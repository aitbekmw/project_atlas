from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import JobNotFound
from app.db.session import get_db
from app.dependencies.auth import get_current_user
from app.models.user import User
from app.repositories.job import JobRepository
from app.schemas.job import (
    JobCreate,
    JobResponse,
    JobUpdate,
)
from app.services.job import (
    JobService,
    PermissionDenied,
)

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
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    service = JobService(JobRepository(db))

    return await service.create(
        data,
        current_user.id,
    )


@router.get(
    "",
    response_model=list[JobResponse],
)
async def get_jobs(
    db: AsyncSession = Depends(get_db),
):
    service = JobService(JobRepository(db))

    return await service.get_all()


@router.get(
    "/{job_id}",
    response_model=JobResponse,
)
async def get_job(
    job_id: int,
    db: AsyncSession = Depends(get_db),
):
    service = JobService(JobRepository(db))

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
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    service = JobService(JobRepository(db))

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
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    service = JobService(JobRepository(db))

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