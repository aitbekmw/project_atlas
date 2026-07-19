import pytest


@pytest.mark.asyncio
async def test_send_and_get_messages(
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

    # Получаем worker
    me = await client.get(
        "/users/me",
        headers=auth_headers,
    )

    assert me.status_code == 200
    worker = me.json()

    # Создаем conversation
    conversation = await client.post(
        f"/conversations/{job_data['id']}/{worker['id']}",
        headers=customer_headers,
    )

    assert conversation.status_code == 201
    conversation_data = conversation.json()

    # Отправляем сообщение
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

    # Получаем историю сообщений
    history = await client.get(
        f"/messages/{conversation_data['id']}",
        headers=auth_headers,
    )

    assert history.status_code == 200

    messages = history.json()

    assert len(messages) == 1
    assert messages[0]["text"] == "Hello!"

    # Отмечаем как доставленное
    delivered = await client.patch(
        f"/messages/{message_data['id']}/delivered"
    )

    print(delivered.json())

    assert delivered.status_code == 200

    # Отмечаем как прочитанное
    read = await client.patch(
        f"/messages/{message_data['id']}/read"
    )

    assert read.status_code == 200
    assert read.json()["is_read"] is True