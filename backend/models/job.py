
from pydantic import BaseModel
from typing import List, Optional


class JobCreate(BaseModel):
    title: str
    company: str
    location: Optional[str] = None
    description: str
    required_skills: List[str]
    salary: Optional[str] = None
    job_type: Optional[str] = "Full-time"


class JobResponse(BaseModel):
    id: str
    title: str
    company: str
    location: Optional[str] = None
    description: str
    required_skills: List[str]
    salary: Optional[str] = None
    job_type: Optional[str] = None
