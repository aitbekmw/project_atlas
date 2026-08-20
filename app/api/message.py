from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.core.exceptions import ConversationNotFound, MessageNotFound, PermissionDenied
from app.dependencies.auth import get_current_user
from app.dependencies.services import get_message_service
from app.models.user import User
from app.schemas.message import MessageCreate, MessageResponse
from app.services.message import MessageService

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
    service: MessageService = Depends(get_message_service),
    current_user: User = Depends(get_current_user),
):
    try:
        return await service.send(
            conversation_id,
            current_user.id,
            data.text,
        )

    except ConversationNotFound:
        raise HTTPException(
            status_code=404,
            detail="Conversation not found",
        )

    except PermissionDenied:
        raise HTTPException(
            status_code=403,
            detail="Access denied",
        )


@router.get(
    "/{conversation_id}",
    response_model=list[MessageResponse],
)
async def get_history(
    conversation_id: int,
    page: int = Query(1, ge=1),
    size: int = Query(100, ge=1, le=100),
    service: MessageService = Depends(get_message_service),
    current_user: User = Depends(get_current_user),
):
    try:
        messages = await service.get_history(
            conversation_id,
            current_user.id,
            page=page,
            size=size,
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

    except PermissionDenied:
        raise HTTPException(
            status_code=403,
            detail="Access denied",
        )


@router.patch(
    "/{message_id}/delivered",
    response_model=MessageResponse,
)
async def mark_delivered(
    message_id: int,
    service: MessageService = Depends(get_message_service),
    current_user: User = Depends(get_current_user),
):
    try:
        return await service.mark_delivered(
            message_id,
            current_user.id,
        )

    except MessageNotFound:
        raise HTTPException(
            status_code=404,
            detail="Message not found",
        )

    except PermissionDenied:
        raise HTTPException(
            status_code=403,
            detail="Access denied",
        )


@router.patch(
    "/{message_id}/read",
    response_model=MessageResponse,
)
async def mark_as_read(
    message_id: int,
    service: MessageService = Depends(get_message_service),
    current_user: User = Depends(get_current_user),
):
    try:
        return await service.mark_as_read(
            message_id,
            current_user.id,
        )

    except MessageNotFound:
        raise HTTPException(
            status_code=404,
            detail="Message not found",
        )

    except PermissionDenied:
        raise HTTPException(
            status_code=403,
            detail="Access denied",
        )


@router.delete(
    "/{message_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def delete_message(
    message_id: int,
    service: MessageService = Depends(get_message_service),
    current_user: User = Depends(get_current_user),
):
    try:
        await service.delete(
            message_id,
            current_user.id,
        )

    except MessageNotFound:
        raise HTTPException(
            status_code=404,
            detail="Message not found",
        )

    except PermissionDenied:
        raise HTTPException(
            status_code=403,
            detail="You can delete only your own messages",
        )
