from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.core.exceptions import (
    CategoryNotFound,
    JobNotFound,
    PermissionDenied,
)
from app.dependencies.auth import get_current_user
from app.dependencies.permissions import require_roles
from app.dependencies.services import get_application_service, get_job_service
from app.models.enum import JobStatus, UserRole
from app.models.user import User
from app.schemas.application import ApplicationResponse
from app.schemas.job import JobCreate, JobResponse, JobUpdate
from app.services.application import ApplicationService
from app.services.job import JobService

router = APIRouter(
    prefix="/jobs",
    tags=["Jobs"],
)


@router.post(
    "",
    response_model=JobResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_job(
    data: JobCreate,
    service: JobService = Depends(get_job_service),
    current_user: User = Depends(
        require_roles(
            UserRole.CUSTOMER,
            UserRole.ADMIN,
        )
    ),
):
    try:
        return await service.create(
            data,
            current_user.id,
        )

    except CategoryNotFound:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Category not found",
        )


@router.get(
    "",
    response_model=list[JobResponse],
)
async def get_jobs(
    page: int = Query(1, ge=1),
    size: int = Query(10, ge=1, le=100),
    search: str | None = Query(None),
    city: str | None = Query(None),
    category_id: int | None = Query(None),
    min_salary: int | None = Query(None),
    status: JobStatus | None = Query(None),
    service: JobService = Depends(get_job_service),
):
    job_status = status.value if status else None

    if search or city or category_id or min_salary or status:
        return await service.search(
            search=search,
            city=city,
            category_id=category_id,
            min_salary=min_salary,
            status=job_status,
            page=page,
            size=size,
        )

    return await service.get_all(
        page=page,
        size=size,
        status=job_status,
    )


@router.get(
    "/{job_id}/applications",
    response_model=list[ApplicationResponse],
)
async def get_job_applications(
    job_id: int,
    service: ApplicationService = Depends(get_application_service),
    current_user: User = Depends(get_current_user),
):
    return await service.get_by_job(
        job_id,
        current_user,
    )


@router.get(
    "/{job_id}",
    response_model=JobResponse,
)
async def get_job(
    job_id: int,
    service: JobService = Depends(get_job_service),
):
    try:
        return await service.get_by_id(job_id)

    except JobNotFound:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job not found",
        )


@router.put(
    "/{job_id}",
    response_model=JobResponse,
)
async def update_job(
    job_id: int,
    data: JobUpdate,
    service: JobService = Depends(get_job_service),
    current_user: User = Depends(get_current_user),
):
    try:
        return await service.update(
            job_id,
            current_user,
            data,
        )

    except JobNotFound:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job not found",
        )

    except PermissionDenied:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not the owner of this job",
        )


@router.delete(
    "/{job_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def delete_job(
    job_id: int,
    service: JobService = Depends(get_job_service),
    current_user: User = Depends(get_current_user),
):
    try:
        await service.delete(
            job_id,
            current_user,
        )

    except JobNotFound:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job not found",
        )

    except PermissionDenied:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not the owner of this job",
        )


@router.post(
    "/{job_id}/complete",
    response_model=JobResponse,
)
async def complete_job(
    job_id: int,
    service: JobService = Depends(get_job_service),
    current_user: User = Depends(get_current_user),
):
    try:
        return await service.complete(
            job_id,
            current_user,
        )

    except JobNotFound:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job not found",
        )

    except PermissionDenied:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not the owner of this job",
        )


@router.post(
    "/{job_id}/cancel",
    response_model=JobResponse,
)
async def cancel_job(
    job_id: int,
    service: JobService = Depends(get_job_service),
    current_user: User = Depends(get_current_user),
):
    try:
        return await service.cancel(
            job_id,
            current_user,
        )

    except JobNotFound:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job not found",
        )

    except PermissionDenied:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not the owner of this job",
        )
