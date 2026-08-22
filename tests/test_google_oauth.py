import uuid
from urllib.parse import parse_qs, urlparse

import pytest
from jose import jwt

from app.core.config import settings
from app.core.exceptions import GoogleAuthFailed
from app.services.oauth_store import clear_memory_store
from tests.conftest import TEST_PASSWORD, verify_registered_email

ORIGIN = "http://localhost:5173"


def _qs(url: str, key: str) -> str | None:
    return parse_qs(urlparse(url).query).get(key, [None])[0]


@pytest.fixture(autouse=True)
def google_settings(monkeypatch):
    monkeypatch.setattr(settings, "GOOGLE_CLIENT_ID", "test-google-client")
    monkeypatch.setattr(settings, "GOOGLE_CLIENT_SECRET", "test-google-secret")
    monkeypatch.setattr(
        settings,
        "GOOGLE_REDIRECT_URI",
        "http://localhost:8001/auth/google/callback",
    )
    clear_memory_store()
    yield
    clear_memory_store()


def _identity(**overrides):
    data = {
        "sub": "google-sub-1",
        "email": "google.user@gmail.com",
        "email_verified": True,
        "given_name": "Aida",
        "family_name": "Kyrgyz",
        "picture": "https://example.com/avatar.jpg",
    }
    data.update(overrides)
    return data


@pytest.fixture
def mock_google(monkeypatch):
    state = {"identity": _identity(), "fail_exchange": False}

    async def fake_exchange(_code: str):
        if state["fail_exchange"]:
            raise GoogleAuthFailed()
        return {"access_token": "ya29.fake-token", "token_type": "Bearer"}

    async def fake_userinfo(_token: str):
        return state["identity"]

    monkeypatch.setattr("app.services.auth.exchange_google_code", fake_exchange)
    monkeypatch.setattr("app.services.auth.fetch_google_userinfo", fake_userinfo)
    return state


async def _start(client):
    response = await client.get("/auth/google/start", params={"origin": ORIGIN})
    assert response.status_code == 200, response.text
    url = response.json()["authorization_url"]
    return url, _qs(url, "state")


@pytest.mark.asyncio
async def test_google_start_builds_authorization_url(client):
    url, state = await _start(client)
    parsed = urlparse(url)
    assert parsed.netloc == "accounts.google.com"
    query = parse_qs(parsed.query)
    assert query["client_id"] == ["test-google-client"]
    assert query["redirect_uri"] == ["http://localhost:8001/auth/google/callback"]
    assert query["response_type"] == ["code"]
    assert "openid" in query["scope"][0]
    assert "email" in query["scope"][0]
    assert state
    assert "code_challenge" not in query


@pytest.mark.asyncio
async def test_google_start_requires_config(client, monkeypatch):
    monkeypatch.setattr(settings, "GOOGLE_CLIENT_ID", None)
    response = await client.get("/auth/google/start", params={"origin": ORIGIN})
    assert response.status_code == 503
    assert response.json()["detail"] == "Google sign-in is not configured"


@pytest.mark.asyncio
async def test_google_start_rejects_unknown_origin(client):
    response = await client.get(
        "/auth/google/start",
        params={"origin": "https://evil.example"},
    )
    assert response.status_code == 400


@pytest.mark.asyncio
@pytest.mark.parametrize(
    "origin",
    [
        "http://192.168.1.20:5173",
        "http://10.0.0.5",
        "http://172.16.0.8:80",
        "https://example-tunnel.trycloudflare.com",
    ],
)
async def test_google_start_allows_lan_and_tunnel_origins(client, origin):
    response = await client.get("/auth/google/start", params={"origin": origin})
    assert response.status_code == 200, response.text


@pytest.mark.asyncio
async def test_google_callback_invalid_state(client, mock_google):
    response = await client.get(
        "/auth/google/callback",
        params={"code": "ok", "state": "not-a-real-state"},
        follow_redirects=False,
    )
    assert response.status_code == 302
    assert _qs(response.headers["location"], "error") == "google_failed"


@pytest.mark.asyncio
async def test_google_callback_cancelled(client, mock_google):
    _, state = await _start(client)
    response = await client.get(
        "/auth/google/callback",
        params={"error": "access_denied", "state": state},
        follow_redirects=False,
    )
    assert response.status_code == 302
    assert _qs(response.headers["location"], "error") == "google_cancelled"


@pytest.mark.asyncio
async def test_google_api_failure(client, mock_google):
    mock_google["fail_exchange"] = True
    _, state = await _start(client)
    response = await client.get(
        "/auth/google/callback",
        params={"code": "ok", "state": state},
        follow_redirects=False,
    )
    assert response.status_code == 302
    assert _qs(response.headers["location"], "error") == "google_failed"


@pytest.mark.asyncio
async def test_google_email_not_verified(client, mock_google):
    mock_google["identity"] = _identity(email_verified=False)
    _, state = await _start(client)
    response = await client.get(
        "/auth/google/callback",
        params={"code": "ok", "state": state},
        follow_redirects=False,
    )
    assert response.status_code == 302
    assert _qs(response.headers["location"], "error") == "google_email_not_verified"


@pytest.mark.asyncio
async def test_new_google_user_completes_profile_and_gets_jwt(client, mock_google):
    _, state = await _start(client)
    callback = await client.get(
        "/auth/google/callback",
        params={"code": "ok", "state": state},
        follow_redirects=False,
    )
    assert callback.status_code == 302
    location = callback.headers["location"]
    assert location.startswith(f"{ORIGIN}/complete-profile")
    ticket = _qs(location, "code")
    assert ticket
    assert "access_token" not in location

    too_soon = await client.post("/auth/google/exchange", json={"code": ticket})
    assert too_soon.status_code == 400

    completed = await client.post(
        "/auth/google/complete-profile",
        json={
            "code": ticket,
            "phone": "+996700111222",
            "role": "customer",
        },
    )
    assert completed.status_code == 200
    body = completed.json()
    assert body["token_type"] == "bearer"
    assert body["access_token"]
    assert body["refresh_token"]
    payload = jwt.decode(
        body["access_token"],
        settings.SECRET_KEY,
        algorithms=[settings.ALGORITHM],
        audience=settings.JWT_AUDIENCE,
        issuer=settings.JWT_ISSUER,
    )
    assert payload["type"] == "access"
    assert payload["email"] == "google.user@gmail.com"

    me = await client.get(
        "/users/me",
        headers={"Authorization": f"Bearer {body['access_token']}"},
    )
    assert me.status_code == 200
    data = me.json()
    assert data["email"] == "google.user@gmail.com"
    assert data["is_verified"] is True
    assert data["role"] == "customer"
    assert data["phone"] == "+996700111222"
    assert data["first_name"] == "Aida"
    assert "password" not in data

    reused = await client.post(
        "/auth/google/complete-profile",
        json={
            "code": ticket,
            "phone": "+996700111222",
            "role": "customer",
        },
    )
    assert reused.status_code == 400


@pytest.mark.asyncio
async def test_existing_google_user_logs_in(client, mock_google):
    _, state = await _start(client)
    first = await client.get(
        "/auth/google/callback",
        params={"code": "ok", "state": state},
        follow_redirects=False,
    )
    ticket = _qs(first.headers["location"], "code")
    await client.post(
        "/auth/google/complete-profile",
        json={"code": ticket, "phone": "+996700111222", "role": "worker"},
    )

    _, state = await _start(client)
    second = await client.get(
        "/auth/google/callback",
        params={"code": "ok", "state": state},
        follow_redirects=False,
    )
    location = second.headers["location"]
    assert location.startswith(f"{ORIGIN}/auth/google/complete")
    login_ticket = _qs(location, "code")
    tokens = await client.post("/auth/google/exchange", json={"code": login_ticket})
    assert tokens.status_code == 200
    me = await client.get(
        "/users/me",
        headers={"Authorization": f"Bearer {tokens.json()['access_token']}"},
    )
    assert me.status_code == 200
    assert me.json()["email"] == "google.user@gmail.com"


@pytest.mark.asyncio
async def test_existing_atlas_email_is_linked(client, mock_google):
    unique = uuid.uuid4().hex[:8]
    email = "google.user@gmail.com"
    payload = {
        "email": email,
        "password": TEST_PASSWORD,
        "first_name": "Old",
        "last_name": "Account",
        "phone": "+996700000000",
        "role": "customer",
        "username": f"user_{unique}",
    }
    created = await client.post("/auth/register", json=payload)
    assert created.status_code == 201
    await verify_registered_email(client, email)
    user_id = created.json()["id"]

    mock_google["identity"] = _identity(email=email, sub="google-sub-link")
    _, state = await _start(client)
    callback = await client.get(
        "/auth/google/callback",
        params={"code": "ok", "state": state},
        follow_redirects=False,
    )
    ticket = _qs(callback.headers["location"], "code")
    tokens = await client.post("/auth/google/exchange", json={"code": ticket})
    assert tokens.status_code == 200
    me = await client.get(
        "/users/me",
        headers={"Authorization": f"Bearer {tokens.json()['access_token']}"},
    )
    assert me.status_code == 200
    assert me.json()["id"] == user_id
    assert me.json()["email"] == email

    password_login = await client.post(
        "/auth/login",
        json={"email": email, "password": TEST_PASSWORD},
    )
    assert password_login.status_code == 200


@pytest.mark.asyncio
async def test_duplicate_google_identity_does_not_create_second_user(
    client,
    mock_google,
    db,
):
    from sqlalchemy import func, select

    from app.models.user import User

    _, state = await _start(client)
    first = await client.get(
        "/auth/google/callback",
        params={"code": "ok", "state": state},
        follow_redirects=False,
    )
    ticket = _qs(first.headers["location"], "code")
    await client.post(
        "/auth/google/complete-profile",
        json={"code": ticket, "phone": "+996700111222", "role": "worker"},
    )

    _, state = await _start(client)
    await client.get(
        "/auth/google/callback",
        params={"code": "ok", "state": state},
        follow_redirects=False,
    )
    count = await db.scalar(
        select(func.count())
        .select_from(User)
        .where(User.email == "google.user@gmail.com")
    )
    assert count == 1


@pytest.mark.asyncio
async def test_oauth_only_user_cannot_use_password(client, mock_google):
    _, state = await _start(client)
    callback = await client.get(
        "/auth/google/callback",
        params={"code": "ok", "state": state},
        follow_redirects=False,
    )
    ticket = _qs(callback.headers["location"], "code")
    await client.post(
        "/auth/google/complete-profile",
        json={"code": ticket, "phone": "+996700111222", "role": "worker"},
    )
    response = await client.post(
        "/auth/login",
        json={"email": "google.user@gmail.com", "password": TEST_PASSWORD},
    )
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_second_google_account_same_email_is_rejected(client, mock_google):
    _, state = await _start(client)
    first = await client.get(
        "/auth/google/callback",
        params={"code": "ok", "state": state},
        follow_redirects=False,
    )
    ticket = _qs(first.headers["location"], "code")
    await client.post(
        "/auth/google/complete-profile",
        json={"code": ticket, "phone": "+996700111222", "role": "worker"},
    )

    mock_google["identity"] = _identity(sub="google-sub-other")
    _, state = await _start(client)
    second = await client.get(
        "/auth/google/callback",
        params={"code": "ok", "state": state},
        follow_redirects=False,
    )
    assert _qs(second.headers["location"], "error") == "google_email_exists"


@pytest.mark.asyncio
async def test_google_callback_does_not_return_tokens_or_secret(client, mock_google):
    _, state = await _start(client)
    response = await client.get(
        "/auth/google/callback",
        params={"code": "ok", "state": state},
        follow_redirects=False,
    )
    body = response.text
    location = response.headers["location"]
    assert "ya29" not in body
    assert "test-google-secret" not in body
    assert "access_token" not in location
