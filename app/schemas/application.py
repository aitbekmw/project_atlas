from datetime import datetime

from pydantic import BaseModel, ConfigDict

from app.models.enum import ApplicationStatus


class ApplicationCreate(BaseModel):
    job_id: int


class ApplicationUpdate(BaseModel):
    status: ApplicationStatus


class ApplicationResponse(BaseModel):
    id: int
    worker_id: int
    job_id: int
    status: ApplicationStatus
    created_at: datetime | None = None

    model_config = ConfigDict(from_attributes=True)
