class AtlasException(Exception):
    """Базовое исключение проекта."""

    pass


# ==========================
# User
# ==========================


class JobNotFound(AtlasException):
    pass


class EmailAlreadyExists(AtlasException):
    pass


class UsernameAlreadyExists(AtlasException):
    pass


class InvalidCredentials(AtlasException):
    pass


class UserNotFound(AtlasException):
    pass


class ApplicationNotFound(AtlasException):
    pass


class ApplicationAlreadyExists(AtlasException):
    pass


# ==========================
# Category
# ==========================


class CategoryAlreadyExists(AtlasException):
    pass


class CategoryNotFound(AtlasException):
    pass


class PermissionDenied(AtlasException):
    pass


class ReviewNotFound(AtlasException):
    pass


class ReviewAlreadyExists(AtlasException):
    pass


class JobNotCompleted(AtlasException):
    pass


class SelfReviewNotAllowed(AtlasException):
    pass


# ==========================
# Password
# ==========================


class IncorrectPassword(AtlasException):
    pass


class SamePassword(AtlasException):
    pass
