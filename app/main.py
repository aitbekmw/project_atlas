from contextlib import asynccontextmanager

from fastapi import FastAPI

from app.api import api_router
from app.api.health import router as health_router
from app.core.config import settings
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
from app.core.handlers import (
    application_not_found_handler,
    category_not_found_handler,
    job_not_completed_handler,
    job_not_found_handler,
    permission_denied_handler,
    review_already_exists_handler,
    review_not_found_handler,
    self_review_not_allowed_handler,
    user_not_found_handler,
)
from app.core.logging import setup_logging
from app.core.middleware import LoggingMiddleware
from app.core.minio import create_bucket
from app.core.redis import connect_redis, disconnect_redis
from app.websocket.redis import start_subscriber
from app.websocket.routes import router as websocket_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    if not settings.TESTING:
        create_bucket()
        await connect_redis()
        await start_subscriber()

    yield

    if not settings.TESTING:
        await disconnect_redis()


# Настройка логирования
setup_logging()

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    lifespan=lifespan,
)

app.add_middleware(
    LoggingMiddleware,
)

# ==========================
# Routers
# ==========================

app.include_router(api_router)
app.include_router(websocket_router)
app.include_router(health_router)  # <-- добавили

# ==========================
# Exception Handlers
# ==========================

app.add_exception_handler(JobNotFound, job_not_found_handler)
app.add_exception_handler(UserNotFound, user_not_found_handler)
app.add_exception_handler(CategoryNotFound, category_not_found_handler)
app.add_exception_handler(ApplicationNotFound, application_not_found_handler)
app.add_exception_handler(PermissionDenied, permission_denied_handler)
app.add_exception_handler(ReviewNotFound, review_not_found_handler)
app.add_exception_handler(ReviewAlreadyExists, review_already_exists_handler)
app.add_exception_handler(JobNotCompleted, job_not_completed_handler)
app.add_exception_handler(SelfReviewNotAllowed, self_review_not_allowed_handler)

# ==========================
# Root Endpoint
# ==========================


@app.get("/", tags=["Root"])
async def root():
    return {"message": "Atlas API is running 🚀"}
