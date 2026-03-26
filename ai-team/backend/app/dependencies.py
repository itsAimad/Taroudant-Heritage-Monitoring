from fastapi import Request, HTTPException, Depends, status
from .config import settings
from .database import get_db, execute_query
from .services.auth_service import decode_token
from .models.user import UserRole

def get_current_user(
    request: Request,
    conn = Depends(get_db)
) -> dict:
    """
    Read access JWT from httpOnly cookie.
    Inject current user into any protected route.
    """
    token = request.cookies.get(settings.ACCESS_COOKIE_NAME)

    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail='Not authenticated. Please login.'
        )

    payload = decode_token(token)

    if payload.type != 'access':
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail='Invalid token type.'
        )

    rows = execute_query(
        conn,
        """
        SELECT
          u.id_user     AS id,
          u.email,
          u.full_name,
          u.organization,
          u.is_active,
          u.created_at,
          u.last_login,
          r.role_name   AS role
        FROM users u
        JOIN roles r ON u.role_id = r.role_id
        WHERE u.id_user = %s
        LIMIT 1
        """,
        (payload.user_id,)
    )

    if not rows:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail='User no longer exists.'
        )

    user = rows[0]

    if not user['is_active']:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail='Account is deactivated.'
        )

    return user


def require_role(*roles: UserRole):
    """
    Factory — returns a dependency that enforces role.
    Usage: Depends(require_role(UserRole.ADMIN))
           Depends(require_role(UserRole.ADMIN, UserRole.AUTHORITY))
    """
    def role_checker(
        current_user: dict = Depends(get_current_user)
    ) -> dict:
        if current_user['role'] not in [r.value for r in roles]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Required role: {', '.join(r.value for r in roles)}"
            )
        return current_user
    return role_checker

# Pre-built role shortcuts
require_admin     = require_role(UserRole.ADMIN)
require_inspector = require_role(UserRole.INSPECTOR)
require_authority = require_role(UserRole.AUTHORITY)
require_admin_or_authority = require_role(
    UserRole.ADMIN, UserRole.AUTHORITY
)
require_any_auth = require_role(
    UserRole.ADMIN, UserRole.INSPECTOR, UserRole.AUTHORITY
)
