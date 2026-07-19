import uuid

import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy import update
from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)

from app.core.config import settings
from app.db.base import Base
from app.db.session import get_db
from app.main import app
from app.models.category import Category
from app.models.enum import UserRole
from app.models.user import User

TEST_DATABASE_URL = settings.TEST_DATABASE_URL

engine = create_async_engine(
    TEST_DATABASE_URL,
    echo=False,
)

TestingSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


# FastAPI dependency override
async def override_get_db():
    async with TestingSessionLocal() as session:
        yield session


@pytest_asyncio.fixture(scope="function", autouse=True)
async def prepare_database():
    # создаём чистую БД перед тестом
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)

    yield

    # очищаем после теста
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)

    # очень важно закрыть все соединения
    await engine.dispose()


@pytest_asyncio.fixture
async def client():
    app.dependency_overrides[get_db] = override_get_db

    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test",
    ) as client:
        yield client

    app.dependency_overrides.clear()


@pytest_asyncio.fixture
async def auth_headers(client):
    unique = uuid.uuid4().hex[:8]

    user_data = {
        "username": f"user_{unique}",
        "email": f"{unique}@test.com",
        "password": "12345678",
        "first_name": "Test",
        "last_name": "User",
        "phone": "+996700000000",
    }

    response = await client.post(
        "/auth/register",
        json=user_data,
    )

    assert response.status_code == 201

    response = await client.post(
        "/auth/login",
        json={
            "email": user_data["email"],
            "password": user_data["password"],
        },
    )

    assert response.status_code == 200

    token = response.json()["access_token"]

    return {"Authorization": f"Bearer {token}"}


@pytest_asyncio.fixture
async def authorized_user(client, auth_headers):
    response = await client.get(
        "/users/me",
        headers=auth_headers,
    )

    assert response.status_code == 200

    return response.json()


@pytest_asyncio.fixture
async def category():
    async with TestingSessionLocal() as session:
        category = Category(
            name="Testing Category",
            description="Category for tests",
        )

        session.add(category)
        await session.commit()
        await session.refresh(category)

        return category


@pytest_asyncio.fixture
async def db():
    async with TestingSessionLocal() as session:
        yield session


@pytest_asyncio.fixture
async def customer_headers(client, db):
    unique = uuid.uuid4().hex[:8]

    user_data = {
        "username": f"customer_{unique}",
        "email": f"{unique}@test.com",
        "password": "12345678",
        "first_name": "Test",
        "last_name": "Customer",
        "phone": "+996700000000",
    }

    # Регистрация
    response = await client.post(
        "/auth/register",
        json=user_data,
    )

    assert response.status_code == 201

    # Меняем роль на CUSTOMER
    await db.execute(
        update(User)
        .where(User.email == user_data["email"])
        .values(role=UserRole.CUSTOMER.value)
    )
    await db.commit()

    # Логин
    response = await client.post(
        "/auth/login",
        json={
            "email": user_data["email"],
            "password": user_data["password"],
        },
    )

    assert response.status_code == 200

    token = response.json()["access_token"]

    return {"Authorization": f"Bearer {token}"}
