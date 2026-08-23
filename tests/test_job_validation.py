import pytest
from sqlalchemy import select

from app.models.enum import PaymentMethod
from app.models.job import Job
from app.seed import seed
from tests.conftest import TestingSessionLocal

VALID_DESCRIPTION = "Valid job description"
VALID_TITLE = "Valid title"


def _payload(category, **overrides):
    data = {
        "title": VALID_TITLE,
        "description": VALID_DESCRIPTION,
        "salary": 1000,
        "city": "Bishkek",
        "address": "Manas",
        "category_id": category.id,
    }
    data.update(overrides)
    return data


async def _create_valid_job(client, customer_headers, category):
    response = await client.post(
        "/jobs",
        json=_payload(category),
        headers=customer_headers,
    )
    assert response.status_code == 201
    return response.json()


@pytest.mark.asyncio
@pytest.mark.parametrize(
    "title",
    [
        "",
        "    ",
        "abcd",
        "a" * 256,
    ],
)
async def test_create_job_rejects_invalid_title(
    client, customer_headers, category, title
):
    response = await client.post(
        "/jobs",
        json=_payload(category, title=title),
        headers=customer_headers,
    )
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_create_job_accepts_min_title(client, customer_headers, category):
    response = await client.post(
        "/jobs",
        json=_payload(category, title="abcde"),
        headers=customer_headers,
    )
    assert response.status_code == 201
    assert response.json()["title"] == "abcde"


@pytest.mark.asyncio
async def test_create_job_accepts_max_title(client, customer_headers, category):
    title = "a" * 255
    response = await client.post(
        "/jobs",
        json=_payload(category, title=title),
        headers=customer_headers,
    )
    assert response.status_code == 201
    assert response.json()["title"] == title


@pytest.mark.asyncio
async def test_create_job_normalizes_repeated_spaces_in_title(
    client, customer_headers, category
):
    response = await client.post(
        "/jobs",
        json=_payload(category, title="   Hello    world   "),
        headers=customer_headers,
    )
    assert response.status_code == 201
    assert response.json()["title"] == "Hello world"


@pytest.mark.asyncio
@pytest.mark.parametrize(
    "description",
    [
        "",
        "    ",
        " \n\t ",
        "a" * 9,
        "a" * 2001,
    ],
)
async def test_create_job_rejects_invalid_description(
    client, customer_headers, category, description
):
    response = await client.post(
        "/jobs",
        json=_payload(category, description=description),
        headers=customer_headers,
    )
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_create_job_accepts_min_description(client, customer_headers, category):
    description = "a" * 10
    response = await client.post(
        "/jobs",
        json=_payload(category, description=description),
        headers=customer_headers,
    )
    assert response.status_code == 201
    assert response.json()["description"] == description


@pytest.mark.asyncio
async def test_create_job_accepts_max_description(client, customer_headers, category):
    description = "a" * 2000
    response = await client.post(
        "/jobs",
        json=_payload(category, description=description),
        headers=customer_headers,
    )
    assert response.status_code == 201
    assert len(response.json()["description"]) == 2000


@pytest.mark.asyncio
async def test_create_job_preserves_newlines_in_description(
    client, customer_headers, category
):
    response = await client.post(
        "/jobs",
        json=_payload(category, description="  first line\n\nsecond line  "),
        headers=customer_headers,
    )
    assert response.status_code == 201
    assert response.json()["description"] == "first line\n\nsecond line"


@pytest.mark.asyncio
@pytest.mark.parametrize(
    "salary",
    [0, 99, 1_000_001, 8_678_678],
)
async def test_create_job_rejects_invalid_salary(
    client, customer_headers, category, salary
):
    response = await client.post(
        "/jobs",
        json=_payload(category, salary=salary),
        headers=customer_headers,
    )
    assert response.status_code == 422


@pytest.mark.asyncio
@pytest.mark.parametrize(
    "salary",
    [100, 1_000_000],
)
async def test_create_job_accepts_salary_bounds(
    client, customer_headers, category, salary
):
    response = await client.post(
        "/jobs",
        json=_payload(category, salary=salary),
        headers=customer_headers,
    )
    assert response.status_code == 201
    assert response.json()["salary"] == salary


@pytest.mark.asyncio
@pytest.mark.parametrize(
    "update",
    [
        {"title": ""},
        {"title": "    "},
        {"title": "abcd"},
        {"title": "a" * 256},
        {"description": ""},
        {"description": "    "},
        {"description": "a" * 9},
        {"description": "a" * 2001},
        {"salary": 0},
        {"salary": 99},
        {"salary": 1_000_001},
        {"salary": 8_678_678},
    ],
)
async def test_update_job_rejects_invalid_fields(
    client, customer_headers, category, update
):
    job = await _create_valid_job(client, customer_headers, category)
    response = await client.put(
        f"/jobs/{job['id']}",
        json=update,
        headers=customer_headers,
    )
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_update_job_accepts_bounds_and_normalizes(
    client, customer_headers, category
):
    job = await _create_valid_job(client, customer_headers, category)

    title_ok = await client.put(
        f"/jobs/{job['id']}",
        json={"title": "abcde"},
        headers=customer_headers,
    )
    assert title_ok.status_code == 200
    assert title_ok.json()["title"] == "abcde"

    title_max = await client.put(
        f"/jobs/{job['id']}",
        json={"title": "b" * 255},
        headers=customer_headers,
    )
    assert title_max.status_code == 200
    assert title_max.json()["title"] == "b" * 255

    title_spaces = await client.put(
        f"/jobs/{job['id']}",
        json={"title": "   Hello    world   "},
        headers=customer_headers,
    )
    assert title_spaces.status_code == 200
    assert title_spaces.json()["title"] == "Hello world"

    description_min = await client.put(
        f"/jobs/{job['id']}",
        json={"description": "c" * 10},
        headers=customer_headers,
    )
    assert description_min.status_code == 200
    assert description_min.json()["description"] == "c" * 10

    description_max = await client.put(
        f"/jobs/{job['id']}",
        json={"description": "d" * 2000},
        headers=customer_headers,
    )
    assert description_max.status_code == 200
    assert len(description_max.json()["description"]) == 2000

    description_newlines = await client.put(
        f"/jobs/{job['id']}",
        json={"description": "  first line\n\nsecond line  "},
        headers=customer_headers,
    )
    assert description_newlines.status_code == 200
    assert description_newlines.json()["description"] == "first line\n\nsecond line"

    salary_min = await client.put(
        f"/jobs/{job['id']}",
        json={"salary": 100},
        headers=customer_headers,
    )
    assert salary_min.status_code == 200
    assert salary_min.json()["salary"] == 100

    salary_max = await client.put(
        f"/jobs/{job['id']}",
        json={"salary": 1_000_000},
        headers=customer_headers,
    )
    assert salary_max.status_code == 200
    assert salary_max.json()["salary"] == 1_000_000


@pytest.mark.asyncio
async def test_get_does_not_apply_write_validation_to_existing_jobs(
    client, customer_headers, category
):
    me = await client.get("/users/me", headers=customer_headers)
    assert me.status_code == 200
    owner_id = me.json()["id"]

    async with TestingSessionLocal() as db:
        job = Job(
            title="ab",
            description="short",
            salary=0,
            payment_method=PaymentMethod.CASH.value,
            city="Bishkek",
            address="Manas",
            category_id=category.id,
            owner_id=owner_id,
        )
        db.add(job)
        await db.commit()
        await db.refresh(job)
        job_id = job.id

    response = await client.get(f"/jobs/{job_id}")
    assert response.status_code == 200
    data = response.json()
    assert data["title"] == "ab"
    assert data["description"] == "short"
    assert data["salary"] == 0

    listed = await client.get("/jobs?size=100")
    assert listed.status_code == 200
    assert any(item["id"] == job_id for item in listed.json())


@pytest.mark.asyncio
async def test_seeded_jobs_remain_readable_via_get(client):
    await seed(TestingSessionLocal)

    async with TestingSessionLocal() as db:
        job_ids = list((await db.execute(select(Job.id).order_by(Job.id))).scalars())

    assert len(job_ids) >= 30
    for job_id in job_ids:
        response = await client.get(f"/jobs/{job_id}")
        assert response.status_code == 200, response.text
        assert response.json()["id"] == job_id

    listed = await client.get("/jobs?size=100")
    assert listed.status_code == 200
    assert len(listed.json()) >= 1


@pytest.mark.asyncio
async def test_create_apply_accept_chat_complete_review_flow(
    client, customer_headers, auth_headers, category
):
    job = await client.post(
        "/jobs",
        json=_payload(category),
        headers=customer_headers,
    )
    assert job.status_code == 201
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

    conversations = await client.get("/conversations", headers=customer_headers)
    assert conversations.status_code == 200
    items = conversations.json()
    assert len(items) == 1
    conversation_id = items[0]["id"]

    message = await client.post(
        f"/messages/{conversation_id}",
        json={"text": "Hello!"},
        headers=customer_headers,
    )
    assert message.status_code == 201

    complete = await client.post(
        f"/jobs/{job_id}/complete",
        headers=customer_headers,
    )
    assert complete.status_code == 200

    worker = await client.get("/users/me", headers=auth_headers)
    assert worker.status_code == 200

    review = await client.post(
        "/reviews",
        json={
            "job_id": job_id,
            "to_user_id": worker.json()["id"],
            "rating": 5,
            "comment": "Excellent work!",
        },
        headers=customer_headers,
    )
    assert review.status_code == 201
