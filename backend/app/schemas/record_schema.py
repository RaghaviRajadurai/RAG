from pydantic import BaseModel

class RecordCreate(BaseModel):
    patient_id: int
    report_type: str
    description: str