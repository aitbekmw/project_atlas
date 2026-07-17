from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import IncorrectPassword, SamePassword, UserNotFound
from app.db.session import get_db
from app.dependencies.auth import get_current_user
from app.dependencies.services import get_user_service
from app.models.user import User
from app.repositories.application import ApplicationRepository
from app.repositories.job import JobRepository
from app.schemas.application import ApplicationResponse
from app.schemas.job import JobResponse
from app.schemas.password import ChangePasswordRequest
from app.schemas.user import UserResponse, UserUpdate
from app.services.user import UserService

router = APIRouter(
    prefix="/users",
    tags=["Users"],
)


@router.get(
    "/me",
    response_model=UserResponse,
)
async def get_me(
    current_user: User = Depends(get_current_user),
):
    return current_user


@router.patch(
    "/me",
    response_model=UserResponse,
)
async def update_me(
    data: UserUpdate,
    service: UserService = Depends(get_user_service),
    current_user: User = Depends(get_current_user),
):
    return await service.update(
        current_user,
        data,
    )


@router.patch(
    "/change-password",
    status_code=status.HTTP_200_OK,
)
async def change_password(
    data: ChangePasswordRequest,
    service: UserService = Depends(get_user_service),
    current_user: User = Depends(get_current_user),
):
    try:
        await service.change_password(
            current_user,
            data.current_password,
            data.new_password,
        )

        return {"message": "Password changed successfully"}

    except IncorrectPassword:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect",
        )

    except SamePassword:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New password must be different",
        )


@router.get(
    "/{user_id}",
    response_model=UserResponse,
)
async def get_user(
    user_id: int,
    service: UserService = Depends(get_user_service),
):
    try:
        return await service.get_by_id(user_id)

    except UserNotFound:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )


@router.get(
    "/me/jobs",
    response_model=list[JobResponse],
)
async def get_my_jobs(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    repo = JobRepository(db)

    return await repo.get_by_owner(
        current_user.id,
    )


@router.get(
    "/me/applications",
    response_model=list[ApplicationResponse],
)
async def get_my_applications(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    repo = ApplicationRepository(db)

    return await repo.get_by_worker(
        current_user.id,
    )
