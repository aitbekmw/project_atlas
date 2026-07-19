from app.core.exceptions import JobNotFound, PermissionDenied
from app.models.conversation import Conversation
from app.repositories.conversation import ConversationRepository
from app.repositories.job import JobRepository


class ConversationAlreadyExists(Exception):
    pass


class ConversationNotFound(Exception):
    pass


class ConversationService:
    def __init__(
        self,
        repo: ConversationRepository,
        job_repo: JobRepository,
    ):
        self.repo = repo
        self.job_repo = job_repo

    async def create(
        self,
        job_id: int,
        customer_id: int,
        worker_id: int,
    ):
        job = await self.job_repo.get_by_id(job_id)

        if not job:
            raise JobNotFound()

        conversation = await self.repo.get_by_job(job_id)

        if conversation:
            raise ConversationAlreadyExists()

        conversation = Conversation(
            job_id=job_id,
            customer_id=customer_id,
            worker_id=worker_id,
        )

        return await self.repo.create(conversation)

    async def get_by_id(
        self,
        conversation_id: int,
    ):
        conversation = await self.repo.get_by_id(conversation_id)

        if not conversation:
            raise ConversationNotFound()

        return conversation

    async def get_my_conversations(
        self,
        user_id: int,
    ):
        return await self.repo.get_by_user(user_id)

    async def check_access(
        self,
        conversation_id: int,
        user_id: int,
    ):
        conversation = await self.get_by_id(conversation_id)

        if conversation.customer_id != user_id and conversation.worker_id != user_id:
            raise PermissionDenied()

        return conversation

    async def delete(
        self,
        conversation_id: int,
    ):
        conversation = await self.get_by_id(conversation_id)

        await self.repo.delete(conversation)
