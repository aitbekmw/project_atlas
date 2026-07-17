from fastapi import UploadFile

from app.core.exceptions import IncorrectPassword, SamePassword, UserNotFound
from app.core.security import hash_password, verify_password
from app.models.user import User
from app.repositories.user import UserRepository
from app.schemas.user import UserUpdate
from app.services.minio import MinioService


class UserService:

    def __init__(
        self,
        repo: UserRepository,
    ):
        self.repo = repo
        self.minio_service = MinioService()

    async def get_by_id(
        self,
        user_id: int,
    ):
        user = await self.repo.get_by_id(user_id)

        if not user:
            raise UserNotFound()

        return user

    async def update(
        self,
        user: User,
        data: UserUpdate,
    ):
        for key, value in data.model_dump(exclude_unset=True).items():
            setattr(user, key, value)

        await self.repo.update()

        return user

    async def change_password(
        self,
        user: User,
        current_password: str,
        new_password: str,
    ):
        if not verify_password(
            current_password,
            user.hashed_password,
        ):
            raise IncorrectPassword()

        if verify_password(
            new_password,
            user.hashed_password,
        ):
            raise SamePassword()

        hashed_password = hash_password(new_password)

        return await self.repo.change_password(
            user,
            hashed_password,
        )

    async def upload_avatar(
        self,
        user: User,
        file: UploadFile,
    ):
        if user.avatar:
            self.minio_service.delete_avatar(
                user.avatar,
            )

        object_name = await self.minio_service.upload_avatar(
            file,
        )

        user.avatar = object_name

        await self.repo.update()

        return user

    async def delete_avatar(
        self,
        user: User,
    ):
        if user.avatar:
            self.minio_service.delete_avatar(
                user.avatar,
            )

        user.avatar = None

        await self.repo.update()

        return user

    def get_avatar_url(
        self,
        user: User,
    ):
        if not user.avatar:
            return None

        return self.minio_service.get_avatar_url(
            user.avatar,
        )

    async def set_online(
        self,
        user: User,
    ):
        return await self.repo.set_online(
            user,
        )

    async def set_offline(
        self,
        user: User,
    ):
        return await self.repo.set_offline(
            user,
        )
