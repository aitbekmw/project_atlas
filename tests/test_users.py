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


