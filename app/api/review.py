from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.dependencies.auth import get_current_user
from app.models.user import User
from app.repositories.job import JobRepository
from app.repositories.review import ReviewRepository
from app.schemas.review import ReviewCreate, ReviewResponse
from app.services.review import ReviewNotFound, ReviewService

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
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    service = ReviewService(
        ReviewRepository(db),
        JobRepository(db),
    )

    try:
        return await service.create(
            data,
            current_user.id,
        )

    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=str(e),
        )


@router.get(
    "",
    response_model=list[ReviewResponse],
)
async def get_reviews(
    db: AsyncSession = Depends(get_db),
):
    service = ReviewService(
        ReviewRepository(db),
        JobRepository(db),
    )

    return await service.get_all()


@router.get(
    "/{review_id}",
    response_model=ReviewResponse,
)
async def get_review(
    review_id: int,
    db: AsyncSession = Depends(get_db),
):
    service = ReviewService(
        ReviewRepository(db),
        JobRepository(db),
    )

    try:
        return await service.get_by_id(review_id)

    except ReviewNotFound:
        raise HTTPException(
            status_code=404,
            detail="Review not found",
        )


@router.get(
    "/user/{user_id}",
    response_model=list[ReviewResponse],
)
async def get_user_reviews(
    user_id: int,
    db: AsyncSession = Depends(get_db),
):
    service = ReviewService(
        ReviewRepository(db),
        JobRepository(db),
    )

    return await service.get_by_user(user_id)


@router.delete(
    "/{review_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def delete_review(
    review_id: int,
    db: AsyncSession = Depends(get_db),
):
    service = ReviewService(
        ReviewRepository(db),
        JobRepository(db),
    )

    try:
        await service.delete(review_id)

    except ReviewNotFound:
        raise HTTPException(
            status_code=404,
            detail="Review not found",
        )
