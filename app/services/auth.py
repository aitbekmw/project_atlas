import hmac
import re
import secrets
from datetime import datetime, timedelta, timezone
from urllib.parse import urlencode

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.exceptions import (
    EmailAlreadyExists,
    EmailAlreadyVerified,
    EmailNotVerified,
    GoogleAuthFailed,
    GoogleCancelled,
    GoogleEmailNotVerified,
    InvalidCredentials,
    InvalidOAuthCode,
    InvalidOAuthState,
    InvalidRefreshToken,
    InvalidVerificationCode,
    ProfileIncomplete,
    ResendTooSoon,
    UsernameAlreadyExists,
    UserNotFound,
    VerificationCodeExpired,
    WeakPassword,
)
from app.core.origins import is_allowed_frontend_origin
from app.core.security import (
    create_access_token,
    create_refresh_token,
    hash_password,
    hash_refresh_token,
    verify_password,
)
from app.core.validators import (
    generate_username,
    import_person_name,
    validate_password_strength,
)
from app.models.email_verification import EmailVerification
from app.models.oauth_account import OAuthAccount
from app.models.refresh_token import RefreshToken
from app.models.user import User
from app.repositories.email_verification import EmailVerificationRepository
from app.repositories.oauth_account import OAuthAccountRepository
from app.repositories.refresh_token import RefreshTokenRepository
from app.repositories.user import UserRepository
from app.schemas.user import UserCreate
from app.services.email import (
    generate_email_code,
    hash_email_code,
    send_verification_email,
)
from app.services.google_oauth import (
    build_google_authorization_url,
    exchange_google_code,
    fetch_google_userinfo,
    require_google_config,
)
from app.services.oauth_store import delete_value, get_value, put_value, take_value


# TODO(auth): forgot-password flow is not implemented yet.
# Keep using email verification endpoints for account confirmation only.
class AuthService:
    def __init__(self, db: AsyncSession):
        self.user_repo = UserRepository(db)
        self.refresh_repo = RefreshTokenRepository(db)
        self.verification_repo = EmailVerificationRepository(db)
        self.oauth_repo = OAuthAccountRepository(db)

    async def register(
        self,
        data: UserCreate,
    ):
        if await self.user_repo.get_by_email(data.email):
            raise EmailAlreadyExists()

        try:
            validate_password_strength(data.password, data.email)
        except ValueError as orig:
            raise WeakPassword() from orig

        username = data.username
        if username:
            if await self.user_repo.get_by_username(username):
                raise UsernameAlreadyExists()
        else:
            username = await self._unique_username(data.email)

        user = User(
            username=username,
            email=data.email,
            hashed_password=hash_password(data.password),
            first_name=data.first_name,
            last_name=data.last_name,
            phone=data.phone,
            role=data.role,
            is_verified=False,
        )

        user = await self.user_repo.create(user)
        await self._issue_verification_code(user)
        return user

    async def login(
        self,
        email: str,
        password: str,
    ):
        user = await self.user_repo.get_by_email(email.lower())
        await self._ensure_can_login(user, password)
        return await self._create_tokens(user)

    async def login_by_username(
        self,
        username: str,
        password: str,
    ):
        user = await self.user_repo.get_by_username(username)
        await self._ensure_can_login(user, password)
        return await self._create_tokens(user)

    async def verify_email(self, email: str, code: str) -> User:
        user = await self.user_repo.get_by_email(email.lower())
        if user is None:
            raise UserNotFound()
        if user.is_verified:
            raise EmailAlreadyVerified()

        record = await self.verification_repo.get_latest_active(user.id)
        if record is None:
            raise InvalidVerificationCode()

        expires_at = record.expires_at
        if expires_at.tzinfo is None:
            expires_at = expires_at.replace(tzinfo=timezone.utc)
        if expires_at <= datetime.now(timezone.utc):
            raise VerificationCodeExpired()

        if not hmac.compare_digest(record.code_hash, hash_email_code(user.email, code)):
            raise InvalidVerificationCode()

        record.consumed_at = datetime.now(timezone.utc)
        user.is_verified = True
        await self.verification_repo.save()
        return user

    async def resend_verification(self, email: str) -> None:
        user = await self.user_repo.get_by_email(email.lower())
        if user is None:
            raise UserNotFound()
        if user.is_verified:
            raise EmailAlreadyVerified()
        await self._issue_verification_code(user)

    async def _issue_verification_code(self, user: User) -> None:
        latest = await self.verification_repo.get_latest(user.id)
        if latest is not None:
            created = latest.created_at
            if created.tzinfo is None:
                created = created.replace(tzinfo=timezone.utc)
            wait = timedelta(seconds=settings.EMAIL_RESEND_SECONDS)
            elapsed = datetime.now(timezone.utc) - created
            if elapsed < wait:
                remaining = int((wait - elapsed).total_seconds()) or 1
                raise ResendTooSoon(remaining)

        await self.verification_repo.invalidate_active(user.id)
        code = generate_email_code()
        record = EmailVerification(
            user_id=user.id,
            code_hash=hash_email_code(user.email, code),
            expires_at=datetime.now(timezone.utc)
            + timedelta(minutes=settings.EMAIL_VERIFICATION_EXPIRE_MINUTES),
        )
        await self.verification_repo.create(record)
        send_verification_email(user.email, code)

    async def _ensure_can_login(self, user: User | None, password: str) -> None:
        if not user or not user.is_active:
            raise InvalidCredentials()
        if not user.hashed_password or not verify_password(
            password, user.hashed_password
        ):
            raise InvalidCredentials()
        if not user.is_verified:
            raise EmailNotVerified()

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

    async def _unique_username(self, email: str) -> str:
        for _ in range(8):
            candidate = generate_username(email)
            if await self.user_repo.get_by_username(candidate) is None:
                return candidate
        raise UsernameAlreadyExists()

    async def google_start(self, origin: str) -> str:
        require_google_config()
        frontend = self._allowed_origin(origin)
        state = secrets.token_urlsafe(32)
        await put_value(
            f"oauth:state:{state}",
            {"origin": frontend},
            ttl_seconds=600,
        )
        return build_google_authorization_url(state)

    async def google_callback(
        self,
        code: str | None,
        state: str | None,
        error: str | None,
    ) -> str:
        origin = self._fallback_origin()
        stored = None
        if state:
            stored = await take_value(f"oauth:state:{state}")
            if stored and stored.get("origin"):
                origin = str(stored["origin"])

        if error == "access_denied":
            return self._frontend_error(origin, "google_cancelled")
        if error:
            return self._frontend_error(origin, "google_failed")
        if not state or stored is None:
            return self._frontend_error(origin, "google_failed")
        if not code:
            return self._frontend_error(origin, "google_failed")

        try:
            tokens = await exchange_google_code(code)
            identity = await fetch_google_userinfo(str(tokens["access_token"]))
            user = await self._user_from_google_identity(identity)
        except GoogleCancelled:
            return self._frontend_error(origin, "google_cancelled")
        except GoogleEmailNotVerified:
            return self._frontend_error(origin, "google_email_not_verified")
        except EmailAlreadyExists:
            return self._frontend_error(origin, "google_email_exists")
        except (GoogleAuthFailed, InvalidOAuthState):
            return self._frontend_error(origin, "google_failed")

        purpose = "login" if self._profile_ready(user) else "complete_profile"
        ticket = secrets.token_urlsafe(32)
        await put_value(
            f"oauth:ticket:{ticket}",
            {"user_id": user.id, "purpose": purpose},
            ttl_seconds=300,
        )
        if purpose == "complete_profile":
            return f"{origin}/complete-profile?code={ticket}"
        return f"{origin}/auth/google/complete?code={ticket}"

    async def exchange_google_login(self, ticket: str):
        user = await self._user_from_ticket(ticket, "login")
        if not self._profile_ready(user):
            raise ProfileIncomplete()
        if not user.is_active:
            raise InvalidCredentials()
        return await self._create_tokens(user)

    async def complete_google_profile(self, ticket: str, phone: str, role: str):
        user = await self._user_from_ticket(ticket, "complete_profile")
        if not user.is_active:
            raise InvalidCredentials()
        user.phone = phone
        user.role = role
        await self.user_repo.update(user)
        return await self._create_tokens(user)

    async def _user_from_ticket(self, ticket: str, expected_purpose: str) -> User:
        key = f"oauth:ticket:{ticket}"
        stored = await get_value(key)
        if stored is None:
            raise InvalidOAuthCode()
        if stored.get("purpose") != expected_purpose:
            raise InvalidOAuthCode()
        user = await self.user_repo.get_by_id(int(stored["user_id"]))
        await delete_value(key)
        if user is None:
            raise UserNotFound()
        return user

    async def _user_from_google_identity(self, identity: dict) -> User:
        google_id = str(identity.get("sub") or "").strip()
        email = str(identity.get("email") or "").strip().lower()
        verified = identity.get("email_verified")
        email_verified = verified is True or str(verified).lower() == "true"
        if not google_id or not email:
            raise GoogleAuthFailed()
        if not email_verified:
            raise GoogleEmailNotVerified()

        linked = await self.oauth_repo.get_by_provider_account("google", google_id)
        if linked is not None:
            user = await self.user_repo.get_by_id(linked.user_id)
            if user is None or not user.is_active:
                raise GoogleAuthFailed()
            if not user.is_verified:
                user.is_verified = True
                await self.user_repo.update(user)
            return user

        existing = await self.user_repo.get_by_email(email)
        if existing is not None:
            owned = await self.oauth_repo.get_for_user(existing.id, "google")
            if owned is not None and owned.provider_account_id != google_id:
                raise EmailAlreadyExists()
            await self._link_google(existing, google_id)
            if not existing.is_verified:
                existing.is_verified = True
                await self.user_repo.update(existing)
            return existing

        first_name = import_person_name(
            identity.get("given_name"),
            email.split("@", 1)[0][:20] or "User",
        )
        last_name = import_person_name(identity.get("family_name"), "User")
        picture = str(identity.get("picture") or "").strip()
        avatar = picture if picture.startswith(("http://", "https://")) else None
        user = User(
            username=await self._unique_username(email),
            email=email,
            hashed_password=None,
            first_name=first_name,
            last_name=last_name,
            phone=None,
            avatar=avatar,
            role="worker",
            is_verified=True,
        )
        user = await self.user_repo.create(user)
        await self._link_google(user, google_id)
        return user

    async def _link_google(self, user: User, google_id: str) -> None:
        existing = await self.oauth_repo.get_by_provider_account("google", google_id)
        if existing is not None:
            if existing.user_id != user.id:
                raise EmailAlreadyExists()
            return
        owned = await self.oauth_repo.get_for_user(user.id, "google")
        if owned is not None:
            if owned.provider_account_id != google_id:
                raise EmailAlreadyExists()
            return
        await self.oauth_repo.create(
            OAuthAccount(
                user_id=user.id,
                provider="google",
                provider_account_id=google_id,
            )
        )

    def _profile_ready(self, user: User) -> bool:
        return bool(user.phone)

    def _allowed_origin(self, origin: str) -> str:
        cleaned = origin.strip().rstrip("/")
        if is_allowed_frontend_origin(cleaned):
            return cleaned
        raise InvalidOAuthState()

    def _fallback_origin(self) -> str:
        for item in settings.CORS_ORIGINS:
            if re.search(r"localhost:5173$|127\.0\.0\.1:5173$", item.rstrip("/")):
                return item.rstrip("/")
        if settings.CORS_ORIGINS:
            return settings.CORS_ORIGINS[0].rstrip("/")
        return "http://localhost:5173"

    def _frontend_error(self, origin: str, code: str) -> str:
        return f"{origin}/login?{urlencode({'error': code})}"

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
