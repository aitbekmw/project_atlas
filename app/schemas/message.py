from datetime import datetime

from pydantic import BaseModel, ConfigDict


class MessageCreate(BaseModel):
    text: str


class MessageResponse(BaseModel):
    id: int

    conversation_id: int
    sender_id: int

    text: str

    is_read: bool

    created_at: datetime

    model_config = ConfigDict(
        from_attributes=True,
    )
