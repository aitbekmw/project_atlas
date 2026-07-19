import pytest


@pytest.mark.asyncio
async def test_create_conversation(
    client,
    customer_headers,
    auth_headers,
):
    # Создаем категорию
    category = await client.post(
        "/categories",
        json={
            "name": "IT",
            "description": "Information Technology",
        },
    )

    assert category.status_code == 201

    category_data = category.json()

    # Создаем вакансию
    job = await client.post(
        "/jobs",
        json={
            "title": "Backend Developer",
            "description": "Need FastAPI developer",
            "salary": 5000,
            "city": "Bishkek",
            "address": "Chui 100",
            "category_id": category_data["id"],
        },
        headers=customer_headers,
    )

    assert job.status_code == 201

    job_data = job.json()

    # Получаем текущего worker
    me = await client.get(
        "/users/me",
        headers=auth_headers,
    )

    assert me.status_code == 200

    worker = me.json()

    # Создаем диалог
    response = await client.post(
        f"/conversations/{job_data['id']}/{worker['id']}",
        headers=customer_headers,
    )

    assert response.status_code == 201

    data = response.json()

    assert data["job_id"] == job_data["id"]
    assert data["customer_id"] == 1
    assert data["worker_id"] == worker["id"]
