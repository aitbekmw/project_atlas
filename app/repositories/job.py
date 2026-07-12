from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.job import Job


class JobRepository:

    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(self, job: Job):
        self.db.add(job)
        await self.db.commit()
        await self.db.refresh(job)
        return job

    async def get_all(self):
        result = await self.db.execute(
            select(Job)
        )
        return result.scalars().all()

    async def get_by_id(self, job_id: int):
        result = await self.db.execute(
            select(Job).where(Job.id == job_id)
        )
        return result.scalar_one_or_none()

    async def update(self):
        await self.db.commit()

    async def delete(self, job: Job):
        await self.db.delete(job)
        await self.db.commit()