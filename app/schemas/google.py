from pydantic import BaseModel, Field, field_validator

from app.core.validators import normalize_phone
from app.models.enum import UserRole


class GoogleStartResponse(BaseModel):
    authorization_url: str


class GoogleExchangeRequest(BaseModel):
    code: str = Field(min_length=8, max_length=512)


class GoogleCompleteProfileRequest(BaseModel):
    code: str = Field(min_length=8, max_length=512)
    phone: str = Field(min_length=8, max_length=30)
    role: str

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, value: str) -> str:
        return normalize_phone(value)

    @field_validator("role")
    @classmethod
    def validate_role(cls, value: str) -> str:
        allowed = {UserRole.WORKER.value, UserRole.CUSTOMER.value}
        if value not in allowed:
            raise ValueError("Role must be worker or customer")
        return value
