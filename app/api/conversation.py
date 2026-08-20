from fastapi import APIRouter, Depends, HTTPException, status

from app.core.exceptions import (
    ConversationAlreadyExists,
    ConversationNotFound,
    JobNotFound,
    PermissionDenied,
    UserNotFound,
)
from app.dependencies.auth import get_current_user
from app.dependencies.services import get_conversation_service
from app.models.user import User
from app.schemas.conversation import ConversationResponse
from app.services.conversation import ConversationService

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
    service: ConversationService = Depends(get_conversation_service),
    current_user: User = Depends(get_current_user),
):
    try:
        return await service.create(
            job_id=job_id,
            customer_id=current_user.id,
            worker_id=worker_id,
        )

    except JobNotFound:
        raise HTTPException(
            status_code=404,
            detail="Job not found",
        )

    except UserNotFound:
        raise HTTPException(
            status_code=404,
            detail="User not found",
        )

    except ConversationAlreadyExists:
        raise HTTPException(
            status_code=400,
            detail="Conversation already exists",
        )

    except PermissionDenied:
        raise HTTPException(
            status_code=403,
            detail="You are not the owner of this job",
        )


@router.get(
    "",
    response_model=list[ConversationResponse],
)
async def get_my_conversations(
    service: ConversationService = Depends(get_conversation_service),
    current_user: User = Depends(get_current_user),
):
    return await service.get_my_conversations(
        current_user.id,
    )


@router.get(
    "/{conversation_id}",
    response_model=ConversationResponse,
)
async def get_conversation(
    conversation_id: int,
    service: ConversationService = Depends(get_conversation_service),
    current_user: User = Depends(get_current_user),
):
    try:
        return await service.check_access(
            conversation_id,
            current_user.id,
            current_user,
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


@router.delete(
    "/{conversation_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def delete_conversation(
    conversation_id: int,
    service: ConversationService = Depends(get_conversation_service),
    current_user: User = Depends(get_current_user),
):
    try:
        await service.delete(
            conversation_id,
            current_user,
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
