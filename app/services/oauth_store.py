import json
import time

from app.core.config import settings
from app.core.redis import redis

MEMORY_STORE: dict[str, tuple[str, float]] = {}


def clear_memory_store() -> None:
    MEMORY_STORE.clear()


async def put_value(key: str, value: dict, ttl_seconds: int) -> None:
    payload = json.dumps(value)
    if settings.TESTING:
        MEMORY_STORE[key] = (payload, time.time() + ttl_seconds)
        return
    await redis.set(key, payload, ex=ttl_seconds)


async def take_value(key: str) -> dict | None:
    stored = await get_value(key)
    if stored is None:
        return None
    await delete_value(key)
    return stored


async def get_value(key: str) -> dict | None:
    if settings.TESTING:
        stored = MEMORY_STORE.get(key)
        if stored is None:
            return None
        payload, expires_at = stored
        if expires_at <= time.time():
            MEMORY_STORE.pop(key, None)
            return None
        return json.loads(payload)

    payload = await redis.get(key)
    if payload is None:
        return None
    return json.loads(payload)


async def delete_value(key: str) -> None:
    if settings.TESTING:
        MEMORY_STORE.pop(key, None)
        return
    await redis.delete(key)
