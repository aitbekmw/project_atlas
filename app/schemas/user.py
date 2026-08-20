from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator

from app.models.enum import UserRole


class UserBase(BaseModel):
    username: str = Field(min_length=3, max_length=50)
    email: EmailStr
    first_name: str = Field(min_length=1, max_length=100)
    last_name: str = Field(min_length=1, max_length=100)
    phone: str | None = Field(default=None, max_length=30)
    avatar: str | None = None


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

    @field_validator("email")
    @classmethod
    def normalize_email(cls, value: EmailStr) -> str:
        return str(value).lower()


class UserLogin(BaseModel):
    email: EmailStr
    password: str

    @field_validator("email")
    @classmethod
    def normalize_email(cls, value: EmailStr) -> str:
        return str(value).lower()


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
