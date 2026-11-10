
from pydantic import BaseModel
from typing import Optional


class ApplicationCreate(BaseModel):
    job_id: str
    cover_letter: Optional[str] = None


class ApplicationStatusUpdate(BaseModel):
    status: str
