from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.review import Review


class ReviewRepository:

    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(self, review: Review):
        self.db.add(review)
        await self.db.commit()
        await self.db.refresh(review)
        return review

    async def get_by_id(self, review_id: int):
        result = await self.db.execute(select(Review).where(Review.id == review_id))
        return result.scalar_one_or_none()

    async def get_all(self):
        result = await self.db.execute(select(Review))
        return result.scalars().all()

    async def get_by_user(self, user_id: int):
        result = await self.db.execute(
            select(Review).where(Review.to_user_id == user_id)
        )
        return result.scalars().all()

    async def delete(self, review: Review):
        await self.db.delete(review)
        await self.db.commit()
