from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.models.enum import JobStatus


class JobBase(BaseModel):
    title: str = Field(min_length=1, max_length=255)
    description: str = Field(min_length=1)
    salary: int = Field(ge=0)
    city: str = Field(min_length=1, max_length=100)
    address: str = Field(min_length=1, max_length=255)
    category_id: int


class JobCreate(JobBase):
    pass


class JobUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=255)
    description: str | None = Field(default=None, min_length=1)
    salary: int | None = Field(default=None, ge=0)
    city: str | None = Field(default=None, min_length=1, max_length=100)
    address: str | None = Field(default=None, min_length=1, max_length=255)
    category_id: int | None = None
    is_active: bool | None = None


class JobResponse(JobBase):
    id: int
    owner_id: int
    is_active: bool
    status: JobStatus
    created_at: datetime | None = None

    model_config = ConfigDict(from_attributes=True)
