from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.category import Category


class CategoryRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(self, category: Category):
        self.db.add(category)
        await self.db.commit()
        await self.db.refresh(category)
        return category

    async def get_all(self):
        result = await self.db.execute(select(Category))
        return result.scalars().all()

    async def get_by_id(self, category_id: int):
        result = await self.db.execute(
            select(Category).where(Category.id == category_id)
        )
        return result.scalar_one_or_none()

    async def get_by_name(self, name: str):
        result = await self.db.execute(select(Category).where(Category.name == name))
        return result.scalar_one_or_none()

    async def update(self):
        await self.db.commit()

    async def delete(self, category: Category):
        await self.db.delete(category)
        await self.db.commit()
