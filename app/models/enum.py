from enum import Enum


class UserRole(str, Enum):
    CUSTOMER = "customer"
    WORKER = "worker"
    ADMIN = "admin"