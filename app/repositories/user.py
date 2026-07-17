import asyncio

from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User


class UserRepository:

    def __init__(self, db: AsyncSession):
        self.db = db


    async def get_by_email(self, email: str):
        print("=" * 60)
        print("REPOSITORY")
        print("Session:", id(self.db))
        print("Loop:", asyncio.get_running_loop())
        print("=" * 60)

        result = await self.db.execute(
            select(User).where(User.email == email)
        )
        return result.scalar_one_or_none()

    async def get_by_username(self, username: str):
        result = await self.db.execute(select(User).where(User.username == username))
        return result.scalar_one_or_none()

    async def create(self, user: User):
        self.db.add(user)
        await self.db.commit()
        await self.db.refresh(user)
        return user

    async def get_by_id(self, user_id: int):
        result = await self.db.execute(select(User).where(User.id == user_id))
        return result.scalar_one_or_none()

    async def update(
        self,
        user: User,
    ):
        await self.db.commit()
        await self.db.refresh(user)
        return user

    async def change_password(
        self,
        user: User,
        hashed_password: str,
    ):
        user.hashed_password = hashed_password

        await self.db.commit()
        await self.db.refresh(user)

        return user

    async def set_online(
        self,
        user: User,
    ):
        user.is_online = True

        await self.db.commit()
        await self.db.refresh(user)

        return user

    async def set_offline(
        self,
        user: User,
    ):
        user.is_online = False
        user.last_seen = datetime.now(timezone.utc)

        await self.db.commit()
        await self.db.refresh(user)

        return user
