import os
import smtplib
import secrets
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import or_, desc
from app.database import SessionLocal
from app.models.user import User
from app.models.otp_verification import OTPVerification
from app.schemas.user_schema import UserCreate
from app.schemas.otp_schema import OTPRegisterRequest, OTPConfirmRequest, LoginRequest
from app.auth.jwt_handler import create_token
from app.auth.auth_handler import hash_password, verify_password

router = APIRouter()

EMAIL_HOST = os.environ.get("EMAIL_HOST")
EMAIL_PORT = int(os.environ.get("EMAIL_PORT", 465))
EMAIL_USER = os.environ.get("EMAIL_USER")
EMAIL_PASSWORD = os.environ.get("EMAIL_PASSWORD")
EMAIL_FROM = os.environ.get("EMAIL_FROM", EMAIL_USER)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def generate_otp_code(length: int = 6) -> str:
    return "".join(str(secrets.randbelow(10)) for _ in range(length))


def send_otp_email(recipient: str, otp_code: str, username: str):
    # For development: log to console if email not configured
    if not EMAIL_HOST or not EMAIL_USER or not EMAIL_PASSWORD:
        print("\n" + "="*60)
        print("📧 [DEV MODE] OTP Email would be sent:")
        print(f"   To: {recipient}")
        print(f"   Username: {username}")
        print(f"   OTP Code: {otp_code}")
        print("="*60 + "\n")
        return

    # Production: send via SMTP
    subject = "Your Healthcare Registration OTP"
    body = (
        f"Hello {username},\n\n"
        f"Use the following One Time Password (OTP) to complete your registration:\n\n"
        f"{otp_code}\n\n"
        "This code expires in 10 minutes.\n\n"
        "If you did not request this, please ignore this email.\n\n"
        "Thanks,\nHealthcare Team"
    )
    message = f"Subject: {subject}\nFrom: {EMAIL_FROM}\nTo: {recipient}\n\n{body}"

    if EMAIL_PORT == 465:
        server = smtplib.SMTP_SSL(EMAIL_HOST, EMAIL_PORT)
    else:
        server = smtplib.SMTP(EMAIL_HOST, EMAIL_PORT)

    with server:
        if EMAIL_PORT != 465:
            server.starttls()
        server.login(EMAIL_USER, EMAIL_PASSWORD)
        server.sendmail(EMAIL_FROM, recipient, message)


@router.post("/register")
def register(user: OTPRegisterRequest, db: Session = Depends(get_db)):
    existing_user = db.query(User).filter(
        or_(User.username == user.username, User.email == user.email)
    ).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Username or email already in use.")

    existing_pending = db.query(OTPVerification).filter(
        or_(OTPVerification.username == user.username, OTPVerification.email == user.email),
        OTPVerification.verified == False
    ).order_by(desc(OTPVerification.created_at)).first()
    if existing_pending and existing_pending.expires_at > datetime.utcnow():
        raise HTTPException(status_code=400, detail="A pending OTP request already exists. Please use the existing OTP or wait until it expires.")

    otp_code = generate_otp_code()
    expires_at = datetime.utcnow() + timedelta(minutes=10)

    pending = OTPVerification(
        username=user.username,
        email=user.email,
        password_hash=hash_password(user.password),
        role=user.role,
        otp_code=otp_code,
        expires_at=expires_at,
        verified=False
    )
    db.add(pending)
    db.commit()
    db.refresh(pending)

    try:
        send_otp_email(user.email, otp_code, user.username)
    except Exception as exc:
        db.delete(pending)
        db.commit()
        raise HTTPException(status_code=500, detail=f"Failed to send OTP email: {exc}")

    return {"message": "OTP sent to your email. Please verify to complete registration."}


@router.post("/register/confirm")
def confirm_registration(data: OTPConfirmRequest, db: Session = Depends(get_db)):
    pending = db.query(OTPVerification).filter(
        OTPVerification.email == data.email,
        OTPVerification.otp_code == data.otp_code,
        OTPVerification.verified == False
    ).order_by(desc(OTPVerification.created_at)).first()

    if not pending:
        raise HTTPException(status_code=400, detail="Invalid OTP or email.")

    if pending.expires_at < datetime.utcnow():
        raise HTTPException(status_code=400, detail="OTP has expired. Please request a new registration OTP.")

    existing_user = db.query(User).filter(
        or_(User.username == pending.username, User.email == pending.email)
    ).first()
    if existing_user:
        pending.verified = True
        db.commit()
        raise HTTPException(status_code=400, detail="A user with that username or email already exists.")

    new_user = User(
        username=pending.username,
        email=pending.email,
        password=pending.password_hash,
        role=pending.role
    )
    db.add(new_user)
    pending.verified = True
    db.commit()
    db.refresh(new_user)

    return {"message": "Registration successful. You can now log in."}


@router.post("/login")
def login(login_data: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == login_data.username).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")

    if not verify_password(login_data.password, user.password):
        raise HTTPException(status_code=401, detail="Invalid password.")

    token = create_token(user.id)
    return {"access_token": token}
