from __future__ import annotations

import json
from collections import Counter, defaultdict
from datetime import date, timedelta

from sqlalchemy.orm import Session

from app.models.ai_reply import AiReply
from app.models.branch import Branch
from app.models.organization import Organization
from app.models.review import Review
from app.models.weekly_report import WeeklyReport


def generate_weekly_report(db: Session, organization: Organization, week_start: date | None = None) -> WeeklyReport:
    today = date.today()
    start = week_start or today - timedelta(days=6)
    end = start + timedelta(days=6)
    reviews = _reviews_for_period(db, organization.id, start, end)

    total_reviews = len(reviews)
    negative_reviews = [review for review in reviews if review.sentiment == "negative"]
    unanswered_reviews = [review for review in reviews if not review.is_answered]
    top_complaint = _top_complaint(negative_reviews)
    worst_branch = _worst_branch_name(reviews)
    rating_change = _rating_change(reviews)
    actions = recommended_actions_for(top_complaint, worst_branch, len(negative_reviews))

    summary = (
        f"This week Sarap.ai analyzed {total_reviews} reviews. "
        f"{len(negative_reviews)} were negative and {len(unanswered_reviews)} still need a response. "
        f"Top complaint: {top_complaint}. Highest-risk branch: {worst_branch}."
    )

    report = WeeklyReport(
        organization_id=organization.id,
        week_start=start,
        week_end=end,
        total_reviews=total_reviews,
        negative_reviews=len(negative_reviews),
        unanswered_reviews=len(unanswered_reviews),
        top_complaint=top_complaint,
        worst_branch=worst_branch,
        rating_change=rating_change,
        summary=summary,
        recommended_actions=json.dumps(actions, ensure_ascii=False),
    )
    db.add(report)
    db.commit()
    db.refresh(report)
    return report


def dashboard_summary(db: Session, organization: Organization) -> dict[str, object]:
    today = date.today()
    week_start = today - timedelta(days=6)
    today_reviews = _reviews_for_period(db, organization.id, today, today)
    week_reviews = _reviews_for_period(db, organization.id, week_start, today)
    negative_week = [review for review in week_reviews if review.sentiment == "negative"]
    unanswered_negative = [review for review in negative_week if not review.is_answered]
    top_complaint = _top_complaint(negative_week)
    highest_risk_branch = _highest_risk_branch(db, organization.id)
    replies_prepared = _reply_count_for_reviews(db, [review.id for review in week_reviews])
    action = recommended_actions_for(top_complaint, highest_risk_branch or "none", len(negative_week))[0]

    return {
        "negative_reviews_today": sum(1 for review in today_reviews if review.sentiment == "negative"),
        "negative_reviews_this_week": len(negative_week),
        "unanswered_negative_reviews": len(unanswered_negative),
        "highest_risk_branch": highest_risk_branch,
        "top_complaint_this_week": top_complaint if top_complaint != "none" else None,
        "rating_change": _rating_change(week_reviews),
        "ai_replies_prepared": replies_prepared,
        "recommended_action": action,
    }


def serialize_report(report: WeeklyReport) -> dict[str, object]:
    return {
        "id": report.id,
        "organization_id": report.organization_id,
        "week_start": report.week_start,
        "week_end": report.week_end,
        "total_reviews": report.total_reviews,
        "negative_reviews": report.negative_reviews,
        "unanswered_reviews": report.unanswered_reviews,
        "top_complaint": report.top_complaint,
        "worst_branch": report.worst_branch,
        "rating_change": report.rating_change,
        "summary": report.summary,
        "recommended_actions": json.loads(report.recommended_actions),
        "created_at": report.created_at,
    }


def recommended_actions_for(top_complaint: str, worst_branch: str, negative_count: int) -> list[str]:
    if negative_count == 0:
        return ["Keep monitoring new reviews and ask satisfied guests to leave detailed feedback."]
    action_by_category = {
        "waiting_time": f"Check service speed at {worst_branch}, especially evening shifts and kitchen handoff.",
        "food_quality": f"Review dish consistency at {worst_branch} and inspect the most-mentioned menu items.",
        "staff_behavior": f"Review staff communication at {worst_branch} and coach the shift lead on complaint handling.",
        "cleanliness": f"Run a cleanliness audit at {worst_branch} before peak hours.",
        "delivery_issue": f"Check delivery handoff and packaging issues connected to {worst_branch}.",
        "price_value": f"Review perceived value at {worst_branch}: portion size, bill clarity, and menu expectations.",
        "atmosphere": f"Check music volume, seating comfort, and hall load at {worst_branch}.",
        "reservation": f"Audit reservation handling at {worst_branch} and confirm table readiness process.",
        "other": f"Read the latest negative reviews for {worst_branch} and assign one manager-owned fix this week.",
    }
    first_action = action_by_category.get(top_complaint, action_by_category["other"])
    return [
        first_action,
        "Reply to all high and critical urgency reviews within 24 hours.",
        "Log repeated complaints and review them in the next manager meeting.",
    ]


def _reviews_for_period(db: Session, organization_id: int, start: date, end: date) -> list[Review]:
    return (
        db.query(Review)
        .join(Branch)
        .filter(
            Branch.organization_id == organization_id,
            Review.review_date >= start,
            Review.review_date <= end,
        )
        .order_by(Review.review_date.desc(), Review.id.desc())
        .all()
    )


def _top_complaint(reviews: list[Review]) -> str:
    if not reviews:
        return "none"
    return Counter(review.category for review in reviews).most_common(1)[0][0]


def _worst_branch_name(reviews: list[Review]) -> str:
    if not reviews:
        return "none"
    ratings: dict[str, list[int]] = defaultdict(list)
    for review in reviews:
        ratings[review.branch.name].append(review.rating)
    worst_branch = min(ratings.items(), key=lambda item: sum(item[1]) / len(item[1]))
    return worst_branch[0]


def _highest_risk_branch(db: Session, organization_id: int) -> str | None:
    priority = {"critical": 4, "high": 3, "medium": 2, "low": 1}
    branches = db.query(Branch).filter(Branch.organization_id == organization_id).all()
    if not branches:
        return None
    return max(branches, key=lambda branch: (priority.get(branch.risk_level, 0), branch.review_count)).name


def _reply_count_for_reviews(db: Session, review_ids: list[int]) -> int:
    if not review_ids:
        return 0
    return db.query(AiReply).filter(AiReply.review_id.in_(review_ids)).count()


def _rating_change(reviews: list[Review]) -> float:
    if len(reviews) < 2:
        return 0.0
    sorted_reviews = sorted(reviews, key=lambda review: review.review_date)
    midpoint = max(1, len(sorted_reviews) // 2)
    early = sorted_reviews[:midpoint]
    late = sorted_reviews[midpoint:]
    early_avg = sum(review.rating for review in early) / len(early)
    late_avg = sum(review.rating for review in late) / len(late) if late else early_avg
    return round(late_avg - early_avg, 2)

