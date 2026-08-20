from datetime import datetime, timedelta, timezone

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.exceptions import (
    EmailAlreadyExists,
    InvalidCredentials,
    InvalidRefreshToken,
    UsernameAlreadyExists,
)
from app.core.security import (
    create_access_token,
    create_refresh_token,
    hash_password,
    hash_refresh_token,
    verify_password,
)
from app.models.refresh_token import RefreshToken
from app.models.user import User
from app.repositories.refresh_token import RefreshTokenRepository
from app.repositories.user import UserRepository
from app.schemas.user import UserCreate


class AuthService:
    def __init__(self, db: AsyncSession):
        self.user_repo = UserRepository(db)
        self.refresh_repo = RefreshTokenRepository(db)

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
            role=data.role,
        )

        return await self.user_repo.create(user)

    async def login(
        self,
        email: str,
        password: str,
    ):
        user = await self.user_repo.get_by_email(email.lower())

        if not user or not user.is_active:
            raise InvalidCredentials()

        if not verify_password(
            password,
            user.hashed_password,
        ):
            raise InvalidCredentials()

        return await self._create_tokens(user)

    async def login_by_username(
        self,
        username: str,
        password: str,
    ):
        user = await self.user_repo.get_by_username(username)

        if not user or not user.is_active:
            raise InvalidCredentials()

        if not verify_password(
            password,
            user.hashed_password,
        ):
            raise InvalidCredentials()

        return await self._create_tokens(user)

    async def refresh(
        self,
        refresh_token: str,
    ):
        token_hash = hash_refresh_token(refresh_token)
        stored = await self.refresh_repo.get_by_hash(token_hash)

        if stored is None or stored.is_revoked:
            raise InvalidRefreshToken()

        expires_at = stored.expires_at

        if expires_at.tzinfo is None:
            expires_at = expires_at.replace(tzinfo=timezone.utc)

        if expires_at <= datetime.now(timezone.utc):
            raise InvalidRefreshToken()

        user = await self.user_repo.get_by_id(stored.user_id)

        if user is None or not user.is_active:
            raise InvalidRefreshToken()

        await self.refresh_repo.revoke(stored)

        return await self._create_tokens(user)

    async def logout(
        self,
        refresh_token: str,
    ):
        token_hash = hash_refresh_token(refresh_token)
        stored = await self.refresh_repo.get_by_hash(token_hash)

        if stored is None or stored.is_revoked:
            return

        await self.refresh_repo.revoke(stored)

    async def _create_tokens(
        self,
        user: User,
    ):
        access_token = create_access_token(
            {
                "sub": str(user.id),
                "email": user.email,
            }
        )

        refresh_token = create_refresh_token()

        stored = RefreshToken(
            token_hash=hash_refresh_token(refresh_token),
            expires_at=datetime.now(timezone.utc)
            + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS),
            user_id=user.id,
        )

        await self.refresh_repo.create(stored)

        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer",
        }
