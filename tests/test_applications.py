import pytest


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

    complete = await client.post(
        f"/jobs/{job_id}/complete",
        headers=customer_headers,
    )
    assert complete.status_code == 200

    response = await client.post(
        "/applications",
        json={"job_id": job_id},
        headers=auth_headers,
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
