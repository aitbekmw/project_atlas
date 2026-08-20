import pytest


@pytest.mark.asyncio
async def test_send_and_get_messages(
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

    worker = await client.get("/users/me", headers=auth_headers)
    assert worker.status_code == 200

    conversation = await client.post(
        f"/conversations/{job_data['id']}/{worker.json()['id']}",
        headers=customer_headers,
    )

    assert conversation.status_code == 201
    conversation_data = conversation.json()

    message = await client.post(
        f"/messages/{conversation_data['id']}",
        json={
            "text": "Hello!",
        },
        headers=customer_headers,
    )

    assert message.status_code == 201

    message_data = message.json()

    assert message_data["text"] == "Hello!"
    assert message_data["conversation_id"] == conversation_data["id"]
    assert message_data["is_delivered"] is False
    assert message_data["is_read"] is False

    history = await client.get(
        f"/messages/{conversation_data['id']}",
        headers=auth_headers,
    )

    assert history.status_code == 200

    messages = history.json()

    assert len(messages) == 1
    assert messages[0]["text"] == "Hello!"

    delivered = await client.patch(
        f"/messages/{message_data['id']}/delivered",
        headers=auth_headers,
    )

    assert delivered.status_code == 200
    assert delivered.json()["is_delivered"] is True

    read = await client.patch(
        f"/messages/{message_data['id']}/read",
        headers=auth_headers,
    )

    assert read.status_code == 200
    assert read.json()["is_read"] is True


@pytest.mark.asyncio
async def test_empty_message_rejected(
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
    worker = await client.get("/users/me", headers=auth_headers)
    conversation = await client.post(
        f"/conversations/{job.json()['id']}/{worker.json()['id']}",
        headers=customer_headers,
    )

    response = await client.post(
        f"/messages/{conversation.json()['id']}",
        json={"text": "   "},
        headers=customer_headers,
    )

    assert response.status_code == 422
