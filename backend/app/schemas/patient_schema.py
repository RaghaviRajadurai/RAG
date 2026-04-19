from pydantic import BaseModel
from typing import Optional

class PatientCreate(BaseModel):
    name: str
    age: int
    gender: str
    diagnosis: str
    prescription: str
    assigned_doctor_id: Optional[str] = None
    assigned_doctor_name: Optional[str] = None