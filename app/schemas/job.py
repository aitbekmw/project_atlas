from pydantic import BaseModel, ConfigDict
from app.models.enum import JobStatus



class JobBase(BaseModel):
    title: str
    description: str
    salary: int
    city: str
    address: str
    category_id: int


class JobCreate(JobBase):
    pass


class JobUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    salary: int | None = None
    city: str | None = None
    address: str | None = None
    category_id: int | None = None
    is_active: bool | None = None


class JobResponse(JobBase):
    id: int
    owner_id: int
    is_active: bool
    status: JobStatus

    model_config = ConfigDict(from_attributes=True)
