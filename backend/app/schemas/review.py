from datetime import date, datetime

from pydantic import BaseModel, ConfigDict


class ReviewRead(BaseModel):
    id: int
    branch_id: int
    reviewer_name: str | None
    rating: int
    text: str
    review_date: date
    source: str
    is_answered: bool
    sentiment: str
    category: str
    urgency: str
    language: str
    summary: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class CSVUploadResult(BaseModel):
    imported_reviews: int
    created_branches: int
    generated_replies: int
    errors: list[str]


class AnsweredUpdate(BaseModel):
    is_answered: bool

