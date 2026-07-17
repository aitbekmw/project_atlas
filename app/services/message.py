from app.models.message import Message
from app.repositories.conversation import ConversationRepository
from app.repositories.message import MessageRepository


class MessageNotFound(Exception):
    pass


class ConversationNotFound(Exception):
    pass


class MessageService:

    def __init__(
        self,
        repo: MessageRepository,
        conversation_repo: ConversationRepository,
    ):
        self.repo = repo
        self.conversation_repo = conversation_repo

    async def send(
        self,
        conversation_id: int,
        sender_id: int,
        text: str,
    ):
        conversation = await self.conversation_repo.get_by_id(conversation_id)

        if not conversation:
            raise ConversationNotFound()

        message = Message(
            conversation_id=conversation_id,
            sender_id=sender_id,
            text=text,
        )

        return await self.repo.create(message)

    async def get_history(
        self,
        conversation_id: int,
    ):
        conversation = await self.conversation_repo.get_by_id(conversation_id)

        if not conversation:
            raise ConversationNotFound()

        return await self.repo.get_by_conversation(conversation_id)

    async def get_by_id(
        self,
        message_id: int,
    ):
        message = await self.repo.get_by_id(message_id)

        if not message:
            raise MessageNotFound()

        return message

    async def mark_delivered(
        self,
        message_id: int,
    ):
        message = await self.get_by_id(message_id)

        return await self.repo.mark_delivered(message)

    async def mark_as_read(
        self,
        message_id: int,
    ):
        message = await self.get_by_id(message_id)

        return await self.repo.mark_read(message)

    async def mark_all_read(
        self,
        conversation_id: int,
        user_id: int,
    ):
        conversation = await self.conversation_repo.get_by_id(conversation_id)

        if not conversation:
            raise ConversationNotFound()

        await self.repo.mark_all_read(
            conversation_id,
            user_id,
        )

    async def delete(
        self,
        message_id: int,
    ):
        message = await self.get_by_id(message_id)

        await self.repo.delete(message)
