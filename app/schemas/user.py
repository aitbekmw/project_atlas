from pydantic import BaseModel, ConfigDict, EmailStr


class UserBase(BaseModel):
    username: str
    email: EmailStr
    first_name: str
    last_name: str
    phone: str | None = None
    avatar: str | None = None


class UserCreate(UserBase):
    password: str


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserUpdate(BaseModel):
    first_name: str | None = None
    last_name: str | None = None
    phone: str | None = None
    avatar: str | None = None


class UserResponse(UserBase):
    id: int
    role: str
    is_active: bool
    is_verified: bool

    model_config = ConfigDict(from_attributes=True)
