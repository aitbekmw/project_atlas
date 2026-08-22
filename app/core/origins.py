import re

from app.core.config import settings

_LOCALHOST = re.compile(r"^https?://(localhost|127\.0\.0\.1)(:\d+)?$")
_PRIVATE_LAN = re.compile(
    r"^http://("
    r"10\.\d{1,3}\.\d{1,3}\.\d{1,3}|"
    r"192\.168\.\d{1,3}\.\d{1,3}|"
    r"172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3}"
    r")(:\d+)?$"
)
_CLOUDFLARE_QUICK_TUNNEL = re.compile(r"^https://[\w.-]+\.trycloudflare\.com$")

# Used by CORSMiddleware allow_origin_regex. Does not allow "*".
CORS_ORIGIN_REGEX = (
    r"https?://(localhost|127\.0\.0\.1)(:\d+)?"
    r"|http://(10\.\d{1,3}\.\d{1,3}\.\d{1,3}"
    r"|192\.168\.\d{1,3}\.\d{1,3}"
    r"|172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3})(:\d+)?"
    r"|https://[\w.-]+\.trycloudflare\.com"
)


def normalize_origin(origin: str) -> str:
    return origin.strip().rstrip("/")


def configured_origins() -> set[str]:
    return {normalize_origin(item) for item in settings.CORS_ORIGINS if item}


def is_allowed_frontend_origin(origin: str) -> bool:
    cleaned = normalize_origin(origin)
    if not cleaned:
        return False
    if cleaned in configured_origins():
        return True
    return bool(
        _LOCALHOST.fullmatch(cleaned)
        or _PRIVATE_LAN.fullmatch(cleaned)
        or _CLOUDFLARE_QUICK_TUNNEL.fullmatch(cleaned)
    )
