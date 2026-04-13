from pydantic import BaseModel


class RecordCreate(BaseModel):
    patient_id: str
    report_type: str
    description: str
    gender: str | None = None
    doctor_name: str | None = None
    diagnosis: str | None = None
    treatment: str | None = None
    lab_report: str | None = None
    status: str | None = "pending"


class RecordUpdate(BaseModel):
    report_type: str | None = None
    description: str | None = None
    gender: str | None = None
    doctor_name: str | None = None
    diagnosis: str | None = None
    treatment: str | None = None
    lab_report: str | None = None
    status: str | None = None