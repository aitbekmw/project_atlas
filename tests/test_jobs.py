import uuid

import pytest
from sqlalchemy import update

from app.models.enum import JobStatus, PaymentMethod, UserRole
from app.models.job import Job
from app.models.user import User
from tests.conftest import TestingSessionLocal, verify_registered_email

JOB_PAYLOAD = {
    "title": "Complete Job",
    "description": "Test job details",
    "salary": 100000,
    "city": "Bishkek",
    "address": "Manas",
}


async def _create_job(client, headers, category, title="Complete Job"):
    payload = {
        **JOB_PAYLOAD,
        "title": title,
        "category_id": category.id,
    }
    response = await client.post("/jobs", json=payload, headers=headers)
    assert response.status_code == 201
    return response.json()


async def _apply(client, job_id, worker_headers):
    response = await client.post(
        "/applications",
        json={"job_id": job_id},
        headers=worker_headers,
    )
    assert response.status_code == 201
    return response.json()


async def _accept(client, application_id, customer_headers):
    response = await client.post(
        f"/applications/{application_id}/accept",
        headers=customer_headers,
    )
    assert response.status_code == 200
    return response.json()


async def _apply_and_accept(client, job_id, worker_headers, customer_headers):
    application = await _apply(client, job_id, worker_headers)
    await _accept(client, application["id"], customer_headers)
    return application


# ==========================================================
# CREATE
# ==========================================================


@pytest.mark.asyncio
async def test_create_job_success(client, customer_headers, category):
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
    assert data["payment_method"] == PaymentMethod.AGREEMENT.value


@pytest.mark.asyncio
async def test_create_job_unauthorized(client, category):
    payload = {
        "title": "Backend",
        "description": "FastAPI backend",
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


@pytest.mark.asyncio
async def test_create_job_forbidden_for_worker(client, auth_headers, category):
    payload = {
        "title": "Backend",
        "description": "FastAPI backend",
        "salary": 100000,
        "city": "Bishkek",
        "address": "Manas",
        "category_id": category.id,
    }

    response = await client.post(
        "/jobs",
        json=payload,
        headers=auth_headers,
    )

    assert response.status_code == 403


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
        "description": "FastAPI backend",
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
        "description": "FastAPI backend",
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
        "password": "AtlasTest1!",
        "first_name": "Test",
        "last_name": "User",
        "phone": "+996700000000",
    }

    response = await client.post(
        "/auth/register",
        json=second_user,
    )

    assert response.status_code == 201
    await verify_registered_email(client, second_user["email"])

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

    headers = {"Authorization": f"Bearer {token}"}

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
        "description": "Test job details",
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
        "description": "FastAPI backend",
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
        "password": "AtlasTest1!",
        "first_name": "Test",
        "last_name": "User",
        "phone": "+996700000000",
    }

    response = await client.post(
        "/auth/register",
        json=second_user,
    )

    assert response.status_code == 201
    await verify_registered_email(client, second_user["email"])

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

    headers = {"Authorization": f"Bearer {token}"}

    response = await client.delete(
        f"/jobs/{job_id}",
        headers=headers,
    )

    assert response.status_code == 403


@pytest.mark.asyncio
async def test_complete_job_success(client, customer_headers, auth_headers, category):
    job = await _create_job(client, customer_headers, category)
    await _apply_and_accept(client, job["id"], auth_headers, customer_headers)

    response = await client.post(
        f"/jobs/{job['id']}/complete",
        headers=customer_headers,
    )

    assert response.status_code == 200
    assert response.json()["status"] == JobStatus.COMPLETED.value


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
        "description": "FastAPI backend",
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
        "password": "AtlasTest1!",
        "first_name": "Test",
        "last_name": "User",
        "phone": "+996700000000",
    }

    await client.post("/auth/register", json=second_user)
    await verify_registered_email(client, second_user["email"])

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

    headers = {"Authorization": f"Bearer {response.json()['access_token']}"}

    response = await client.post(
        f"/jobs/{job_id}/complete",
        headers=headers,
    )

    assert response.status_code == 403


async def _set_job_status(job_id: int, status: str) -> None:
    async with TestingSessionLocal() as session:
        await session.execute(update(Job).where(Job.id == job_id).values(status=status))
        await session.commit()


@pytest.mark.asyncio
async def test_complete_open_job_with_accepted_application_fails(
    client,
    customer_headers,
    auth_headers,
    category,
):
    job = await _create_job(client, customer_headers, category)
    await _apply_and_accept(client, job["id"], auth_headers, customer_headers)
    await _set_job_status(job["id"], JobStatus.OPEN.value)

    response = await client.post(
        f"/jobs/{job['id']}/complete",
        headers=customer_headers,
    )

    assert response.status_code == 403
    job_after = await client.get(f"/jobs/{job['id']}")
    assert job_after.json()["status"] == JobStatus.OPEN.value


@pytest.mark.asyncio
async def test_complete_open_job_without_application_fails(
    client,
    customer_headers,
    category,
):
    job = await _create_job(client, customer_headers, category)

    response = await client.post(
        f"/jobs/{job['id']}/complete",
        headers=customer_headers,
    )

    assert response.status_code == 403
    job_after = await client.get(f"/jobs/{job['id']}")
    assert job_after.json()["status"] == JobStatus.OPEN.value


@pytest.mark.asyncio
async def test_complete_in_progress_job_as_admin(
    client,
    customer_headers,
    auth_headers,
    admin_headers,
    category,
):
    job = await _create_job(client, customer_headers, category)
    await _apply_and_accept(client, job["id"], auth_headers, customer_headers)

    response = await client.post(
        f"/jobs/{job['id']}/complete",
        headers=admin_headers,
    )

    assert response.status_code == 200
    assert response.json()["status"] == JobStatus.COMPLETED.value


@pytest.mark.asyncio
async def test_complete_in_progress_job_as_worker_forbidden(
    client,
    customer_headers,
    auth_headers,
    category,
):
    job = await _create_job(client, customer_headers, category)
    await _apply_and_accept(client, job["id"], auth_headers, customer_headers)

    response = await client.post(
        f"/jobs/{job['id']}/complete",
        headers=auth_headers,
    )

    assert response.status_code == 403
    job_after = await client.get(f"/jobs/{job['id']}")
    assert job_after.json()["status"] == JobStatus.IN_PROGRESS.value


@pytest.mark.asyncio
async def test_complete_cancelled_job_fails(
    client,
    customer_headers,
    category,
):
    job = await _create_job(client, customer_headers, category)
    cancelled = await client.post(
        f"/jobs/{job['id']}/cancel",
        headers=customer_headers,
    )
    assert cancelled.status_code == 200
    assert cancelled.json()["status"] == JobStatus.CANCELLED.value

    response = await client.post(
        f"/jobs/{job['id']}/complete",
        headers=customer_headers,
    )

    assert response.status_code == 403
    job_after = await client.get(f"/jobs/{job['id']}")
    assert job_after.json()["status"] == JobStatus.CANCELLED.value


@pytest.mark.asyncio
async def test_complete_already_completed_job_fails(
    client,
    customer_headers,
    auth_headers,
    category,
):
    job = await _create_job(client, customer_headers, category)
    await _apply_and_accept(client, job["id"], auth_headers, customer_headers)

    first = await client.post(
        f"/jobs/{job['id']}/complete",
        headers=customer_headers,
    )
    assert first.status_code == 200

    second = await client.post(
        f"/jobs/{job['id']}/complete",
        headers=customer_headers,
    )

    assert second.status_code == 403
    job_after = await client.get(f"/jobs/{job['id']}")
    assert job_after.json()["status"] == JobStatus.COMPLETED.value


@pytest.mark.asyncio
async def test_complete_in_progress_without_accepted_application_fails(
    client,
    customer_headers,
    auth_headers,
    category,
):
    job = await _create_job(client, customer_headers, category)
    await _apply(client, job["id"], auth_headers)
    await _set_job_status(job["id"], JobStatus.IN_PROGRESS.value)

    response = await client.post(
        f"/jobs/{job['id']}/complete",
        headers=customer_headers,
    )

    assert response.status_code == 403
    job_after = await client.get(f"/jobs/{job['id']}")
    assert job_after.json()["status"] == JobStatus.IN_PROGRESS.value


@pytest.mark.asyncio
async def test_review_allowed_after_complete(
    client,
    customer_headers,
    auth_headers,
    category,
):
    job = await _create_job(client, customer_headers, category)
    await _apply_and_accept(client, job["id"], auth_headers, customer_headers)

    complete = await client.post(
        f"/jobs/{job['id']}/complete",
        headers=customer_headers,
    )
    assert complete.status_code == 200

    worker = await client.get("/users/me", headers=auth_headers)
    review = await client.post(
        "/reviews",
        json={
            "job_id": job["id"],
            "to_user_id": worker.json()["id"],
            "rating": 5,
            "comment": "Excellent work!",
        },
        headers=customer_headers,
    )

    assert review.status_code == 201
    assert review.json()["rating"] == 5


@pytest.mark.asyncio
async def test_review_rejected_before_complete(
    client,
    customer_headers,
    auth_headers,
    category,
):
    job = await _create_job(client, customer_headers, category)
    await _apply_and_accept(client, job["id"], auth_headers, customer_headers)

    worker = await client.get("/users/me", headers=auth_headers)
    review = await client.post(
        "/reviews",
        json={
            "job_id": job["id"],
            "to_user_id": worker.json()["id"],
            "rating": 5,
            "comment": "Too early",
        },
        headers=customer_headers,
    )

    assert review.status_code == 400
    assert review.json()["detail"] == "Job is not completed"


@pytest.mark.asyncio
async def test_search_job_by_title(client, customer_headers, category):
    payload = {
        "title": "FastAPI Developer",
        "description": "Backend Python",
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
        "description": "Backend Python",
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
        "description": "Backend Python",
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
        "description": "FastAPI backend",
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

    response = await client.get(f"/jobs?category_id={category.id}")

    assert response.status_code == 200

    jobs = response.json()

    assert len(jobs) == 1
    assert jobs[0]["category_id"] == category.id


@pytest.mark.asyncio
async def test_cancel_job_success(client, customer_headers, category):
    payload = {
        "title": "Cancel Job",
        "description": "Test job details",
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
        f"/jobs/{job_id}/cancel",
        headers=customer_headers,
    )

    assert response.status_code == 200

    data = response.json()

    assert data["status"] == JobStatus.CANCELLED.value
    assert data["is_active"] is False


@pytest.mark.asyncio
async def test_create_job_with_payment_method(client, customer_headers, category):
    payload = {
        "title": "Courier",
        "description": "Deliver documents",
        "salary": 1500,
        "payment_method": PaymentMethod.QR.value,
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
    assert response.json()["payment_method"] == PaymentMethod.QR.value


@pytest.mark.asyncio
async def test_create_job_rejects_card_payment(client, customer_headers, category):
    payload = {
        "title": "Courier",
        "description": "Deliver documents",
        "salary": 1500,
        "payment_method": "CARD",
        "city": "Bishkek",
        "address": "Manas",
        "category_id": category.id,
    }

    response = await client.post(
        "/jobs",
        json=payload,
        headers=customer_headers,
    )

    assert response.status_code == 422


@pytest.mark.asyncio
async def test_update_job_payment_method(client, customer_headers, category):
    payload = {
        "title": "Courier",
        "description": "Deliver documents",
        "salary": 1500,
        "payment_method": PaymentMethod.CASH.value,
        "city": "Bishkek",
        "address": "Manas",
        "category_id": category.id,
    }
    created = await client.post("/jobs", json=payload, headers=customer_headers)
    job_id = created.json()["id"]

    response = await client.put(
        f"/jobs/{job_id}",
        json={"payment_method": PaymentMethod.AGREEMENT.value},
        headers=customer_headers,
    )

    assert response.status_code == 200
    assert response.json()["payment_method"] == PaymentMethod.AGREEMENT.value


@pytest.mark.asyncio
async def test_search_job_by_payment_method(client, customer_headers, category):
    cash_payload = {
        "title": "Cash job",
        "description": "Pay in cash",
        "salary": 2000,
        "payment_method": PaymentMethod.CASH.value,
        "city": "Bishkek",
        "address": "Manas",
        "category_id": category.id,
    }
    qr_payload = {
        "title": "QR job",
        "description": "Pay by QR code",
        "salary": 2000,
        "payment_method": PaymentMethod.QR.value,
        "city": "Bishkek",
        "address": "Manas",
        "category_id": category.id,
    }
    await client.post("/jobs", json=cash_payload, headers=customer_headers)
    await client.post("/jobs", json=qr_payload, headers=customer_headers)

    response = await client.get("/jobs?payment_method=QR")

    assert response.status_code == 200
    jobs = response.json()
    assert len(jobs) == 1
    assert jobs[0]["title"] == "QR job"
    assert jobs[0]["payment_method"] == PaymentMethod.QR.value


@pytest.mark.asyncio
async def test_nearby_jobs_sorted_by_distance(client, customer_headers, category):
    close = {
        "title": "Close job",
        "description": "Near Ala-Too",
        "salary": 1500,
        "city": "Bishkek",
        "address": "Chuy 100",
        "category_id": category.id,
        "latitude": 42.8766,
        "longitude": 74.6068,
    }
    far = {
        "title": "Far job",
        "description": "South district",
        "salary": 1500,
        "city": "Bishkek",
        "address": "12 mkr",
        "category_id": category.id,
        "latitude": 42.8460,
        "longitude": 74.5840,
    }
    await client.post("/jobs", json=close, headers=customer_headers)
    await client.post("/jobs", json=far, headers=customer_headers)

    response = await client.get(
        "/jobs/nearby",
        params={"lat": 42.8765, "lng": 74.6070, "radius_km": 10},
    )
    assert response.status_code == 200
    jobs = response.json()
    assert [item["title"] for item in jobs] == ["Close job", "Far job"]
    assert jobs[0]["distance_km"] < jobs[1]["distance_km"]
    assert "latitude" in jobs[0]
    assert "longitude" in jobs[0]


@pytest.mark.asyncio
async def test_create_job_with_coordinates(client, customer_headers, category):
    response = await client.post(
        "/jobs",
        json={
            "title": "Geo job",
            "description": "Has coordinates",
            "salary": 1200,
            "city": "Bishkek",
            "address": "Manas 10",
            "category_id": category.id,
            "latitude": 42.87,
            "longitude": 74.59,
        },
        headers=customer_headers,
    )
    assert response.status_code == 201
    data = response.json()
    assert data["latitude"] == 42.87
    assert data["longitude"] == 74.59
    assert data["image_url"] is None
