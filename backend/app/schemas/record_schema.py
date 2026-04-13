from pydantic import BaseModel

class RecordCreate(BaseModel):
    patient_id: str
    report_type: str
    description: str