from minio import Minio

from app.core.config import settings


def _build_client(endpoint: str) -> Minio:
    return Minio(
        endpoint=endpoint,
        access_key=settings.MINIO_ACCESS_KEY,
        secret_key=settings.MINIO_SECRET_KEY,
        secure=settings.MINIO_SECURE,
        region="us-east-1",
    )


minio_client = _build_client(settings.MINIO_ENDPOINT)

_public_endpoint = (
    settings.MINIO_PUBLIC_ENDPOINT or ""
).strip() or settings.MINIO_ENDPOINT
minio_presign_client = (
    minio_client
    if _public_endpoint == settings.MINIO_ENDPOINT
    else _build_client(_public_endpoint)
)


def create_bucket():
    """
    Создает bucket при запуске приложения,
    если он еще не существует.
    """

    if not minio_client.bucket_exists(
        settings.MINIO_BUCKET,
    ):
        minio_client.make_bucket(
            settings.MINIO_BUCKET,
        )
