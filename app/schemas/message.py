from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, field_validator


class MessageCreate(BaseModel):
    text: str = Field(min_length=1)

    @field_validator("text")
    @classmethod
    def strip_text(cls, value: str) -> str:
        value = value.strip()

        if not value:
            raise ValueError("Message cannot be empty")

        return value


class MessageResponse(BaseModel):
    id: int

    conversation_id: int
    sender_id: int

    text: str

    is_delivered: bool
    is_read: bool
    read_at: datetime | None = None

    created_at: datetime

    model_config = ConfigDict(
        from_attributes=True,
    )
