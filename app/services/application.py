from app.core.exceptions import (
    ApplicationAlreadyExists,
    ApplicationNotFound,
    JobNotFound,
    JobNotOpen,
    PermissionDenied,
)
from app.models.application import Application
from app.models.enum import ApplicationStatus, JobStatus, UserRole
from app.models.user import User
from app.repositories.application import ApplicationRepository
from app.repositories.job import JobRepository
from app.schemas.application import ApplicationCreate, ApplicationUpdate


class ApplicationService:
    def __init__(
        self,
        repo: ApplicationRepository,
        job_repo: JobRepository,
    ):
        self.repo = repo
        self.job_repo = job_repo

    def _is_admin(self, user: User) -> bool:
        return user.role == UserRole.ADMIN.value

    async def create(
        self,
        data: ApplicationCreate,
        worker_id: int,
    ):
        job = await self.job_repo.get_by_id(data.job_id)

        if not job:
            raise JobNotFound()

        if job.owner_id == worker_id:
            raise PermissionDenied()

        if job.status != JobStatus.OPEN.value or not job.is_active:
            raise JobNotOpen()

        exists = await self.repo.get_by_worker_and_job(
            worker_id,
            data.job_id,
        )

        if exists:
            raise ApplicationAlreadyExists()

        application = Application(
            worker_id=worker_id,
            job_id=data.job_id,
        )

        return await self.repo.create(application)

    async def get_all(self, user: User):
        if self._is_admin(user):
            return await self.repo.get_all()

        return await self.repo.get_visible_to_user(user.id)

    async def get_by_id(self, application_id: int, user: User):
        application = await self.repo.get_by_id(application_id)

        if not application:
            raise ApplicationNotFound()

        await self._ensure_can_view(application, user)

        return application

    async def get_by_job(self, job_id: int, user: User):
        job = await self.job_repo.get_by_id(job_id)

        if not job:
            raise JobNotFound()

        if job.owner_id != user.id and not self._is_admin(user):
            raise PermissionDenied()

        return await self.repo.get_by_job(job_id)

    async def update(
        self,
        application_id: int,
        data: ApplicationUpdate,
        user: User,
    ):
        if data.status == ApplicationStatus.ACCEPTED:
            return await self.accept(application_id, user)

        if data.status == ApplicationStatus.REJECTED:
            return await self.reject(application_id, user)

        application = await self.repo.get_by_id(application_id)

        if not application:
            raise ApplicationNotFound()

        job = await self.job_repo.get_by_id(application.job_id)

        if job.owner_id != user.id and not self._is_admin(user):
            raise PermissionDenied()

        application.status = data.status.value

        await self.repo.update()

        return application

    async def delete(self, application_id: int, user: User):
        application = await self.repo.get_by_id(application_id)

        if not application:
            raise ApplicationNotFound()

        job = await self.job_repo.get_by_id(application.job_id)

        is_owner = job.owner_id == user.id
        is_worker = application.worker_id == user.id

        if not (self._is_admin(user) or is_owner or is_worker):
            raise PermissionDenied()

        if is_worker and not is_owner and not self._is_admin(user):
            if application.status != ApplicationStatus.PENDING.value:
                raise PermissionDenied()

        await self.repo.delete(application)

    async def accept(
        self,
        application_id: int,
        user: User,
    ):
        application = await self.repo.get_by_id(application_id)

        if not application:
            raise ApplicationNotFound()

        job = await self.job_repo.get_by_id(application.job_id)

        if job.owner_id != user.id and not self._is_admin(user):
            raise PermissionDenied()

        if application.status == ApplicationStatus.ACCEPTED.value:
            return application

        if job.status != JobStatus.OPEN.value:
            raise JobNotOpen()

        application.status = ApplicationStatus.ACCEPTED.value

        applications = await self.repo.get_by_job(application.job_id)

        for item in applications:
            if item.id != application.id:
                item.status = ApplicationStatus.REJECTED.value

        job.status = JobStatus.IN_PROGRESS.value

        await self.repo.update_many()

        return application

    async def reject(
        self,
        application_id: int,
        user: User,
    ):
        application = await self.repo.get_by_id(application_id)

        if not application:
            raise ApplicationNotFound()

        job = await self.job_repo.get_by_id(application.job_id)

        if job.owner_id != user.id and not self._is_admin(user):
            raise PermissionDenied()

        if application.status == ApplicationStatus.REJECTED.value:
            return application

        if application.status == ApplicationStatus.ACCEPTED.value:
            raise PermissionDenied()

        application.status = ApplicationStatus.REJECTED.value

        await self.repo.update()

        return application

    async def _ensure_can_view(self, application, user: User) -> None:
        if self._is_admin(user):
            return

        if application.worker_id == user.id:
            return

        job = await self.job_repo.get_by_id(application.job_id)

        if job and job.owner_id == user.id:
            return

        raise PermissionDenied()
