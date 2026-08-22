from fastapi import APIRouter, Depends, Query, status
from fastapi.responses import RedirectResponse
from fastapi.security import OAuth2PasswordRequestForm

from app.dependencies.services import get_auth_service
from app.schemas.email import EmailCodeRequest, ResendVerificationRequest
from app.schemas.google import (
    GoogleCompleteProfileRequest,
    GoogleExchangeRequest,
    GoogleStartResponse,
)
from app.schemas.token import RefreshTokenRequest, TokenResponse
from app.schemas.user import UserCreate, UserLogin, UserResponse
from app.services.auth import AuthService

# TODO(auth): forgot-password flow is not implemented yet.
# Keep registration + email verification as the current account recovery path.

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
    return await service.register(data)


@router.post(
    "/login",
    response_model=TokenResponse,
)
async def login(
    data: UserLogin,
    service: AuthService = Depends(get_auth_service),
):
    return await service.login(
        data.email,
        data.password,
    )


@router.post(
    "/token",
    response_model=TokenResponse,
)
async def token(
    form_data: OAuth2PasswordRequestForm = Depends(),
    service: AuthService = Depends(get_auth_service),
):
    return await service.login_by_username(
        form_data.username,
        form_data.password,
    )


@router.post(
    "/refresh",
    response_model=TokenResponse,
)
async def refresh(
    data: RefreshTokenRequest,
    service: AuthService = Depends(get_auth_service),
):
    return await service.refresh(data.refresh_token)


@router.post(
    "/logout",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def logout(
    data: RefreshTokenRequest,
    service: AuthService = Depends(get_auth_service),
):
    await service.logout(data.refresh_token)


@router.post(
    "/verify-email",
    response_model=UserResponse,
)
async def verify_email(
    data: EmailCodeRequest,
    service: AuthService = Depends(get_auth_service),
):
    return await service.verify_email(data.email, data.code)


@router.post(
    "/resend-verification",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def resend_verification(
    data: ResendVerificationRequest,
    service: AuthService = Depends(get_auth_service),
):
    await service.resend_verification(data.email)


@router.get(
    "/google/start",
    response_model=GoogleStartResponse,
)
async def google_start(
    origin: str = Query(default="http://localhost:5173"),
    service: AuthService = Depends(get_auth_service),
):
    authorization_url = await service.google_start(origin)
    return {"authorization_url": authorization_url}


@router.get("/google/callback")
async def google_callback(
    code: str | None = None,
    state: str | None = None,
    error: str | None = None,
    service: AuthService = Depends(get_auth_service),
):
    redirect_to = await service.google_callback(code=code, state=state, error=error)
    return RedirectResponse(url=redirect_to, status_code=status.HTTP_302_FOUND)


@router.post(
    "/google/exchange",
    response_model=TokenResponse,
)
async def google_exchange(
    data: GoogleExchangeRequest,
    service: AuthService = Depends(get_auth_service),
):
    return await service.exchange_google_login(data.code)


@router.post(
    "/google/complete-profile",
    response_model=TokenResponse,
)
async def google_complete_profile(
    data: GoogleCompleteProfileRequest,
    service: AuthService = Depends(get_auth_service),
):
    return await service.complete_google_profile(
        data.code,
        data.phone,
        data.role,
    )
