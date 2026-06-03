from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.branch import Branch
from app.models.organization import Organization
from app.models.user import User
from app.schemas.organization import BranchCreate, BranchRead, BranchUpdate
from app.services.auth_service import get_current_user

router = APIRouter(tags=["branches"])


@router.post("/organizations/{organization_id}/branches", response_model=BranchRead, status_code=status.HTTP_201_CREATED)
def create_branch(
    organization_id: int,
    payload: BranchCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Branch:
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
    return branch


@router.get("/organizations/{organization_id}/branches", response_model=list[BranchRead])
def list_branches(
    organization_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[Branch]:
    _get_owned_organization(db, organization_id, current_user.id)
    return db.query(Branch).filter(Branch.organization_id == organization_id).order_by(Branch.name).all()


@router.get("/branches/{branch_id}", response_model=BranchRead)
def get_branch(
    branch_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Branch:
    return _get_owned_branch(db, branch_id, current_user.id)


@router.patch("/branches/{branch_id}", response_model=BranchRead)
def update_branch(
    branch_id: int,
    payload: BranchUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Branch:
    branch = _get_owned_branch(db, branch_id, current_user.id)
    updates = payload.model_dump(exclude_unset=True)
    for field, value in updates.items():
        setattr(branch, field, value)
    db.commit()
    db.refresh(branch)
    return branch


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
