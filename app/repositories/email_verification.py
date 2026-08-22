from datetime import datetime, timezone

from sqlalchemy import desc, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.email_verification import EmailVerification


class EmailVerificationRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(self, item: EmailVerification) -> EmailVerification:
        self.db.add(item)
        await self.db.commit()
        await self.db.refresh(item)
        return item

    async def get_latest(self, user_id: int) -> EmailVerification | None:
        result = await self.db.execute(
            select(EmailVerification)
            .where(EmailVerification.user_id == user_id)
            .order_by(desc(EmailVerification.created_at))
            .limit(1)
        )
        return result.scalar_one_or_none()

    async def get_latest_active(self, user_id: int) -> EmailVerification | None:
        result = await self.db.execute(
            select(EmailVerification)
            .where(
                EmailVerification.user_id == user_id,
                EmailVerification.consumed_at.is_(None),
            )
            .order_by(desc(EmailVerification.created_at))
            .limit(1)
        )
        return result.scalar_one_or_none()

    async def invalidate_active(self, user_id: int) -> None:
        now = datetime.now(timezone.utc)
        await self.db.execute(
            update(EmailVerification)
            .where(
                EmailVerification.user_id == user_id,
                EmailVerification.consumed_at.is_(None),
            )
            .values(consumed_at=now)
        )
        await self.db.commit()

    async def save(self) -> None:
        await self.db.commit()
