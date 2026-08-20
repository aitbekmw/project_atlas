from app.core.exceptions import ConversationNotFound, MessageNotFound, PermissionDenied
from app.models.message import Message
from app.repositories.conversation import ConversationRepository
from app.repositories.message import MessageRepository


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

        if (
            conversation.customer_id != sender_id
            and conversation.worker_id != sender_id
        ):
            raise PermissionDenied()

        message = Message(
            conversation_id=conversation_id,
            sender_id=sender_id,
            text=text.strip(),
        )

        return await self.repo.create(message)

    async def get_history(
        self,
        conversation_id: int,
        user_id: int,
        page: int = 1,
        size: int = 100,
    ):
        conversation = await self.conversation_repo.get_by_id(conversation_id)

        if not conversation:
            raise ConversationNotFound()

        if conversation.customer_id != user_id and conversation.worker_id != user_id:
            raise PermissionDenied()

        return await self.repo.get_by_conversation(
            conversation_id,
            page=page,
            size=size,
        )

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
        user_id: int,
    ):
        message = await self.get_by_id(message_id)
        await self._ensure_participant(message.conversation_id, user_id)

        if message.is_delivered:
            return message

        return await self.repo.mark_delivered(message)

    async def mark_as_read(
        self,
        message_id: int,
        user_id: int,
    ):
        message = await self.get_by_id(message_id)
        await self._ensure_participant(message.conversation_id, user_id)

        if message.sender_id == user_id:
            return message

        if message.is_read:
            return message

        return await self.repo.mark_read(message)

    async def mark_all_read(
        self,
        conversation_id: int,
        user_id: int,
    ):
        await self._ensure_participant(conversation_id, user_id)

        await self.repo.mark_all_read(
            conversation_id,
            user_id,
        )

    async def delete(
        self,
        message_id: int,
        user_id: int,
    ):
        message = await self.get_by_id(message_id)

        if message.sender_id != user_id:
            raise PermissionDenied()

        await self.repo.delete(message)

    async def _ensure_participant(
        self,
        conversation_id: int,
        user_id: int,
    ):
        conversation = await self.conversation_repo.get_by_id(conversation_id)

        if not conversation:
            raise ConversationNotFound()

        if conversation.customer_id != user_id and conversation.worker_id != user_id:
            raise PermissionDenied()

        return conversation
