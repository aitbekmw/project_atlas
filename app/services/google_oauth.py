import httpx

from app.core.config import settings
from app.core.exceptions import GoogleAuthFailed, GoogleNotConfigured

GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"
GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
GOOGLE_USERINFO_URL = "https://openidconnect.googleapis.com/v1/userinfo"
GOOGLE_SCOPES = "openid email profile"


def google_configured() -> bool:
    return bool(
        settings.GOOGLE_CLIENT_ID
        and settings.GOOGLE_CLIENT_SECRET
        and settings.GOOGLE_REDIRECT_URI
    )


def require_google_config() -> None:
    if not google_configured():
        raise GoogleNotConfigured()


def build_google_authorization_url(state: str) -> str:
    require_google_config()
    params = httpx.QueryParams(
        {
            "client_id": settings.GOOGLE_CLIENT_ID,
            "redirect_uri": settings.GOOGLE_REDIRECT_URI,
            "response_type": "code",
            "scope": GOOGLE_SCOPES,
            "state": state,
            "access_type": "online",
            "include_granted_scopes": "true",
            "prompt": "select_account",
        }
    )
    return f"{GOOGLE_AUTH_URL}?{params}"


async def exchange_google_code(code: str) -> dict:
    require_google_config()
    try:
        async with httpx.AsyncClient(timeout=15) as client:
            response = await client.post(
                GOOGLE_TOKEN_URL,
                data={
                    "code": code,
                    "client_id": settings.GOOGLE_CLIENT_ID,
                    "client_secret": settings.GOOGLE_CLIENT_SECRET,
                    "redirect_uri": settings.GOOGLE_REDIRECT_URI,
                    "grant_type": "authorization_code",
                },
            )
            response.raise_for_status()
            payload = response.json()
    except (httpx.HTTPError, ValueError) as orig:
        raise GoogleAuthFailed() from orig

    if not isinstance(payload, dict) or not payload.get("access_token"):
        raise GoogleAuthFailed()
    return payload


async def fetch_google_userinfo(access_token: str) -> dict:
    try:
        async with httpx.AsyncClient(timeout=15) as client:
            response = await client.get(
                GOOGLE_USERINFO_URL,
                headers={"Authorization": f"Bearer {access_token}"},
            )
            response.raise_for_status()
            payload = response.json()
    except (httpx.HTTPError, ValueError) as orig:
        raise GoogleAuthFailed() from orig

    if not isinstance(payload, dict):
        raise GoogleAuthFailed()
    return payload
