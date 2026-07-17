from fastapi import APIRouter

from app.api.application import router as application_router
from app.api.auth import router as auth_router
from app.api.category import router as category_router
from app.api.conversation import router as conversation_router
from app.api.job import router as job_router
from app.api.message import router as message_router
from app.api.review import router as review_router
from app.api.users import router as users_router

api_router = APIRouter()

api_router.include_router(auth_router)
api_router.include_router(users_router)
api_router.include_router(category_router)
api_router.include_router(job_router)
api_router.include_router(application_router)
api_router.include_router(review_router)

api_router.include_router(conversation_router)
api_router.include_router(message_router)
