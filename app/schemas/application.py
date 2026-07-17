from pydantic import BaseModel, ConfigDict


class ApplicationCreate(BaseModel):
    job_id: int


class ApplicationUpdate(BaseModel):
    status: str


class ApplicationResponse(BaseModel):
    id: int
    worker_id: int
    job_id: int
    status: str

    model_config = ConfigDict(from_attributes=True)
