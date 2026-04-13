from pydantic import BaseModel

class MedicalRecordCreate(BaseModel):
    patient_id: str
    doctor_name: str
    diagnosis: str
    treatment: str
    lab_report: str