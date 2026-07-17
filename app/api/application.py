from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import (ApplicationAlreadyExists, ApplicationNotFound,
                                 PermissionDenied)
from app.db.session import get_db
from app.dependencies.auth import get_current_user
from app.models.user import User
from app.repositories.application import ApplicationRepository
from app.repositories.job import JobRepository
from app.schemas.application import (ApplicationCreate, ApplicationResponse,
                                     ApplicationUpdate)
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
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    service = ApplicationService(
        ApplicationRepository(db),
        JobRepository(db),
    )
    try:
        return await service.create(
            data,
            current_user.id,
        )

    except ApplicationAlreadyExists:
        raise HTTPException(
            status_code=400,
            detail="You have already applied",
        )


@router.get(
    "",
    response_model=list[ApplicationResponse],
)
async def get_applications(
    db: AsyncSession = Depends(get_db),
):
    service = ApplicationService(
        ApplicationRepository(db),
        JobRepository(db),
    )

    return await service.get_all()


@router.get(
    "/{application_id}",
    response_model=ApplicationResponse,
)
async def get_application(
    application_id: int,
    db: AsyncSession = Depends(get_db),
):
    service = ApplicationService(
        ApplicationRepository(db),
        JobRepository(db),
    )

    try:
        return await service.get_by_id(application_id)

    except ApplicationNotFound:
        raise HTTPException(
            status_code=404,
            detail="Application not found",
        )


@router.put(
    "/{application_id}",
    response_model=ApplicationResponse,
)
async def update_application(
    application_id: int,
    data: ApplicationUpdate,
    db: AsyncSession = Depends(get_db),
):
    service = ApplicationService(
        ApplicationRepository(db),
        JobRepository(db),
    )

    try:
        return await service.update(
            application_id,
            data,
        )

    except ApplicationNotFound:
        raise HTTPException(
            status_code=404,
            detail="Application not found",
        )


@router.delete(
    "/{application_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def delete_application(
    application_id: int,
    db: AsyncSession = Depends(get_db),
):
    service = ApplicationService(
        ApplicationRepository(db),
        JobRepository(db),
    )

    try:
        await service.delete(application_id)

    except ApplicationNotFound:
        raise HTTPException(
            status_code=404,
            detail="Application not found",
        )


@router.post(
    "/{application_id}/accept",
    response_model=ApplicationResponse,
)
async def accept_application(
    application_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    service = ApplicationService(
        ApplicationRepository(db),
        JobRepository(db),
    )

    try:
        return await service.accept(
            application_id,
            current_user.id,
        )

    except ApplicationNotFound:
        raise HTTPException(
            status_code=404,
            detail="Application not found",
        )

    except PermissionDenied:
        raise HTTPException(
            status_code=403,
            detail="You are not the owner of this job",
        )


@router.post(
    "/{application_id}/reject",
    response_model=ApplicationResponse,
)
async def reject_application(
    application_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    service = ApplicationService(
        ApplicationRepository(db),
        JobRepository(db),
    )

    try:
        return await service.reject(
            application_id,
            current_user.id,
        )

    except ApplicationNotFound:
        raise HTTPException(
            status_code=404,
            detail="Application not found",
        )

    except PermissionDenied:
        raise HTTPException(
            status_code=403,
            detail="You are not the owner of this job",
        )
