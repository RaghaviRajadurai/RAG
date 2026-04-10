from pydantic import BaseModel

class MedicalRecordCreate(BaseModel):
    patient_id: int
    doctor_name: str
    diagnosis: str
    treatment: str
    lab_report: str