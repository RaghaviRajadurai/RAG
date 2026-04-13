
import os

from fastapi import HTTPException, Request
from fastapi.security import HTTPBearer
from jose import jwt

SECRET_KEY = os.getenv("JWT_SECRET_KEY", "healthcareproject")
ALGORITHM = "HS256"

class JWTBearer(HTTPBearer):

    async def __call__(self, request: Request):

        credentials = await super().__call__(request)

        if credentials:
            try:
                payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
                return payload
            except Exception:
                raise HTTPException(status_code=403, detail="Invalid token")