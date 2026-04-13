import os
from datetime import datetime, timedelta

from jose import jwt

SECRET_KEY = os.getenv("JWT_SECRET_KEY", "healthcareproject")
ALGORITHM = "HS256"

def create_token(user_id: str, role: str):

    payload = {
        "user_id": user_id,
        "role": role,
        "exp": datetime.utcnow() + timedelta(hours=2)
    }

    token = jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)

    return token