from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.dependencies.auth import get_current_user
from app.models.user import User
from app.repositories.conversation import ConversationRepository
from app.repositories.job import JobRepository
from app.schemas.conversation import ConversationResponse
from app.services.conversation import (
    ConversationAlreadyExists,
    ConversationNotFound,
    ConversationService,
)

router = APIRouter(
    prefix="/conversations",
    tags=["Conversations"],
)


@router.post(
    "/{job_id}/{worker_id}",
    response_model=ConversationResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_conversation(
    job_id: int,
    worker_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    service = ConversationService(
        ConversationRepository(db),
        JobRepository(db),
    )

    try:
        return await service.create(
            job_id=job_id,
            customer_id=current_user.id,
            worker_id=worker_id,
        )

    except ConversationAlreadyExists:
        raise HTTPException(
            status_code=400,
            detail="Conversation already exists",
        )


@router.get(
    "",
    response_model=list[ConversationResponse],
)
async def get_my_conversations(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    service = ConversationService(
        ConversationRepository(db),
        JobRepository(db),
    )

    return await service.get_my_conversations(
        current_user.id,
    )


@router.delete(
    "/{conversation_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def delete_conversation(
    conversation_id: int,
    db: AsyncSession = Depends(get_db),
):
    service = ConversationService(
        ConversationRepository(db),
        JobRepository(db),
    )

    try:
        await service.delete(
            conversation_id,
        )

    except ConversationNotFound:
        raise HTTPException(
            status_code=404,
            detail="Conversation not found",
        )
