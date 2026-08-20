import pytest


@pytest.mark.asyncio
async def test_create_conversation(
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

    customer = await client.get("/users/me", headers=customer_headers)
    worker = await client.get("/users/me", headers=auth_headers)

    assert customer.status_code == 200
    assert worker.status_code == 200

    response = await client.post(
        f"/conversations/{job_data['id']}/{worker.json()['id']}",
        headers=customer_headers,
    )

    assert response.status_code == 201

    data = response.json()

    assert data["job_id"] == job_data["id"]
    assert data["customer_id"] == customer.json()["id"]
    assert data["worker_id"] == worker.json()["id"]

    fetched = await client.get(
        f"/conversations/{data['id']}",
        headers=customer_headers,
    )

    assert fetched.status_code == 200
    assert fetched.json()["id"] == data["id"]

    my_conversations = await client.get(
        "/conversations",
        headers=auth_headers,
    )

    assert my_conversations.status_code == 200
    assert len(my_conversations.json()) == 1
