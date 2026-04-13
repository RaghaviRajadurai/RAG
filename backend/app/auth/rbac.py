import os
import smtplib
from datetime import datetime

from bson import ObjectId
from bson.errors import InvalidId
from fastapi import Depends, HTTPException

from app.auth.auth_bearer import JWTBearer
from app.database import audit_logs_collection, patients_collection, users_collection


def _normalize_role(role: str | None) -> str:
    return (role or "").strip().lower()


def _send_admin_email(subject: str, body: str) -> None:
    email_host = os.environ.get("EMAIL_HOST")
    email_port = int(os.environ.get("EMAIL_PORT", 465))
    email_user = os.environ.get("EMAIL_USER")
    email_password = os.environ.get("EMAIL_PASSWORD")
    email_from = os.environ.get("EMAIL_FROM", email_user)
    admin_emails = os.environ.get("ADMIN_ALERT_EMAILS", "")

    recipients = [item.strip() for item in admin_emails.split(",") if item.strip()]
    if not recipients:
        return

    if not email_host or not email_user or not email_password:
        print("[RBAC ALERT][DEV MODE]", subject)
        print(body)
        return

    message = f"Subject: {subject}\nFrom: {email_from}\nTo: {', '.join(recipients)}\n\n{body}"

    if email_port == 465:
        server = smtplib.SMTP_SSL(email_host, email_port)
    else:
        server = smtplib.SMTP(email_host, email_port)

    with server:
        if email_port != 465:
            server.starttls()
        server.login(email_user, email_password)
        server.sendmail(email_from, recipients, message)


def write_audit_log(
    *,
    actor_user_id: str,
    actor_username: str | None,
    actor_role: str | None,
    action: str,
    status: str,
    resource: str,
    target_patient_id: str | None = None,
    details: dict | None = None,
) -> None:
    payload = {
        "timestamp": datetime.utcnow(),
        "actor_user_id": actor_user_id,
        "actor_username": actor_username,
        "actor_role": actor_role,
        "action": action,
        "status": status,
        "resource": resource,
        "target_patient_id": target_patient_id,
        "details": details or {},
    }
    audit_logs_collection.insert_one(payload)


def notify_admin_team(event: str, *, actor: dict, target_patient_id: str | None, details: dict | None = None) -> None:
    role = actor.get("role", "unknown")
    username = actor.get("username", "unknown")
    user_id = str(actor.get("_id"))

    subject = f"RBAC Alert: {event}"
    body = (
        f"Event: {event}\n"
        f"Time (UTC): {datetime.utcnow().isoformat()}\n"
        f"Actor: {username} ({role})\n"
        f"Actor User ID: {user_id}\n"
        f"Target Patient ID: {target_patient_id or 'N/A'}\n"
        f"Details: {details or {}}\n"
    )
    _send_admin_email(subject, body)


def get_current_user(token_payload=Depends(JWTBearer())) -> dict:
    user_id = token_payload.get("user_id")
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid auth token")

    try:
        oid = ObjectId(user_id)
    except (InvalidId, TypeError) as exc:
        raise HTTPException(status_code=401, detail="Invalid auth token") from exc

    user = users_collection.find_one({"_id": oid})

    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    return user


def require_roles(user: dict, allowed_roles: set[str]) -> None:
    role = _normalize_role(user.get("role"))
    if role not in allowed_roles:
        raise HTTPException(status_code=403, detail="Insufficient permissions")


def is_lab_technician(user: dict) -> bool:
    return _normalize_role(user.get("role")) in {"lab technician", "lab_technician", "lab-technician"}


def get_user_patient_profile_id(user: dict) -> str | None:
    # If linked explicitly, use the stored profile id.
    patient_profile_id = user.get("patient_profile_id")
    if patient_profile_id:
        return str(patient_profile_id)

    # Fallback: first patient doc owned by this user.
    owned = patients_collection.find_one({"owner_user_id": str(user.get("_id"))}, {"_id": 1})
    if owned:
        return str(owned["_id"])

    return None


def ensure_patient_can_access_target(user: dict, target_patient_id: str, action: str, resource: str) -> None:
    role = _normalize_role(user.get("role"))

    # Doctor/Admin can access all patient data.
    if role in {"doctor", "admin"}:
        return

    # Lab technician cannot access non-report resources.
    if role in {"lab technician", "lab_technician", "lab-technician"}:
        write_audit_log(
            actor_user_id=str(user.get("_id")),
            actor_username=user.get("username"),
            actor_role=user.get("role"),
            action=action,
            status="denied",
            resource=resource,
            target_patient_id=target_patient_id,
            details={"reason": "Lab technician attempted non-report data access"},
        )
        notify_admin_team(
            "Lab technician attempted non-report patient data access",
            actor=user,
            target_patient_id=target_patient_id,
            details={"resource": resource, "action": action},
        )
        raise HTTPException(status_code=403, detail="Lab technician can only access report data")

    if role != "patient":
        raise HTTPException(status_code=403, detail="Insufficient permissions")

    own_patient_id = get_user_patient_profile_id(user)
    if own_patient_id != str(target_patient_id):
        write_audit_log(
            actor_user_id=str(user.get("_id")),
            actor_username=user.get("username"),
            actor_role=user.get("role"),
            action=action,
            status="denied",
            resource=resource,
            target_patient_id=target_patient_id,
            details={
                "reason": "Patient attempted access to another patient's data",
                "own_patient_id": own_patient_id,
            },
        )
        notify_admin_team(
            "Cross-patient access attempt blocked",
            actor=user,
            target_patient_id=target_patient_id,
            details={"resource": resource, "action": action, "own_patient_id": own_patient_id},
        )
        raise HTTPException(status_code=403, detail="Patients can only access their own data")
