import os
from pathlib import Path

from bson import ObjectId
from bson.errors import InvalidId
from dotenv import load_dotenv
from pymongo import MongoClient
from pymongo.errors import ConfigurationError


load_dotenv(Path(__file__).resolve().parent / ".env")

MONGODB_URI = os.getenv("MONGODB_URI")

if not MONGODB_URI:
    raise RuntimeError("MONGODB_URI is not set. Add it to backend/app/.env")

mongo_client = MongoClient(MONGODB_URI)
try:
    mongo_db = mongo_client.get_default_database()
except ConfigurationError:
    mongo_db = None

if mongo_db is None:
    mongo_db = mongo_client[os.getenv("MONGODB_DB", "healthcare_db")]

patients_collection = mongo_db["patients"]
medical_records_collection = mongo_db["medical_records"]
records_collection = mongo_db["records"]
users_collection = mongo_db["users"]
otp_verifications_collection = mongo_db["otp_verifications"]
audit_logs_collection = mongo_db["audit_logs"]


def parse_object_id(value: str) -> ObjectId:
    try:
        return ObjectId(value)
    except (InvalidId, TypeError) as exc:
        raise ValueError("Invalid id format") from exc


def serialize_document(doc: dict | None) -> dict | None:
    if not doc:
        return None

    serialized = dict(doc)
    serialized["id"] = str(serialized.pop("_id"))
    return serialized


def serialize_documents(docs: list[dict]) -> list[dict]:
    return [serialize_document(doc) for doc in docs]