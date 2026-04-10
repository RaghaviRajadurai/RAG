from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models.patient import Patient
from app.schemas.patient_schema import PatientCreate

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/add_patient")
def add_patient(patient: PatientCreate, db: Session = Depends(get_db)):

    new_patient = Patient(**patient.dict())

    db.add(new_patient)
    db.commit()
    db.refresh(new_patient)

    return new_patient


@router.get("/patients")
def get_patients(db: Session = Depends(get_db)):

    return db.query(Patient).all()

@router.delete("/delete_patient/{patient_id}")
def delete_patient(patient_id: int, db: Session = Depends(get_db)):

    patient = db.query(Patient).filter(Patient.id == patient_id).first()

    if not patient:
        return {"message": "Patient not found"}

    db.delete(patient)
    db.commit()

    return {"message": "Patient deleted successfully"}


@router.put("/update_patient/{patient_id}")
def update_patient(patient_id: int, patient: PatientCreate, db: Session = Depends(get_db)):

    existing_patient = db.query(Patient).filter(Patient.id == patient_id).first()

    if not existing_patient:
        return {"message": "Patient not found"}

    existing_patient.name = patient.name
    existing_patient.age = patient.age
    existing_patient.gender = patient.gender
    existing_patient.diagnosis = patient.diagnosis
    existing_patient.prescription = patient.prescription

    db.commit()
    db.refresh(existing_patient)

    return {"message": "Patient updated successfully", "data": existing_patient}