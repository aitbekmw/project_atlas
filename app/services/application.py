from app.core.exceptions import (
    ApplicationAlreadyExists,
    ApplicationNotFound,
    PermissionDenied,
)
from app.models.application import Application
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

    async def create(
        self,
        data: ApplicationCreate,
        worker_id: int,
    ):
        job = await self.job_repo.get_by_id(data.job_id)

        if job.owner_id == worker_id:
            raise PermissionDenied()

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

    async def get_all(self):
        return await self.repo.get_all()

    async def get_by_id(self, application_id: int):
        application = await self.repo.get_by_id(application_id)

        if not application:
            raise ApplicationNotFound()

        return application

    async def update(
        self,
        application_id: int,
        data: ApplicationUpdate,
    ):
        application = await self.get_by_id(application_id)

        application.status = data.status

        await self.repo.update()

        return application

    async def delete(self, application_id: int):
        application = await self.get_by_id(application_id)

        await self.repo.delete(application)

    async def accept(
        self,
        application_id: int,
        owner_id: int,
    ):
        application = await self.get_by_id(application_id)

        job = await self.job_repo.get_by_id(application.job_id)

        if job.owner_id != owner_id:
            raise PermissionDenied()

        application.status = "ACCEPTED"

        applications = await self.repo.get_by_job(application.job_id)

        for item in applications:
            if item.id != application.id:
                item.status = "REJECTED"

        job.status = "IN_PROGRESS"

        await self.repo.update_many()

        return application

    async def reject(
        self,
        application_id: int,
        owner_id: int,
    ):
        application = await self.get_by_id(application_id)

        job = await self.job_repo.get_by_id(application.job_id)

        if job.owner_id != owner_id:
            raise PermissionDenied()

        application.status = "REJECTED"

        await self.repo.update()

        return application
