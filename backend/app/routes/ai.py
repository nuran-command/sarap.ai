from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.ai_reply import AiReply
from app.models.branch import Branch
from app.models.organization import Organization
from app.models.review import Review
from app.models.user import User
from app.schemas.ai_reply import AiReplyCreate, AiReplyRead
from app.services.ai_service import generate_reply
from app.services.auth_service import get_current_user

router = APIRouter(tags=["ai"])


@router.post("/reviews/{review_id}/replies", response_model=AiReplyRead, status_code=status.HTTP_201_CREATED)
def create_reply(
    review_id: int,
    payload: AiReplyCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> AiReply:
    review = _get_owned_review(db, review_id, current_user.id)
    reply = AiReply(
        review_id=review.id,
        language=payload.language,
        tone=payload.tone,
        text=generate_reply(review.text, review.rating, review.category, payload.language, payload.tone),
    )
    db.add(reply)
    db.commit()
    db.refresh(reply)
    return reply


@router.get("/reviews/{review_id}/replies", response_model=list[AiReplyRead])
def list_replies(
    review_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[AiReply]:
    review = _get_owned_review(db, review_id, current_user.id)
    return db.query(AiReply).filter(AiReply.review_id == review.id).order_by(AiReply.id.desc()).all()


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

