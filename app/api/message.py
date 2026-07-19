from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.dependencies.auth import get_current_user
from app.models.user import User
from app.repositories.conversation import ConversationRepository
from app.repositories.message import MessageRepository
from app.schemas.message import MessageCreate, MessageResponse
from app.services.message import ConversationNotFound, MessageNotFound, MessageService

router = APIRouter(
    prefix="/messages",
    tags=["Messages"],
)


@router.post(
    "/{conversation_id}",
    response_model=MessageResponse,
    status_code=status.HTTP_201_CREATED,
)
async def send_message(
    conversation_id: int,
    data: MessageCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    service = MessageService(
        MessageRepository(db),
        ConversationRepository(db),
    )

    return await service.send(
        conversation_id,
        current_user.id,
        data.text,
    )


@router.get(
    "/{conversation_id}",
    response_model=list[MessageResponse],
)
async def get_history(
    conversation_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    service = MessageService(
        MessageRepository(db),
        ConversationRepository(db),
    )

    try:
        messages = await service.get_history(
            conversation_id,
        )

        await service.mark_all_read(
            conversation_id,
            current_user.id,
        )

        return messages

    except ConversationNotFound:
        raise HTTPException(
            status_code=404,
            detail="Conversation not found",
        )


@router.patch(
    "/{message_id}/delivered",
    response_model=MessageResponse,
)
async def mark_delivered(
    message_id: int,
    db: AsyncSession = Depends(get_db),
):
    service = MessageService(
        MessageRepository(db),
        ConversationRepository(db),
    )

    try:
        return await service.mark_delivered(
            message_id,
        )

    except MessageNotFound:
        raise HTTPException(
            status_code=404,
            detail="Message not found",
        )


@router.patch(
    "/{message_id}/read",
    response_model=MessageResponse,
)
async def mark_as_read(
    message_id: int,
    db: AsyncSession = Depends(get_db),
):
    service = MessageService(
        MessageRepository(db),
        ConversationRepository(db),
    )

    try:
        return await service.mark_as_read(
            message_id,
        )

    except MessageNotFound:
        raise HTTPException(
            status_code=404,
            detail="Message not found",
        )
