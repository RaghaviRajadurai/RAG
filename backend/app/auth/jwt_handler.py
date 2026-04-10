from jose import jwt
from datetime import datetime, timedelta

SECRET_KEY = "healthcareproject"
ALGORITHM = "HS256"

def create_token(user_id: int):

    payload = {
        "user_id": user_id,
        "exp": datetime.utcnow() + timedelta(hours=2)
    }

    token = jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)

    return token