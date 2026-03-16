from pydantic import BaseModel, EmailStr, field_validator
from typing import Optional, Literal
from datetime import datetime
from enum import Enum

class UserRole(str, Enum):
    ADMIN     = 'admin'
    INSPECTOR = 'inspector'
    AUTHORITY = 'authority'

class UserBase(BaseModel):
    email:        EmailStr
    full_name:    str
    organization: Optional[str] = ''
    role:         UserRole

class UserCreate(UserBase):
    password:         str
    confirm_password: str

    @field_validator('password')
    @classmethod
    def password_strength(cls, v):
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters')
        if not any(c.isupper() for c in v):
            raise ValueError('Password must contain an uppercase letter')
        if not any(c.isdigit() for c in v):
            raise ValueError('Password must contain a number')
        return v

    @field_validator('confirm_password')
    @classmethod
    def passwords_match(cls, v, info):
        if 'password' in info.data and v != info.data['password']:
            raise ValueError('Passwords do not match')
        return v

class UserResponse(BaseModel):
    id:           int
    email:        str
    full_name:    str
    organization: str
    role:         UserRole
    is_active:    bool
    created_at:   datetime
    last_login:   Optional[datetime] = None

    model_config = {'from_attributes': True}

class LoginRequest(BaseModel):
    email:    EmailStr
    password: str

class TokenPayload(BaseModel):
    user_id:   int
    email:     str
    role:      UserRole
    full_name: str
    type:      Literal['access', 'refresh']
