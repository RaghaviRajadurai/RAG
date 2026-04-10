from pydantic import BaseModel, EmailStr

class OTPRegisterRequest(BaseModel):
    username: str
    email: EmailStr
    password: str
    role: str

class OTPConfirmRequest(BaseModel):
    email: EmailStr
    otp_code: str

class LoginRequest(BaseModel):
    username: str
    password: str
