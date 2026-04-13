"""
Ingest module: Load patient data from db.json, chunk, embed, and store in ChromaDB.
Supports idempotent ingestion — skips if collection already populated.
"""

import json
import os
from pathlib import Path
from sentence_transformers import SentenceTransformer
import chromadb


def load_patient_data(db_path: str) -> list:
    """Load patient records from db.json with proper encoding handling."""
    try:
        with open(db_path, 'r', encoding='utf-8-sig') as f:
            data = json.load(f)
        return data.get('patients', [])
    except UnicodeDecodeError:
        # Fallback: try with latin-1
        with open(db_path, 'r', encoding='latin-1') as f:
            data = json.load(f)
        return data.get('patients', [])


def create_patient_chunk(patient: dict) -> str:
    """
    Create a plain text chunk from a patient record.
    
    Args:
        patient: Dictionary containing patient data
        
    Returns:
        Formatted text chunk
    """
    name = patient.get('name', 'Unknown')
    age = patient.get('age', 'N/A')
    gender = patient.get('gender', 'N/A')
    hospital = patient.get('hospital', 'N/A')
    doctor = patient.get('doctor', 'N/A')
    report_date = patient.get('report_date', 'N/A')
    
    diagnosis = patient.get('diagnosis', {})
    condition = diagnosis.get('condition', 'N/A')
    description = diagnosis.get('description', 'N/A')
    
    prescription = patient.get('prescription', [])
    prescription_text = ', '.join(prescription) if prescription else 'N/A'
    
    lab_report = patient.get('lab_report', {})
    lab_items = []
    for key, value in lab_report.items():
        if key != 'remarks':
            lab_items.append(f"{key}: {value}")
    lab_text = '; '.join(lab_items) if lab_items else 'N/A'
    remarks = lab_report.get('remarks', 'N/A')
    
    chunk = (
        f"Patient: {name}, Age: {age}, Gender: {gender}. "
        f"Hospital: {hospital}, Doctor: {doctor}, Report Date: {report_date}. "
        f"Diagnosis: {condition} - {description}. "
        f"Prescription: {prescription_text}. "
        f"Lab Report: {lab_text}. Remarks: {remarks}."
    )
    
    return chunk


def get_or_create_chroma_client(persist_dir: str = "./chroma_db"):
    """
    Get or create a persistent ChromaDB client using the new API.
    
    Args:
        persist_dir: Directory path for ChromaDB persistence
        
    Returns:
        ChromaDB client instance
    """
    client = chromadb.PersistentClient(path=persist_dir)
    return client


def get_collection_size(collection) -> int:
    """Get the number of documents in a ChromaDB collection."""
    try:
        return collection.count()
    except Exception:
        return 0


def ingest_patients(db_path: str = "db.json", persist_dir: str = "./chroma_db"):
    """
    Load patient data, create embeddings, and store in ChromaDB.
    Idempotent — skips if collection already has data.
    
    Args:
        db_path: Path to db.json file
        persist_dir: Directory for ChromaDB persistence
    """
    print("=" * 60)
    print("HEALTHCARE RAG — INGESTION PIPELINE")
    print("=" * 60)
    
    # Load embedding model
    print("\n[1/4] Loading embedding model (all-MiniLM-L6-v2)...")
    try:
        embedder = SentenceTransformer('all-MiniLM-L6-v2')
        print("      ✓ Embedding model loaded")
    except Exception as e:
        print(f"      ✗ ERROR: Failed to load embedder: {e}")
        return
    
    # Load ChromaDB client
    print("\n[2/4] Initializing ChromaDB...")
    try:
        client = get_or_create_chroma_client(persist_dir)
        collection = client.get_or_create_collection(
            name="healthcare_rag",
            metadata={"hnsw:space": "cosine"}
        )
        print(f"      ✓ ChromaDB initialized at {persist_dir}")
    except Exception as e:
        print(f"      ✗ ERROR: Failed to initialize ChromaDB: {e}")
        return
    
    # Check if collection already has data
    existing_count = get_collection_size(collection)
    if existing_count > 0:
        print(f"\n[3/4] Collection already has {existing_count} documents.")
        print("      Skipping ingestion (idempotent). Run with fresh DB to re-ingest.")
        print("\n[4/4] Done!")
        return
    
    # Load patient data
    print("\n[3/4] Loading patient data from db.json...")
    try:
        patients = load_patient_data(db_path)
        print(f"      ✓ Loaded {len(patients)} patient records")
    except Exception as e:
        print(f"      ✗ ERROR: Failed to load patient data: {e}")
        return
    
    # Chunk, embed, and store
    print("\n[4/4] Processing and storing patient records...")
    try:
        ids = []
        metadatas = []
        documents = []
        embeddings = []
        
        for i, patient in enumerate(patients):
            patient_id = patient.get('patient_id', f'P{i+1}')
            name = patient.get('name', 'Unknown')
            condition = patient.get('diagnosis', {}).get('condition', 'Unknown')
            hospital = patient.get('hospital', 'Unknown')
            
            # Create chunk
            chunk_text = create_patient_chunk(patient)
            
            # Generate embedding
            embedding = embedder.encode(chunk_text)
            
            # Prepare for batch insert
            ids.append(patient_id)
            documents.append(chunk_text)
            embeddings.append(embedding)
            metadatas.append({
                "patient_id": patient_id,
                "name": name,
                "condition": condition,
                "hospital": hospital,
            })
            
            if (i + 1) % 10 == 0:
                print(f"      Processing: {i + 1}/{len(patients)}...")
        
        # Batch insert into ChromaDB
        collection.add(
            ids=ids,
            documents=documents,
            embeddings=embeddings,
            metadatas=metadatas
        )
        
        print(f"      ✓ Successfully stored {len(patients)} patient records")
        print("\n" + "=" * 60)
        print(f"INGESTION COMPLETE: {len(patients)} records indexed")
        print("=" * 60)
        
    except Exception as e:
        print(f"      ✗ ERROR during ingestion: {e}")
        return


def ingest_patients_from_data(patients_data: list, persist_dir: str = "./chroma_db"):
    """
    Load patient data from a list/dict (not file), chunk, embed, and store in ChromaDB.
    Useful for backend-RAG synchronization.
    
    Args:
        patients_data: List of patient dictionaries
        persist_dir: Directory for ChromaDB persistence
        
    Returns:
        Dictionary with ingestion status and results
    """
    print("=" * 60)
    print("HEALTHCARE RAG — DATA INGESTION (from backend)")
    print("=" * 60)
    
    try:
        # Load embedding model
        print("\n[1/4] Loading embedding model (all-MiniLM-L6-v2)...")
        embedder = SentenceTransformer('all-MiniLM-L6-v2')
        print("      ✓ Embedding model loaded")
    except Exception as e:
        print(f"      ✗ ERROR: Failed to load embedder: {e}")
        return {"status": "error", "message": str(e)}
    
    try:
        # Load ChromaDB client
        print("\n[2/4] Initializing ChromaDB...")
        client = get_or_create_chroma_client(persist_dir)
        
        # Delete existing collection to refresh with new data
        try:
            client.delete_collection(name="healthcare_rag")
            print("      ✓ Cleared existing collection")
        except Exception:
            pass  # Collection might not exist
        
        collection = client.get_or_create_collection(
            name="healthcare_rag",
            metadata={"hnsw:space": "cosine"}
        )
        print(f"      ✓ ChromaDB initialized at {persist_dir}")
    except Exception as e:
        print(f"      ✗ ERROR: Failed to initialize ChromaDB: {e}")
        return {"status": "error", "message": str(e)}
    
    # Process patient data
    print(f"\n[3/4] Processing {len(patients_data)} patient records...")
    try:
        ids = []
        metadatas = []
        documents = []
        embeddings = []
        
        for i, patient in enumerate(patients_data):
            patient_id = patient.get('patient_id', f'P{i+1}')
            name = patient.get('name', 'Unknown')
            condition = patient.get('diagnosis', {}).get('condition', 'Unknown')
            hospital = patient.get('hospital', 'Unknown')
            
            # Create chunk
            chunk_text = create_patient_chunk(patient)
            
            # Generate embedding
            embedding = embedder.encode(chunk_text)
            
            # Prepare for batch insert
            ids.append(patient_id)
            documents.append(chunk_text)
            embeddings.append(embedding)
            metadatas.append({
                "patient_id": patient_id,
                "name": name,
                "condition": condition,
                "hospital": hospital,
            })
            
            if (i + 1) % 10 == 0 or i + 1 == len(patients_data):
                print(f"      Processing: {i + 1}/{len(patients_data)}...")
        
        # Batch insert into ChromaDB
        print("\n[4/4] Storing in ChromaDB...")
        collection.add(
            ids=ids,
            documents=documents,
            embeddings=embeddings,
            metadatas=metadatas
        )
        
        print(f"      ✓ Successfully stored {len(patients_data)} patient records")
        print("\n" + "=" * 60)
        print(f"INGESTION COMPLETE: {len(patients_data)} records indexed")
        print("=" * 60)
        
        return {
            "status": "success",
            "message": f"Ingested {len(patients_data)} patients",
            "records_ingested": len(patients_data),
            "persist_dir": persist_dir
        }
        
    except Exception as e:
        print(f"      ✗ ERROR during ingestion: {e}")
        return {"status": "error", "message": str(e)}


if __name__ == "__main__":
    ingest_patients(db_path="db.json", persist_dir="./chroma_db")
