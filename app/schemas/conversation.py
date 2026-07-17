from datetime import datetime

from pydantic import BaseModel, ConfigDict


class ConversationCreate(BaseModel):
    job_id: int
    worker_id: int


class ConversationResponse(BaseModel):
    id: int

    job_id: int
    customer_id: int
    worker_id: int

    created_at: datetime

    model_config = ConfigDict(
        from_attributes=True,
    )
