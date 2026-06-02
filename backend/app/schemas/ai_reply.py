from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class AiReplyCreate(BaseModel):
    language: str = Field(default="ru", pattern="^(ru|kk)$")
    tone: str = Field(default="warm", pattern="^(formal|warm|short|apologetic)$")


class AiReplyRead(BaseModel):
    id: int
    review_id: int
    language: str
    tone: str
    text: str
    status: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

