import pytest
from sqlalchemy import update

from app.core.config import settings
from app.models.user import User


@pytest.mark.asyncio
async def test_get_me_success(client, auth_headers):
    response = await client.get(
        "/users/me",
        headers=auth_headers,
    )

    assert response.status_code == 200

    data = response.json()

    assert "id" in data
    assert "email" in data
    assert "username" in data
    assert data["rating"] is None
    assert data["reviews_count"] == 0


@pytest.mark.asyncio
async def test_get_me_without_token(client):
    response = await client.get("/users/me")

    assert response.status_code == 401


@pytest.mark.asyncio
async def test_get_me_invalid_token(client):
    response = await client.get(
        "/users/me",
        headers={"Authorization": "Bearer invalid_token"},
    )

    assert response.status_code == 401


@pytest.mark.asyncio
async def test_change_password_success(client, auth_headers):
    payload = {
        "current_password": "AtlasTest1!",
        "new_password": "AtlasNew1!",
    }

    response = await client.patch(
        "/users/change-password",
        json=payload,
        headers=auth_headers,
    )

    assert response.status_code == 200
    assert response.json()["message"] == "Password changed successfully"


@pytest.mark.asyncio
async def test_change_password_wrong_current_password(client, auth_headers):
    payload = {
        "current_password": "wrong_password",
        "new_password": "AtlasNew1!",
    }

    response = await client.patch(
        "/users/change-password",
        json=payload,
        headers=auth_headers,
    )

    assert response.status_code == 400
    assert response.json()["detail"] == "Current password is incorrect"


@pytest.mark.asyncio
async def test_change_password_same_password(client, auth_headers):
    payload = {
        "current_password": "AtlasTest1!",
        "new_password": "AtlasTest1!",
    }

    response = await client.patch(
        "/users/change-password",
        json=payload,
        headers=auth_headers,
    )

    assert response.status_code == 400
    assert response.json()["detail"] == "New password must be different"


@pytest.mark.asyncio
async def test_update_me_success(client, auth_headers):
    payload = {
        "first_name": "Updated",
        "last_name": "Developer",
        "phone": "+996777123456",
    }

    response = await client.patch(
        "/users/me",
        json=payload,
        headers=auth_headers,
    )

    assert response.status_code == 200

    data = response.json()

    assert data["first_name"] == "Updated"
    assert data["last_name"] == "Developer"
    assert data["phone"] == "+996777123456"


@pytest.mark.asyncio
async def test_get_user_by_id_success(client, auth_headers):
    me = await client.get(
        "/users/me",
        headers=auth_headers,
    )

    user = me.json()

    response = await client.get(
        f"/users/{user['id']}",
    )

    assert response.status_code == 200

    data = response.json()

    assert data["id"] == user["id"]
    assert data["email"] == user["email"]
    assert data["rating"] is None
    assert data["reviews_count"] == 0


@pytest.mark.asyncio
async def test_get_me_avatar_returns_presigned_url(client, auth_headers, db):
    me = await client.get(
        "/users/me",
        headers=auth_headers,
    )
    user_id = me.json()["id"]
    object_name = "avatars/test-object.jpg"

    await db.execute(update(User).where(User.id == user_id).values(avatar=object_name))
    await db.commit()

    response = await client.get(
        "/users/me",
        headers=auth_headers,
    )

    assert response.status_code == 200

    avatar = response.json()["avatar"]
    assert avatar.startswith("http")
    assert object_name in avatar
    assert "X-Amz-Algorithm" in avatar
    assert f"X-Amz-Expires={settings.MINIO_PRESIGN_EXPIRES_SECONDS}" in avatar

    stored = await db.get(User, user_id)
    await db.refresh(stored)

    assert stored is not None
    assert stored.avatar == object_name


@pytest.mark.asyncio
async def test_get_user_by_id_not_found(client):
    response = await client.get("/users/999999")

    assert response.status_code == 404
    assert response.json()["detail"] == "User not found"


@pytest.mark.asyncio
async def test_get_my_jobs_empty(client, auth_headers):
    response = await client.get(
        "/users/me/jobs",
        headers=auth_headers,
    )

    assert response.status_code == 200
    assert response.json() == []


async def _complete_job_and_review(
    client,
    customer_headers,
    worker_headers,
    category,
    *,
    title: str,
    rating: int,
    comment: str,
):
    job = await client.post(
        "/jobs",
        json={
            "title": title,
            "description": "Need FastAPI developer",
            "salary": 5000,
            "city": "Bishkek",
            "address": "Chui 100",
            "category_id": category.id,
        },
        headers=customer_headers,
    )
    assert job.status_code == 201
    job_id = job.json()["id"]

    application = await client.post(
        "/applications",
        json={"job_id": job_id},
        headers=worker_headers,
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

    worker = await client.get("/users/me", headers=worker_headers)
    assert worker.status_code == 200
    worker_id = worker.json()["id"]

    review = await client.post(
        "/reviews",
        json={
            "job_id": job_id,
            "to_user_id": worker_id,
            "rating": rating,
            "comment": comment,
        },
        headers=customer_headers,
    )
    assert review.status_code == 201
    return worker_id


@pytest.mark.asyncio
async def test_user_without_reviews_has_null_rating(
    client,
    auth_headers,
):
    me = await client.get("/users/me", headers=auth_headers)
    assert me.status_code == 200
    assert me.json()["rating"] is None
    assert me.json()["reviews_count"] == 0

    by_id = await client.get(f"/users/{me.json()['id']}")
    assert by_id.status_code == 200
    assert by_id.json()["rating"] is None
    assert by_id.json()["reviews_count"] == 0


@pytest.mark.asyncio
async def test_user_rating_with_single_review(
    client,
    customer_headers,
    auth_headers,
    category,
):
    worker_id = await _complete_job_and_review(
        client,
        customer_headers,
        auth_headers,
        category,
        title="Rating Job One",
        rating=5,
        comment="Excellent work!",
    )

    me = await client.get("/users/me", headers=auth_headers)
    assert me.status_code == 200
    assert me.json()["id"] == worker_id
    assert me.json()["rating"] == 5.0
    assert me.json()["reviews_count"] == 1

    by_id = await client.get(f"/users/{worker_id}")
    assert by_id.status_code == 200
    assert by_id.json()["rating"] == 5.0
    assert by_id.json()["reviews_count"] == 1

    reviews = await client.get(f"/reviews/user/{worker_id}")
    assert reviews.status_code == 200
    assert len(reviews.json()) == 1


@pytest.mark.asyncio
async def test_user_rating_with_multiple_reviews(
    client,
    customer_headers,
    auth_headers,
    category,
):
    worker_id = await _complete_job_and_review(
        client,
        customer_headers,
        auth_headers,
        category,
        title="Rating Job First",
        rating=5,
        comment="Great",
    )
    await _complete_job_and_review(
        client,
        customer_headers,
        auth_headers,
        category,
        title="Rating Job Second",
        rating=4,
        comment="Good",
    )

    me = await client.get("/users/me", headers=auth_headers)
    assert me.status_code == 200
    assert me.json()["id"] == worker_id
    assert me.json()["rating"] == 4.5
    assert me.json()["reviews_count"] == 2

    by_id = await client.get(f"/users/{worker_id}")
    assert by_id.status_code == 200
    assert by_id.json()["rating"] == 4.5
    assert by_id.json()["reviews_count"] == 2

    reviews = await client.get(f"/reviews/user/{worker_id}")
    assert reviews.status_code == 200
    assert len(reviews.json()) == 2
