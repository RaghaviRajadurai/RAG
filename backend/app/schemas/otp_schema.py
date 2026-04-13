from typing import Literal

from pydantic import BaseModel, EmailStr

class OTPRegisterRequest(BaseModel):
    username: str
    email: EmailStr
    password: str
    role: Literal["Doctor", "Patient", "Lab technician", "Admin"]

class OTPConfirmRequest(BaseModel):
    email: EmailStr
    otp_code: str

class LoginRequest(BaseModel):
    username: str
    password: str
