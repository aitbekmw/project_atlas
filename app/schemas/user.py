import re
from datetime import datetime

from email_validator import EmailNotValidError, validate_email
from pydantic import (
    BaseModel,
    ConfigDict,
    Field,
    field_serializer,
    field_validator,
)

from app.models.enum import UserRole
from app.services.minio import MinioService

# email-validator rejects .local even in test_environment.
_LOCAL_EMAIL = re.compile(r"^[^@\s]+@[^@\s]+\.local$")


def normalize_atlas_email(value: str) -> str:
    """Validate email, allowing reserved .local addresses for local E2E accounts."""
    normalized = str(value).strip().lower()

    if _LOCAL_EMAIL.fullmatch(normalized) and ".." not in normalized:
        return normalized

    try:
        result = validate_email(
            normalized,
            check_deliverability=False,
        )
    except EmailNotValidError as orig:
        raise ValueError(f"value is not a valid email address: {orig}") from orig

    return str(result.normalized).lower()


class UserBase(BaseModel):
    username: str = Field(min_length=3, max_length=50)
    email: str = Field(min_length=3, max_length=255)
    first_name: str = Field(min_length=1, max_length=100)
    last_name: str = Field(min_length=1, max_length=100)
    phone: str | None = Field(default=None, max_length=30)
    avatar: str | None = None

    @field_validator("email")
    @classmethod
    def validate_email_value(cls, value: str) -> str:
        return normalize_atlas_email(value)


class UserCreate(UserBase):
    password: str = Field(min_length=8)
    role: str = UserRole.WORKER.value

    @field_validator("role")
    @classmethod
    def validate_role(cls, value: str) -> str:
        allowed = {
            UserRole.WORKER.value,
            UserRole.CUSTOMER.value,
        }

        if value not in allowed:
            raise ValueError("Role must be worker or customer")

        return value


class UserLogin(BaseModel):
    email: str
    password: str

    @field_validator("email")
    @classmethod
    def normalize_email(cls, value: str) -> str:
        return normalize_atlas_email(value)


class UserUpdate(BaseModel):
    first_name: str | None = Field(default=None, min_length=1, max_length=100)
    last_name: str | None = Field(default=None, min_length=1, max_length=100)
    phone: str | None = Field(default=None, max_length=30)
    avatar: str | None = None


class UserResponse(UserBase):
    id: int
    role: str
    is_active: bool
    is_verified: bool
    is_online: bool
    last_seen: datetime | None = None

    model_config = ConfigDict(from_attributes=True)

    @field_serializer("avatar")
    def serialize_avatar(self, avatar: str | None) -> str | None:
        if not avatar:
            return None

        if avatar.startswith(("http://", "https://")):
            return avatar

        return MinioService().get_avatar_url(avatar)
