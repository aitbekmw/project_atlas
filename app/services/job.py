from app.core.exceptions import CategoryNotFound, JobNotFound, PermissionDenied
from app.models.enum import JobStatus, UserRole
from app.models.job import Job
from app.models.user import User
from app.repositories.category import CategoryRepository
from app.repositories.job import JobRepository
from app.schemas.job import JobCreate, JobUpdate


class JobService:
    def __init__(
        self,
        repo: JobRepository,
        category_repo: CategoryRepository,
    ):
        self.repo = repo
        self.category_repo = category_repo

    def _ensure_owner_or_admin(self, job: Job, user: User) -> None:
        if job.owner_id != user.id and user.role != UserRole.ADMIN.value:
            raise PermissionDenied()

    async def _ensure_category(self, category_id: int) -> None:
        category = await self.category_repo.get_by_id(category_id)

        if not category or not category.is_active:
            raise CategoryNotFound()

    async def create(
        self,
        data: JobCreate,
        owner_id: int,
    ):
        await self._ensure_category(data.category_id)

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
        status: str | None = None,
    ):
        return await self.repo.get_all(
            page,
            size,
            status=status,
            is_active=True,
        )

    async def search(
        self,
        search: str | None = None,
        city: str | None = None,
        category_id: int | None = None,
        min_salary: int | None = None,
        status: str | None = None,
        page: int = 1,
        size: int = 10,
    ):
        return await self.repo.search(
            search=search,
            city=city,
            category_id=category_id,
            min_salary=min_salary,
            status=status,
            is_active=True,
            page=page,
            size=size,
        )

    async def get_by_id(self, job_id: int):
        job = await self.repo.get_by_id(job_id)

        if not job:
            raise JobNotFound()

        return job

    async def update(
        self,
        job_id: int,
        user: User,
        data: JobUpdate,
    ):
        job = await self.get_by_id(job_id)

        self._ensure_owner_or_admin(job, user)

        payload = data.model_dump(exclude_unset=True)

        if "category_id" in payload:
            await self._ensure_category(payload["category_id"])

        for key, value in payload.items():
            setattr(job, key, value)

        await self.repo.update()

        return job

    async def complete(
        self,
        job_id: int,
        user: User,
    ):
        job = await self.get_by_id(job_id)

        self._ensure_owner_or_admin(job, user)

        if job.status == JobStatus.CANCELLED.value:
            raise PermissionDenied()

        job.status = JobStatus.COMPLETED.value

        await self.repo.update()

        return job

    async def cancel(
        self,
        job_id: int,
        user: User,
    ):
        job = await self.get_by_id(job_id)

        self._ensure_owner_or_admin(job, user)

        if job.status == JobStatus.COMPLETED.value:
            raise PermissionDenied()

        job.status = JobStatus.CANCELLED.value
        job.is_active = False

        await self.repo.update()

        return job

    async def delete(
        self,
        job_id: int,
        user: User,
    ):
        job = await self.get_by_id(job_id)

        self._ensure_owner_or_admin(job, user)

        await self.repo.delete(job)
