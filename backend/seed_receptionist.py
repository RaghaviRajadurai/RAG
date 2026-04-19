import os
from datetime import datetime
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), "app", ".env"))

from app.database import users_collection
from app.auth.auth_handler import hash_password

def seed_receptionist():
    receptionist_data = {
        "username": "desk.reception@hospital.in",
        "email": "desk.reception@hospital.in",
        "password": hash_password("Reception@101"),
        "role": "receptionist",
        "created_at": datetime.utcnow()
    }
    
    existing = users_collection.find_one({"email": receptionist_data["email"]})
    if existing:
        print(f"Receptionist already exists: {receptionist_data['email']}")
        return
        
    users_collection.insert_one(receptionist_data)
    print(f"Successfully seeded Receptionist role!")
    print(f"Email: {receptionist_data['email']}")
    print(f"Password: Reception@101")

if __name__ == "__main__":
    seed_receptionist()