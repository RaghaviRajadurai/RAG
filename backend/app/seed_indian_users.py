from __future__ import annotations

import re
from datetime import UTC, datetime

from app.auth.auth_handler import hash_password
from app.database import patients_collection, users_collection


def slugify_name(name: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", ".", name.lower()).strip(".")
    return slug or "patient"


def seed_patient_users() -> list[dict]:
    patient_docs = list(patients_collection.find().sort("_id", 1))
    fallback_names = [
        "Ananya Sharma",
        "Rohan Iyer",
        "Kavya Menon",
        "Vikram Singh",
        "Ishita Rao",
        "Devansh Gupta",
    ]

    creds: list[dict] = []

    for idx, patient in enumerate(patient_docs, start=1):
        patient_id = str(patient["_id"])
        raw_name = (patient.get("name") or "").strip()

        if not raw_name or raw_name.lower() in {"string", "unknown", "test"}:
            raw_name = fallback_names[(idx - 1) % len(fallback_names)]
            patients_collection.update_one(
                {"_id": patient["_id"]},
                {"$set": {"name": raw_name}},
            )

        local_part = slugify_name(raw_name)
        username = f"{local_part}.{idx:02d}@patient.health.in"
        password_plain = f"Patient@{100 + idx}"

        user_doc = {
            "full_name": raw_name,
            "username": username,
            "email": username,
            "password": hash_password(password_plain),
            "role": "Patient",
            "patient_profile_id": patient_id,
            "created_at": datetime.now(UTC),
        }

        users_collection.update_one(
            {"username": username},
            {"$set": user_doc},
            upsert=True,
        )

        user = users_collection.find_one({"username": username}, {"_id": 1})
        if user:
            patients_collection.update_one(
                {"_id": patient["_id"]},
                {"$set": {"owner_user_id": str(user["_id"])}},
            )

        creds.append(
            {
                "role": "Patient",
                "name": raw_name,
                "username": username,
                "password": password_plain,
            }
        )

    return creds


def seed_staff_users() -> list[dict]:
    staff_seed = [
        {
            "role": "Doctor",
            "full_name": "Dr. Arjun Mehta",
            "username": "arjun.mehta@hospital.in",
            "password": "Doctor@201",
        },
        {
            "role": "Doctor",
            "full_name": "Dr. Nisha Reddy",
            "username": "nisha.reddy@hospital.in",
            "password": "Doctor@202",
        },
        {
            "role": "Lab technician",
            "full_name": "Ritesh Kulkarni",
            "username": "ritesh.kulkarni@hospital.in",
            "password": "LabTech@301",
        },
        {
            "role": "Lab technician",
            "full_name": "Pooja Chawla",
            "username": "pooja.chawla@hospital.in",
            "password": "LabTech@302",
        },
        {
            "role": "Admin",
            "full_name": "Sanjay Bhattacharya",
            "username": "sanjay.bhattacharya@hospital.in",
            "password": "Admin@401",
        },
    ]

    creds: list[dict] = []

    for entry in staff_seed:
        users_collection.update_one(
            {"username": entry["username"]},
            {
                "$set": {
                    "full_name": entry["full_name"],
                    "username": entry["username"],
                    "email": entry["username"],
                    "password": hash_password(entry["password"]),
                    "role": entry["role"],
                    "created_at": datetime.now(UTC),
                }
            },
            upsert=True,
        )
        creds.append(
            {
                "role": entry["role"],
                "name": entry["full_name"],
                "username": entry["username"],
                "password": entry["password"],
            }
        )

    return creds


def main() -> None:
    patient_creds = seed_patient_users()
    staff_creds = seed_staff_users()
    all_creds = patient_creds + staff_creds

    print(f"Seeded/updated patient credentials: {len(patient_creds)}")
    print(f"Seeded/updated staff credentials: {len(staff_creds)}")
    print("--- CREDENTIALS ---")
    for item in all_creds:
        print(
            f"{item['role']} | {item['name']} | {item['username']} | {item['password']}"
        )


if __name__ == "__main__":
    main()
