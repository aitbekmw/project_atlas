from sqlalchemy import desc, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.application import Application
from app.models.enum import ApplicationStatus
from app.models.job import Job


class ApplicationRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(self, application: Application):
        self.db.add(application)
        await self.db.commit()
        await self.db.refresh(application)
        return application

    async def get_by_id(self, application_id: int):
        result = await self.db.execute(
            select(Application).where(Application.id == application_id)
        )
        return result.scalar_one_or_none()

    async def get_all(self):
        result = await self.db.execute(
            select(Application).order_by(desc(Application.created_at))
        )
        return result.scalars().all()

    async def get_visible_to_user(self, user_id: int):
        result = await self.db.execute(
            select(Application)
            .join(Job, Application.job_id == Job.id)
            .where((Application.worker_id == user_id) | (Job.owner_id == user_id))
            .order_by(desc(Application.created_at))
        )
        return result.scalars().all()

    async def get_by_worker(self, worker_id: int):
        result = await self.db.execute(
            select(Application)
            .where(Application.worker_id == worker_id)
            .order_by(desc(Application.created_at))
        )
        return result.scalars().all()

    async def get_by_worker_and_job(
        self,
        worker_id: int,
        job_id: int,
    ):
        result = await self.db.execute(
            select(Application).where(
                Application.worker_id == worker_id,
                Application.job_id == job_id,
            )
        )
        return result.scalar_one_or_none()

    async def get_by_job(
        self,
        job_id: int,
    ):
        result = await self.db.execute(
            select(Application)
            .where(Application.job_id == job_id)
            .order_by(desc(Application.created_at))
        )
        return result.scalars().all()

    async def get_accepted_by_job(
        self,
        job_id: int,
    ):
        result = await self.db.execute(
            select(Application).where(
                Application.job_id == job_id,
                Application.status == ApplicationStatus.ACCEPTED.value,
            )
        )
        return result.scalar_one_or_none()

    async def update(self):
        await self.db.commit()

    async def update_many(self):
        await self.db.commit()

    async def delete(self, application: Application):
        await self.db.delete(application)
        await self.db.commit()
