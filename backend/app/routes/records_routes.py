from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query
from bson import ObjectId
from bson.errors import InvalidId

from app.auth.rbac import ensure_patient_can_access_target, get_current_user, require_roles
from app.database import patients_collection, records_collection, serialize_document, serialize_documents
from app.schemas.record_schema import RecordCreate, RecordUpdate

router = APIRouter()


def _normalize_role(role: str | None) -> str:
    return (role or "").strip().lower().replace("_", "-")


def _is_lab_role(role: str) -> bool:
    return role in {"lab technician", "lab-technician"}


def _enrich_with_patient_names(records: list[dict]) -> list[dict]:
    if not records:
        return records

    patient_ids = {str(item.get("patient_id")) for item in records if item.get("patient_id")}
    object_ids: list[ObjectId] = []
    for patient_id in patient_ids:
        try:
            object_ids.append(ObjectId(patient_id))
        except (InvalidId, TypeError):
            continue

    name_map: dict[str, str] = {}
    if object_ids:
        for patient in patients_collection.find({"_id": {"$in": object_ids}}, {"name": 1}):
            name_map[str(patient["_id"])] = patient.get("name") or "Unknown"

    for item in records:
        pid = str(item.get("patient_id") or "")
        item["patient_name"] = name_map.get(pid, "Unknown")

    return records


@router.post("/add_record")
def add_record(record: RecordCreate, current_user: dict = Depends(get_current_user)):
    require_roles(current_user, {"doctor", "admin", "lab technician", "lab_technician", "lab-technician"})

    payload = record.dict()
    payload["patient_id"] = str(payload["patient_id"])
    payload["status"] = (payload.get("status") or "pending").lower()
    payload["updated_at"] = datetime.utcnow()
    payload["created_at"] = datetime.utcnow()

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
    records = _enrich_with_patient_names(records)
    return serialize_documents(records)


@router.get("/reports")
def list_reports(current_user: dict = Depends(get_current_user)):
    role = (current_user.get("role") or "").strip().lower()
    if role not in {"doctor", "admin", "lab technician", "lab_technician", "lab-technician"}:
        raise HTTPException(status_code=403, detail="Insufficient permissions")

    reports = list(records_collection.find().sort("updated_at", -1))
    reports = _enrich_with_patient_names(reports)
    return serialize_documents(reports)


@router.get("/reports/queue")
def get_report_queue(
    status: str | None = Query(default=None),
    doctor_name: str | None = Query(default=None),
    report_type: str | None = Query(default=None),
    q: str | None = Query(default=None),
    current_user: dict = Depends(get_current_user),
):
    role = (current_user.get("role") or "").strip().lower()
    if role not in {"doctor", "admin", "lab technician", "lab_technician", "lab-technician"}:
        raise HTTPException(status_code=403, detail="Insufficient permissions")

    normalized_status = (status or "").strip().lower()
    allowed_statuses = {"pending", "in_review", "verified"}
    query: dict = {
        "status": {"$in": ["pending", "in_review"] if not normalized_status else [normalized_status]}
    }

    if normalized_status and normalized_status not in allowed_statuses:
        raise HTTPException(status_code=400, detail="Invalid status filter")

    if doctor_name:
        query["doctor_name"] = {"$regex": doctor_name, "$options": "i"}
    if report_type:
        query["report_type"] = {"$regex": report_type, "$options": "i"}

    queue = list(records_collection.find(query).sort("updated_at", -1))
    queue = _enrich_with_patient_names(queue)

    if q:
        q_lower = q.strip().lower()
        queue = [
            item
            for item in queue
            if q_lower in str(item.get("patient_id", "")).lower()
            or q_lower in str(item.get("patient_name", "")).lower()
            or q_lower in str(item.get("doctor_name", "")).lower()
            or q_lower in str(item.get("report_type", "")).lower()
        ]

    return serialize_documents(queue)


@router.put("/reports/{report_id}")
def update_report(report_id: str, update: RecordUpdate, current_user: dict = Depends(get_current_user)):
    require_roles(current_user, {"doctor", "admin", "lab technician", "lab_technician", "lab-technician"})
    role = _normalize_role(current_user.get("role"))

    try:
        oid = ObjectId(report_id)
    except (InvalidId, TypeError) as exc:
        raise HTTPException(status_code=400, detail="Invalid report id") from exc

    payload = {k: v for k, v in update.dict().items() if v is not None}
    if not payload:
        raise HTTPException(status_code=400, detail="No fields to update")

    existing = records_collection.find_one({"_id": oid})
    if not existing:
        raise HTTPException(status_code=404, detail="Report not found")

    existing_status = str(existing.get("status") or "pending").lower()

    if "status" in payload:
        requested_status = str(payload["status"]).lower()
        if requested_status not in {"pending", "in_review"}:
            raise HTTPException(status_code=400, detail="Use verify endpoint to set status to verified")

        if existing_status == "pending" and requested_status not in {"pending", "in_review"}:
            raise HTTPException(status_code=400, detail="Invalid status transition")
        if existing_status == "in_review" and requested_status != "in_review":
            raise HTTPException(status_code=400, detail="Only verify endpoint can move in_review forward")

        if _is_lab_role(role) and requested_status == "pending":
            raise HTTPException(status_code=403, detail="Lab technician cannot move report back to pending")

        payload["status"] = requested_status
    elif _is_lab_role(role) and existing_status == "pending":
        payload["status"] = "in_review"

    payload["updated_at"] = datetime.utcnow()

    result = records_collection.update_one({"_id": oid}, {"$set": payload})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Report not found")

    updated = records_collection.find_one({"_id": oid})
    updated = _enrich_with_patient_names([updated])[0]
    return serialize_document(updated)


@router.put("/reports/{report_id}/verify")
def verify_report(report_id: str, current_user: dict = Depends(get_current_user)):
    require_roles(current_user, {"doctor", "admin", "lab technician", "lab_technician", "lab-technician"})

    try:
        oid = ObjectId(report_id)
    except (InvalidId, TypeError) as exc:
        raise HTTPException(status_code=400, detail="Invalid report id") from exc

    existing = records_collection.find_one({"_id": oid})
    if not existing:
        raise HTTPException(status_code=404, detail="Report not found")

    if str(existing.get("status") or "pending").lower() != "in_review":
        raise HTTPException(status_code=400, detail="Only in_review reports can be verified")

    result = records_collection.update_one(
        {"_id": oid},
        {
            "$set": {
                "status": "verified",
                "verified_by": str(current_user.get("username") or current_user.get("_id")),
                "verified_by_role": str(current_user.get("role") or "unknown"),
                "verified_at": datetime.utcnow(),
                "updated_at": datetime.utcnow(),
            }
        },
    )

    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Report not found")

    updated = records_collection.find_one({"_id": oid})
    updated = _enrich_with_patient_names([updated])[0]
    return serialize_document(updated)