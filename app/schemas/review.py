from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class ReviewCreate(BaseModel):
    job_id: int
    to_user_id: int
    rating: int = Field(..., ge=1, le=5)
    comment: str


class ReviewResponse(BaseModel):
    id: int
    comment: str
    job_id: int
    from_user_id: int
    to_user_id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
