from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile, status

from app.core.config import settings
from app.core.exceptions import (
    CategoryNotFound,
    JobNotFound,
    PermissionDenied,
)
from app.dependencies.auth import get_current_user
from app.dependencies.permissions import require_roles
from app.dependencies.services import get_application_service, get_job_service
from app.models.enum import JobStatus, PaymentMethod, UserRole
from app.models.user import User
from app.schemas.application import ApplicationResponse
from app.schemas.job import JobCreate, JobNearbyResponse, JobResponse, JobUpdate
from app.services.application import ApplicationService
from app.services.job import JobService

router = APIRouter(
    prefix="/jobs",
    tags=["Jobs"],
)

ALLOWED_IMAGE_TYPES = {
    "image/jpeg",
    "image/png",
    "image/webp",
}


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
    payment_method: PaymentMethod | None = Query(None),
    status: JobStatus | None = Query(None),
    service: JobService = Depends(get_job_service),
):
    job_status = status.value if status else None
    job_payment = payment_method.value if payment_method else None

    if search or city or category_id or min_salary or payment_method or status:
        return await service.search(
            search=search,
            city=city,
            category_id=category_id,
            min_salary=min_salary,
            payment_method=job_payment,
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
    "/nearby",
    response_model=list[JobNearbyResponse],
)
async def get_nearby_jobs(
    lat: float = Query(..., ge=-90, le=90),
    lng: float = Query(..., ge=-180, le=180),
    radius_km: float = Query(10, gt=0, le=50),
    size: int = Query(30, ge=1, le=100),
    service: JobService = Depends(get_job_service),
):
    return await service.get_nearby(
        lat=lat,
        lng=lng,
        radius_km=radius_km,
        size=size,
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


@router.post(
    "/{job_id}/image",
    response_model=JobResponse,
)
async def upload_job_image(
    job_id: int,
    file: UploadFile = File(...),
    service: JobService = Depends(get_job_service),
    current_user: User = Depends(get_current_user),
):
    if file.content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unsupported file type",
        )
    content = await file.read()
    if len(content) > settings.MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File too large",
        )
    await file.seek(0)
    try:
        return await service.upload_image(job_id, current_user, file)
    except JobNotFound:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Job not found"
        )
    except PermissionDenied:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not the owner of this job",
        )


@router.delete(
    "/{job_id}/image",
    response_model=JobResponse,
)
async def delete_job_image(
    job_id: int,
    service: JobService = Depends(get_job_service),
    current_user: User = Depends(get_current_user),
):
    try:
        return await service.delete_image(job_id, current_user)
    except JobNotFound:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Job not found"
        )
    except PermissionDenied:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not the owner of this job",
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
            detail="Permission denied",
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
