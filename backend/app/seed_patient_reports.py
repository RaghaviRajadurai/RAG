from __future__ import annotations

from datetime import UTC, datetime

from app.database import patients_collection, records_collection


def main() -> None:
    doctor_names = [
        "Dr. Arjun Mehta",
        "Dr. Nisha Reddy",
        "Dr. Kavita Sharma",
        "Dr. Rahul Menon",
    ]
    diagnoses = [
        "Type 2 Diabetes Mellitus",
        "Hypertension",
        "Dengue Fever Recovery",
        "Iron Deficiency Anemia",
        "Asthma Follow-up",
    ]
    treatments = [
        "Metformin 500mg twice daily and dietary management",
        "Telmisartan 40mg once daily with salt restriction",
        "Hydration therapy and platelet monitoring",
        "Oral iron supplementation for 12 weeks",
        "Inhaled budesonide and trigger avoidance",
    ]
    lab_reports = [
        "HbA1c 7.2%, Fasting glucose 138 mg/dL",
        "BP average 148/92 mmHg, Renal panel normal",
        "Platelet count improved to 1.6 lakh/uL",
        "Hemoglobin 9.8 g/dL, Ferritin low",
        "FEV1 improved by 11% from baseline",
    ]

    patients = list(patients_collection.find().sort("_id", 1))
    created_or_updated = 0

    for idx, patient in enumerate(patients):
        patient_id = str(patient["_id"])
        report_type = "Comprehensive Lab Report"

        payload = {
            "patient_id": patient_id,
            "gender": patient.get("gender") or "Unknown",
            "doctor_name": doctor_names[idx % len(doctor_names)],
            "diagnosis": diagnoses[idx % len(diagnoses)],
            "treatment": treatments[idx % len(treatments)],
            "lab_report": lab_reports[idx % len(lab_reports)],
            "description": f"Clinical report generated for {patient.get('name') or 'Patient'}",
            "report_type": report_type,
            "status": "pending",
            "updated_at": datetime.now(UTC),
            "created_at": datetime.now(UTC),
        }

        records_collection.update_one(
            {"patient_id": patient_id, "report_type": report_type},
            {"$set": payload},
            upsert=True,
        )
        created_or_updated += 1

    print(f"Reports seeded/updated: {created_or_updated}")


if __name__ == "__main__":
    main()
