from fastapi import APIRouter, Depends, HTTPException, status

from app.core.exceptions import (
    JobNotCompleted,
    JobNotFound,
    PermissionDenied,
    ReviewAlreadyExists,
    ReviewNotFound,
    SelfReviewNotAllowed,
)
from app.dependencies.auth import get_current_user
from app.dependencies.services import get_review_service
from app.models.user import User
from app.schemas.review import ReviewCreate, ReviewResponse
from app.services.review import ReviewService

router = APIRouter(
    prefix="/reviews",
    tags=["Reviews"],
)


@router.post(
    "",
    response_model=ReviewResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_review(
    data: ReviewCreate,
    service: ReviewService = Depends(get_review_service),
    current_user: User = Depends(get_current_user),
):
    try:
        return await service.create(
            data,
            current_user.id,
        )
    except JobNotFound:
        raise HTTPException(status_code=404, detail="Job not found")
    except JobNotCompleted:
        raise HTTPException(status_code=400, detail="Job is not completed")
    except SelfReviewNotAllowed:
        raise HTTPException(status_code=400, detail="You cannot review yourself")
    except ReviewAlreadyExists:
        raise HTTPException(status_code=400, detail="Review already exists")
    except PermissionDenied:
        raise HTTPException(
            status_code=403,
            detail="You can review only after the job is completed by its participants",
        )


@router.get(
    "",
    response_model=list[ReviewResponse],
)
async def get_reviews(
    service: ReviewService = Depends(get_review_service),
):
    return await service.get_all()


@router.get(
    "/user/{user_id}",
    response_model=list[ReviewResponse],
)
async def get_user_reviews(
    user_id: int,
    service: ReviewService = Depends(get_review_service),
):
    return await service.get_by_user(user_id)


@router.get(
    "/{review_id}",
    response_model=ReviewResponse,
)
async def get_review(
    review_id: int,
    service: ReviewService = Depends(get_review_service),
):
    try:
        return await service.get_by_id(review_id)

    except ReviewNotFound:
        raise HTTPException(
            status_code=404,
            detail="Review not found",
        )


@router.delete(
    "/{review_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def delete_review(
    review_id: int,
    service: ReviewService = Depends(get_review_service),
    current_user: User = Depends(get_current_user),
):
    try:
        await service.delete(review_id, current_user)

    except ReviewNotFound:
        raise HTTPException(
            status_code=404,
            detail="Review not found",
        )

    except PermissionDenied:
        raise HTTPException(
            status_code=403,
            detail="You can delete only your own reviews",
        )
