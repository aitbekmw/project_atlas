import hashlib
import hmac
import logging
import secrets
import smtplib
from email.message import EmailMessage

from app.core.config import settings
from app.core.exceptions import SmtpNotConfigured

logger = logging.getLogger(__name__)

# TESTING only: last issued plaintext code per email. Never used in production.
TEST_EMAIL_CODES: dict[str, str] = {}


def hash_email_code(email: str, code: str) -> str:
    payload = f"{email.strip().lower()}:{code.strip()}".encode()
    return hmac.new(
        settings.SECRET_KEY.encode(),
        payload,
        hashlib.sha256,
    ).hexdigest()


def generate_email_code() -> str:
    return f"{secrets.randbelow(1_000_000):06d}"


def smtp_configured() -> bool:
    return bool(settings.SMTP_HOST and settings.SMTP_FROM_EMAIL)


def send_verification_email(to_email: str, code: str) -> None:
    minutes = settings.EMAIL_VERIFICATION_EXPIRE_MINUTES
    subject = "Atlas — Подтверждение email"
    body = (
        "Atlas\n\n"
        "Подтверждение email\n\n"
        f"Ваш код:\n\n{code}\n\n"
        f"Код действует {minutes} минут.\n\n"
        "Если вы не регистрировались в Atlas, проигнорируйте это письмо.\n"
    )

    if settings.TESTING:
        TEST_EMAIL_CODES[to_email.strip().lower()] = code
        logger.info("Queued verification email for tests: %s", to_email)
        return

    if not smtp_configured():
        if settings.ENVIRONMENT.lower() == "production":
            raise SmtpNotConfigured()
        logger.warning(
            "SMTP is not configured; verification email was not sent to %s",
            to_email,
        )
        return

    message = EmailMessage()
    message["Subject"] = subject
    message["From"] = settings.SMTP_FROM_EMAIL
    message["To"] = to_email
    message.set_content(body)

    with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=20) as smtp:
        if settings.SMTP_USE_TLS:
            smtp.starttls()
        if settings.SMTP_USERNAME and settings.SMTP_PASSWORD:
            smtp.login(settings.SMTP_USERNAME, settings.SMTP_PASSWORD)
        smtp.send_message(message)
