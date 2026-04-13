from fastapi import APIRouter, Depends, HTTPException

from app.auth.rbac import ensure_patient_can_access_target, get_current_user, get_user_patient_profile_id
from app.database import (
    patients_collection,
    parse_object_id,
    serialize_document,
    serialize_documents,
    users_collection,
)
from app.schemas.patient_schema import PatientCreate

router = APIRouter()


@router.post("/add_patient")
def add_patient(patient: PatientCreate, current_user: dict = Depends(get_current_user)):
    role = (current_user.get("role") or "").strip().lower()
    if role not in {"doctor", "admin", "patient"}:
        raise HTTPException(status_code=403, detail="Insufficient permissions")

    payload = patient.dict()
    if role == "patient":
        payload["owner_user_id"] = str(current_user["_id"])

    result = patients_collection.insert_one(payload)

    if role == "patient":
        users_collection.update_one(
            {"_id": current_user["_id"]},
            {"$set": {"patient_profile_id": str(result.inserted_id)}},
        )

    created = patients_collection.find_one({"_id": result.inserted_id})
    return serialize_document(created)


@router.get("/patients")
def get_patients(current_user: dict = Depends(get_current_user)):
    role = (current_user.get("role") or "").strip().lower()
    if role in {"doctor", "admin"}:
        return serialize_documents(list(patients_collection.find()))

    if role == "patient":
        own_id = get_user_patient_profile_id(current_user)
        if not own_id:
            return []
        doc = patients_collection.find_one({"_id": parse_object_id(own_id)})
        return serialize_documents([doc] if doc else [])

    raise HTTPException(status_code=403, detail="Insufficient permissions")


@router.get("/patients/{patient_id}")
def get_patient_by_id(patient_id: str, current_user: dict = Depends(get_current_user)):
    try:
        oid = parse_object_id(patient_id)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    ensure_patient_can_access_target(
        current_user,
        target_patient_id=patient_id,
        action="read_patient",
        resource="patients",
    )

    patient = patients_collection.find_one({"_id": oid})
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    return serialize_document(patient)


@router.delete("/delete_patient/{patient_id}")
def delete_patient(patient_id: str, current_user: dict = Depends(get_current_user)):
    role = (current_user.get("role") or "").strip().lower()
    try:
        oid = parse_object_id(patient_id)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    if role in {"doctor", "admin"}:
        pass
    elif role == "patient":
        ensure_patient_can_access_target(
            current_user,
            target_patient_id=patient_id,
            action="delete_patient",
            resource="patients",
        )
    else:
        raise HTTPException(status_code=403, detail="Insufficient permissions")

    result = patients_collection.delete_one({"_id": oid})
    if result.deleted_count == 0:
        return {"message": "Patient not found"}

    return {"message": "Patient deleted successfully"}


@router.put("/update_patient/{patient_id}")
def update_patient(patient_id: str, patient: PatientCreate, current_user: dict = Depends(get_current_user)):
    role = (current_user.get("role") or "").strip().lower()
    try:
        oid = parse_object_id(patient_id)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    if role in {"doctor", "admin"}:
        pass
    elif role == "patient":
        ensure_patient_can_access_target(
            current_user,
            target_patient_id=patient_id,
            action="update_patient",
            resource="patients",
        )
    else:
        raise HTTPException(status_code=403, detail="Insufficient permissions")

    payload = patient.dict()
    if role == "patient":
        payload["owner_user_id"] = str(current_user["_id"])

    result = patients_collection.update_one(
        {"_id": oid},
        {"$set": payload},
    )

    if result.matched_count == 0:
        return {"message": "Patient not found"}

    updated = patients_collection.find_one({"_id": oid})
    return {"message": "Patient updated successfully", "data": serialize_document(updated)}