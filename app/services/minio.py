from datetime import timedelta
from io import BytesIO
from uuid import uuid4

from fastapi import UploadFile
from minio.error import S3Error

from app.core.config import settings
from app.core.minio import minio_client, minio_presign_client


class MinioService:
    async def upload_file(
        self,
        file: UploadFile,
        folder: str,
    ) -> str:
        extension = (file.filename or "jpg").rsplit(".", 1)[-1].lower()
        object_name = f"{folder}/{uuid4()}.{extension}"
        data = await file.read()
        minio_client.put_object(
            bucket_name=settings.MINIO_BUCKET,
            object_name=object_name,
            data=BytesIO(data),
            length=len(data),
            content_type=file.content_type,
        )
        return object_name

    async def upload_avatar(self, file: UploadFile) -> str:
        return await self.upload_file(file, "avatars")

    def delete_file(self, object_name: str) -> None:
        try:
            minio_client.remove_object(
                settings.MINIO_BUCKET,
                object_name,
            )
        except S3Error:
            pass

    def delete_avatar(self, object_name: str) -> None:
        self.delete_file(object_name)

    def get_file_url(self, object_name: str) -> str:
        return minio_presign_client.presigned_get_object(
            settings.MINIO_BUCKET,
            object_name,
            expires=timedelta(seconds=settings.MINIO_PRESIGN_EXPIRES_SECONDS),
        )

    def get_avatar_url(self, object_name: str) -> str:
        return self.get_file_url(object_name)
