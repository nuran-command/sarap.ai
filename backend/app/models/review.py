from datetime import date

from sqlalchemy import Boolean, Date, DateTime, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Review(Base):
    __tablename__ = "reviews"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    branch_id: Mapped[int] = mapped_column(ForeignKey("branches.id"), nullable=False, index=True)
    reviewer_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    rating: Mapped[int] = mapped_column(Integer, nullable=False)
    text: Mapped[str] = mapped_column(Text, nullable=False)
    review_date: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    source: Mapped[str] = mapped_column(String(80), default="manual_csv", nullable=False)
    is_answered: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    sentiment: Mapped[str] = mapped_column(String(24), default="neutral", nullable=False, index=True)
    category: Mapped[str] = mapped_column(String(64), default="other", nullable=False, index=True)
    urgency: Mapped[str] = mapped_column(String(24), default="low", nullable=False, index=True)
    language: Mapped[str] = mapped_column(String(12), default="other", nullable=False)
    summary: Mapped[str] = mapped_column(Text, default="", nullable=False)
    created_at = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    branch = relationship("Branch", back_populates="reviews")
    ai_replies = relationship("AiReply", back_populates="review", cascade="all, delete-orphan")

