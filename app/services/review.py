from app.core.exceptions import (
    JobNotCompleted,
    JobNotFound,
    PermissionDenied,
    ReviewAlreadyExists,
    ReviewNotFound,
    SelfReviewNotAllowed,
)
from app.models.enum import JobStatus, UserRole
from app.models.review import Review
from app.models.user import User
from app.repositories.application import ApplicationRepository
from app.repositories.job import JobRepository
from app.repositories.review import ReviewRepository
from app.schemas.review import ReviewCreate


class ReviewService:
    def __init__(
        self,
        repo: ReviewRepository,
        job_repo: JobRepository,
        application_repo: ApplicationRepository,
    ):
        self.repo = repo
        self.job_repo = job_repo
        self.application_repo = application_repo

    async def create(
        self,
        data: ReviewCreate,
        from_user_id: int,
    ):
        job = await self.job_repo.get_by_id(data.job_id)

        if not job:
            raise JobNotFound()

        if job.status != JobStatus.COMPLETED.value:
            raise JobNotCompleted()

        if from_user_id == data.to_user_id:
            raise SelfReviewNotAllowed()

        accepted = await self.application_repo.get_accepted_by_job(job.id)

        if not accepted:
            raise PermissionDenied()

        if from_user_id == job.owner_id:
            if data.to_user_id != accepted.worker_id:
                raise PermissionDenied()
        elif from_user_id == accepted.worker_id:
            if data.to_user_id != job.owner_id:
                raise PermissionDenied()
        else:
            raise PermissionDenied()

        existing = await self.repo.get_by_job_and_author(
            data.job_id,
            from_user_id,
        )

        if existing:
            raise ReviewAlreadyExists()

        review = Review(
            rating=data.rating,
            comment=data.comment,
            job_id=data.job_id,
            from_user_id=from_user_id,
            to_user_id=data.to_user_id,
        )

        return await self.repo.create(review)

    async def get_all(self):
        return await self.repo.get_all()

    async def get_by_id(
        self,
        review_id: int,
    ):
        review = await self.repo.get_by_id(review_id)

        if not review:
            raise ReviewNotFound()

        return review

    async def get_by_user(
        self,
        user_id: int,
    ):
        return await self.repo.get_by_user(user_id)

    async def delete(
        self,
        review_id: int,
        user: User,
    ):
        review = await self.get_by_id(review_id)

        if review.from_user_id != user.id and user.role != UserRole.ADMIN.value:
            raise PermissionDenied()

        await self.repo.delete(review)
