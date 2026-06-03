from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class OrganizationCreate(BaseModel):
    name: str = Field(min_length=2, max_length=255)
    city: str = Field(default="Almaty", max_length=120)


class OrganizationRead(BaseModel):
    id: int
    owner_id: int
    name: str
    city: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class BranchCreate(BaseModel):
    name: str = Field(min_length=2, max_length=255)
    city: str = Field(default="Almaty", max_length=120)
    address: str | None = Field(default=None, max_length=255)
    google_maps_url: str | None = Field(default=None, max_length=500)


class BranchUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=2, max_length=255)
    city: str | None = Field(default=None, max_length=120)
    address: str | None = Field(default=None, max_length=255)
    google_maps_url: str | None = Field(default=None, max_length=500)
    current_rating: float | None = Field(default=None, ge=0, le=5)
    review_count: int | None = Field(default=None, ge=0)
    risk_level: str | None = None


class BranchRead(BaseModel):
    id: int
    organization_id: int
    name: str
    city: str
    address: str | None
    google_maps_url: str | None
    current_rating: float
    review_count: int
    risk_level: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
