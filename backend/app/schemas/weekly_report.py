from datetime import date, datetime

from pydantic import BaseModel, ConfigDict


class WeeklyReportRead(BaseModel):
    id: int
    organization_id: int
    week_start: date
    week_end: date
    total_reviews: int
    negative_reviews: int
    unanswered_reviews: int
    top_complaint: str
    worst_branch: str
    rating_change: float
    summary: str
    recommended_actions: list[str]
    created_at: datetime


class WeeklyReportDBRead(BaseModel):
    id: int
    organization_id: int
    week_start: date
    week_end: date
    total_reviews: int
    negative_reviews: int
    unanswered_reviews: int
    top_complaint: str
    worst_branch: str
    rating_change: float
    summary: str
    recommended_actions: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class DashboardSummary(BaseModel):
    negative_reviews_today: int
    negative_reviews_this_week: int
    unanswered_negative_reviews: int
    highest_risk_branch: str | None
    top_complaint_this_week: str | None
    rating_change: float
    ai_replies_prepared: int
    recommended_action: str

