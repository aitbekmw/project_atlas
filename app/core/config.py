from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "Atlas API"
    VERSION: str = "1.0.0"

    # ==========================
    # Database
    # ==========================

    DATABASE_URL: str

    TEST_DATABASE_URL: str | None = None

    REDIS_URL: str

    TESTING: bool = False

    # ==========================
    # JWT
    # ==========================
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
        "http://localhost",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
    ]

    # ==========================
    # Uploads (оставим для будущих локальных файлов)
    # ==========================
    UPLOAD_DIR: str = "media"
    AVATAR_DIR: str = "avatars"
    MAX_FILE_SIZE: int = 5 * 1024 * 1024

    # ==========================
    # MinIO
    # ==========================
    MINIO_ENDPOINT: str
    MINIO_ACCESS_KEY: str
    MINIO_SECRET_KEY: str
    MINIO_BUCKET: str
    MINIO_SECURE: bool = False

    model_config = SettingsConfigDict(
        env_file=".env",
        case_sensitive=True,
    )


settings = Settings()
