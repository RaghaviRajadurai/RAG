from fastapi import APIRouter

router = APIRouter()

@router.get("/doctor/dashboard")
def doctor_dashboard():
    return {
        "message": "Doctor Dashboard",
        "features": [
            "View Patients",
            "View Records",
            "Write Prescriptions"
        ]
    }