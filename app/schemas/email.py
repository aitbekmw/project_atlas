from pydantic import BaseModel, Field, field_validator

from app.schemas.user import normalize_atlas_email


class EmailCodeRequest(BaseModel):
    email: str
    code: str = Field(min_length=6, max_length=6)

    @field_validator("email")
    @classmethod
    def normalize_email(cls, value: str) -> str:
        return normalize_atlas_email(value)

    @field_validator("code")
    @classmethod
    def digits_only(cls, value: str) -> str:
        cleaned = value.strip()
        if not cleaned.isdigit() or len(cleaned) != 6:
            raise ValueError("Code must be 6 digits")
        return cleaned


class ResendVerificationRequest(BaseModel):
    email: str

    @field_validator("email")
    @classmethod
    def normalize_email(cls, value: str) -> str:
        return normalize_atlas_email(value)
