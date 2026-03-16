from datetime import datetime, timedelta, timezone
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import HTTPException, status
from ..config import settings
from ..models.user import TokenPayload, UserRole

pwd_context = CryptContext(schemes=['bcrypt'], deprecated='auto')

def hash_password(plain: str) -> str:
    return pwd_context.hash(plain)

def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)

def create_token(
    user_id:   int,
    email:     str,
    role:      str,
    full_name: str,
    token_type: str,
) -> str:
    now = datetime.now(timezone.utc)

    if token_type == 'access':
        expire = now + timedelta(
            minutes=settings.JWT_ACCESS_EXPIRE_MINUTES
        )
    else:
        expire = now + timedelta(
            days=settings.JWT_REFRESH_EXPIRE_DAYS
        )

    payload = {
        'user_id':   user_id,
        'email':     email,
        'role':      role,
        'full_name': full_name,
        'type':      token_type,
        'iat':       now,
        'exp':       expire,
    }

    return jwt.encode(
        payload,
        settings.JWT_SECRET_KEY,
        algorithm=settings.JWT_ALGORITHM
    )

def decode_token(token: str) -> TokenPayload:
    try:
        payload = jwt.decode(
            token,
            settings.JWT_SECRET_KEY,
            algorithms=[settings.JWT_ALGORITHM]
        )
        return TokenPayload(**payload)
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail='Token is invalid or expired',
            headers={'WWW-Authenticate': 'Bearer'},
        )
