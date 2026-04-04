from pydantic import BaseModel, EmailStr, field_validator
from typing import Optional, Literal
from datetime import datetime

class AccessRequestCreate(BaseModel):
    full_name:         str
    email:             EmailStr
    organization:      str
    requested_role_id: int  # 2=inspector, 3=authority
    reason:            str

    @field_validator('requested_role_id')
    @classmethod
    def validate_role(cls, v):
        if v not in (2, 3):
            raise ValueError('Invalid role requested. Must be 2 (Inspector) or 3 (Authority).')
        return v

    @field_validator('reason')
    @classmethod
    def reason_length(cls, v):
        if len(v.strip()) < 20:
            raise ValueError('Reason must be at least 20 characters')
        return v

    @field_validator('full_name', 'organization')
    @classmethod
    def min_length(cls, v):
        if len(v.strip()) < 2:
            raise ValueError('Must be at least 2 characters')
        return v

class AccessRequestResponse(BaseModel):
    id:                int
    full_name:         str
    email:             str
    organization:      str
    requested_role_id: int
    role_name:         Optional[str] = None
    reason:            str
    status:            str
    submitted_at:      datetime
    reviewed_at:       Optional[datetime] = None
    review_note:       Optional[str]      = None
    reviewed_by_id:    Optional[int]      = None
    reviewed_by_name:  Optional[str]      = None

class ReviewRequest(BaseModel):
    status:      Optional[Literal['approved', 'rejected']] = None
    review_note: Optional[str] = ''

    @field_validator('review_note')
    @classmethod
    def note_required_on_reject(cls, v, info):
        # We only enforce this if status is present and is 'rejected'
        if info.data.get('status') == 'rejected':
            if not v or not v.strip():
                raise ValueError(
                    'Review note is required when rejecting a request'
                )
        return v

class TokenVerifyResponse(BaseModel):
    valid:     bool
    full_name: str
    email:     str
    role_name: str

class AccountCompletionRequest(BaseModel):
    token:    str
    password: str

    @field_validator('password')
    @classmethod
    def password_strength(cls, v):
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters long')
        if not any(c.isupper() for c in v):
            raise ValueError('Password must contain at least one uppercase letter')
        if not any(c.isdigit() for c in v):
            raise ValueError('Password must contain at least one digit')
        if not any(c in '@$!%*?&' for c in v):
            raise ValueError('Password must contain at least one special character (@$!%*?&)')
        return v
