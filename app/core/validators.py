import re
import secrets

WEAK_PASSWORDS = {
    "12345678",
    "password",
    "password1",
    "qwerty123",
    "qwerty",
    "11111111",
    "abcdefgh",
    "letmein1",
    "admin123",
    "passw0rd",
}

_SPECIAL = re.compile(r"[^A-Za-z0-9]")
_NAME = re.compile(r"^[A-Za-zА-Яа-яЁёӨөҮүҢңІі'’.\- ]+$")
_HAS_LETTER = re.compile(r"[A-Za-zА-Яа-яЁёӨөҮүҢңІі]")


def validate_password_strength(password: str, email: str | None = None) -> None:
    if len(password) < 8:
        raise ValueError("Password does not meet requirements")
    if not re.search(r"[A-Z]", password):
        raise ValueError("Password does not meet requirements")
    if not re.search(r"[a-z]", password):
        raise ValueError("Password does not meet requirements")
    if not re.search(r"\d", password):
        raise ValueError("Password does not meet requirements")
    if not _SPECIAL.search(password):
        raise ValueError("Password does not meet requirements")
    lowered = password.lower()
    if lowered in WEAK_PASSWORDS:
        raise ValueError("Password does not meet requirements")
    if re.fullmatch(r"\d+", password) or re.fullmatch(r"[a-zA-Z]+", password):
        raise ValueError("Password does not meet requirements")
    sequences = (
        "0123456789",
        "9876543210",
        "abcdefghijklmnopqrstuvwxyz",
        "qwertyuiop",
        "asdfghjkl",
        "zxcvbnm",
    )
    for sequence in sequences:
        for index in range(len(sequence) - 3):
            chunk = sequence[index : index + 4]
            if chunk in lowered or chunk[::-1] in lowered:
                raise ValueError("Password does not meet requirements")
    if email:
        local = email.split("@", 1)[0].lower()
        if len(local) >= 3 and local in lowered:
            raise ValueError("Password does not meet requirements")


def normalize_person_name(value: str) -> str:
    cleaned = " ".join(str(value).split())
    if len(cleaned) < 2:
        raise ValueError("Name is too short")
    if re.fullmatch(r"[\d\s]+", cleaned) or not _HAS_LETTER.search(cleaned):
        raise ValueError("Name must contain letters")
    if not _NAME.fullmatch(cleaned):
        raise ValueError("Name contains invalid characters")
    return cleaned


def normalize_phone(value: str) -> str:
    raw = str(value).strip()
    if not raw:
        raise ValueError("Invalid phone number")
    compact = re.sub(r"[^\d+]", "", raw)
    if compact.startswith("00"):
        compact = f"+{compact[2:]}"
    digits = re.sub(r"\D", "", compact)
    if digits.startswith("996") and len(digits) == 12:
        return f"+{digits}"
    if len(digits) == 9:
        return f"+996{digits}"
    if compact.startswith("0") and len(digits) == 10:
        return f"+996{digits[1:]}"
    raise ValueError("Invalid phone number")


def generate_username(email: str) -> str:
    local = re.sub(r"[^a-z0-9]", "", email.split("@", 1)[0].lower())[:18]
    if len(local) < 3:
        local = f"user{local}" or "user"
    return f"{local}_{secrets.token_hex(3)}"[:50]


def import_person_name(value: str | None, fallback: str) -> str:
    raw = " ".join(str(value or "").split())
    if raw:
        try:
            return normalize_person_name(raw)
        except ValueError:
            cleaned = re.sub(r"[^\w\- ]", "", raw, flags=re.UNICODE)
            cleaned = " ".join(cleaned.split())
            if len(cleaned) >= 2:
                return cleaned[:100]
    try:
        return normalize_person_name(fallback)
    except ValueError:
        return "User"
