class AtlasException(Exception):
    """Base project exception."""


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


class JobNotOpen(AtlasException):
    pass


class SelfReviewNotAllowed(AtlasException):
    pass


class IncorrectPassword(AtlasException):
    pass


class SamePassword(AtlasException):
    pass


class ConversationNotFound(AtlasException):
    pass


class ConversationAlreadyExists(AtlasException):
    pass


class MessageNotFound(AtlasException):
    pass


class InvalidRefreshToken(AtlasException):
    pass


class InvalidFile(AtlasException):
    pass
