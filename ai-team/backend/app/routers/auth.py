from fastapi import APIRouter, Depends, HTTPException, Response, Request, status
from datetime import datetime
from ..database import get_db, execute_query, execute_write
from ..config import settings
from ..models.user import LoginRequest, UserResponse
from ..models.access_request import AccountCompletionRequest
from ..services.auth_service import create_token, decode_token
from ..services.user_service import (
    authenticate_user, update_last_login, get_user_by_id
)
from ..dependencies import get_current_user

router = APIRouter(prefix='/auth', tags=['Authentication'])


def _set_cookies(response: Response, user: dict):
    """Set both JWT cookies on response."""
    access  = create_token(user['id'], user['email'],
                            user['role'], user['full_name'], 'access')
    refresh = create_token(user['id'], user['email'],
                            user['role'], user['full_name'], 'refresh')

    cookie_kwargs = dict(
        httponly = settings.COOKIE_HTTPONLY,
        secure   = settings.COOKIE_SECURE,
        samesite = settings.COOKIE_SAMESITE,
        path     = settings.COOKIE_PATH,
    )

    response.set_cookie(
        settings.ACCESS_COOKIE_NAME,
        access,
        max_age = settings.JWT_ACCESS_EXPIRE_MINUTES * 60,
        **cookie_kwargs
    )
    response.set_cookie(
        settings.REFRESH_COOKIE_NAME,
        refresh,
        max_age = settings.JWT_REFRESH_EXPIRE_DAYS * 86400,
        **cookie_kwargs
    )
    return access, refresh


def _clear_cookies(response: Response):
    """Delete both JWT cookies."""
    response.delete_cookie(
        settings.ACCESS_COOKIE_NAME,
        path=settings.COOKIE_PATH
    )
    response.delete_cookie(
        settings.REFRESH_COOKIE_NAME,
        path=settings.COOKIE_PATH
    )


@router.post('/login')
async def login(
    credentials: LoginRequest,
    response:    Response,
    conn         = Depends(get_db)
):
    user = authenticate_user(conn, credentials.email, credentials.password)

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail='Invalid email or password.'
        )

    update_last_login(conn, user['id'])
    _set_cookies(response, user)

    return {
        'message': 'Login successful.',
        'user': {
            'id':           user['id'],
            'email':        user['email'],
            'full_name':    user['full_name'],
            'role':         user['role'],
            'organization': user['organization'],
        }
    }


@router.post('/logout')
async def logout(
    response: Response,
    request:  Request,
    conn      = Depends(get_db),
    _user     = Depends(get_current_user)
):
    _clear_cookies(response)
    return {'message': 'Logged out successfully.'}


@router.post('/token/refresh')
async def refresh_token(
    request:  Request,
    response: Response,
    conn      = Depends(get_db)
):
    refresh = request.cookies.get(settings.REFRESH_COOKIE_NAME)

    if not refresh:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail='No refresh token found. Please login again.'
        )

    payload = decode_token(refresh)

    if payload.type != 'refresh':
        _clear_cookies(response)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail='Invalid token type.'
        )

    user = get_user_by_id(conn, payload.user_id)

    if not user or not user['is_active']:
        _clear_cookies(response)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail='User not found or deactivated.'
        )

    _set_cookies(response, user)
    return {'message': 'Token refreshed successfully.'}


@router.get('/verify-token')
async def verify_token(
    token: str,
    conn = Depends(get_db)
):
    rows = execute_query(
        conn,
        '''SELECT u.full_name, u.email, r.role_name, u.completion_token_expiry
           FROM users u
           JOIN roles r ON u.role_id = r.role_id
           WHERE u.completion_token = %s LIMIT 1''',
        (token,)
    )
    if not rows:
        raise HTTPException(status_code=400, detail="Invalid token.")
    
    user = rows[0]
    # Check expiry
    if user['completion_token_expiry'] < datetime.now():
        raise HTTPException(status_code=400, detail="Link expired. Contact admin for a new one.")
    
    return {
        "valid":     True,
        "full_name": user['full_name'],
        "email":     user['email'],
        "role":      user['role_name']
    }


@router.post('/complete-account')
async def complete_account(
    data: AccountCompletionRequest,
    conn = Depends(get_db)
):
    # 1. Find user
    rows = execute_query(
        conn,
        "SELECT id_user, email, completion_token_expiry FROM users WHERE completion_token = %s LIMIT 1",
        (data.token,)
    )
    if not rows:
        raise HTTPException(status_code=400, detail="Invalid token.")
    
    user = rows[0]
    if user['completion_token_expiry'] < datetime.now():
        raise HTTPException(status_code=400, detail="Link expired.")

    # 2. Hash password
    # Note: Using the same hashing logic as in user_service.py (bcrypt)
    import bcrypt
    salt = bcrypt.gensalt(rounds=12)
    hashed = bcrypt.hashpw(data.password.encode('utf-8'), salt).decode('utf-8')

    # 3. Update user
    execute_write(
        conn,
        '''UPDATE users
           SET password_hash = %s,
               completion_token = NULL,
               completion_token_expiry = NULL,
               is_active = TRUE
           WHERE id_user = %s''',
        (hashed, user['id_user'])
    )

    # 4. Audit log
    execute_write(
        conn,
        "INSERT INTO audit_logs (user_id, action, details) VALUES (%s, 'ACCOUNT_COMPLETED', %s)",
        (user['id_user'], f"User {user['email']} completed account setup")
    )

    return {"message": "Account setup complete. You can now log in."}


@router.get('/me', response_model=UserResponse)
async def get_me(
    current_user: dict = Depends(get_current_user)
):
    return current_user
