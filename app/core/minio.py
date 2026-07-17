from minio import Minio

from app.core.config import settings

minio_client = Minio(
    endpoint=settings.MINIO_ENDPOINT,
    access_key=settings.MINIO_ACCESS_KEY,
    secret_key=settings.MINIO_SECRET_KEY,
    secure=settings.MINIO_SECURE,
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
