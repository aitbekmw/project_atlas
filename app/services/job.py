from fastapi import UploadFile

from app.core.exceptions import CategoryNotFound, JobNotFound, PermissionDenied
from app.core.geo import haversine_km
from app.models.enum import JobStatus, PaymentMethod, UserRole
from app.models.job import Job
from app.models.user import User
from app.repositories.application import ApplicationRepository
from app.repositories.category import CategoryRepository
from app.repositories.job import JobRepository
from app.schemas.job import JobCreate, JobNearbyResponse, JobResponse, JobUpdate
from app.services.minio import MinioService


class JobService:
    def __init__(
        self,
        repo: JobRepository,
        category_repo: CategoryRepository,
        application_repo: ApplicationRepository,
    ):
        self.repo = repo
        self.category_repo = category_repo
        self.application_repo = application_repo
        self.minio_service = MinioService()

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
            payment_method=data.payment_method.value,
            city=data.city,
            address=data.address,
            category_id=data.category_id,
            owner_id=owner_id,
            latitude=data.latitude,
            longitude=data.longitude,
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
        payment_method: str | None = None,
        status: str | None = None,
        page: int = 1,
        size: int = 10,
    ):
        return await self.repo.search(
            search=search,
            city=city,
            category_id=category_id,
            min_salary=min_salary,
            payment_method=payment_method,
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

        if "payment_method" in payload and payload["payment_method"] is not None:
            method = payload["payment_method"]
            payload["payment_method"] = (
                method.value if isinstance(method, PaymentMethod) else method
            )

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

        if job.status != JobStatus.IN_PROGRESS.value:
            raise PermissionDenied()

        accepted = await self.application_repo.get_accepted_by_job(job.id)

        if not accepted:
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

    async def get_nearby(
        self,
        lat: float,
        lng: float,
        radius_km: float = 10,
        size: int = 30,
    ) -> list[JobNearbyResponse]:
        jobs = await self.repo.get_open_with_coords()
        scored: list[tuple[float, Job]] = []
        for job in jobs:
            if job.latitude is None or job.longitude is None:
                continue
            distance = haversine_km(lat, lng, job.latitude, job.longitude)
            if distance <= radius_km:
                scored.append((distance, job))
        scored.sort(key=lambda item: item[0])
        nearby: list[JobNearbyResponse] = []
        for distance, job in scored[:size]:
            data = JobResponse.model_validate(job).model_dump()
            data.pop("image_url", None)
            nearby.append(
                JobNearbyResponse(
                    **data,
                    image_key=job.image_key,
                    distance_km=round(distance, 1),
                )
            )
        return nearby

    async def upload_image(self, job_id: int, user: User, file: UploadFile) -> Job:
        job = await self.get_by_id(job_id)
        self._ensure_owner_or_admin(job, user)
        if job.image_key:
            self.minio_service.delete_file(job.image_key)
        job.image_key = await self.minio_service.upload_file(file, "jobs")
        await self.repo.update()
        return job

    async def delete_image(self, job_id: int, user: User) -> Job:
        job = await self.get_by_id(job_id)
        self._ensure_owner_or_admin(job, user)
        if job.image_key:
            self.minio_service.delete_file(job.image_key)
            job.image_key = None
            await self.repo.update()
        return job
