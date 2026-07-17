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