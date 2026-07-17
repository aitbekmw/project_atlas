from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import (EmailAlreadyExists, InvalidCredentials,
                                 UsernameAlreadyExists)
from app.core.security import (create_access_token, hash_password,
                               verify_password)
from app.models.user import User
from app.repositories.user import UserRepository
from app.schemas.user import UserCreate


class AuthService:

    def __init__(self, db: AsyncSession):
        self.user_repo = UserRepository(db)

    async def register(
        self,
        data: UserCreate,
    ):
        if await self.user_repo.get_by_email(data.email):
            raise EmailAlreadyExists()

        if await self.user_repo.get_by_username(data.username):
            raise UsernameAlreadyExists()

        user = User(
            username=data.username,
            email=data.email,
            hashed_password=hash_password(data.password),
            first_name=data.first_name,
            last_name=data.last_name,
            phone=data.phone,
        )

        return await self.user_repo.create(user)

    async def login(
        self,
        email: str,
        password: str,
    ):
        user = await self.user_repo.get_by_email(email)

        if not user:
            raise InvalidCredentials()

        if not verify_password(
            password,
            user.hashed_password,
        ):
            raise InvalidCredentials()

        return self._create_token(user)

    async def login_by_username(
        self,
        username: str,
        password: str,
    ):
        user = await self.user_repo.get_by_username(username)

        if not user:
            raise InvalidCredentials()

        if not verify_password(
            password,
            user.hashed_password,
        ):
            raise InvalidCredentials()

        return self._create_token(user)

    def _create_token(
        self,
        user: User,
    ):
        access_token = create_access_token(
            {
                "sub": str(user.id),
                "email": user.email,
            }
        )

        return {
            "access_token": access_token,
            "token_type": "bearer",
        }
