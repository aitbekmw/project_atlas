from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm

from app.core.exceptions import (EmailAlreadyExists, InvalidCredentials,
                                 UsernameAlreadyExists)
from app.dependencies.services import get_auth_service
from app.schemas.user import UserCreate, UserLogin, UserResponse
from app.services.auth import AuthService

router = APIRouter(
    prefix="/auth",
    tags=["Authentication"],
)


@router.post(
    "/register",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
)
async def register(
    data: UserCreate,
    service: AuthService = Depends(get_auth_service),
):
    try:
        return await service.register(data)

    except EmailAlreadyExists:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already exists",
        )

    except UsernameAlreadyExists:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already exists",
        )


@router.post("/login")
async def login(
    data: UserLogin,
    service: AuthService = Depends(get_auth_service),
):
    try:
        return await service.login(
            data.email,
            data.password,
        )

    except InvalidCredentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )


@router.post("/token")
async def token(
    form_data: OAuth2PasswordRequestForm = Depends(),
    service: AuthService = Depends(get_auth_service),
):
    try:
        return await service.login_by_username(
            form_data.username,
            form_data.password,
        )

    except InvalidCredentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password",
        )
