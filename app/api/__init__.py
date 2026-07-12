from fastapi import APIRouter

from app.api.auth import router as auth_router
from app.api.users import router as users_router
from app.api.category import router as category_router
from app.api.job import router as job_router

api_router = APIRouter()


api_router.include_router(auth_router)
api_router.include_router(users_router)
api_router.include_router(category_router)
api_router.include_router(job_router)