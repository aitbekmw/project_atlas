from app.models.enum import JobStatus
from app.models.review import Review
from app.repositories.job import JobRepository
from app.repositories.review import ReviewRepository
from app.schemas.review import ReviewCreate


class ReviewNotFound(Exception):
    pass


class ReviewAlreadyExists(Exception):
    pass


class ReviewService:

    def __init__(
        self,
        repo: ReviewRepository,
        job_repo: JobRepository,
    ):
        self.repo = repo
        self.job_repo = job_repo

    async def create(
        self,
        data: ReviewCreate,
        from_user_id: int,
    ):
        job = await self.job_repo.get_by_id(data.job_id)

        if not job:
            raise Exception("Job not found")

        if job.status != JobStatus.COMPLETED:
            raise Exception("Job is not completed")

        if from_user_id == data.to_user_id:
            raise Exception("You cannot review yourself")

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
    ):
        review = await self.get_by_id(review_id)

        await self.repo.delete(review)
