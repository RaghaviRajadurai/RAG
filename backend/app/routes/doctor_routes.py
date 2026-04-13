from fastapi import APIRouter, Depends

from app.auth.rbac import get_current_user, require_roles

router = APIRouter()

@router.get("/doctor/dashboard")
def doctor_dashboard(current_user: dict = Depends(get_current_user)):
    require_roles(current_user, {"doctor", "admin"})

    return {
        "message": "Doctor Dashboard",
        "features": [
            "View Patients",
            "View Records",
            "Write Prescriptions"
        ]
    }