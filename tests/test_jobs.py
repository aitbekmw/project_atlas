import uuid

import pytest
from sqlalchemy import update

from app.models.enum import UserRole
from app.models.user import User
from tests.conftest import TestingSessionLocal

from app.models.enum import JobStatus



# ==========================================================
# CREATE
# ==========================================================


@pytest.mark.asyncio
async def test_create_job_success(client, customer_headers, category, job_id=None):
    payload = {
        "title": "Python Backend Developer",
        "description": "Need FastAPI developer",
        "salary": 100000,
        "city": "Bishkek",
        "address": "Manas 100",
        "category_id": category.id,
    }

    response = await client.post(
        "/jobs",
        json=payload,
        headers=customer_headers,
    )

    assert response.status_code == 201

    data = response.json()

    assert data["title"] == payload["title"]
    assert data["description"] == payload["description"]
    assert data["salary"] == payload["salary"]
    assert data["city"] == payload["city"]
    assert data["address"] == payload["address"]
    assert data["category_id"] == payload["category_id"]


@pytest.mark.asyncio
async def test_create_job_unauthorized(client, category):
    payload = {
        "title": "Backend",
        "description": "FastAPI",
        "salary": 100000,
        "city": "Bishkek",
        "address": "Manas",
        "category_id": category.id,
    }

    response = await client.post(
        "/jobs",
        json=payload,
    )

    assert response.status_code == 401


# ==========================================================
# GET
# ==========================================================


@pytest.mark.asyncio
async def test_get_jobs_empty(client):
    response = await client.get("/jobs")

    assert response.status_code == 200
    assert response.json() == []


@pytest.mark.asyncio
async def test_get_jobs_not_empty(client, customer_headers, category):
    payload = {
        "title": "Backend Developer",
        "description": "Need FastAPI developer",
        "salary": 120000,
        "city": "Bishkek",
        "address": "Manas 100",
        "category_id": category.id,
    }

    response = await client.post(
        "/jobs",
        json=payload,
        headers=customer_headers,
    )

    assert response.status_code == 201

    response = await client.get("/jobs")

    assert response.status_code == 200

    jobs = response.json()

    assert len(jobs) == 1
    assert jobs[0]["title"] == payload["title"]


@pytest.mark.asyncio
async def test_get_job_success(client, customer_headers, category):
    payload = {
        "title": "Python Developer",
        "description": "FastAPI project",
        "salary": 90000,
        "city": "Osh",
        "address": "Lenina 15",
        "category_id": category.id,
    }

    response = await client.post(
        "/jobs",
        json=payload,
        headers=customer_headers,
    )

    assert response.status_code == 201

    job_id = response.json()["id"]

    response = await client.get(f"/jobs/{job_id}")

    assert response.status_code == 200

    data = response.json()

    assert data["id"] == job_id
    assert data["title"] == payload["title"]


@pytest.mark.asyncio
async def test_get_job_not_found(client):
    response = await client.get("/jobs/999999")

    assert response.status_code == 404
    assert response.json()["detail"] == "Job not found"



# ==========================================================
# UPDATE
# ==========================================================


@pytest.mark.asyncio
async def test_update_job_success(client, customer_headers, category):
    payload = {
        "title": "Backend Developer",
        "description": "FastAPI",
        "salary": 100000,
        "city": "Bishkek",
        "address": "Manas 100",
        "category_id": category.id,
    }

    response = await client.post(
        "/jobs",
        json=payload,
        headers=customer_headers,
    )

    assert response.status_code == 201

    job_id = response.json()["id"]

    update_data = {
        "title": "Senior Backend Developer",
        "salary": 150000,
    }

    response = await client.put(
        f"/jobs/{job_id}",
        json=update_data,
        headers=customer_headers,
    )

    assert response.status_code == 200

    data = response.json()

    assert data["title"] == "Senior Backend Developer"
    assert data["salary"] == 150000


@pytest.mark.asyncio
async def test_update_job_not_found(client, customer_headers):
    response = await client.put(
        "/jobs/999999",
        json={
            "title": "New title",
        },
        headers=customer_headers,
    )

    assert response.status_code == 404
    assert response.json()["detail"] == "Job not found"


@pytest.mark.asyncio
async def test_update_job_not_owner(client, customer_headers, category):
    payload = {
        "title": "Backend",
        "description": "FastAPI",
        "salary": 100000,
        "city": "Bishkek",
        "address": "Manas",
        "category_id": category.id,
    }

    response = await client.post(
        "/jobs",
        json=payload,
        headers=customer_headers,
    )

    assert response.status_code == 201

    job_id = response.json()["id"]

    unique = uuid.uuid4().hex[:8]

    second_user = {
        "username": f"user_{unique}",
        "email": f"{unique}@test.com",
        "password": "12345678",
        "first_name": "Test",
        "last_name": "User",
        "phone": "+996700000000",
    }

    response = await client.post(
        "/auth/register",
        json=second_user,
    )

    assert response.status_code == 201

    async with TestingSessionLocal() as session:
        await session.execute(
            update(User)
            .where(User.email == second_user["email"])
            .values(role=UserRole.CUSTOMER.value)
        )
        await session.commit()

    response = await client.post(
        "/auth/login",
        json={
            "email": second_user["email"],
            "password": second_user["password"],
        },
    )

    assert response.status_code == 200

    token = response.json()["access_token"]

    headers = {
        "Authorization": f"Bearer {token}"
    }

    response = await client.put(
        f"/jobs/{job_id}",
        json={
            "title": "Hacked",
        },
        headers=headers,
    )

    assert response.status_code == 403


# ==========================================================
# DELETE
# ==========================================================


@pytest.mark.asyncio
async def test_delete_job_success(client, customer_headers, category):
    payload = {
        "title": "Delete Job",
        "description": "Test",
        "salary": 100000,
        "city": "Bishkek",
        "address": "Manas",
        "category_id": category.id,
    }

    response = await client.post(
        "/jobs",
        json=payload,
        headers=customer_headers,
    )

    assert response.status_code == 201

    job_id = response.json()["id"]

    response = await client.delete(
        f"/jobs/{job_id}",
        headers=customer_headers,
    )

    assert response.status_code == 204

    response = await client.get(f"/jobs/{job_id}")

    assert response.status_code == 404


@pytest.mark.asyncio
async def test_delete_job_not_found(client, customer_headers):
    response = await client.delete(
        "/jobs/999999",
        headers=customer_headers,
    )

    assert response.status_code == 404
    assert response.json()["detail"] == "Job not found"


@pytest.mark.asyncio
async def test_delete_job_not_owner(client, customer_headers, category):
    payload = {
        "title": "Backend",
        "description": "FastAPI",
        "salary": 100000,
        "city": "Bishkek",
        "address": "Manas",
        "category_id": category.id,
    }

    response = await client.post(
        "/jobs",
        json=payload,
        headers=customer_headers,
    )

    assert response.status_code == 201

    job_id = response.json()["id"]

    unique = uuid.uuid4().hex[:8]

    second_user = {
        "username": f"user_{unique}",
        "email": f"{unique}@test.com",
        "password": "12345678",
        "first_name": "Test",
        "last_name": "User",
        "phone": "+996700000000",
    }

    response = await client.post(
        "/auth/register",
        json=second_user,
    )

    assert response.status_code == 201

    async with TestingSessionLocal() as session:
        await session.execute(
            update(User)
            .where(User.email == second_user["email"])
            .values(role=UserRole.CUSTOMER.value)
        )
        await session.commit()

    response = await client.post(
        "/auth/login",
        json={
            "email": second_user["email"],
            "password": second_user["password"],
        },
    )

    assert response.status_code == 200

    token = response.json()["access_token"]

    headers = {
        "Authorization": f"Bearer {token}"
    }

    response = await client.delete(
        f"/jobs/{job_id}",
        headers=headers,
    )

    assert response.status_code == 403




@pytest.mark.asyncio
async def test_complete_job_success(client, customer_headers, category):
    payload = {
        "title": "Complete Job",
        "description": "Test",
        "salary": 100000,
        "city": "Bishkek",
        "address": "Manas",
        "category_id": category.id,
    }

    response = await client.post(
        "/jobs",
        json=payload,
        headers=customer_headers,
    )

    job_id = response.json()["id"]

    response = await client.post(
        f"/jobs/{job_id}/complete",
        headers=customer_headers,
    )

    assert response.status_code == 200
    assert response.json()["is_active"] is True


@pytest.mark.asyncio
async def test_complete_job_not_found(client, customer_headers):
    response = await client.post(
        "/jobs/999999/complete",
        headers=customer_headers,
    )

    assert response.status_code == 404




@pytest.mark.asyncio
async def test_complete_job_not_owner(client, customer_headers, category):
    payload = {
        "title": "Complete",
        "description": "Test",
        "salary": 100000,
        "city": "Bishkek",
        "address": "Manas",
        "category_id": category.id,
    }

    response = await client.post(
        "/jobs",
        json=payload,
        headers=customer_headers,
    )

    job_id = response.json()["id"]

    unique = uuid.uuid4().hex[:8]

    second_user = {
        "username": f"user_{unique}",
        "email": f"{unique}@test.com",
        "password": "12345678",
        "first_name": "Test",
        "last_name": "User",
        "phone": "+996700000000",
    }

    await client.post("/auth/register", json=second_user)

    async with TestingSessionLocal() as session:
        await session.execute(
            update(User)
            .where(User.email == second_user["email"])
            .values(role=UserRole.CUSTOMER.value)
        )
        await session.commit()

    response = await client.post(
        "/auth/login",
        json={
            "email": second_user["email"],
            "password": second_user["password"],
        },
    )

    headers = {
        "Authorization": f"Bearer {response.json()['access_token']}"
    }

    response = await client.post(
        f"/jobs/{job_id}/complete",
        headers=headers,
    )

    assert response.status_code == 403




@pytest.mark.asyncio
async def test_search_job_by_city(client, customer_headers, category):
    payload = {
        "title": "Python",
        "description": "Backend",
        "salary": 120000,
        "city": "Bishkek",
        "address": "Manas",
        "category_id": category.id,
    }

    await client.post(
        "/jobs",
        json=payload,
        headers=customer_headers,
    )

    response = await client.get("/jobs?city=Bishkek")

    assert response.status_code == 200
    assert len(response.json()) == 1




@pytest.mark.asyncio
async def test_search_job_by_title(client, customer_headers, category):
    payload = {
        "title": "FastAPI Developer",
        "description": "Backend",
        "salary": 120000,
        "city": "Osh",
        "address": "Lenina",
        "category_id": category.id,
    }

    await client.post(
        "/jobs",
        json=payload,
        headers=customer_headers,
    )

    response = await client.get("/jobs?search=FastAPI")

    assert response.status_code == 200
    assert len(response.json()) == 1




@pytest.mark.asyncio
async def test_search_job_by_salary(client, customer_headers, category):
    payload = {
        "title": "Senior",
        "description": "Backend",
        "salary": 200000,
        "city": "Bishkek",
        "address": "Manas",
        "category_id": category.id,
    }

    await client.post(
        "/jobs",
        json=payload,
        headers=customer_headers,
    )

    response = await client.get("/jobs?min_salary=150000")

    assert response.status_code == 200
    assert len(response.json()) == 1



@pytest.mark.asyncio
async def test_complete_job_success(client, customer_headers, category):
    payload = {
        "title": "Complete Job",
        "description": "Test",
        "salary": 100000,
        "city": "Bishkek",
        "address": "Manas",
        "category_id": category.id,
    }

    response = await client.post(
        "/jobs",
        json=payload,
        headers=customer_headers,
    )

    assert response.status_code == 201

    job_id = response.json()["id"]

    response = await client.post(
        f"/jobs/{job_id}/complete",
        headers=customer_headers,
    )

    assert response.status_code == 200

    data = response.json()

    assert data["status"] == JobStatus.COMPLETED.value



@pytest.mark.asyncio
async def test_complete_job_not_found(client, customer_headers):
    response = await client.post(
        "/jobs/999999/complete",
        headers=customer_headers,
    )

    assert response.status_code == 404
    assert response.json()["detail"] == "Job not found"




@pytest.mark.asyncio
async def test_complete_job_not_owner(client, customer_headers, category):
    payload = {
        "title": "Backend",
        "description": "FastAPI",
        "salary": 100000,
        "city": "Bishkek",
        "address": "Manas",
        "category_id": category.id,
    }

    response = await client.post(
        "/jobs",
        json=payload,
        headers=customer_headers,
    )

    job_id = response.json()["id"]

    unique = uuid.uuid4().hex[:8]

    second_user = {
        "username": f"user_{unique}",
        "email": f"{unique}@test.com",
        "password": "12345678",
        "first_name": "Test",
        "last_name": "User",
        "phone": "+996700000000",
    }

    await client.post("/auth/register", json=second_user)

    async with TestingSessionLocal() as session:
        await session.execute(
            update(User)
            .where(User.email == second_user["email"])
            .values(role=UserRole.CUSTOMER.value)
        )
        await session.commit()

    response = await client.post(
        "/auth/login",
        json={
            "email": second_user["email"],
            "password": second_user["password"],
        },
    )

    headers = {
        "Authorization": f"Bearer {response.json()['access_token']}"
    }

    response = await client.post(
        f"/jobs/{job_id}/complete",
        headers=headers,
    )

    assert response.status_code == 403




@pytest.mark.asyncio
async def test_search_job_by_title(client, customer_headers, category):
    payload = {
        "title": "FastAPI Developer",
        "description": "Backend",
        "salary": 100000,
        "city": "Bishkek",
        "address": "Manas",
        "category_id": category.id,
    }

    await client.post(
        "/jobs",
        json=payload,
        headers=customer_headers,
    )

    response = await client.get("/jobs?search=FastAPI")

    assert response.status_code == 200

    jobs = response.json()

    assert len(jobs) == 1
    assert jobs[0]["title"] == "FastAPI Developer"




@pytest.mark.asyncio
async def test_search_job_by_city(client, customer_headers, category):
    payload = {
        "title": "Python",
        "description": "Backend",
        "salary": 100000,
        "city": "Osh",
        "address": "Lenina",
        "category_id": category.id,
    }

    await client.post(
        "/jobs",
        json=payload,
        headers=customer_headers,
    )

    response = await client.get("/jobs?city=Osh")

    assert response.status_code == 200

    jobs = response.json()

    assert len(jobs) == 1
    assert jobs[0]["city"] == "Osh"



@pytest.mark.asyncio
async def test_search_job_by_salary(client, customer_headers, category):
    payload = {
        "title": "Senior Python",
        "description": "Backend",
        "salary": 200000,
        "city": "Bishkek",
        "address": "Manas",
        "category_id": category.id,
    }

    await client.post(
        "/jobs",
        json=payload,
        headers=customer_headers,
    )

    response = await client.get("/jobs?min_salary=150000")

    assert response.status_code == 200

    jobs = response.json()

    assert len(jobs) == 1
    assert jobs[0]["salary"] >= 150000



@pytest.mark.asyncio
async def test_search_job_by_category(client, customer_headers, category):
    payload = {
        "title": "Backend",
        "description": "FastAPI",
        "salary": 100000,
        "city": "Bishkek",
        "address": "Manas",
        "category_id": category.id,
    }

    await client.post(
        "/jobs",
        json=payload,
        headers=customer_headers,
    )

    response = await client.get(
        f"/jobs?category_id={category.id}"
    )

    assert response.status_code == 200

    jobs = response.json()

    assert len(jobs) == 1
    assert jobs[0]["category_id"] == category.id



