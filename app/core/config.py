import json

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict
from sqlalchemy.engine.url import make_url


def normalize_async_database_url(url: str) -> str:
    """Force a URL that SQLAlchemy create_async_engine can load (asyncpg).

    Render/managed Postgres typically provides postgres:// or postgresql://.
    Those schemes default to psycopg2, which is not an async driver.
    """
    raw = url.strip().strip("'").strip('"')
    parsed = make_url(raw)
    if parsed.get_backend_name() not in {"postgres", "postgresql"}:
        return parsed.render_as_string(hide_password=False)

    query = dict(parsed.query)
    sslmode = query.pop("sslmode", None)
    if sslmode in {"require", "verify-ca", "verify-full"}:
        query["ssl"] = "true"

    parsed = parsed.set(drivername="postgresql+asyncpg", query=query)
    return parsed.render_as_string(hide_password=False)


def normalize_sync_database_url(url: str) -> str:
    """Alembic uses a sync engine; keep psycopg2 for migrations only."""
    raw = url.strip().strip("'").strip('"')
    parsed = make_url(raw)
    if parsed.get_backend_name() not in {"postgres", "postgresql"}:
        return parsed.render_as_string(hide_password=False)

    query = dict(parsed.query)
    ssl = query.pop("ssl", None)
    if ssl in {"true", "require", "1"} and "sslmode" not in query:
        query["sslmode"] = "require"

    parsed = parsed.set(drivername="postgresql+psycopg2", query=query)
    return parsed.render_as_string(hide_password=False)


class Settings(BaseSettings):
    PROJECT_NAME: str = "Atlas API"
    VERSION: str = "1.0.0"

    DATABASE_URL: str
    TEST_DATABASE_URL: str | None = None
    REDIS_URL: str
    TESTING: bool = False

    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    JWT_ISSUER: str = "atlas-api"
    JWT_AUDIENCE: str = "atlas-users"
    DATABASE_ECHO: bool = False

    CORS_ORIGINS: list[str] = [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:5175",
        "http://localhost:5176",
        "http://localhost",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
        "http://127.0.0.1:5175",
        "http://127.0.0.1:5176",
        "https://atlas-frontend-2a9s.onrender.com",
    ]

    UPLOAD_DIR: str = "media"
    AVATAR_DIR: str = "avatars"
    MAX_FILE_SIZE: int = 5 * 1024 * 1024

    MINIO_ENDPOINT: str
    MINIO_ACCESS_KEY: str
    MINIO_SECRET_KEY: str
    MINIO_BUCKET: str
    MINIO_SECURE: bool = False
    MINIO_PUBLIC_ENDPOINT: str | None = None
    MINIO_PRESIGN_EXPIRES_SECONDS: int = 7 * 24 * 60 * 60

    model_config = SettingsConfigDict(
        env_file=".env",
        case_sensitive=True,
        extra="ignore",
    )

    @field_validator("DATABASE_URL", mode="before")
    @classmethod
    def normalize_database_url(cls, value: object) -> object:
        if isinstance(value, str) and value.strip():
            return normalize_async_database_url(value)
        return value

    @field_validator("TEST_DATABASE_URL", mode="before")
    @classmethod
    def normalize_test_database_url(cls, value: object) -> object:
        if not isinstance(value, str) or not value.strip():
            return value
        return normalize_async_database_url(value)

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def parse_cors_origins(cls, value: object) -> object:
        if isinstance(value, str):
            text = value.strip()
            if not text:
                return []
            if text.startswith("["):
                parsed = json.loads(text)
                if isinstance(parsed, list):
                    return [str(item).strip() for item in parsed if str(item).strip()]
                return parsed
            return [item.strip() for item in text.split(",") if item.strip()]
        return value

    @field_validator("CORS_ORIGINS")
    @classmethod
    def include_production_frontend(cls, value: list[str]) -> list[str]:
        production = "https://atlas-frontend-2a9s.onrender.com"
        origins = [item.rstrip("/") for item in value]
        if production not in origins:
            origins.append(production)
        return origins


settings = Settings()
