from fastapi import APIRouter, Depends, HTTPException

from app.auth.rbac import ensure_patient_can_access_target, get_current_user, require_roles
from app.database import medical_records_collection, serialize_document, serialize_documents
from app.schemas.medical_record_schema import MedicalRecordCreate

router = APIRouter()


@router.post("/add_medical_record")
def add_medical_record(record: MedicalRecordCreate, current_user: dict = Depends(get_current_user)):
    require_roles(current_user, {"doctor", "admin"})

    payload = record.dict()
    payload["patient_id"] = str(payload["patient_id"])

    result = medical_records_collection.insert_one(payload)
    created = medical_records_collection.find_one({"_id": result.inserted_id})
    return serialize_document(created)


@router.get("/medical_records/{patient_id}")
def get_medical_records(patient_id: str, current_user: dict = Depends(get_current_user)):
    role = (current_user.get("role") or "").strip().lower()
    if role == "patient":
        ensure_patient_can_access_target(
            current_user,
            target_patient_id=str(patient_id),
            action="read_medical_records",
            resource="medical_records",
        )
    elif role not in {"doctor", "admin"}:
        raise HTTPException(status_code=403, detail="Insufficient permissions")

    records = list(medical_records_collection.find({"patient_id": str(patient_id)}))
    return serialize_documents(records)