from fastapi import Request
from fastapi.responses import JSONResponse

from app.core.exceptions import (
    ApplicationNotFound,
    CategoryNotFound,
    JobNotCompleted,
    JobNotFound,
    PermissionDenied,
    ReviewAlreadyExists,
    ReviewNotFound,
    SelfReviewNotAllowed,
    UserNotFound,
)


async def job_not_found_handler(
    request: Request,
    exc: JobNotFound,
):
    return JSONResponse(
        status_code=404,
        content={
            "detail": "Job not found",
        },
    )


async def user_not_found_handler(
    request: Request,
    exc: UserNotFound,
):
    return JSONResponse(
        status_code=404,
        content={
            "detail": "User not found",
        },
    )


async def category_not_found_handler(
    request: Request,
    exc: CategoryNotFound,
):
    return JSONResponse(
        status_code=404,
        content={
            "detail": "Category not found",
        },
    )


async def application_not_found_handler(
    request: Request,
    exc: ApplicationNotFound,
):
    return JSONResponse(
        status_code=404,
        content={
            "detail": "Application not found",
        },
    )


async def permission_denied_handler(
    request: Request,
    exc: PermissionDenied,
):
    return JSONResponse(
        status_code=403,
        content={
            "detail": "Permission denied",
        },
    )


async def review_not_found_handler(
    request: Request,
    exc: ReviewNotFound,
):
    return JSONResponse(
        status_code=404,
        content={
            "detail": "Review not found",
        },
    )


async def review_already_exists_handler(
    request: Request,
    exc: ReviewAlreadyExists,
):
    return JSONResponse(
        status_code=400,
        content={
            "detail": "Review already exists",
        },
    )


async def job_not_completed_handler(
    request: Request,
    exc: JobNotCompleted,
):
    return JSONResponse(
        status_code=400,
        content={
            "detail": "Job is not completed",
        },
    )


async def self_review_not_allowed_handler(
    request: Request,
    exc: SelfReviewNotAllowed,
):
    return JSONResponse(
        status_code=400,
        content={
            "detail": "You cannot review yourself",
        },
    )
