from datetime import date, timedelta

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.branch import Branch
from app.models.organization import Organization
from app.models.review import Review
from app.models.user import User
from app.schemas.organization import BranchCreate, BranchRead, BranchUpdate
from app.services.auth_service import get_current_user
from app.services.review_service import refresh_branch_metrics

router = APIRouter(tags=["branches"])


@router.post("/organizations/{organization_id}/branches", response_model=BranchRead, status_code=status.HTTP_201_CREATED)
def create_branch(
    organization_id: int,
    payload: BranchCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> dict[str, object]:
    _get_owned_organization(db, organization_id, current_user.id)
    branch = Branch(
        organization_id=organization_id,
        name=payload.name,
        city=payload.city,
        address=payload.address,
        google_maps_url=payload.google_maps_url,
    )
    db.add(branch)
    db.commit()
    db.refresh(branch)
    return _serialize_branch(db, branch)


@router.get("/organizations/{organization_id}/branches", response_model=list[BranchRead])
def list_branches(
    organization_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[dict[str, object]]:
    _get_owned_organization(db, organization_id, current_user.id)
    refresh_branch_metrics(db, organization_id)
    db.commit()
    branches = db.query(Branch).filter(Branch.organization_id == organization_id).order_by(Branch.name).all()
    return [_serialize_branch(db, branch) for branch in branches]


@router.get("/branches/{branch_id}", response_model=BranchRead)
def get_branch(
    branch_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> dict[str, object]:
    branch = _get_owned_branch(db, branch_id, current_user.id)
    refresh_branch_metrics(db, branch.organization_id)
    db.commit()
    db.refresh(branch)
    return _serialize_branch(db, branch)


@router.patch("/branches/{branch_id}", response_model=BranchRead)
def update_branch(
    branch_id: int,
    payload: BranchUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> dict[str, object]:
    branch = _get_owned_branch(db, branch_id, current_user.id)
    updates = payload.model_dump(exclude_unset=True)
    for field, value in updates.items():
        setattr(branch, field, value)
    refresh_branch_metrics(db, branch.organization_id)
    db.commit()
    db.refresh(branch)
    return _serialize_branch(db, branch)


def _get_owned_organization(db: Session, organization_id: int, owner_id: int) -> Organization:
    organization = (
        db.query(Organization)
        .filter(Organization.id == organization_id, Organization.owner_id == owner_id)
        .first()
    )
    if organization is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Organization not found")
    return organization


def _get_owned_branch(db: Session, branch_id: int, owner_id: int) -> Branch:
    branch = db.query(Branch).join(Organization).filter(Branch.id == branch_id, Organization.owner_id == owner_id).first()
    if branch is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Branch not found")
    return branch


def _serialize_branch(db: Session, branch: Branch) -> dict[str, object]:
    week_start = date.today() - timedelta(days=6)
    weekly_reviews = (
        db.query(Review)
        .filter(Review.branch_id == branch.id, Review.review_date >= week_start)
        .order_by(Review.review_date.desc(), Review.id.desc())
        .all()
    )
    latest_review = weekly_reviews[0] if weekly_reviews else (
        db.query(Review)
        .filter(Review.branch_id == branch.id)
        .order_by(Review.review_date.desc(), Review.id.desc())
        .first()
    )

    return {
        "id": branch.id,
        "organization_id": branch.organization_id,
        "name": branch.name,
        "city": branch.city,
        "address": branch.address,
        "google_maps_url": branch.google_maps_url,
        "current_rating": branch.current_rating,
        "review_count": branch.review_count,
        "risk_level": branch.risk_level,
        "status_flag": branch.status_flag,
        "weekly_negative_reviews": sum(1 for review in weekly_reviews if review.sentiment == "negative"),
        "unanswered_reviews": sum(1 for review in weekly_reviews if not review.is_answered),
        "last_review_date": latest_review.review_date if latest_review else None,
        "created_at": branch.created_at,
    }
