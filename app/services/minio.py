from io import BytesIO
from uuid import uuid4

from fastapi import UploadFile
from minio.error import S3Error

from app.core.config import settings
from app.core.minio import minio_client


class MinioService:

    async def upload_avatar(
        self,
        file: UploadFile,
    ) -> str:
        extension = file.filename.split(".")[-1].lower()

        object_name = f"avatars/{uuid4()}.{extension}"

        data = await file.read()

        minio_client.put_object(
            bucket_name=settings.MINIO_BUCKET,
            object_name=object_name,
            data=BytesIO(data),
            length=len(data),
            content_type=file.content_type,
        )

        return object_name

    def delete_avatar(
        self,
        object_name: str,
    ):
        try:
            minio_client.remove_object(
                settings.MINIO_BUCKET,
                object_name,
            )

        except S3Error:
            pass

    def get_avatar_url(
        self,
        object_name: str,
    ) -> str:
        return minio_client.presigned_get_object(
            settings.MINIO_BUCKET,
            object_name,
        )
