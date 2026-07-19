from redis.asyncio import Redis

from app.core.config import settings

redis = Redis.from_url(
    settings.REDIS_URL,
    decode_responses=True,
)


async def connect_redis():
    if settings.TESTING:
        return

    await redis.ping()


async def disconnect_redis():
    if settings.TESTING:
        return

    await redis.aclose()
