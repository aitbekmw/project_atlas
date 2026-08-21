from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import api_router
from app.api.health import router as health_router
from app.core.config import settings
from app.core.handlers import register_exception_handlers
from app.core.logging import setup_logging
from app.core.middleware import LoggingMiddleware
from app.core.minio import create_bucket
from app.core.redis import connect_redis, disconnect_redis
from app.services.bootstrap import ensure_default_categories
from app.websocket.redis import start_subscriber
from app.websocket.routes import router as websocket_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    if not settings.TESTING:
        create_bucket()
        await ensure_default_categories()
        await connect_redis()
        await start_subscriber()

    yield

    if not settings.TESTING:
        await disconnect_redis()


setup_logging()

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    lifespan=lifespan,
)

app.add_middleware(LoggingMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_origin_regex=r"http://(localhost|127\.0\.0\.1):\d+",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router)
app.include_router(websocket_router)
app.include_router(health_router)

register_exception_handlers(app)


@app.get("/", tags=["Root"])
async def root():
    return {"message": "Atlas API is running"}
