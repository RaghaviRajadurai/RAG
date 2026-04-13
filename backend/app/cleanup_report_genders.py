from app.database import patients_collection, records_collection


def main() -> None:
    gender_map = {
        "Ananya Sharma": "Female",
        "Ravi Kumar": "Male",
        "Suresh Patel": "Male",
        "Priya Nair": "Female",
        "Rahul Verma": "Male",
        "Sneha Kapoor": "Female",
        "Karthik Srinivasan": "Male",
        "Meera Nair": "Female",
    }

    changed = 0
    for patient in patients_collection.find():
        name = (patient.get("name") or "").strip()
        gender = (patient.get("gender") or "").strip().lower()

        if gender in {"", "string", "unknown", "na", "n/a"}:
            normalized = gender_map.get(name, "Unknown")
            patients_collection.update_one(
                {"_id": patient["_id"]},
                {"$set": {"gender": normalized}},
            )
            records_collection.update_many(
                {"patient_id": str(patient["_id"])},
                {"$set": {"gender": normalized}},
            )
            changed += 1

    print(f"gender_cleanup_updated={changed}")


if __name__ == "__main__":
    main()
