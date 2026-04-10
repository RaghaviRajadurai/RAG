from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models.records import Record
from app.schemas.record_schema import RecordCreate

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.post("/add_record")
def add_record(record: RecordCreate, db: Session = Depends(get_db)):

    new_record = Record(**record.dict())

    db.add(new_record)
    db.commit()
    db.refresh(new_record)

    return new_record


@router.get("/records/{patient_id}")
def get_records(patient_id: int, db: Session = Depends(get_db)):

    records = db.query(Record).filter(Record.patient_id == patient_id).all()

    return records