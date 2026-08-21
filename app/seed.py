"""Idempotent E2E seed for the local Atlas PostgreSQL database.

Creates real Category / User / Job / Application rows through existing
services. Does not delete data and does not invent coordinates.

Run inside the API container:

    PYTHONPATH=/app python app/seed.py
"""

from __future__ import annotations

import asyncio

from app.db.session import AsyncSessionLocal
from app.models.category import Category
from app.models.enum import UserRole
from app.models.user import User
from app.repositories.application import ApplicationRepository
from app.repositories.category import CategoryRepository
from app.repositories.job import JobRepository
from app.schemas.application import ApplicationCreate
from app.schemas.category import CategoryCreate
from app.schemas.job import JobCreate
from app.schemas.user import UserCreate
from app.services.application import ApplicationService
from app.services.auth import AuthService
from app.services.category import CategoryService
from app.services.job import JobService

CATEGORIES = [
    {
        "name": "Ремонт",
        "description": "Мелкий бытовой ремонт",
        "icon": "wrench",
    },
    {
        "name": "Доставка",
        "description": "Курьер и перевозки",
        "icon": "package",
    },
    {
        "name": "Уборка",
        "description": "Клининг квартир и офисов",
        "icon": "sparkles",
    },
    {
        "name": "Переезд",
        "description": "Помощь с переездом",
        "icon": "truck",
    },
    {
        "name": "IT и техника",
        "description": "Настройка и разработка",
        "icon": "monitor",
    },
]

CUSTOMER = UserCreate(
    username="atlas_customer",
    email="atlas.customer@test.local",
    password="AtlasTest123!",
    first_name="Atlas",
    last_name="Customer",
    phone="+996700000001",
    role=UserRole.CUSTOMER.value,
)

WORKER = UserCreate(
    username="atlas_worker",
    email="atlas.worker@test.local",
    password="AtlasTest123!",
    first_name="Atlas",
    last_name="Worker",
    phone="+996700000002",
    role=UserRole.WORKER.value,
)

JOBS = [
    {
        "title": "Собрать шкаф IKEA",
        "description": "Нужно собрать шкаф IKEA дома.",
        "city": "Бишкек",
        "address": "проспект Чуй, 100",
        "salary": 3500,
        "category": "Ремонт",
        "apply": False,
    },
    {
        "title": "Генеральная уборка квартиры",
        "description": "Нужна генеральная уборка двухкомнатной квартиры.",
        "city": "Бишкек",
        "address": "улица Киевская, 120",
        "salary": 4500,
        "category": "Уборка",
        "apply": True,
    },
    {
        "title": "Доставка документов",
        "description": "Нужно доставить документы по Бишкеку.",
        "city": "Бишкек",
        "address": "улица Манаса, 50",
        "salary": 1200,
        "category": "Доставка",
        "apply": True,
    },
    {
        "title": "Помощь с переездом",
        "description": "Нужно перенести мебель в новую квартиру.",
        "city": "Бишкек",
        "address": "улица Исанова, 80",
        "salary": 5000,
        "category": "Переезд",
        "apply": False,
    },
]


async def get_or_register(auth: AuthService, data: UserCreate) -> tuple[User, bool]:
    existing = await auth.user_repo.get_by_email(data.email)
    if existing is None:
        existing = await auth.user_repo.get_by_username(data.username)

    if existing is not None:
        return existing, False

    return await auth.register(data), True


async def seed() -> dict:
    async with AsyncSessionLocal() as db:
        category_service = CategoryService(CategoryRepository(db))
        auth_service = AuthService(db)
        job_service = JobService(JobRepository(db), CategoryRepository(db))
        application_service = ApplicationService(
            ApplicationRepository(db),
            JobRepository(db),
        )
        job_repo = JobRepository(db)
        application_repo = ApplicationRepository(db)

        categories: dict[str, Category] = {}
        created_categories: list[str] = []
        for item in CATEGORIES:
            category = await category_service.repo.get_by_name(item["name"])
            if category is None:
                category = await category_service.create(CategoryCreate(**item))
                created_categories.append(category.name)
            categories[category.name] = category

        customer, customer_created = await get_or_register(auth_service, CUSTOMER)
        worker, worker_created = await get_or_register(auth_service, WORKER)

        owned = await job_repo.get_by_owner(customer.id)
        jobs_by_title = {job.title: job for job in owned}
        created_jobs: list[str] = []
        jobs = []
        for item in JOBS:
            category = categories[item["category"]]
            job = jobs_by_title.get(item["title"])
            if job is None:
                job = await job_service.create(
                    JobCreate(
                        title=item["title"],
                        description=item["description"],
                        salary=item["salary"],
                        city=item["city"],
                        address=item["address"],
                        category_id=category.id,
                    ),
                    customer.id,
                )
                created_jobs.append(job.title)
            jobs.append((job, item["apply"]))

        created_applications: list[int] = []
        applications = []
        for job, should_apply in jobs:
            existing = await application_repo.get_by_worker_and_job(
                worker.id,
                job.id,
            )
            if existing is not None:
                applications.append(existing)
                continue
            if not should_apply:
                continue
            application = await application_service.create(
                ApplicationCreate(job_id=job.id),
                worker.id,
            )
            created_applications.append(application.id)
            applications.append(application)

        return {
            "categories": [
                {"id": category.id, "name": category.name}
                for category in categories.values()
            ],
            "created_categories": created_categories,
            "customer": {
                "id": customer.id,
                "username": customer.username,
                "email": customer.email,
                "created": customer_created,
            },
            "worker": {
                "id": worker.id,
                "username": worker.username,
                "email": worker.email,
                "created": worker_created,
            },
            "jobs": [
                {
                    "id": job.id,
                    "title": job.title,
                    "status": job.status,
                    "category": next(
                        item["category"] for item in JOBS if item["title"] == job.title
                    ),
                }
                for job, _ in jobs
            ],
            "created_jobs": created_jobs,
            "applications": [
                {
                    "id": application.id,
                    "job_id": application.job_id,
                    "worker_id": application.worker_id,
                    "status": application.status,
                }
                for application in applications
            ],
            "created_applications": created_applications,
        }


def main() -> None:
    summary = asyncio.run(seed())
    print("Atlas E2E seed complete")
    for key, value in summary.items():
        print(f"{key}: {value}")


if __name__ == "__main__":
    main()
