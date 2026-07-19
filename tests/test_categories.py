import pytest


@pytest.mark.asyncio
async def test_create_category(client):
    payload = {
        "name": "IT",
        "description": "Information Technology",
    }

    response = await client.post(
        "/categories",
        json=payload,
    )

    assert response.status_code == 201

    data = response.json()

    assert data["name"] == "IT"
    assert data["description"] == "Information Technology"


@pytest.mark.asyncio
async def test_get_categories(client):
    payload = {
        "name": "IT",
        "description": "Information Technology",
    }

    response = await client.post(
        "/categories",
        json=payload,
    )

    assert response.status_code == 201

    response = await client.get("/categories")

    assert response.status_code == 200

    data = response.json()

    assert isinstance(data, list)
    assert len(data) == 1
    assert data[0]["name"] == "IT"


@pytest.mark.asyncio
async def test_get_category_by_id(client):
    payload = {
        "name": "IT",
        "description": "Information Technology",
    }

    response = await client.post(
        "/categories",
        json=payload,
    )

    assert response.status_code == 201

    category = response.json()

    response = await client.get(f"/categories/{category['id']}")

    assert response.status_code == 200

    data = response.json()

    assert data["id"] == category["id"]
    assert data["name"] == "IT"
    assert data["description"] == "Information Technology"


@pytest.mark.asyncio
async def test_update_category(client):
    payload = {
        "name": "IT",
        "description": "Information Technology",
    }

    response = await client.post(
        "/categories",
        json=payload,
    )

    assert response.status_code == 201

    category = response.json()

    response = await client.put(
        f"/categories/{category['id']}",
        json={
            "name": "Backend",
            "description": "Backend Development",
        },
    )

    assert response.status_code == 200

    data = response.json()

    assert data["name"] == "Backend"
    assert data["description"] == "Backend Development"


@pytest.mark.asyncio
async def test_delete_category(client):
    payload = {
        "name": "IT",
        "description": "Information Technology",
    }

    response = await client.post(
        "/categories",
        json=payload,
    )

    assert response.status_code == 201

    category = response.json()

    response = await client.delete(f"/categories/{category['id']}")

    assert response.status_code == 204

    response = await client.get(f"/categories/{category['id']}")

    assert response.status_code == 404
