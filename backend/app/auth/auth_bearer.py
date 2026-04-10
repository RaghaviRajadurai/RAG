
from fastapi import Request, HTTPException
from fastapi.security import HTTPBearer
from jose import jwt

SECRET_KEY = "healthcareprojectsecret"
ALGORITHM = "HS256"

class JWTBearer(HTTPBearer):

    async def __call__(self, request: Request):

        credentials = await super().__call__(request)

        if credentials:
            try:
                payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
                return payload
            except:
                raise HTTPException(status_code=403, detail="Invalid token")