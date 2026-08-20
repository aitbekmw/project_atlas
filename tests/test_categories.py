import pytest


@pytest.mark.asyncio
async def test_create_category(client, admin_headers):
    payload = {
        "name": "IT",
        "description": "Information Technology",
    }

    response = await client.post(
        "/categories",
        json=payload,
        headers=admin_headers,
    )

    assert response.status_code == 201

    data = response.json()

    assert data["name"] == "IT"
    assert data["description"] == "Information Technology"


@pytest.mark.asyncio
async def test_create_category_unauthorized(client, auth_headers):
    response = await client.post(
        "/categories",
        json={
            "name": "IT",
            "description": "Information Technology",
        },
    )

    assert response.status_code == 401

    response = await client.post(
        "/categories",
        json={
            "name": "IT",
            "description": "Information Technology",
        },
        headers=auth_headers,
    )

    assert response.status_code == 403


@pytest.mark.asyncio
async def test_get_categories(client, admin_headers):
    payload = {
        "name": "IT",
        "description": "Information Technology",
    }

    response = await client.post(
        "/categories",
        json=payload,
        headers=admin_headers,
    )

    assert response.status_code == 201

    response = await client.get("/categories")

    assert response.status_code == 200

    data = response.json()

    assert isinstance(data, list)
    assert len(data) == 1
    assert data[0]["name"] == "IT"


@pytest.mark.asyncio
async def test_get_category_by_id(client, admin_headers):
    payload = {
        "name": "IT",
        "description": "Information Technology",
    }

    response = await client.post(
        "/categories",
        json=payload,
        headers=admin_headers,
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
async def test_update_category(client, admin_headers):
    payload = {
        "name": "IT",
        "description": "Information Technology",
    }

    response = await client.post(
        "/categories",
        json=payload,
        headers=admin_headers,
    )

    assert response.status_code == 201

    category = response.json()

    response = await client.put(
        f"/categories/{category['id']}",
        json={
            "name": "Backend",
            "description": "Backend Development",
        },
        headers=admin_headers,
    )

    assert response.status_code == 200

    data = response.json()

    assert data["name"] == "Backend"
    assert data["description"] == "Backend Development"


@pytest.mark.asyncio
async def test_delete_category(client, admin_headers):
    payload = {
        "name": "IT",
        "description": "Information Technology",
    }

    response = await client.post(
        "/categories",
        json=payload,
        headers=admin_headers,
    )

    assert response.status_code == 201

    category = response.json()

    response = await client.delete(
        f"/categories/{category['id']}",
        headers=admin_headers,
    )

    assert response.status_code == 204

    response = await client.get(f"/categories/{category['id']}")

    assert response.status_code == 404
