from enum import Enum


class UserRole(str, Enum):
    CUSTOMER = "customer"
    WORKER = "worker"
    ADMIN = "admin"


class JobStatus(str, Enum):
    OPEN = "OPEN"
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"


class PaymentMethod(str, Enum):
    """How the customer plans to pay.

    QR is reserved for a future electronic payment flow.
    """

    CASH = "CASH"
    QR = "QR"
    AGREEMENT = "AGREEMENT"


class ApplicationStatus(str, Enum):
    PENDING = "PENDING"
    ACCEPTED = "ACCEPTED"
    REJECTED = "REJECTED"


class ReviewSort(str, Enum):
    NEWEST = "newest"
    OLDEST = "oldest"
