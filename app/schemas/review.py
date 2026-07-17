from datetime import datetime

from pydantic import BaseModel, Field


class ReviewCreate(BaseModel):
    job_id: int
    to_user_id: int
    rating: int = Field(..., ge=1, le=5)
    comment: str


class ReviewResponse(BaseModel):
    id: int
    rating: int
    comment: str

    job_id: int
    from_user_id: int
    to_user_id: int

    created_at: datetime

    class Config:
        from_attributes = True
