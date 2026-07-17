from typing import Callable

from fastapi import Depends

from app.core.exceptions import PermissionDenied
from app.dependencies.auth import get_current_user
from app.models.enum import UserRole
from app.models.user import User


def require_roles(
    *roles: UserRole,
) -> Callable:
    async def checker(
        current_user: User = Depends(get_current_user),
    ) -> User:
        allowed_roles = {role.value for role in roles}

        if current_user.role not in allowed_roles:
            raise PermissionDenied()

        return current_user

    return checker


require_admin = require_roles(
    UserRole.ADMIN,
)

require_customer = require_roles(
    UserRole.CUSTOMER,
)

require_worker = require_roles(
    UserRole.WORKER,
)
