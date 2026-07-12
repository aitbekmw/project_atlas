from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import (
    CategoryAlreadyExists,
    CategoryNotFound,
)
from app.db.session import get_db
from app.repositories.category import CategoryRepository
from app.schemas.category import (
    CategoryCreate,
    CategoryResponse,
    CategoryUpdate,
)
from app.services.category import CategoryService

router = APIRouter(
    prefix="/categories",
    tags=["Categories"],
)


@router.post(
    "",
    response_model=CategoryResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_category(
    data: CategoryCreate,
    db: AsyncSession = Depends(get_db),
):
    service = CategoryService(CategoryRepository(db))

    try:
        return await service.create(data)

    except CategoryAlreadyExists:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Category already exists",
        )


@router.get(
    "",
    response_model=list[CategoryResponse],
)
async def get_categories(
    db: AsyncSession = Depends(get_db),
):
    service = CategoryService(CategoryRepository(db))
    return await service.get_all()


@router.get(
    "/{category_id}",
    response_model=CategoryResponse,
)
async def get_category(
    category_id: int,
    db: AsyncSession = Depends(get_db),
):
    service = CategoryService(CategoryRepository(db))

    try:
        return await service.get_by_id(category_id)

    except CategoryNotFound:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Category not found",
        )


@router.put(
    "/{category_id}",
    response_model=CategoryResponse,
)
async def update_category(
    category_id: int,
    data: CategoryUpdate,
    db: AsyncSession = Depends(get_db),
):
    service = CategoryService(CategoryRepository(db))

    try:
        return await service.update(category_id, data)

    except CategoryNotFound:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Category not found",
        )


@router.delete(
    "/{category_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def delete_category(
    category_id: int,
    db: AsyncSession = Depends(get_db),
):
    service = CategoryService(CategoryRepository(db))

    try:
        await service.delete(category_id)

    except CategoryNotFound:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Category not found",
        )