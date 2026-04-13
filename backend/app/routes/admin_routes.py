from fastapi import APIRouter, Depends

from app.auth.rbac import get_current_user, require_roles
from app.database import audit_logs_collection, serialize_documents

router = APIRouter()


@router.get("/admin/audit-logs")
def get_audit_logs(limit: int = 100, current_user: dict = Depends(get_current_user)):
    require_roles(current_user, {"admin"})

    bounded_limit = min(max(limit, 1), 500)
    logs = list(audit_logs_collection.find().sort("timestamp", -1).limit(bounded_limit))
    return serialize_documents(logs)
