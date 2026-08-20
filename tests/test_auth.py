import uuid

import pytest


@pytest.mark.asyncio
async def test_register_success(client):
    unique = uuid.uuid4().hex[:8]

    response = await client.post(
        "/auth/register",
        json={
            "username": f"user_{unique}",
            "email": f"{unique}@test.com",
            "password": "12345678",
            "first_name": "Test",
            "last_name": "User",
            "phone": "+996700000000",
        },
    )

    assert response.status_code == 201

    data = response.json()

    assert data["email"] == f"{unique}@test.com"
    assert data["username"] == f"user_{unique}"
    assert "id" in data


@pytest.mark.asyncio
async def test_register_duplicate_email(client):
    unique = uuid.uuid4().hex[:8]

    payload = {
        "username": f"user_{unique}",
        "email": f"{unique}@test.com",
        "password": "12345678",
        "first_name": "Test",
        "last_name": "User",
        "phone": "+996700000000",
    }

    response = await client.post("/auth/register", json=payload)
    assert response.status_code == 201

    payload["username"] = f"another_{unique}"

    response = await client.post("/auth/register", json=payload)

    assert response.status_code == 400
    assert response.json()["detail"] == "Email already exists"


@pytest.mark.asyncio
async def test_login_success(client):
    unique = uuid.uuid4().hex[:8]

    payload = {
        "username": f"user_{unique}",
        "email": f"{unique}@test.com",
        "password": "12345678",
        "first_name": "Test",
        "last_name": "User",
        "phone": "+996700000000",
    }

    await client.post("/auth/register", json=payload)

    response = await client.post(
        "/auth/login",
        json={
            "email": payload["email"],
            "password": payload["password"],
        },
    )

    assert response.status_code == 200

    data = response.json()

    assert "access_token" in data
    assert "refresh_token" in data
    assert "token_type" in data


@pytest.mark.asyncio
async def test_login_wrong_password(client):
    unique = uuid.uuid4().hex[:8]

    payload = {
        "username": f"user_{unique}",
        "email": f"{unique}@test.com",
        "password": "12345678",
        "first_name": "Test",
        "last_name": "User",
        "phone": "+996700000000",
    }

    await client.post("/auth/register", json=payload)

    response = await client.post(
        "/auth/login",
        json={
            "email": payload["email"],
            "password": "wrong_password",
        },
    )

    assert response.status_code == 401
    assert response.json()["detail"] == "Invalid email or password"


@pytest.mark.asyncio
async def test_login_unknown_email(client):
    response = await client.post(
        "/auth/login",
        json={
            "email": "unknown@test.com",
            "password": "12345678",
        },
    )

    assert response.status_code == 401
    assert response.json()["detail"] == "Invalid email or password"


@pytest.mark.asyncio
async def test_register_duplicate_username(client):
    unique = uuid.uuid4().hex[:8]

    payload = {
        "username": f"user_{unique}",
        "email": f"{unique}@test.com",
        "password": "12345678",
        "first_name": "Test",
        "last_name": "User",
        "phone": "+996700000000",
    }

    response = await client.post("/auth/register", json=payload)
    assert response.status_code == 201

    payload["email"] = f"another_{unique}@test.com"

    response = await client.post("/auth/register", json=payload)

    assert response.status_code == 400
    assert response.json()["detail"] == "Username already exists"


@pytest.mark.asyncio
async def test_register_as_customer(client):
    unique = uuid.uuid4().hex[:8]

    response = await client.post(
        "/auth/register",
        json={
            "username": f"cust_{unique}",
            "email": f"{unique}@test.com",
            "password": "12345678",
            "first_name": "Test",
            "last_name": "Customer",
            "role": "customer",
        },
    )

    assert response.status_code == 201
    assert response.json()["role"] == "customer"


@pytest.mark.asyncio
async def test_register_admin_role_rejected(client):
    unique = uuid.uuid4().hex[:8]

    response = await client.post(
        "/auth/register",
        json={
            "username": f"admin_{unique}",
            "email": f"{unique}@test.com",
            "password": "12345678",
            "first_name": "Test",
            "last_name": "Admin",
            "role": "admin",
        },
    )

    assert response.status_code == 422


@pytest.mark.asyncio
async def test_refresh_and_logout(client):
    unique = uuid.uuid4().hex[:8]

    payload = {
        "username": f"user_{unique}",
        "email": f"{unique}@test.com",
        "password": "12345678",
        "first_name": "Test",
        "last_name": "User",
        "phone": "+996700000000",
    }

    await client.post("/auth/register", json=payload)

    login = await client.post(
        "/auth/login",
        json={
            "email": payload["email"],
            "password": payload["password"],
        },
    )

    assert login.status_code == 200

    refresh_token = login.json()["refresh_token"]

    refreshed = await client.post(
        "/auth/refresh",
        json={"refresh_token": refresh_token},
    )

    assert refreshed.status_code == 200
    assert "access_token" in refreshed.json()
    assert "refresh_token" in refreshed.json()

    reused = await client.post(
        "/auth/refresh",
        json={"refresh_token": refresh_token},
    )

    assert reused.status_code == 401

    new_refresh = refreshed.json()["refresh_token"]

    logout = await client.post(
        "/auth/logout",
        json={"refresh_token": new_refresh},
    )

    assert logout.status_code == 204

    after_logout = await client.post(
        "/auth/refresh",
        json={"refresh_token": new_refresh},
    )

    assert after_logout.status_code == 401
