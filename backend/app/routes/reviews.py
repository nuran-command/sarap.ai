from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.branch import Branch
from app.models.organization import Organization
from app.models.review import Review
from app.models.user import User
from app.schemas.review import AnsweredUpdate, CSVUploadResult, ReviewRead
from app.services.auth_service import get_current_user
from app.services.review_service import import_reviews_csv

router = APIRouter(tags=["reviews"])


@router.post("/organizations/{organization_id}/reviews/import", response_model=CSVUploadResult)
async def import_reviews(
    organization_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> dict[str, object]:
    organization = _get_owned_organization(db, organization_id, current_user.id)
    if not file.filename or not file.filename.lower().endswith(".csv"):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Upload a CSV file")
    content = await file.read()
    try:
        return import_reviews_csv(db, organization, content)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc


@router.get("/organizations/{organization_id}/reviews", response_model=list[ReviewRead])
def list_reviews(
    organization_id: int,
    branch_id: int | None = None,
    sentiment: str | None = Query(default=None),
    category: str | None = Query(default=None),
    urgency: str | None = Query(default=None),
    is_answered: bool | None = Query(default=None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[Review]:
    _get_owned_organization(db, organization_id, current_user.id)
    query = db.query(Review).join(Branch).filter(Branch.organization_id == organization_id)
    if branch_id is not None:
        query = query.filter(Review.branch_id == branch_id)
    if sentiment is not None:
        query = query.filter(Review.sentiment == sentiment)
    if category is not None:
        query = query.filter(Review.category == category)
    if urgency is not None:
        query = query.filter(Review.urgency == urgency)
    if is_answered is not None:
        query = query.filter(Review.is_answered == is_answered)
    return query.order_by(Review.review_date.desc(), Review.id.desc()).all()


@router.patch("/reviews/{review_id}/answered", response_model=ReviewRead)
def update_answered_status(
    review_id: int,
    payload: AnsweredUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Review:
    review = _get_owned_review(db, review_id, current_user.id)
    review.is_answered = payload.is_answered
    db.commit()
    db.refresh(review)
    return review


def _get_owned_organization(db: Session, organization_id: int, owner_id: int) -> Organization:
    organization = (
        db.query(Organization)
        .filter(Organization.id == organization_id, Organization.owner_id == owner_id)
        .first()
    )
    if organization is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Organization not found")
    return organization


def _get_owned_review(db: Session, review_id: int, owner_id: int) -> Review:
    review = (
        db.query(Review)
        .join(Branch)
        .join(Organization)
        .filter(Review.id == review_id, Organization.owner_id == owner_id)
        .first()
    )
    if review is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Review not found")
    return review

