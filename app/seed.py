"""Idempotent development seed. Not run on API startup.

Creates categories, demo users, ~30 Bishkek jobs with coordinates,
applications, completed jobs and reviews through existing services.

Does not target production automatically. Run only against a local/dev database:

    PYTHONPATH=/app python app/seed.py
"""

from __future__ import annotations

import asyncio

from app.data.default_categories import DEFAULT_CATEGORIES
from app.data.demo_marketplace import DEMO_JOBS, DEMO_REVIEWS, DEMO_USERS
from app.db.session import AsyncSessionLocal
from app.models.category import Category
from app.models.user import User
from app.repositories.application import ApplicationRepository
from app.repositories.category import CategoryRepository
from app.repositories.job import JobRepository
from app.repositories.review import ReviewRepository
from app.schemas.application import ApplicationCreate
from app.schemas.category import CategoryCreate
from app.schemas.job import JobCreate
from app.schemas.review import ReviewCreate
from app.schemas.user import UserCreate
from app.services.application import ApplicationService
from app.services.auth import AuthService
from app.services.category import CategoryService
from app.services.job import JobService
from app.services.review import ReviewService


async def get_or_register(auth: AuthService, data: UserCreate) -> tuple[User, bool]:
    existing = await auth.user_repo.get_by_email(data.email)
    if existing is None:
        existing = await auth.user_repo.get_by_username(data.username)
    if existing is not None:
        return existing, False
    return await auth.register(data), True


async def ensure_verified(user: User, db) -> None:
    if user.is_verified:
        return
    user.is_verified = True
    await db.commit()


async def seed() -> dict:
    async with AsyncSessionLocal() as db:
        category_service = CategoryService(CategoryRepository(db))
        auth_service = AuthService(db)
        job_repo = JobRepository(db)
        job_service = JobService(job_repo, CategoryRepository(db))
        application_repo = ApplicationRepository(db)
        application_service = ApplicationService(application_repo, job_repo)
        review_service = ReviewService(
            ReviewRepository(db),
            job_repo,
            application_repo,
        )

        categories: dict[str, Category] = {}
        created_categories: list[str] = []
        for item in DEFAULT_CATEGORIES:
            category = await category_service.repo.get_by_name(item["name"])
            if category is None:
                category = await category_service.create(CategoryCreate(**item))
                created_categories.append(category.name)
            categories[category.name] = category

        users: dict[str, User] = {}
        created_users: list[str] = []
        for item in DEMO_USERS:
            user, created = await get_or_register(
                auth_service,
                UserCreate(
                    username=item["username"],
                    email=item["email"],
                    password=item["password"],
                    first_name=item["first_name"],
                    last_name=item["last_name"],
                    phone=item["phone"],
                    role=item["role"],
                ),
            )
            await ensure_verified(user, db)
            users[item["username"]] = user
            if created:
                created_users.append(item["username"])

        jobs_by_title: dict[str, object] = {}
        created_jobs: list[str] = []
        for item in DEMO_JOBS:
            owner = users[item["customer"]]
            owned = await job_repo.get_by_owner(owner.id)
            existing = next((job for job in owned if job.title == item["title"]), None)
            if existing is None:
                job = await job_service.create(
                    JobCreate(
                        title=item["title"],
                        description=item["description"],
                        salary=item["salary"],
                        payment_method=item["payment_method"],
                        city=item["city"],
                        address=item["address"],
                        category_id=categories[item["category"]].id,
                        latitude=item["lat"],
                        longitude=item["lng"],
                    ),
                    owner.id,
                )
                created_jobs.append(job.title)
            else:
                job = existing
                if job.latitude is None or job.longitude is None:
                    job.latitude = item["lat"]
                    job.longitude = item["lng"]
                    await job_repo.update()
            jobs_by_title[job.title] = job

            if item["complete"] and item["worker"] and job.status != "COMPLETED":
                worker = users[item["worker"]]
                application = await application_repo.get_by_worker_and_job(
                    worker.id,
                    job.id,
                )
                if application is None:
                    application = await application_service.create(
                        ApplicationCreate(job_id=job.id),
                        worker.id,
                    )
                if application.status != "ACCEPTED":
                    await application_service.accept(application.id, owner)
                if job.status != "COMPLETED":
                    await job_service.complete(job.id, owner)

        created_reviews: list[int] = []
        for item in DEMO_REVIEWS:
            job = jobs_by_title[item["job"]]
            from_user = users[item["from_user"]]
            to_user = users[item["to_user"]]
            existing = await review_service.repo.get_by_job_and_author(
                job.id, from_user.id
            )
            if existing is not None:
                continue
            review = await review_service.create(
                ReviewCreate(
                    job_id=job.id,
                    to_user_id=to_user.id,
                    rating=item["rating"],
                    comment=item["comment"],
                ),
                from_user.id,
            )
            created_reviews.append(review.id)

        open_jobs = [item["title"] for item in DEMO_JOBS if not item["complete"]]
        return {
            "created_categories": created_categories,
            "categories": len(categories),
            "created_users": created_users,
            "users": len(users),
            "created_jobs": created_jobs,
            "jobs": len(jobs_by_title),
            "open_jobs": len(open_jobs),
            "created_reviews": created_reviews,
            "note": "Development seed only. Do not run against production.",
        }


def main() -> None:
    summary = asyncio.run(seed())
    print("Atlas development seed complete")
    for key, value in summary.items():
        print(f"{key}: {value}")


if __name__ == "__main__":
    main()
