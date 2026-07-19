import asyncio
import json
import logging

from app.core.config import settings
from app.core.redis import redis
from app.websocket.manager import manager

CHANNEL = "atlas_chat"

logger = logging.getLogger(__name__)


async def publish(payload: dict):
    if settings.TESTING:
        return

    await redis.publish(
        CHANNEL,
        json.dumps(payload),
    )


async def subscriber():
    pubsub = redis.pubsub()

    await pubsub.subscribe(CHANNEL)

    try:
        async for message in pubsub.listen():
            if message["type"] != "message":
                continue

            payload = json.loads(message["data"])

            await manager.send_to_room(
                payload["conversation_id"],
                payload,
            )

    except Exception:
        logger.exception("Redis subscriber crashed")

    finally:
        await pubsub.unsubscribe(CHANNEL)
        await pubsub.aclose()


async def start_subscriber():
    if settings.TESTING:
        return

    asyncio.create_task(subscriber())
