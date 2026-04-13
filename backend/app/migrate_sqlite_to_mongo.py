import argparse
import sqlite3
from datetime import datetime
from pathlib import Path

from database import (
    medical_records_collection,
    otp_verifications_collection,
    patients_collection,
    records_collection,
    users_collection,
)


def parse_datetime(value):
    if value is None:
        return None
    if isinstance(value, datetime):
        return value
    if isinstance(value, str):
        cleaned = value.replace("Z", "+00:00")
        try:
            return datetime.fromisoformat(cleaned)
        except ValueError:
            return value
    return value


def rows_from_table(cursor, table_name):
    cursor.execute(f"SELECT * FROM {table_name}")
    columns = [col[0] for col in cursor.description]
    return [dict(zip(columns, row)) for row in cursor.fetchall()]


def migrate(sqlite_path: Path, wipe: bool = False):
    if not sqlite_path.exists():
        raise FileNotFoundError(f"SQLite DB not found: {sqlite_path}")

    if wipe:
        patients_collection.delete_many({})
        medical_records_collection.delete_many({})
        records_collection.delete_many({})
        users_collection.delete_many({})
        otp_verifications_collection.delete_many({})

    conn = sqlite3.connect(str(sqlite_path))
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    users = rows_from_table(cursor, "users")
    otp_rows = rows_from_table(cursor, "otp_verifications")
    patients = rows_from_table(cursor, "patients")
    medical_rows = rows_from_table(cursor, "medical_records")
    records_rows = rows_from_table(cursor, "records")

    patient_id_map = {}

    for row in users:
        payload = {
            "legacy_sqlite_id": row.get("id"),
            "username": row.get("username"),
            "email": row.get("email"),
            "password": row.get("password"),
            "role": row.get("role"),
        }
        users_collection.update_one(
            {"legacy_sqlite_id": row.get("id")},
            {"$set": payload},
            upsert=True,
        )

    for row in otp_rows:
        payload = {
            "legacy_sqlite_id": row.get("id"),
            "username": row.get("username"),
            "email": row.get("email"),
            "password_hash": row.get("password_hash"),
            "role": row.get("role"),
            "otp_code": row.get("otp_code"),
            "expires_at": parse_datetime(row.get("expires_at")),
            "verified": bool(row.get("verified")),
            "created_at": parse_datetime(row.get("created_at")),
        }
        otp_verifications_collection.update_one(
            {"legacy_sqlite_id": row.get("id")},
            {"$set": payload},
            upsert=True,
        )

    for row in patients:
        payload = {
            "legacy_sqlite_id": row.get("id"),
            "name": row.get("name"),
            "age": row.get("age"),
            "gender": row.get("gender"),
            "diagnosis": row.get("diagnosis"),
            "prescription": row.get("prescription"),
        }
        result = patients_collection.update_one(
            {"legacy_sqlite_id": row.get("id")},
            {"$set": payload},
            upsert=True,
        )

        if result.upserted_id is not None:
            patient_id_map[row.get("id")] = str(result.upserted_id)
        else:
            existing = patients_collection.find_one({"legacy_sqlite_id": row.get("id")}, {"_id": 1})
            if existing:
                patient_id_map[row.get("id")] = str(existing["_id"])

    for row in medical_rows:
        payload = {
            "legacy_sqlite_id": row.get("id"),
            "patient_id": patient_id_map.get(row.get("patient_id"), str(row.get("patient_id"))),
            "doctor_name": row.get("doctor_name"),
            "diagnosis": row.get("diagnosis"),
            "treatment": row.get("treatment"),
            "lab_report": row.get("lab_report"),
        }
        medical_records_collection.update_one(
            {"legacy_sqlite_id": row.get("id")},
            {"$set": payload},
            upsert=True,
        )

    for row in records_rows:
        payload = {
            "legacy_sqlite_id": row.get("id"),
            "patient_id": patient_id_map.get(row.get("patient_id"), str(row.get("patient_id"))),
            "report_type": row.get("report_type"),
            "description": row.get("description"),
        }
        records_collection.update_one(
            {"legacy_sqlite_id": row.get("id")},
            {"$set": payload},
            upsert=True,
        )

    conn.close()

    return {
        "users": len(users),
        "otp_verifications": len(otp_rows),
        "patients": len(patients),
        "medical_records": len(medical_rows),
        "records": len(records_rows),
    }


def main():
    parser = argparse.ArgumentParser(description="Migrate legacy SQLite data into MongoDB")
    parser.add_argument(
        "--sqlite",
        default="../healthcare.db",
        help="Path to SQLite database file (default: ../healthcare.db)",
    )
    parser.add_argument(
        "--wipe",
        action="store_true",
        help="Delete existing MongoDB collections before migration",
    )
    args = parser.parse_args()

    sqlite_path = Path(args.sqlite).resolve()
    stats = migrate(sqlite_path=sqlite_path, wipe=args.wipe)
    print("Migration complete:")
    for key, value in stats.items():
        print(f"- {key}: {value}")


if __name__ == "__main__":
    main()
