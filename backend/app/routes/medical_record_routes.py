from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models.medical_record import MedicalRecord
from app.schemas.medical_record_schema import MedicalRecordCreate

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.post("/add_medical_record")
def add_medical_record(record: MedicalRecordCreate, db: Session = Depends(get_db)):

    new_record = MedicalRecord(**record.dict())

    db.add(new_record)
    db.commit()
    db.refresh(new_record)

    return new_record


@router.get("/medical_records/{patient_id}")
def get_medical_records(patient_id: int, db: Session = Depends(get_db)):

    records = db.query(MedicalRecord).filter(MedicalRecord.patient_id == patient_id).all()

    return records