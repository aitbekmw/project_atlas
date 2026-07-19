from app.core.exceptions import CategoryAlreadyExists, CategoryNotFound
from app.models.category import Category
from app.repositories.category import CategoryRepository
from app.schemas.category import CategoryCreate, CategoryUpdate


class CategoryService:
    def __init__(self, repo: CategoryRepository):
        self.repo = repo

    async def create(self, data: CategoryCreate):
        if await self.repo.get_by_name(data.name):
            raise CategoryAlreadyExists()

        category = Category(
            name=data.name,
            description=data.description,
            icon=data.icon,
        )

        return await self.repo.create(category)

    async def get_all(self):
        return await self.repo.get_all()

    async def get_by_id(self, category_id: int):
        category = await self.repo.get_by_id(category_id)

        if not category:
            raise CategoryNotFound()

        return category

    async def update(
        self,
        category_id: int,
        data: CategoryUpdate,
    ):
        category = await self.get_by_id(category_id)

        for key, value in data.model_dump(exclude_unset=True).items():
            setattr(category, key, value)

        await self.repo.update()

        return category

    async def delete(self, category_id: int):
        category = await self.get_by_id(category_id)

        await self.repo.delete(category)
