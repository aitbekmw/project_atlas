import logging

from app.core.exceptions import CategoryAlreadyExists
from app.data.default_categories import DEFAULT_CATEGORIES
from app.db.session import AsyncSessionLocal
from app.repositories.category import CategoryRepository
from app.schemas.category import CategoryCreate
from app.services.category import CategoryService

logger = logging.getLogger(__name__)


async def ensure_default_categories() -> None:
    """Create marketplace categories if the table is empty.

    Production Postgres starts blank; GET /categories then returns [].
    Local seed.py also uses the same names and stays idempotent.
    """
    async with AsyncSessionLocal() as session:
        repo = CategoryRepository(session)
        existing = await repo.get_all()
        if existing:
            return

        service = CategoryService(repo)
        created = 0
        for item in DEFAULT_CATEGORIES:
            if await repo.get_by_name(item["name"]):
                continue
            try:
                await service.create(CategoryCreate(**item))
                created += 1
            except CategoryAlreadyExists:
                continue

        if created:
            logger.info("Created %s default categories", created)
