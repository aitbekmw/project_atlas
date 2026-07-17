from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.conversation import Conversation


class ConversationRepository:

    def __init__(
        self,
        db: AsyncSession,
    ):
        self.db = db

    async def create(
        self,
        conversation: Conversation,
    ):
        self.db.add(conversation)

        await self.db.commit()
        await self.db.refresh(conversation)

        return conversation

    async def get_by_id(
        self,
        conversation_id: int,
    ):
        result = await self.db.execute(
            select(Conversation).where(Conversation.id == conversation_id)
        )

        return result.scalar_one_or_none()

    async def get_by_job(
        self,
        job_id: int,
    ):
        result = await self.db.execute(
            select(Conversation).where(Conversation.job_id == job_id)
        )

        return result.scalar_one_or_none()

    async def get_by_user(
        self,
        user_id: int,
    ):
        result = await self.db.execute(
            select(Conversation).where(
                (Conversation.customer_id == user_id)
                | (Conversation.worker_id == user_id)
            )
        )

        return result.scalars().all()

    async def update(self):
        await self.db.commit()

    async def delete(
        self,
        conversation: Conversation,
    ):
        await self.db.delete(conversation)
        await self.db.commit()
