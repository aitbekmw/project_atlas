from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.oauth_account import OAuthAccount


class OAuthAccountRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_provider_account(
        self,
        provider: str,
        provider_account_id: str,
    ) -> OAuthAccount | None:
        result = await self.db.execute(
            select(OAuthAccount).where(
                OAuthAccount.provider == provider,
                OAuthAccount.provider_account_id == provider_account_id,
            )
        )
        return result.scalar_one_or_none()

    async def get_for_user(
        self,
        user_id: int,
        provider: str,
    ) -> OAuthAccount | None:
        result = await self.db.execute(
            select(OAuthAccount).where(
                OAuthAccount.user_id == user_id,
                OAuthAccount.provider == provider,
            )
        )
        return result.scalar_one_or_none()

    async def create(self, item: OAuthAccount) -> OAuthAccount:
        self.db.add(item)
        await self.db.commit()
        await self.db.refresh(item)
        return item
