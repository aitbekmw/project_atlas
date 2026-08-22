from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse

from app.core.exceptions import (
    ApplicationAlreadyExists,
    ApplicationNotFound,
    AtlasException,
    CategoryAlreadyExists,
    CategoryNotFound,
    ConversationAlreadyExists,
    ConversationNotFound,
    EmailAlreadyExists,
    EmailAlreadyVerified,
    EmailNotVerified,
    GoogleAuthFailed,
    GoogleCancelled,
    GoogleEmailNotVerified,
    GoogleNotConfigured,
    IncorrectPassword,
    InvalidCredentials,
    InvalidFile,
    InvalidOAuthCode,
    InvalidOAuthState,
    InvalidPhone,
    InvalidRefreshToken,
    InvalidVerificationCode,
    JobNotCompleted,
    JobNotFound,
    JobNotOpen,
    MessageNotFound,
    PermissionDenied,
    ProfileIncomplete,
    ResendTooSoon,
    ReviewAlreadyExists,
    ReviewNotFound,
    SamePassword,
    SelfReviewNotAllowed,
    SmtpNotConfigured,
    UsernameAlreadyExists,
    UserNotFound,
    VerificationCodeExpired,
    WeakPassword,
)

EXCEPTION_MAP: dict[type[AtlasException], tuple[int, str]] = {
    JobNotFound: (status.HTTP_404_NOT_FOUND, "Job not found"),
    UserNotFound: (status.HTTP_404_NOT_FOUND, "User not found"),
    CategoryNotFound: (status.HTTP_404_NOT_FOUND, "Category not found"),
    ApplicationNotFound: (status.HTTP_404_NOT_FOUND, "Application not found"),
    ReviewNotFound: (status.HTTP_404_NOT_FOUND, "Review not found"),
    ConversationNotFound: (status.HTTP_404_NOT_FOUND, "Conversation not found"),
    MessageNotFound: (status.HTTP_404_NOT_FOUND, "Message not found"),
    PermissionDenied: (status.HTTP_403_FORBIDDEN, "Permission denied"),
    EmailAlreadyExists: (status.HTTP_400_BAD_REQUEST, "Email already exists"),
    UsernameAlreadyExists: (status.HTTP_400_BAD_REQUEST, "Username already exists"),
    CategoryAlreadyExists: (status.HTTP_400_BAD_REQUEST, "Category already exists"),
    ApplicationAlreadyExists: (
        status.HTTP_400_BAD_REQUEST,
        "You have already applied",
    ),
    ConversationAlreadyExists: (
        status.HTTP_400_BAD_REQUEST,
        "Conversation already exists",
    ),
    ReviewAlreadyExists: (status.HTTP_400_BAD_REQUEST, "Review already exists"),
    JobNotCompleted: (status.HTTP_400_BAD_REQUEST, "Job is not completed"),
    JobNotOpen: (
        status.HTTP_400_BAD_REQUEST,
        "Job is not open for applications",
    ),
    SelfReviewNotAllowed: (
        status.HTTP_400_BAD_REQUEST,
        "You cannot review yourself",
    ),
    IncorrectPassword: (
        status.HTTP_400_BAD_REQUEST,
        "Current password is incorrect",
    ),
    SamePassword: (
        status.HTTP_400_BAD_REQUEST,
        "New password must be different",
    ),
    InvalidFile: (status.HTTP_400_BAD_REQUEST, "Invalid file"),
    InvalidCredentials: (
        status.HTTP_401_UNAUTHORIZED,
        "Invalid email or password",
    ),
    InvalidRefreshToken: (
        status.HTTP_401_UNAUTHORIZED,
        "Invalid or expired refresh token",
    ),
    EmailNotVerified: (
        status.HTTP_403_FORBIDDEN,
        "Email is not verified",
    ),
    InvalidVerificationCode: (
        status.HTTP_400_BAD_REQUEST,
        "Invalid verification code",
    ),
    VerificationCodeExpired: (
        status.HTTP_400_BAD_REQUEST,
        "Verification code expired",
    ),
    ResendTooSoon: (
        status.HTTP_429_TOO_MANY_REQUESTS,
        "Please wait before requesting a new code",
    ),
    EmailAlreadyVerified: (
        status.HTTP_400_BAD_REQUEST,
        "Email is already verified",
    ),
    WeakPassword: (
        status.HTTP_400_BAD_REQUEST,
        "Password does not meet requirements",
    ),
    InvalidPhone: (
        status.HTTP_400_BAD_REQUEST,
        "Invalid phone number",
    ),
    SmtpNotConfigured: (
        status.HTTP_503_SERVICE_UNAVAILABLE,
        "Email delivery is not configured",
    ),
    GoogleNotConfigured: (
        status.HTTP_503_SERVICE_UNAVAILABLE,
        "Google sign-in is not configured",
    ),
    GoogleAuthFailed: (
        status.HTTP_400_BAD_REQUEST,
        "Google authentication failed",
    ),
    GoogleCancelled: (
        status.HTTP_400_BAD_REQUEST,
        "Google sign-in was cancelled",
    ),
    GoogleEmailNotVerified: (
        status.HTTP_400_BAD_REQUEST,
        "Google has not verified this email",
    ),
    InvalidOAuthState: (
        status.HTTP_400_BAD_REQUEST,
        "Google authentication failed",
    ),
    InvalidOAuthCode: (
        status.HTTP_400_BAD_REQUEST,
        "Google authentication failed",
    ),
    ProfileIncomplete: (
        status.HTTP_400_BAD_REQUEST,
        "Complete your Atlas profile",
    ),
}


def _make_handler(status_code: int, detail: str):
    async def handler(_request: Request, _exc: AtlasException):
        return JSONResponse(
            status_code=status_code,
            content={"detail": detail},
        )

    return handler


def register_exception_handlers(app: FastAPI) -> None:
    for exc_class, (status_code, detail) in EXCEPTION_MAP.items():
        if exc_class is ResendTooSoon:
            continue
        app.add_exception_handler(
            exc_class,
            _make_handler(status_code, detail),
        )

    async def resend_too_soon_handler(_request: Request, exc: ResendTooSoon):
        retry_after = getattr(exc, "retry_after", 60)
        return JSONResponse(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            content={
                "detail": "Please wait before requesting a new code",
                "retry_after": retry_after,
            },
        )

    app.add_exception_handler(ResendTooSoon, resend_too_soon_handler)
