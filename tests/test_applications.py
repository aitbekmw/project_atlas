import uuid
from unittest.mock import patch

import pytest

from tests.conftest import TEST_PASSWORD, verify_registered_email


@pytest.mark.asyncio
async def test_create_application_success(
    client,
    auth_headers,
    customer_headers,
    category,
):
    payload = {
        "title": "Python Developer",
        "description": "Backend Developer",
        "salary": 3000,
        "city": "Bishkek",
        "address": "Chui 100",
        "category_id": category.id,
    }

    response = await client.post(
        "/jobs",
        json=payload,
        headers=customer_headers,
    )

    assert response.status_code == 201

    job = response.json()

    application_payload = {
        "job_id": job["id"],
    }

    response = await client.post(
        "/applications",
        json=application_payload,
        headers=auth_headers,
    )

    assert response.status_code == 201

    data = response.json()

    assert data["job_id"] == job["id"]
    assert data["worker_id"] > 0
    assert data["status"] == "PENDING"


@pytest.mark.asyncio
async def test_get_applications(
    client,
    auth_headers,
):
    response = await client.get("/applications", headers=auth_headers)

    assert response.status_code == 200

    data = response.json()

    assert isinstance(data, list)


@pytest.mark.asyncio
async def test_get_application_by_id(
    client,
    auth_headers,
    customer_headers,
    category,
):
    payload = {
        "title": "Python Developer",
        "description": "Backend Developer",
        "salary": 3000,
        "city": "Bishkek",
        "address": "Chui 100",
        "category_id": category.id,
    }

    response = await client.post(
        "/jobs",
        json=payload,
        headers=customer_headers,
    )

    assert response.status_code == 201

    job = response.json()

    response = await client.post(
        "/applications",
        json={"job_id": job["id"]},
        headers=auth_headers,
    )

    assert response.status_code == 201

    application = response.json()

    response = await client.get(
        f"/applications/{application['id']}",
        headers=auth_headers,
    )

    assert response.status_code == 200

    data = response.json()

    assert data["id"] == application["id"]
    assert data["job_id"] == job["id"]


@pytest.mark.asyncio
async def test_update_application(
    client,
    auth_headers,
    customer_headers,
    category,
):
    payload = {
        "title": "Python Developer",
        "description": "Backend Developer",
        "salary": 3000,
        "city": "Bishkek",
        "address": "Chui 100",
        "category_id": category.id,
    }

    response = await client.post(
        "/jobs",
        json=payload,
        headers=customer_headers,
    )

    assert response.status_code == 201

    job = response.json()

    response = await client.post(
        "/applications",
        json={"job_id": job["id"]},
        headers=auth_headers,
    )

    assert response.status_code == 201

    application = response.json()

    response = await client.put(
        f"/applications/{application['id']}",
        json={"status": "ACCEPTED"},
        headers=customer_headers,
    )

    assert response.status_code == 200

    data = response.json()

    assert data["status"] == "ACCEPTED"


@pytest.mark.asyncio
async def test_delete_application(
    client,
    auth_headers,
    customer_headers,
    category,
):
    payload = {
        "title": "Python Developer",
        "description": "Backend Developer",
        "salary": 3000,
        "city": "Bishkek",
        "address": "Chui 100",
        "category_id": category.id,
    }

    response = await client.post(
        "/jobs",
        json=payload,
        headers=customer_headers,
    )

    assert response.status_code == 201

    job = response.json()

    response = await client.post(
        "/applications",
        json={"job_id": job["id"]},
        headers=auth_headers,
    )

    assert response.status_code == 201

    application = response.json()

    response = await client.delete(
        f"/applications/{application['id']}",
        headers=auth_headers,
    )

    assert response.status_code == 204

    response = await client.get(
        f"/applications/{application['id']}",
        headers=auth_headers,
    )

    assert response.status_code == 404


@pytest.mark.asyncio
async def test_accept_application(
    client,
    auth_headers,
    customer_headers,
    category,
):
    payload = {
        "title": "Python Developer",
        "description": "Backend Developer",
        "salary": 3000,
        "city": "Bishkek",
        "address": "Chui 100",
        "category_id": category.id,
    }

    response = await client.post(
        "/jobs",
        json=payload,
        headers=customer_headers,
    )

    assert response.status_code == 201

    job = response.json()

    response = await client.post(
        "/applications",
        json={"job_id": job["id"]},
        headers=auth_headers,
    )

    assert response.status_code == 201

    application = response.json()

    response = await client.post(
        f"/applications/{application['id']}/accept",
        headers=customer_headers,
    )

    assert response.status_code == 200

    data = response.json()

    assert data["status"] == "ACCEPTED"

    job_response = await client.get(f"/jobs/{job['id']}")
    assert job_response.status_code == 200
    assert job_response.json()["status"] == "IN_PROGRESS"

    conversations = await client.get("/conversations", headers=customer_headers)
    assert conversations.status_code == 200
    assert len(conversations.json()) == 1
    conversation = conversations.json()[0]
    assert conversation["job_id"] == job["id"]
    assert conversation["worker_id"] == application["worker_id"]
    assert conversation["customer_id"] == job["owner_id"]


@pytest.mark.asyncio
async def test_reject_application(
    client,
    auth_headers,
    customer_headers,
    category,
):
    payload = {
        "title": "Python Developer",
        "description": "Backend Developer",
        "salary": 3000,
        "city": "Bishkek",
        "address": "Chui 100",
        "category_id": category.id,
    }

    response = await client.post(
        "/jobs",
        json=payload,
        headers=customer_headers,
    )

    assert response.status_code == 201

    job = response.json()

    response = await client.post(
        "/applications",
        json={"job_id": job["id"]},
        headers=auth_headers,
    )

    assert response.status_code == 201

    application = response.json()

    response = await client.post(
        f"/applications/{application['id']}/reject",
        headers=customer_headers,
    )

    assert response.status_code == 200

    data = response.json()

    assert data["status"] == "REJECTED"


@pytest.mark.asyncio
async def test_create_duplicate_application(
    client,
    auth_headers,
    customer_headers,
    category,
):
    payload = {
        "title": "Python Developer",
        "description": "Backend Developer",
        "salary": 3000,
        "city": "Bishkek",
        "address": "Chui 100",
        "category_id": category.id,
    }

    job = await client.post("/jobs", json=payload, headers=customer_headers)
    job_id = job.json()["id"]

    first = await client.post(
        "/applications",
        json={"job_id": job_id},
        headers=auth_headers,
    )
    assert first.status_code == 201

    second = await client.post(
        "/applications",
        json={"job_id": job_id},
        headers=auth_headers,
    )
    assert second.status_code == 400
    assert second.json()["detail"] == "You have already applied"


@pytest.mark.asyncio
async def test_cannot_apply_to_completed_job(
    client,
    auth_headers,
    customer_headers,
    category,
):
    payload = {
        "title": "Python Developer",
        "description": "Backend Developer",
        "salary": 3000,
        "city": "Bishkek",
        "address": "Chui 100",
        "category_id": category.id,
    }

    job = await client.post("/jobs", json=payload, headers=customer_headers)
    job_id = job.json()["id"]

    application = await client.post(
        "/applications",
        json={"job_id": job_id},
        headers=auth_headers,
    )
    assert application.status_code == 201

    accepted = await client.post(
        f"/applications/{application.json()['id']}/accept",
        headers=customer_headers,
    )
    assert accepted.status_code == 200

    complete = await client.post(
        f"/jobs/{job_id}/complete",
        headers=customer_headers,
    )
    assert complete.status_code == 200

    unique = uuid.uuid4().hex[:8]
    second_worker = {
        "username": f"worker_{unique}",
        "email": f"{unique}@test.com",
        "password": TEST_PASSWORD,
        "first_name": "Second",
        "last_name": "Worker",
        "phone": "+996555123456",
        "role": "worker",
    }
    registered = await client.post("/auth/register", json=second_worker)
    assert registered.status_code == 201
    await verify_registered_email(client, second_worker["email"])
    login = await client.post(
        "/auth/login",
        json={
            "email": second_worker["email"],
            "password": second_worker["password"],
        },
    )
    second_headers = {
        "Authorization": f"Bearer {login.json()['access_token']}",
    }

    response = await client.post(
        "/applications",
        json={"job_id": job_id},
        headers=second_headers,
    )

    assert response.status_code == 400
    assert response.json()["detail"] == "Job is not open for applications"


@pytest.mark.asyncio
async def test_get_job_applications(
    client,
    auth_headers,
    customer_headers,
    category,
):
    payload = {
        "title": "Python Developer",
        "description": "Backend Developer",
        "salary": 3000,
        "city": "Bishkek",
        "address": "Chui 100",
        "category_id": category.id,
    }

    job = await client.post("/jobs", json=payload, headers=customer_headers)
    job_id = job.json()["id"]

    await client.post(
        "/applications",
        json={"job_id": job_id},
        headers=auth_headers,
    )

    response = await client.get(
        f"/jobs/{job_id}/applications",
        headers=customer_headers,
    )

    assert response.status_code == 200
    assert len(response.json()) == 1

    forbidden = await client.get(
        f"/jobs/{job_id}/applications",
        headers=auth_headers,
    )

    assert forbidden.status_code == 403


@pytest.mark.asyncio
async def test_accept_application_creates_conversation(
    client,
    auth_headers,
    customer_headers,
    category,
):
    payload = {
        "title": "Python Developer",
        "description": "Backend Developer",
        "salary": 3000,
        "city": "Bishkek",
        "address": "Chui 100",
        "category_id": category.id,
    }

    job_response = await client.post("/jobs", json=payload, headers=customer_headers)
    assert job_response.status_code == 201
    job = job_response.json()

    application_response = await client.post(
        "/applications",
        json={"job_id": job["id"]},
        headers=auth_headers,
    )
    assert application_response.status_code == 201
    application = application_response.json()

    before = await client.get("/conversations", headers=customer_headers)
    assert before.status_code == 200
    assert before.json() == []

    accepted = await client.post(
        f"/applications/{application['id']}/accept",
        headers=customer_headers,
    )
    assert accepted.status_code == 200
    assert accepted.json()["status"] == "ACCEPTED"

    job_after = await client.get(f"/jobs/{job['id']}")
    assert job_after.status_code == 200
    assert job_after.json()["status"] == "IN_PROGRESS"

    customer_conversations = await client.get(
        "/conversations",
        headers=customer_headers,
    )
    worker_conversations = await client.get(
        "/conversations",
        headers=auth_headers,
    )

    assert customer_conversations.status_code == 200
    assert worker_conversations.status_code == 200
    assert len(customer_conversations.json()) == 1
    assert len(worker_conversations.json()) == 1

    conversation = customer_conversations.json()[0]
    assert conversation["id"] == worker_conversations.json()[0]["id"]
    assert conversation["job_id"] == job["id"]
    assert conversation["customer_id"] == job["owner_id"]
    assert conversation["worker_id"] == application["worker_id"]


@pytest.mark.asyncio
async def test_accept_application_does_not_duplicate_conversation(
    client,
    auth_headers,
    customer_headers,
    category,
):
    payload = {
        "title": "Python Developer",
        "description": "Backend Developer",
        "salary": 3000,
        "city": "Bishkek",
        "address": "Chui 100",
        "category_id": category.id,
    }

    job_response = await client.post("/jobs", json=payload, headers=customer_headers)
    job = job_response.json()

    application_response = await client.post(
        "/applications",
        json={"job_id": job["id"]},
        headers=auth_headers,
    )
    application = application_response.json()

    first = await client.post(
        f"/applications/{application['id']}/accept",
        headers=customer_headers,
    )
    assert first.status_code == 200

    second = await client.post(
        f"/applications/{application['id']}/accept",
        headers=customer_headers,
    )
    assert second.status_code == 200
    assert second.json()["status"] == "ACCEPTED"
    assert second.json()["id"] == first.json()["id"]

    conversations = await client.get("/conversations", headers=customer_headers)
    assert conversations.status_code == 200
    assert len(conversations.json()) == 1


@pytest.mark.asyncio
async def test_accept_keeps_existing_conversation_for_same_worker(
    client,
    auth_headers,
    customer_headers,
    category,
):
    payload = {
        "title": "Python Developer",
        "description": "Backend Developer",
        "salary": 3000,
        "city": "Bishkek",
        "address": "Chui 100",
        "category_id": category.id,
    }

    job_response = await client.post("/jobs", json=payload, headers=customer_headers)
    job = job_response.json()

    application_response = await client.post(
        "/applications",
        json={"job_id": job["id"]},
        headers=auth_headers,
    )
    application = application_response.json()

    created = await client.post(
        f"/conversations/{job['id']}/{application['worker_id']}",
        headers=customer_headers,
    )
    assert created.status_code == 201
    existing_id = created.json()["id"]

    accepted = await client.post(
        f"/applications/{application['id']}/accept",
        headers=customer_headers,
    )
    assert accepted.status_code == 200
    assert accepted.json()["status"] == "ACCEPTED"

    conversations = await client.get("/conversations", headers=customer_headers)
    assert conversations.status_code == 200
    assert len(conversations.json()) == 1
    assert conversations.json()[0]["id"] == existing_id


@pytest.mark.asyncio
async def test_accept_conversation_endpoint_remains_idempotent_fallback(
    client,
    auth_headers,
    customer_headers,
    category,
):
    payload = {
        "title": "Python Developer",
        "description": "Backend Developer",
        "salary": 3000,
        "city": "Bishkek",
        "address": "Chui 100",
        "category_id": category.id,
    }

    job_response = await client.post("/jobs", json=payload, headers=customer_headers)
    job = job_response.json()

    application_response = await client.post(
        "/applications",
        json={"job_id": job["id"]},
        headers=auth_headers,
    )
    application = application_response.json()

    accepted = await client.post(
        f"/applications/{application['id']}/accept",
        headers=customer_headers,
    )
    assert accepted.status_code == 200

    conversations = await client.get("/conversations", headers=customer_headers)
    assert len(conversations.json()) == 1
    existing_id = conversations.json()[0]["id"]

    fallback = await client.post(
        f"/conversations/{job['id']}/{application['worker_id']}",
        headers=customer_headers,
    )
    assert fallback.status_code == 201
    assert fallback.json()["id"] == existing_id

    after = await client.get("/conversations", headers=customer_headers)
    assert len(after.json()) == 1


@pytest.mark.asyncio
async def test_accept_rolls_back_when_conversation_create_fails(
    client,
    auth_headers,
    customer_headers,
    category,
):
    payload = {
        "title": "Python Developer",
        "description": "Backend Developer",
        "salary": 3000,
        "city": "Bishkek",
        "address": "Chui 100",
        "category_id": category.id,
    }

    job_response = await client.post("/jobs", json=payload, headers=customer_headers)
    job = job_response.json()

    application_response = await client.post(
        "/applications",
        json={"job_id": job["id"]},
        headers=auth_headers,
    )
    application = application_response.json()

    with patch(
        "app.repositories.conversation.ConversationRepository.add",
        side_effect=RuntimeError("conversation create failed"),
    ):
        try:
            response = await client.post(
                f"/applications/{application['id']}/accept",
                headers=customer_headers,
            )
        except RuntimeError as exc:
            assert "conversation create failed" in str(exc)
        else:
            assert response.status_code == 500

    job_after = await client.get(f"/jobs/{job['id']}")
    assert job_after.status_code == 200
    assert job_after.json()["status"] == "OPEN"

    application_after = await client.get(
        f"/applications/{application['id']}",
        headers=auth_headers,
    )
    assert application_after.status_code == 200
    assert application_after.json()["status"] == "PENDING"

    conversations = await client.get("/conversations", headers=customer_headers)
    assert conversations.status_code == 200
    assert conversations.json() == []
