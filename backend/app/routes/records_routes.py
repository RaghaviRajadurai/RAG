from fastapi import APIRouter, Depends, HTTPException

from app.auth.rbac import ensure_patient_can_access_target, get_current_user, require_roles
from app.database import records_collection, serialize_document, serialize_documents
from app.schemas.record_schema import RecordCreate

router = APIRouter()


@router.post("/add_record")
def add_record(record: RecordCreate, current_user: dict = Depends(get_current_user)):
    require_roles(current_user, {"doctor", "admin", "lab technician", "lab_technician", "lab-technician"})

    payload = record.dict()
    payload["patient_id"] = str(payload["patient_id"])

    result = records_collection.insert_one(payload)
    created = records_collection.find_one({"_id": result.inserted_id})
    return serialize_document(created)


@router.get("/records/{patient_id}")
def get_records(patient_id: str, current_user: dict = Depends(get_current_user)):
    role = (current_user.get("role") or "").strip().lower()
    if role == "patient":
        ensure_patient_can_access_target(
            current_user,
            target_patient_id=str(patient_id),
            action="read_records",
            resource="records",
        )
    elif role not in {"doctor", "admin", "lab technician", "lab_technician", "lab-technician"}:
        raise HTTPException(status_code=403, detail="Insufficient permissions")

    records = list(records_collection.find({"patient_id": str(patient_id)}))
    return serialize_documents(records)