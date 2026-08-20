import pytest


@pytest.mark.asyncio
async def test_create_get_and_delete_review(
    client,
    customer_headers,
    auth_headers,
    category,
):
    job = await client.post(
        "/jobs",
        json={
            "title": "Backend Developer",
            "description": "Need FastAPI developer",
            "salary": 5000,
            "city": "Bishkek",
            "address": "Chui 100",
            "category_id": category.id,
        },
        headers=customer_headers,
    )

    assert job.status_code == 201
    job_data = job.json()

    application = await client.post(
        "/applications",
        json={"job_id": job_data["id"]},
        headers=auth_headers,
    )
    assert application.status_code == 201

    accepted = await client.post(
        f"/applications/{application.json()['id']}/accept",
        headers=customer_headers,
    )
    assert accepted.status_code == 200

    complete = await client.post(
        f"/jobs/{job_data['id']}/complete",
        headers=customer_headers,
    )
    assert complete.status_code == 200

    worker = await client.get("/users/me", headers=auth_headers)
    assert worker.status_code == 200
    worker_data = worker.json()

    review = await client.post(
        "/reviews",
        json={
            "job_id": job_data["id"],
            "to_user_id": worker_data["id"],
            "rating": 5,
            "comment": "Excellent work!",
        },
        headers=customer_headers,
    )

    assert review.status_code == 201

    review_data = review.json()

    assert review_data["job_id"] == job_data["id"]
    assert review_data["to_user_id"] == worker_data["id"]
    assert review_data["comment"] == "Excellent work!"
    assert review_data["rating"] == 5

    reviews = await client.get("/reviews")

    assert reviews.status_code == 200
    assert len(reviews.json()) >= 1

    response = await client.get(f"/reviews/{review_data['id']}")

    assert response.status_code == 200
    assert response.json()["comment"] == "Excellent work!"
    assert response.json()["rating"] == 5

    user_reviews = await client.get(f"/reviews/user/{worker_data['id']}")

    assert user_reviews.status_code == 200
    assert len(user_reviews.json()) == 1

    unauthorized_delete = await client.delete(f"/reviews/{review_data['id']}")
    assert unauthorized_delete.status_code == 401

    deleted = await client.delete(
        f"/reviews/{review_data['id']}",
        headers=customer_headers,
    )

    assert deleted.status_code == 204


@pytest.mark.asyncio
async def test_review_requires_completed_job(
    client,
    customer_headers,
    auth_headers,
    category,
):
    job = await client.post(
        "/jobs",
        json={
            "title": "Backend Developer",
            "description": "Need FastAPI developer",
            "salary": 5000,
            "city": "Bishkek",
            "address": "Chui 100",
            "category_id": category.id,
        },
        headers=customer_headers,
    )
    job_id = job.json()["id"]

    worker = await client.get("/users/me", headers=auth_headers)

    response = await client.post(
        "/reviews",
        json={
            "job_id": job_id,
            "to_user_id": worker.json()["id"],
            "rating": 5,
            "comment": "Too early",
        },
        headers=customer_headers,
    )

    assert response.status_code == 400
    assert response.json()["detail"] == "Job is not completed"
