from pydantic import BaseModel
from typing import Optional
from datetime import date

class AssignmentCreate(BaseModel):
    monument_id: int
    inspector_id: int
    notes: Optional[str] = None
    due_date: Optional[date] = None

class AssignmentStatusUpdate(BaseModel):
    status: str
