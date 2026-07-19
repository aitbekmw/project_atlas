from app.core.exceptions import JobNotFound, PermissionDenied
from app.models.enum import JobStatus
from app.models.job import Job
from app.repositories.job import JobRepository
from app.schemas.job import JobCreate, JobUpdate


class JobService:
    def __init__(self, repo: JobRepository):
        self.repo = repo

    async def create(
        self,
        data: JobCreate,
        owner_id: int,
    ):
        job = Job(
            title=data.title,
            description=data.description,
            salary=data.salary,
            city=data.city,
            address=data.address,
            category_id=data.category_id,
            owner_id=owner_id,
        )

        return await self.repo.create(job)

    async def get_all(
        self,
        page: int = 1,
        size: int = 10,
    ):
        return await self.repo.get_all(
            page,
            size,
        )

    async def search(
        self,
        search: str | None = None,
        city: str | None = None,
        category_id: int | None = None,
        min_salary: int | None = None,
    ):
        return await self.repo.search(
            search=search,
            city=city,
            category_id=category_id,
            min_salary=min_salary,
        )

    async def get_by_id(self, job_id: int):
        job = await self.repo.get_by_id(job_id)

        if not job:
            raise JobNotFound()

        return job

    async def update(
        self,
        job_id: int,
        owner_id: int,
        data: JobUpdate,
    ):
        job = await self.get_by_id(job_id)

        if job.owner_id != owner_id:
            raise PermissionDenied()

        for key, value in data.model_dump(exclude_unset=True).items():
            setattr(job, key, value)

        await self.repo.update()

        return job

    async def complete(
        self,
        job_id: int,
        owner_id: int,
    ):
        job = await self.get_by_id(job_id)

        if job.owner_id != owner_id:
            raise PermissionDenied()

        job.status = JobStatus.COMPLETED.value

        await self.repo.update()

        return job

    async def delete(
        self,
        job_id: int,
        owner_id: int,
    ):
        job = await self.get_by_id(job_id)

        if job.owner_id != owner_id:
            raise PermissionDenied()

        await self.repo.delete(job)
