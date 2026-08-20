from sqlalchemy import and_, desc, or_, select
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

    async def get_all(
        self,
        page: int = 1,
        size: int = 10,
        status: str | None = None,
        is_active: bool | None = True,
    ):
        offset = (page - 1) * size

        query = select(Job)

        if is_active is not None:
            query = query.where(Job.is_active == is_active)

        if status is not None:
            query = query.where(Job.status == status)

        result = await self.db.execute(
            query.order_by(desc(Job.created_at)).offset(offset).limit(size)
        )

        return result.scalars().all()

    async def get_by_id(self, job_id: int):
        result = await self.db.execute(select(Job).where(Job.id == job_id))
        return result.scalar_one_or_none()

    async def get_by_owner(self, owner_id: int):
        result = await self.db.execute(
            select(Job).where(Job.owner_id == owner_id).order_by(desc(Job.created_at))
        )
        return result.scalars().all()

    async def search(
        self,
        search: str | None = None,
        city: str | None = None,
        category_id: int | None = None,
        min_salary: int | None = None,
        status: str | None = None,
        is_active: bool | None = True,
        page: int = 1,
        size: int = 10,
    ):
        query = select(Job)

        filters = []

        if is_active is not None:
            filters.append(Job.is_active == is_active)

        if search:
            filters.append(
                or_(
                    Job.title.ilike(f"%{search}%"),
                    Job.description.ilike(f"%{search}%"),
                )
            )

        if city:
            filters.append(Job.city == city)

        if category_id is not None:
            filters.append(Job.category_id == category_id)

        if min_salary is not None:
            filters.append(Job.salary >= min_salary)

        if status is not None:
            filters.append(Job.status == status)

        if filters:
            query = query.where(and_(*filters))

        offset = (page - 1) * size

        query = query.order_by(desc(Job.created_at)).offset(offset).limit(size)

        result = await self.db.execute(query)

        return result.scalars().all()

    async def update(self):
        await self.db.commit()

    async def delete(self, job: Job):
        await self.db.delete(job)
        await self.db.commit()
