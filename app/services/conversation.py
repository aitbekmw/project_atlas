from app.core.exceptions import (
    ConversationAlreadyExists,
    ConversationNotFound,
    JobNotFound,
    PermissionDenied,
    UserNotFound,
)
from app.models.conversation import Conversation
from app.models.enum import UserRole
from app.models.user import User
from app.repositories.conversation import ConversationRepository
from app.repositories.job import JobRepository
from app.repositories.user import UserRepository


class ConversationService:
    def __init__(
        self,
        repo: ConversationRepository,
        job_repo: JobRepository,
        user_repo: UserRepository,
    ):
        self.repo = repo
        self.job_repo = job_repo
        self.user_repo = user_repo

    async def create(
        self,
        job_id: int,
        customer_id: int,
        worker_id: int,
    ):
        if customer_id == worker_id:
            raise PermissionDenied()

        job = await self.job_repo.get_by_id(job_id)

        if not job:
            raise JobNotFound()

        if job.owner_id != customer_id:
            raise PermissionDenied()

        worker = await self.user_repo.get_by_id(worker_id)

        if not worker:
            raise UserNotFound()

        conversation = await self.repo.get_by_job(job_id)

        if conversation:
            if conversation.worker_id != worker_id:
                raise ConversationAlreadyExists()

            return conversation

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
        user: User | None = None,
    ):
        conversation = await self.get_by_id(conversation_id)

        is_admin = user is not None and user.role == UserRole.ADMIN.value

        if (
            conversation.customer_id != user_id
            and conversation.worker_id != user_id
            and not is_admin
        ):
            raise PermissionDenied()

        return conversation

    async def delete(
        self,
        conversation_id: int,
        user: User,
    ):
        conversation = await self.check_access(
            conversation_id,
            user.id,
            user,
        )

        await self.repo.delete(conversation)
