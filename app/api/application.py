from fastapi import APIRouter, Depends, HTTPException, status

from app.core.exceptions import (
    ApplicationAlreadyExists,
    ApplicationNotFound,
    JobNotFound,
    JobNotOpen,
    PermissionDenied,
)
from app.dependencies.auth import get_current_user
from app.dependencies.services import get_application_service
from app.models.user import User
from app.schemas.application import (
    ApplicationCreate,
    ApplicationResponse,
    ApplicationUpdate,
)
from app.services.application import ApplicationService

router = APIRouter(
    prefix="/applications",
    tags=["Applications"],
)


@router.post(
    "",
    response_model=ApplicationResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_application(
    data: ApplicationCreate,
    service: ApplicationService = Depends(get_application_service),
    current_user: User = Depends(get_current_user),
):
    try:
        return await service.create(
            data,
            current_user.id,
        )

    except JobNotFound:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job not found",
        )

    except ApplicationAlreadyExists:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You have already applied",
        )

    except JobNotOpen:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Job is not open for applications",
        )

    except PermissionDenied:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You cannot apply to your own job",
        )


@router.get(
    "",
    response_model=list[ApplicationResponse],
)
async def get_applications(
    service: ApplicationService = Depends(get_application_service),
    current_user: User = Depends(get_current_user),
):
    return await service.get_all(current_user)


@router.get(
    "/{application_id}",
    response_model=ApplicationResponse,
)
async def get_application(
    application_id: int,
    service: ApplicationService = Depends(get_application_service),
    current_user: User = Depends(get_current_user),
):
    try:
        return await service.get_by_id(application_id, current_user)

    except ApplicationNotFound:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Application not found",
        )

    except PermissionDenied:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Permission denied",
        )


@router.put(
    "/{application_id}",
    response_model=ApplicationResponse,
)
async def update_application(
    application_id: int,
    data: ApplicationUpdate,
    service: ApplicationService = Depends(get_application_service),
    current_user: User = Depends(get_current_user),
):
    try:
        return await service.update(
            application_id,
            data,
            current_user,
        )

    except ApplicationNotFound:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Application not found",
        )

    except PermissionDenied:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not the owner of this job",
        )


@router.delete(
    "/{application_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def delete_application(
    application_id: int,
    service: ApplicationService = Depends(get_application_service),
    current_user: User = Depends(get_current_user),
):
    try:
        await service.delete(application_id, current_user)

    except ApplicationNotFound:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Application not found",
        )

    except PermissionDenied:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Permission denied",
        )


@router.post(
    "/{application_id}/accept",
    response_model=ApplicationResponse,
)
async def accept_application(
    application_id: int,
    service: ApplicationService = Depends(get_application_service),
    current_user: User = Depends(get_current_user),
):
    try:
        return await service.accept(
            application_id,
            current_user,
        )

    except ApplicationNotFound:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Application not found",
        )

    except PermissionDenied:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not the owner of this job",
        )


@router.post(
    "/{application_id}/reject",
    response_model=ApplicationResponse,
)
async def reject_application(
    application_id: int,
    service: ApplicationService = Depends(get_application_service),
    current_user: User = Depends(get_current_user),
):
    try:
        return await service.reject(
            application_id,
            current_user,
        )

    except ApplicationNotFound:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Application not found",
        )

    except PermissionDenied:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not the owner of this job",
        )
