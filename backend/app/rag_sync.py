"""
RAG Synchronization Module
Syncs patient data from backend MongoDB to RAG system (ChromaDB)
"""

import json
from pathlib import Path
from typing import List, Dict, Any
from app.database import patients_collection, medical_records_collection


def export_patients_to_dict() -> Dict[str, List[Dict[str, Any]]]:
    """
    Export all patients from MongoDB backend to dictionary format for RAG ingestion.
        
    Returns:
        Dictionary with 'patients' key containing list of patient records
    """
    patients = list(patients_collection.find())
    
    patients_data = []
    for patient in patients:
        patient_id = str(patient.get("_id"))

        # Get medical records for this patient
        medical_records = list(
            medical_records_collection.find({"patient_id": patient_id})
        )
        
        # Build patient record in RAG format
        patient_record = {
            "patient_id": patient_id,
            "name": patient.get("name") or "Unknown",
            "age": patient.get("age") or 0,
            "gender": patient.get("gender") or "Unknown",
            "diagnosis": {
                "condition": patient.get("diagnosis") or "Not specified",
                "description": "Medical record from backend database"
            },
            "prescription": [patient.get("prescription")] if patient.get("prescription") else [],
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
            patient_record["doctor"] = first_record.get("doctor_name") or "Unknown"
            patient_record["lab_report"]["treatment"] = first_record.get("treatment") or "N/A"
            if first_record.get("lab_report"):
                patient_record["lab_report"]["lab_results"] = first_record["lab_report"]
        
        patients_data.append(patient_record)
    
    return {"patients": patients_data}


def export_to_json_file(output_path: str = None) -> str:
    """
    Export patient data to JSON file for RAG ingestion.
    
    Args:
        output_path: Path to save JSON file. Default: backend/rag_healthcare/db_synced.json
        
    Returns:
        Path to the created JSON file
    """
    if output_path is None:
        # Default to rag_healthcare directory
        backend_dir = Path(__file__).resolve().parents[1]
        output_path = backend_dir / "rag_healthcare" / "db_synced.json"
    else:
        output_path = Path(output_path)
    
    # Export data
    patients_data = export_patients_to_dict()
    
    # Create directory if it doesn't exist
    output_path.parent.mkdir(parents=True, exist_ok=True)
    
    # Write to file
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(patients_data, f, indent=2, ensure_ascii=False)
    
    return str(output_path)


def get_patients_data() -> List[Dict[str, Any]]:
    """
    Get patient data in RAG-ready format without writing to file.
    
    Returns:
        List of patient dictionaries
    """
    data = export_patients_to_dict()
    return data["patients"]


def ingest_db_patients_to_rag(persist_dir: str = None) -> Dict[str, Any]:
    """
    Ingest patients from backend DB directly to RAG (ChromaDB).
    
    Args:
        persist_dir: ChromaDB persistence directory
        
    Returns:
        Status dictionary with ingestion results
    """
    import sys
    from pathlib import Path
    
    # Setup path to RAG modules
    backend_dir = Path(__file__).resolve().parents[1]
    rag_path = backend_dir / "rag_healthcare"
    chroma_path = backend_dir / "chroma_db"
    
    if str(rag_path) not in sys.path:
        sys.path.insert(0, str(rag_path))
    
    try:
        from ingest import ingest_patients_from_data
        
        if persist_dir is None:
            persist_dir = str(chroma_path)
        
        # Get patient data from backend DB
        patients_data = get_patients_data()
        
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
