from datetime import datetime, timezone

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.message import Message


class MessageRepository:
    def __init__(
        self,
        db: AsyncSession,
    ):
        self.db = db

    async def create(
        self,
        message: Message,
    ):
        self.db.add(message)

        await self.db.commit()
        await self.db.refresh(message)

        return message

    async def get_by_id(
        self,
        message_id: int,
    ):
        result = await self.db.execute(select(Message).where(Message.id == message_id))

        return result.scalar_one_or_none()

    async def get_by_conversation(
        self,
        conversation_id: int,
    ):
        result = await self.db.execute(
            select(Message)
            .where(Message.conversation_id == conversation_id)
            .order_by(Message.created_at.asc())
        )

        return result.scalars().all()

    async def mark_delivered(
        self,
        message: Message,
    ):
        message.is_delivered = True

        await self.db.commit()
        await self.db.refresh(message)

        return message

    async def mark_read(
        self,
        message: Message,
    ):
        message.is_read = True
        message.read_at = datetime.now(timezone.utc)

        await self.db.commit()
        await self.db.refresh(message)

        return message

    async def mark_all_read(
        self,
        conversation_id: int,
        user_id: int,
    ):
        await self.db.execute(
            update(Message)
            .where(
                Message.conversation_id == conversation_id,
                Message.sender_id != user_id,
                Message.is_read.is_(False),
            )
            .values(
                is_read=True,
                read_at=datetime.now(timezone.utc),
            )
        )

        await self.db.commit()

    async def update(
        self,
    ):
        await self.db.commit()

    async def delete(
        self,
        message: Message,
    ):
        await self.db.delete(message)

        await self.db.commit()
