"""
RAG Synchronization Module
Syncs patient data from backend SQLite DB to RAG system (ChromaDB)
"""

import json
from pathlib import Path
from typing import List, Dict, Any
from sqlalchemy.orm import Session
from app.models.patient import Patient
from app.models.medical_record import MedicalRecord


def export_patients_to_dict(db: Session) -> Dict[str, List[Dict[str, Any]]]:
    """
    Export all patients from SQLite backend to dictionary format for RAG ingestion.
    
    Args:
        db: SQLAlchemy database session
        
    Returns:
        Dictionary with 'patients' key containing list of patient records
    """
    patients = db.query(Patient).all()
    
    patients_data = []
    for patient in patients:
        # Get medical records for this patient
        medical_records = db.query(MedicalRecord).filter(
            MedicalRecord.patient_id == patient.id
        ).all()
        
        # Build patient record in RAG format
        patient_record = {
            "patient_id": f"P{patient.id}",
            "name": patient.name or "Unknown",
            "age": patient.age or 0,
            "gender": patient.gender or "Unknown",
            "diagnosis": {
                "condition": patient.diagnosis or "Not specified",
                "description": "Medical record from backend database"
            },
            "prescription": [patient.prescription] if patient.prescription else [],
            "lab_report": {
                "remarks": "See medical records for detailed lab information"
            },
            "hospital": "Backend Database",
            "doctor": "Various",
            "report_date": "2026-04-05"
        }
        
        # Add medical record details if available
        if medical_records:
            first_record = medical_records[0]
            patient_record["doctor"] = first_record.doctor_name or "Unknown"
            patient_record["lab_report"]["treatment"] = first_record.treatment or "N/A"
            if first_record.lab_report:
                patient_record["lab_report"]["lab_results"] = first_record.lab_report
        
        patients_data.append(patient_record)
    
    return {"patients": patients_data}


def export_to_json_file(db: Session, output_path: str = None) -> str:
    """
    Export patient data to JSON file for RAG ingestion.
    
    Args:
        db: SQLAlchemy database session
        output_path: Path to save JSON file. Default: rag_healthcare/db_synced.json
        
    Returns:
        Path to the created JSON file
    """
    if output_path is None:
        # Default to rag_healthcare directory
        backend_dir = Path(__file__).parent.parent.parent
        output_path = backend_dir / "rag_healthcare" / "db_synced.json"
    else:
        output_path = Path(output_path)
    
    # Export data
    patients_data = export_patients_to_dict(db)
    
    # Create directory if it doesn't exist
    output_path.parent.mkdir(parents=True, exist_ok=True)
    
    # Write to file
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(patients_data, f, indent=2, ensure_ascii=False)
    
    return str(output_path)


def get_patients_data(db: Session) -> List[Dict[str, Any]]:
    """
    Get patient data in RAG-ready format without writing to file.
    
    Args:
        db: SQLAlchemy database session
        
    Returns:
        List of patient dictionaries
    """
    data = export_patients_to_dict(db)
    return data["patients"]


def ingest_db_patients_to_rag(db: Session, persist_dir: str = None) -> Dict[str, Any]:
    """
    Ingest patients from backend DB directly to RAG (ChromaDB).
    
    Args:
        db: SQLAlchemy database session
        persist_dir: ChromaDB persistence directory
        
    Returns:
        Status dictionary with ingestion results
    """
    import sys
    from pathlib import Path
    
    # Setup path to RAG modules
    backend_dir = Path(__file__).parent.parent.parent
    rag_path = backend_dir / "rag_healthcare"
    
    if str(rag_path) not in sys.path:
        sys.path.insert(0, str(rag_path))
    
    try:
        from ingest import ingest_patients_from_data
        
        if persist_dir is None:
            persist_dir = str(rag_path / "chroma_db")
        
        # Get patient data from backend DB
        patients_data = get_patients_data(db)
        
        # Ingest to RAG
        result = ingest_patients_from_data(
            patients_data=patients_data,
            persist_dir=persist_dir
        )
        
        return {
            "status": "success",
            "message": f"Synced {len(patients_data)} patients to RAG",
            "patients_synced": len(patients_data),
            "details": result
        }
        
    except ImportError as e:
        return {
            "status": "error",
            "message": f"Failed to import RAG modules: {str(e)}"
        }
    except Exception as e:
        return {
            "status": "error",
            "message": f"Sync failed: {str(e)}"
        }
