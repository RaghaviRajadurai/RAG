from datetime import datetime
from io import BytesIO

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from bson import ObjectId
from bson.errors import InvalidId
from fastapi.responses import StreamingResponse
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas

from app.database import patients_collection, records_collection

from app.auth.rbac import get_current_user, require_roles

router = APIRouter()


class DischargePreviewRequest(BaseModel):
    patient_search: str | None = None


class ReportSummaryRequest(BaseModel):
    patient_search: str | None = None
    query: str | None = None
    ai_answer: str | None = None


class DischargePdfRequest(BaseModel):
    patient_id: str | None = None
    patient_name: str | None = None
    diagnosis: str
    treatment: str
    labs: str
    followUp: str


class ReportPdfRequest(BaseModel):
    patient_id: str | None = None
    patient_name: str | None = None
    summary: str
    query: str | None = None
    ai_answer: str | None = None


def _resolve_patient(patient_search: str | None):
    if patient_search and patient_search.strip():
        term = patient_search.strip()
        patient_id_filter = None
        try:
            patient_id_filter = ObjectId(term)
        except (InvalidId, TypeError):
            patient_id_filter = None

        query_options = [{"name": {"$regex": term, "$options": "i"}}]
        if patient_id_filter:
            query_options.append({"_id": patient_id_filter})

        patient = patients_collection.find_one(
            {"$or": query_options}
        )
        if patient:
            return patient

    # Fallback to latest patient for usable preview/demo behavior
    return patients_collection.find_one(sort=[("_id", -1)])


def _resolve_latest_record(patient_id: str | None):
    if not patient_id:
        return None
    return records_collection.find_one({"patient_id": str(patient_id)}, sort=[("updated_at", -1)])

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


@router.post("/doctor/discharge/preview")
def discharge_preview(payload: DischargePreviewRequest, current_user: dict = Depends(get_current_user)):
    require_roles(current_user, {"doctor", "admin"})

    patient = _resolve_patient(payload.patient_search)
    if not patient:
        raise HTTPException(status_code=404, detail="No patient found for preview")

    patient_id = str(patient.get("_id"))
    patient_name = patient.get("name") or "Unknown"
    record = _resolve_latest_record(patient_id)

    diagnosis = (record or {}).get("diagnosis") or (patient.get("diagnosis") or "Condition not specified")
    treatment = (record or {}).get("treatment") or (patient.get("prescription") or "Treatment details pending")
    labs = (record or {}).get("lab_report") or "Lab details pending"

    return {
        "patient_id": patient_id,
        "patient_name": patient_name,
        "diagnosis": diagnosis,
        "treatment": treatment,
        "labs": labs,
        "followUp": "Follow-up in 7 days with repeat investigations as clinically indicated.",
        "generated_at": datetime.utcnow().isoformat(),
    }


@router.post("/doctor/report/summary")
def generate_report_summary(payload: ReportSummaryRequest, current_user: dict = Depends(get_current_user)):
    require_roles(current_user, {"doctor", "admin"})

    patient = _resolve_patient(payload.patient_search)
    if not patient:
        raise HTTPException(status_code=404, detail="No patient found for report")

    patient_id = str(patient.get("_id"))
    patient_name = patient.get("name") or "Unknown"
    record = _resolve_latest_record(patient_id)

    diagnosis = (record or {}).get("diagnosis") or (patient.get("diagnosis") or "Condition not specified")
    treatment = (record or {}).get("treatment") or (patient.get("prescription") or "Treatment details pending")
    lab_report = (record or {}).get("lab_report") or "Lab details pending"

    summary = (
        f"Patient: {patient_name}\n"
        f"Diagnosis: {diagnosis}\n"
        f"Treatment: {treatment}\n"
        f"Lab Report: {lab_report}\n"
        f"Clinical Query: {payload.query or 'N/A'}\n"
        f"AI Answer: {payload.ai_answer or 'N/A'}\n"
        "Plan: Continue current management and reassess in follow-up."
    )

    return {
        "patient_id": patient_id,
        "patient_name": patient_name,
        "summary": summary,
        "generated_at": datetime.utcnow().isoformat(),
    }


def _draw_wrapped_text(pdf: canvas.Canvas, text: str, x: int, y: int, max_chars: int = 95, line_height: int = 16):
    remaining = text or ""
    current_y = y
    while remaining:
        chunk = remaining[:max_chars]
        if len(remaining) > max_chars:
            split_at = chunk.rfind(" ")
            if split_at > 20:
                chunk = chunk[:split_at]
        pdf.drawString(x, current_y, chunk)
        remaining = remaining[len(chunk):].lstrip()
        current_y -= line_height
    return current_y


@router.post("/doctor/discharge/pdf")
def generate_discharge_pdf(payload: DischargePdfRequest, current_user: dict = Depends(get_current_user)):
    require_roles(current_user, {"doctor", "admin"})

    buffer = BytesIO()
    pdf = canvas.Canvas(buffer, pagesize=A4)
    width, height = A4

    y = height - 50
    pdf.setFont("Helvetica-Bold", 16)
    pdf.drawString(40, y, "Discharge Summary")
    y -= 28

    pdf.setFont("Helvetica", 11)
    pdf.drawString(40, y, f"Generated: {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S UTC')}")
    y -= 18
    pdf.drawString(40, y, f"Patient: {payload.patient_name or 'Unknown'}")
    y -= 18
    pdf.drawString(40, y, f"Patient ID: {payload.patient_id or 'N/A'}")
    y -= 28

    sections = [
        ("Diagnosis", payload.diagnosis),
        ("Treatment", payload.treatment),
        ("Lab Results", payload.labs),
        ("Follow-up", payload.followUp),
    ]

    for title, text in sections:
        pdf.setFont("Helvetica-Bold", 12)
        pdf.drawString(40, y, title)
        y -= 16
        pdf.setFont("Helvetica", 11)
        y = _draw_wrapped_text(pdf, text or "N/A", 40, y)
        y -= 14
        if y < 80:
            pdf.showPage()
            y = height - 50

    pdf.save()
    buffer.seek(0)

    file_name = f"discharge_summary_{(payload.patient_name or 'patient').replace(' ', '_').lower()}.pdf"
    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{file_name}"'},
    )


@router.post("/doctor/report/pdf")
def generate_structured_report_pdf(payload: ReportPdfRequest, current_user: dict = Depends(get_current_user)):
    require_roles(current_user, {"doctor", "admin"})

    buffer = BytesIO()
    pdf = canvas.Canvas(buffer, pagesize=A4)
    width, height = A4

    y = height - 50
    pdf.setFont("Helvetica-Bold", 16)
    pdf.drawString(40, y, "Structured Clinical Report")
    y -= 28

    pdf.setFont("Helvetica", 11)
    pdf.drawString(40, y, f"Generated: {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S UTC')}")
    y -= 18
    pdf.drawString(40, y, f"Patient: {payload.patient_name or 'Unknown'}")
    y -= 18
    pdf.drawString(40, y, f"Patient ID: {payload.patient_id or 'N/A'}")
    y -= 28

    sections = [
        ("Clinical Query", payload.query or "N/A"),
        ("AI Answer", payload.ai_answer or "N/A"),
        ("Structured Summary", payload.summary),
    ]

    for title, text in sections:
        pdf.setFont("Helvetica-Bold", 12)
        pdf.drawString(40, y, title)
        y -= 16
        pdf.setFont("Helvetica", 11)
        y = _draw_wrapped_text(pdf, text or "N/A", 40, y)
        y -= 14
        if y < 80:
            pdf.showPage()
            y = height - 50

    pdf.save()
    buffer.seek(0)

    file_name = f"structured_report_{(payload.patient_name or 'patient').replace(' ', '_').lower()}.pdf"
    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{file_name}"'},
    )