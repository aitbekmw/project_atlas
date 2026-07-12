from pydantic import BaseModel, EmailStr, Field

from app.core.exceptions import (
    EmailAlreadyExists,
    UsernameAlreadyExists,
    InvalidCredentials,
)


class UserRegister(BaseModel):
    username: str = Field(min_length=3, max_length=50)
    email: EmailStr
    password: str = Field(min_length=8)

    first_name: str
    last_name: str

    phone: str | None = None


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"