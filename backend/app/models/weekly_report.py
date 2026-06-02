from datetime import date

from sqlalchemy import Date, DateTime, Float, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class WeeklyReport(Base):
    __tablename__ = "weekly_reports"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    organization_id: Mapped[int] = mapped_column(ForeignKey("organizations.id"), nullable=False, index=True)
    week_start: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    week_end: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    total_reviews: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    negative_reviews: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    unanswered_reviews: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    top_complaint: Mapped[str] = mapped_column(String(64), default="none", nullable=False)
    worst_branch: Mapped[str] = mapped_column(String(255), default="none", nullable=False)
    rating_change: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    summary: Mapped[str] = mapped_column(Text, default="", nullable=False)
    recommended_actions: Mapped[str] = mapped_column(Text, default="[]", nullable=False)
    created_at = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    organization = relationship("Organization", back_populates="weekly_reports")

