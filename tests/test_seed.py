from sqlalchemy import func, select

from app.data.default_categories import DEFAULT_CATEGORIES
from app.data.demo_marketplace import DEMO_EMAILS, DEMO_JOBS, DEMO_REVIEWS, DEMO_USERS
from app.models.application import Application
from app.models.category import Category
from app.models.conversation import Conversation
from app.models.job import Job
from app.models.review import Review
from app.models.user import User
from app.seed import collect_stats, seed
from tests.conftest import TestingSessionLocal

EXPECTED_OPEN_JOBS = sum(1 for item in DEMO_JOBS if not item["complete"])
EXPECTED_APPLICATIONS = sum(
    1 for item in DEMO_JOBS if item["complete"] and item["worker"]
)
EXPECTED_CONVERSATIONS = EXPECTED_APPLICATIONS


async def test_seed_creates_demo_marketplace():
    result = await seed(TestingSessionLocal)

    assert result["categories"] == len(DEFAULT_CATEGORIES)
    assert result["demo_users"] == len(DEMO_USERS)
    assert result["jobs"] == len(DEMO_JOBS)
    assert result["open_jobs"] == EXPECTED_OPEN_JOBS
    assert result["reviews"] == len(DEMO_REVIEWS)
    assert result["applications"] == EXPECTED_APPLICATIONS
    assert result["conversations"] == EXPECTED_CONVERSATIONS
    assert result["created_users"] == [item["username"] for item in DEMO_USERS]


async def test_seed_is_idempotent():
    first = await seed(TestingSessionLocal)
    second = await seed(TestingSessionLocal)

    assert first["jobs"] == len(DEMO_JOBS)
    assert second["created_categories"] == []
    assert second["created_users"] == []
    assert second["created_jobs"] == []
    assert second["created_applications"] == 0
    assert second["created_reviews"] == []
    assert second["jobs"] == first["jobs"]
    assert second["reviews"] == first["reviews"]
    assert second["applications"] == first["applications"]
    assert second["demo_users"] == first["demo_users"]

    async with TestingSessionLocal() as db:
        job_count = (
            await db.execute(select(func.count()).select_from(Job))
        ).scalar_one()
        review_count = (
            await db.execute(select(func.count()).select_from(Review))
        ).scalar_one()
        category_count = (
            await db.execute(select(func.count()).select_from(Category))
        ).scalar_one()
        demo_user_count = (
            await db.execute(
                select(func.count())
                .select_from(User)
                .where(User.email.in_(DEMO_EMAILS))
            )
        ).scalar_one()
        application_count = (
            await db.execute(select(func.count()).select_from(Application))
        ).scalar_one()
        conversation_count = (
            await db.execute(select(func.count()).select_from(Conversation))
        ).scalar_one()

    assert job_count == len(DEMO_JOBS)
    assert review_count == len(DEMO_REVIEWS)
    assert category_count == len(DEFAULT_CATEGORIES)
    assert demo_user_count == len(DEMO_USERS)
    assert application_count == EXPECTED_APPLICATIONS
    assert conversation_count == EXPECTED_CONVERSATIONS
    assert second["conversations"] == first["conversations"]


async def test_seed_does_not_send_email(monkeypatch):
    def fail_send(*_args, **_kwargs):
        raise AssertionError("seed must not send email")

    monkeypatch.setattr("app.services.email.send_verification_email", fail_send)
    await seed(TestingSessionLocal)
    stats = await collect_stats(TestingSessionLocal)
    assert stats["demo_users"] == len(DEMO_USERS)
