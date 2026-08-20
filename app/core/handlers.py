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
    IncorrectPassword,
    InvalidCredentials,
    InvalidFile,
    InvalidRefreshToken,
    JobNotCompleted,
    JobNotFound,
    JobNotOpen,
    MessageNotFound,
    PermissionDenied,
    ReviewAlreadyExists,
    ReviewNotFound,
    SamePassword,
    SelfReviewNotAllowed,
    UsernameAlreadyExists,
    UserNotFound,
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
        app.add_exception_handler(
            exc_class,
            _make_handler(status_code, detail),
        )
