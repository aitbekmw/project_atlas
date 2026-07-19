from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.core.exceptions import JobNotFound
from app.dependencies.auth import get_current_user
from app.dependencies.permissions import require_roles
from app.dependencies.services import get_job_service
from app.models.enum import UserRole
from app.models.user import User
from app.schemas.job import JobCreate, JobResponse, JobUpdate
from app.services.job import JobService, PermissionDenied

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
    return await service.create(
        data,
        current_user.id,
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
    service: JobService = Depends(get_job_service),
):
    if search or city or category_id or min_salary:
        return await service.search(
            search=search,
            city=city,
            category_id=category_id,
            min_salary=min_salary,
        )

    return await service.get_all(
        page=page,
        size=size,
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
            current_user.id,
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
            current_user.id,
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
            current_user.id,
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
