"""Idempotent marketplace seed for local and production databases.

Creates default categories, demo users, Bishkek jobs, applications and reviews.
Does not run on API startup. Does not send email. Does not modify non-demo users.
Conversations are created when demo applications are accepted.

Uses DATABASE_URL from the environment (Render Shell uses production Postgres).

    python app/seed.py
    python app/seed.py --stats
"""

from __future__ import annotations

import argparse
import asyncio
import secrets

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from app.core.security import hash_password
from app.data.default_categories import DEFAULT_CATEGORIES
from app.data.demo_marketplace import DEMO_EMAILS, DEMO_JOBS, DEMO_REVIEWS, DEMO_USERS
from app.db.session import AsyncSessionLocal
from app.models.application import Application
from app.models.category import Category
from app.models.conversation import Conversation
from app.models.enum import ApplicationStatus, JobStatus
from app.models.job import Job
from app.models.review import Review
from app.models.user import User
from app.repositories.application import ApplicationRepository
from app.repositories.category import CategoryRepository
from app.repositories.conversation import ConversationRepository
from app.repositories.job import JobRepository
from app.repositories.review import ReviewRepository
from app.repositories.user import UserRepository
from app.schemas.application import ApplicationCreate
from app.schemas.category import CategoryCreate
from app.schemas.job import JobCreate
from app.schemas.review import ReviewCreate
from app.services.application import ApplicationService
from app.services.category import CategoryService
from app.services.job import JobService
from app.services.review import ReviewService

SessionFactory = async_sessionmaker[AsyncSession]


async def _count(db: AsyncSession, model, *filters) -> int:
    query = select(func.count()).select_from(model)
    for item in filters:
        query = query.where(item)
    return int((await db.execute(query)).scalar_one())


async def collect_stats(session_factory: SessionFactory | None = None) -> dict:
    factory = session_factory or AsyncSessionLocal
    async with factory() as db:
        return {
            "categories": await _count(db, Category),
            "demo_users": await _count(db, User, User.email.in_(DEMO_EMAILS)),
            "jobs": await _count(db, Job),
            "open_jobs": await _count(
                db,
                Job,
                Job.status == JobStatus.OPEN.value,
                Job.is_active.is_(True),
            ),
            "reviews": await _count(db, Review),
            "applications": await _count(db, Application),
            "conversations": await _count(db, Conversation),
        }


async def get_or_create_demo_user(db: AsyncSession, item: dict) -> tuple[User, bool]:
    repo = UserRepository(db)
    email = str(item["email"]).strip().lower()
    existing = await repo.get_by_email(email)
    if existing is not None:
        if email in DEMO_EMAILS and not existing.is_verified:
            existing.is_verified = True
            await repo.update(existing)
        return existing, False

    username = item["username"]
    if await repo.get_by_username(username) is not None:
        username = f"{username}_{secrets.token_hex(3)}"

    user = User(
        username=username,
        email=email,
        hashed_password=hash_password(item["password"]),
        first_name=item["first_name"],
        last_name=item["last_name"],
        phone=item["phone"],
        role=item["role"],
        is_verified=True,
        is_active=True,
    )
    return await repo.create(user), True


async def _ensure_completed_assignment(
    job: Job,
    owner: User,
    worker: User,
    job_repo: JobRepository,
    job_service: JobService,
    application_repo: ApplicationRepository,
    application_service: ApplicationService,
) -> bool:
    created_application = False
    application = await application_repo.get_by_worker_and_job(worker.id, job.id)
    if application is None:
        current = await job_repo.get_by_id(job.id)
        if current is None or current.status != JobStatus.OPEN.value:
            return False
        application = await application_service.create(
            ApplicationCreate(job_id=job.id),
            worker.id,
        )
        created_application = True

    if application.status != ApplicationStatus.ACCEPTED.value:
        current = await job_repo.get_by_id(job.id)
        if current is not None and current.status == JobStatus.OPEN.value:
            await application_service.accept(application.id, owner)

    current = await job_repo.get_by_id(job.id)
    if current is not None and current.status != JobStatus.COMPLETED.value:
        await job_service.complete(job.id, owner)
    return created_application


async def seed(session_factory: SessionFactory | None = None) -> dict:
    factory = session_factory or AsyncSessionLocal
    created_categories: list[str] = []
    created_users: list[str] = []
    created_jobs: list[str] = []
    created_applications = 0
    created_reviews: list[int] = []

    async with factory() as db:
        category_service = CategoryService(CategoryRepository(db))
        job_repo = JobRepository(db)
        application_repo = ApplicationRepository(db)
        job_service = JobService(
            job_repo,
            CategoryRepository(db),
            application_repo,
        )
        application_service = ApplicationService(
            application_repo,
            job_repo,
            ConversationRepository(db),
        )
        review_service = ReviewService(
            ReviewRepository(db),
            job_repo,
            application_repo,
        )

        categories: dict[str, Category] = {}
        for item in DEFAULT_CATEGORIES:
            category = await category_service.repo.get_by_name(item["name"])
            if category is None:
                category = await category_service.create(CategoryCreate(**item))
                created_categories.append(category.name)
            categories[category.name] = category

        users: dict[str, User] = {}
        for item in DEMO_USERS:
            user, created = await get_or_create_demo_user(db, item)
            users[item["username"]] = user
            if created:
                created_users.append(item["username"])

        jobs_by_title: dict[str, Job] = {}
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

            if item["complete"] and item["worker"]:
                created = await _ensure_completed_assignment(
                    job,
                    owner,
                    users[item["worker"]],
                    job_repo,
                    job_service,
                    application_repo,
                    application_service,
                )
                if created:
                    created_applications += 1
                refreshed = await job_repo.get_by_id(job.id)
                if refreshed is not None:
                    job = refreshed
            jobs_by_title[job.title] = job

        for item in DEMO_REVIEWS:
            job = jobs_by_title[item["job"]]
            from_user = users[item["from_user"]]
            to_user = users[item["to_user"]]
            existing_review = await review_service.repo.get_by_job_and_author(
                job.id,
                from_user.id,
            )
            if existing_review is not None:
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

    stats = await collect_stats(factory)
    return {
        "created_categories": created_categories,
        "created_users": created_users,
        "created_jobs": created_jobs,
        "created_applications": created_applications,
        "created_reviews": created_reviews,
        **stats,
    }


def main() -> None:
    parser = argparse.ArgumentParser(description="Idempotent Atlas marketplace seed")
    parser.add_argument(
        "--stats",
        action="store_true",
        help="Print row counts without inserting data",
    )
    args = parser.parse_args()
    if args.stats:
        summary = asyncio.run(collect_stats())
        print("Atlas marketplace counts")
    else:
        summary = asyncio.run(seed())
        print("Atlas marketplace seed complete")
    for key, value in summary.items():
        print(f"{key}: {value}")


if __name__ == "__main__":
    main()
