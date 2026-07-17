from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.repositories.application import ApplicationRepository
from app.repositories.category import CategoryRepository
from app.repositories.conversation import ConversationRepository
from app.repositories.job import JobRepository
from app.repositories.message import MessageRepository
from app.repositories.review import ReviewRepository
from app.repositories.user import UserRepository
from app.services.application import ApplicationService
from app.services.auth import AuthService
from app.services.category import CategoryService
from app.services.conversation import ConversationService
from app.services.job import JobService
from app.services.message import MessageService
from app.services.review import ReviewService
from app.services.user import UserService


def get_auth_service(
    db: AsyncSession = Depends(get_db),
):
    return AuthService(db)


def get_user_service(
    db: AsyncSession = Depends(get_db),
):
    return UserService(
        UserRepository(db),
    )


def get_job_service(
    db: AsyncSession = Depends(get_db),
):
    return JobService(
        JobRepository(db),
    )


def get_category_service(
    db: AsyncSession = Depends(get_db),
):
    return CategoryService(
        CategoryRepository(db),
    )


def get_application_service(
    db: AsyncSession = Depends(get_db),
):
    return ApplicationService(
        ApplicationRepository(db),
        JobRepository(db),
    )


def get_review_service(
    db: AsyncSession = Depends(get_db),
):
    return ReviewService(
        ReviewRepository(db),
        JobRepository(db),
    )


def get_conversation_service(
    db: AsyncSession = Depends(get_db),
):
    return ConversationService(
        ConversationRepository(db),
        JobRepository(db),
    )


def get_message_service(
    db: AsyncSession = Depends(get_db),
):
    return MessageService(
        MessageRepository(db),
        ConversationRepository(db),
    )
