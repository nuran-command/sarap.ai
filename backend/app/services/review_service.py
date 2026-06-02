from __future__ import annotations

import csv
from datetime import date
from io import StringIO
from typing import Any

from sqlalchemy.orm import Session

from app.models.ai_reply import AiReply
from app.models.branch import Branch
from app.models.organization import Organization
from app.models.review import Review
from app.services.ai_service import analyze_review, generate_reply

REQUIRED_CSV_COLUMNS = {
    "branch_name",
    "reviewer_name",
    "rating",
    "text",
    "review_date",
    "source",
    "is_answered",
}


def import_reviews_csv(db: Session, organization: Organization, content: bytes) -> dict[str, Any]:
    errors: list[str] = []
    decoded_content = content.decode("utf-8-sig")
    reader = csv.DictReader(StringIO(decoded_content))
    if reader.fieldnames is None:
        raise ValueError("CSV has no header row")

    missing_columns = REQUIRED_CSV_COLUMNS.difference(reader.fieldnames)
    if missing_columns:
        raise ValueError(f"CSV is missing required columns: {', '.join(sorted(missing_columns))}")

    imported_reviews = 0
    created_branches = 0
    generated_replies = 0

    for index, row in enumerate(reader, start=2):
        try:
            branch_name = row["branch_name"].strip()
            if not branch_name:
                raise ValueError("branch_name is empty")

            branch = (
                db.query(Branch)
                .filter(Branch.organization_id == organization.id, Branch.name == branch_name)
                .first()
            )
            if branch is None:
                branch = Branch(
                    organization_id=organization.id,
                    name=branch_name,
                    city=organization.city,
                )
                db.add(branch)
                db.flush()
                created_branches += 1

            rating = int(row["rating"])
            review_text = row["text"].strip()
            review_date = date.fromisoformat(row["review_date"])
            is_answered = _parse_bool(row["is_answered"])
            analysis = analyze_review(review_text, rating)

            review = Review(
                branch_id=branch.id,
                reviewer_name=_nullable_string(row["reviewer_name"]),
                rating=rating,
                text=review_text,
                review_date=review_date,
                    source=row["source"].strip() or "manual_csv",
                is_answered=is_answered,
                sentiment=analysis.sentiment,
                category=analysis.category,
                urgency=analysis.urgency,
                language=analysis.language,
                summary=analysis.summary,
            )
            db.add(review)
            db.flush()
            imported_reviews += 1

            for language in ("ru", "kk"):
                reply = AiReply(
                    review_id=review.id,
                    language=language,
                    tone="warm",
                    text=generate_reply(review_text, rating, analysis.category, language=language),
                )
                db.add(reply)
                generated_replies += 1
        except Exception as exc:  # noqa: BLE001
            errors.append(f"Row {index}: {exc}")

    db.flush()
    refresh_branch_metrics(db, organization.id)
    db.commit()

    return {
        "imported_reviews": imported_reviews,
        "created_branches": created_branches,
        "generated_replies": generated_replies,
        "errors": errors,
    }


def refresh_branch_metrics(db: Session, organization_id: int) -> None:
    branches = db.query(Branch).filter(Branch.organization_id == organization_id).all()
    for branch in branches:
        reviews = db.query(Review).filter(Review.branch_id == branch.id).all()
        branch.review_count = len(reviews)
        branch.current_rating = round(sum(review.rating for review in reviews) / len(reviews), 2) if reviews else 0.0
        branch.risk_level = calculate_branch_risk(reviews)


def calculate_branch_risk(reviews: list[Review]) -> str:
    if not reviews:
        return "low"
    critical_count = sum(1 for review in reviews if review.urgency == "critical")
    high_count = sum(1 for review in reviews if review.urgency == "high")
    negative_count = sum(1 for review in reviews if review.sentiment == "negative")
    negative_ratio = negative_count / len(reviews)

    if critical_count > 0 or negative_ratio >= 0.45:
        return "critical"
    if high_count >= 2 or negative_ratio >= 0.30:
        return "high"
    if high_count == 1 or negative_ratio >= 0.15:
        return "medium"
    return "low"


def _parse_bool(value: object) -> bool:
    if isinstance(value, bool):
        return value
    return str(value).strip().lower() in {"true", "1", "yes", "y", "да"}


def _nullable_string(value: object) -> str | None:
    if value is None:
        return None
    string_value = str(value).strip()
    return string_value or None


def get_default_week_start(today: date) -> date:
    return today.fromordinal(today.toordinal() - 6)
