import pytest


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


@pytest.mark.asyncio
async def test_get_me_without_token(client):
    response = await client.get("/users/me")

    assert response.status_code == 401


@pytest.mark.asyncio
async def test_get_me_invalid_token(client):
    response = await client.get(
        "/users/me",
        headers={
            "Authorization": "Bearer invalid_token"
        },
    )

    assert response.status_code == 401

@pytest.mark.asyncio
async def test_change_password_success(client, auth_headers):
    payload = {
        "current_password": "12345678",
        "new_password": "87654321",
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
        "new_password": "87654321",
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
        "current_password": "12345678",
        "new_password": "12345678",
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



@pytest.mark.asyncio
async def test_get_my_applications_empty(client, auth_headers):
    response = await client.get(
        "/users/me/applications",
        headers=auth_headers,
    )

    assert response.status_code == 200
    assert response.json() == []


