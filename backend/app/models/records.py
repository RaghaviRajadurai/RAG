from sqlalchemy import Column, Integer, String, ForeignKey
from app.database import Base

class Record(Base):
    __tablename__ = "records"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"))
    report_type = Column(String)
    description = Column(String)