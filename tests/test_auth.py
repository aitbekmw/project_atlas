import uuid
from datetime import datetime, timedelta, timezone

import pytest
from sqlalchemy import update

from app.models.email_verification import EmailVerification
from app.services.email import TEST_EMAIL_CODES
from tests.conftest import TEST_PASSWORD, verify_registered_email


def _payload(**overrides):
    unique = uuid.uuid4().hex[:8]
    data = {
        "email": f"{unique}@test.com",
        "password": TEST_PASSWORD,
        "first_name": "Айбек",
        "last_name": "Тестов",
        "phone": "+996700000000",
        "role": "worker",
    }
    data.update(overrides)
    return data


@pytest.mark.asyncio
async def test_register_success(client):
    unique = uuid.uuid4().hex[:8]
    payload = _payload(
        username=f"user_{unique}",
        email=f"{unique}@test.com",
    )

    response = await client.post("/auth/register", json=payload)

    assert response.status_code == 201
    data = response.json()
    assert data["email"] == payload["email"]
    assert data["username"] == payload["username"]
    assert data["is_verified"] is False
    assert "id" in data
    assert "password" not in data
    assert "hashed_password" not in data


@pytest.mark.asyncio
async def test_register_without_username(client):
    payload = _payload()
    response = await client.post("/auth/register", json=payload)

    assert response.status_code == 201
    data = response.json()
    assert data["username"]
    assert "@" not in data["username"]
    assert data["is_verified"] is False


@pytest.mark.asyncio
async def test_register_duplicate_email(client):
    payload = _payload()
    response = await client.post("/auth/register", json=payload)
    assert response.status_code == 201

    again = _payload(email=payload["email"], username="other_user_name")
    response = await client.post("/auth/register", json=again)

    assert response.status_code == 400
    assert response.json()["detail"] == "Email already exists"


@pytest.mark.asyncio
async def test_register_invalid_email(client):
    response = await client.post("/auth/register", json=_payload(email="not-an-email"))
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_register_weak_password(client):
    for password in ("12345678", "password", "qwerty123", "abcdefgh"):
        response = await client.post("/auth/register", json=_payload(password=password))
        assert response.status_code == 422


@pytest.mark.asyncio
async def test_register_password_from_email(client):
    payload = _payload(email="atlasuser@test.com", password="Atlasuser1!")
    response = await client.post("/auth/register", json=payload)
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_register_invalid_phone(client):
    response = await client.post("/auth/register", json=_payload(phone="abc"))
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_register_invalid_name(client):
    response = await client.post("/auth/register", json=_payload(first_name="12"))
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_register_as_customer(client):
    response = await client.post("/auth/register", json=_payload(role="customer"))
    assert response.status_code == 201
    assert response.json()["role"] == "customer"


@pytest.mark.asyncio
async def test_register_as_worker(client):
    response = await client.post("/auth/register", json=_payload(role="worker"))
    assert response.status_code == 201
    assert response.json()["role"] == "worker"


@pytest.mark.asyncio
async def test_register_admin_role_rejected(client):
    response = await client.post("/auth/register", json=_payload(role="admin"))
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_login_success(client):
    payload = _payload()
    await client.post("/auth/register", json=payload)
    await verify_registered_email(client, payload["email"])

    response = await client.post(
        "/auth/login",
        json={"email": payload["email"], "password": payload["password"]},
    )

    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert "refresh_token" in data
    assert "token_type" in data


@pytest.mark.asyncio
async def test_login_wrong_password(client):
    payload = _payload()
    await client.post("/auth/register", json=payload)

    response = await client.post(
        "/auth/login",
        json={"email": payload["email"], "password": "wrong_password"},
    )

    assert response.status_code == 401
    assert response.json()["detail"] == "Invalid email or password"


@pytest.mark.asyncio
async def test_login_unknown_email(client):
    response = await client.post(
        "/auth/login",
        json={"email": "unknown@test.com", "password": TEST_PASSWORD},
    )

    assert response.status_code == 401
    assert response.json()["detail"] == "Invalid email or password"


@pytest.mark.asyncio
async def test_register_duplicate_username(client):
    unique = uuid.uuid4().hex[:8]
    payload = _payload(username=f"user_{unique}", email=f"{unique}@test.com")
    response = await client.post("/auth/register", json=payload)
    assert response.status_code == 201

    payload["email"] = f"another_{unique}@test.com"
    response = await client.post("/auth/register", json=payload)

    assert response.status_code == 400
    assert response.json()["detail"] == "Username already exists"


@pytest.mark.asyncio
async def test_refresh_and_logout(client):
    payload = _payload()
    await client.post("/auth/register", json=payload)
    await verify_registered_email(client, payload["email"])

    login = await client.post(
        "/auth/login",
        json={"email": payload["email"], "password": payload["password"]},
    )
    assert login.status_code == 200
    refresh_token = login.json()["refresh_token"]

    refreshed = await client.post(
        "/auth/refresh", json={"refresh_token": refresh_token}
    )
    assert refreshed.status_code == 200
    assert "access_token" in refreshed.json()
    assert "refresh_token" in refreshed.json()

    reused = await client.post("/auth/refresh", json={"refresh_token": refresh_token})
    assert reused.status_code == 401

    new_refresh = refreshed.json()["refresh_token"]
    logout = await client.post("/auth/logout", json={"refresh_token": new_refresh})
    assert logout.status_code == 204

    after_logout = await client.post(
        "/auth/refresh",
        json={"refresh_token": new_refresh},
    )
    assert after_logout.status_code == 401


@pytest.mark.asyncio
async def test_login_requires_email_verification(client):
    payload = _payload()
    await client.post("/auth/register", json=payload)
    response = await client.post(
        "/auth/login",
        json={"email": payload["email"], "password": payload["password"]},
    )
    assert response.status_code == 403
    assert response.json()["detail"] == "Email is not verified"


@pytest.mark.asyncio
async def test_verify_email_and_login(client):
    payload = _payload()
    await client.post("/auth/register", json=payload)
    wrong = await client.post(
        "/auth/verify-email",
        json={"email": payload["email"], "code": "000000"},
    )
    assert wrong.status_code == 400
    assert wrong.json()["detail"] == "Invalid verification code"

    ok = await verify_registered_email(client, payload["email"])
    assert ok.json()["is_verified"] is True

    reused = await client.post(
        "/auth/verify-email",
        json={"email": payload["email"], "code": TEST_EMAIL_CODES[payload["email"]]},
    )
    assert reused.status_code == 400
    assert reused.json()["detail"] == "Email is already verified"

    login = await client.post(
        "/auth/login",
        json={"email": payload["email"], "password": payload["password"]},
    )
    assert login.status_code == 200


@pytest.mark.asyncio
async def test_verify_email_unknown_account(client):
    response = await client.post(
        "/auth/verify-email",
        json={"email": "missing@test.com", "code": "123456"},
    )
    assert response.status_code == 404
    assert response.json()["detail"] == "User not found"


@pytest.mark.asyncio
async def test_expired_verification_code(client, db):
    payload = _payload()
    created = await client.post("/auth/register", json=payload)
    user_id = created.json()["id"]
    await db.execute(
        update(EmailVerification)
        .where(EmailVerification.user_id == user_id)
        .values(expires_at=datetime.now(timezone.utc) - timedelta(minutes=1))
    )
    await db.commit()

    code = TEST_EMAIL_CODES[payload["email"]]
    response = await client.post(
        "/auth/verify-email",
        json={"email": payload["email"], "code": code},
    )
    assert response.status_code == 400
    assert response.json()["detail"] == "Verification code expired"


@pytest.mark.asyncio
async def test_resend_verification_rate_limit(client):
    payload = _payload()
    await client.post("/auth/register", json=payload)
    first_code = TEST_EMAIL_CODES[payload["email"]]
    response = await client.post(
        "/auth/resend-verification",
        json={"email": payload["email"]},
    )
    assert response.status_code == 429
    assert response.json()["retry_after"] >= 1
    assert TEST_EMAIL_CODES[payload["email"]] == first_code


@pytest.mark.asyncio
async def test_resend_verification_after_cooldown(client, db):
    payload = _payload()
    created = await client.post("/auth/register", json=payload)
    user_id = created.json()["id"]
    first_code = TEST_EMAIL_CODES[payload["email"]]
    await db.execute(
        update(EmailVerification)
        .where(EmailVerification.user_id == user_id)
        .values(created_at=datetime.now(timezone.utc) - timedelta(seconds=61))
    )
    await db.commit()

    response = await client.post(
        "/auth/resend-verification",
        json={"email": payload["email"]},
    )
    assert response.status_code == 204
    assert TEST_EMAIL_CODES[payload["email"]] != first_code


@pytest.mark.asyncio
async def test_resend_already_verified(client):
    payload = _payload()
    await client.post("/auth/register", json=payload)
    await verify_registered_email(client, payload["email"])
    response = await client.post(
        "/auth/resend-verification",
        json={"email": payload["email"]},
    )
    assert response.status_code == 400
    assert response.json()["detail"] == "Email is already verified"


@pytest.mark.asyncio
async def test_verification_code_not_returned(client):
    payload = _payload()
    response = await client.post("/auth/register", json=payload)
    body = response.json()
    assert "code" not in body
    assert TEST_EMAIL_CODES[payload["email"]] not in response.text


@pytest.mark.asyncio
async def test_register_does_not_store_plaintext_code(client, db):
    from sqlalchemy import select

    payload = _payload()
    created = await client.post("/auth/register", json=payload)
    user_id = created.json()["id"]
    result = await db.execute(
        select(EmailVerification).where(EmailVerification.user_id == user_id)
    )
    record = result.scalar_one()
    code = TEST_EMAIL_CODES[payload["email"]]
    assert record.code_hash != code
    assert len(record.code_hash) == 64
