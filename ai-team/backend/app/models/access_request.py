from pydantic import BaseModel, EmailStr, field_validator
from typing import Optional, Literal
from datetime import datetime

class AccessRequestCreate(BaseModel):
    full_name:    str
    email:        EmailStr
    organization: str
    role:         Literal['inspector', 'authority']
    reason:       str

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
    id:           int
    full_name:    str
    email:        str
    organization: str
    role:         str
    reason:       str
    status:       str
    submitted_at: datetime
    reviewed_at:  Optional[datetime] = None
    review_note:  Optional[str]      = None
    reviewed_by:  Optional[str]      = None

class ReviewRequest(BaseModel):
    status:      Literal['approved', 'rejected']
    review_note: Optional[str] = ''

    @field_validator('review_note')
    @classmethod
    def note_required_on_reject(cls, v, info):
        if info.data.get('status') == 'rejected':
            if not v or not v.strip():
                raise ValueError(
                    'Review note is required when rejecting a request'
                )
        return v
