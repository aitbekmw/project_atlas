from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.refresh_token import RefreshToken


class RefreshTokenRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(
        self,
        refresh_token: RefreshToken,
    ):
        self.db.add(refresh_token)
        await self.db.commit()
        await self.db.refresh(refresh_token)
        return refresh_token

    async def get_by_hash(
        self,
        token_hash: str,
    ):
        result = await self.db.execute(
            select(RefreshToken).where(RefreshToken.token_hash == token_hash)
        )
        return result.scalar_one_or_none()

    async def revoke(
        self,
        refresh_token: RefreshToken,
    ):
        refresh_token.is_revoked = True
        await self.db.commit()

    async def delete_by_user(
        self,
        user_id: int,
    ):
        result = await self.db.execute(
            select(RefreshToken).where(RefreshToken.user_id == user_id)
        )

        tokens = result.scalars().all()

        for token in tokens:
            await self.db.delete(token)

        await self.db.commit()
