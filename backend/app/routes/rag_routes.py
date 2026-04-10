from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel
import sys
import os
from pathlib import Path
from app.database import SessionLocal
from app.rag_sync import ingest_db_patients_to_rag, export_to_json_file

# Calculate the RAG folder path - it's a sibling to the backend folder
current_file = Path(__file__).resolve()
backend_dir = current_file.parents[3]  # c:\Users\raghavi\Ramana\Ramana
rag_path = backend_dir / "rag_healthcare"

# Add to Python path at the beginning
if str(rag_path) not in sys.path:
    sys.path.insert(0, str(rag_path))

print(f"RAG path: {rag_path}")
print(f"RAG path exists: {rag_path.exists()}")
print(f"Current working directory: {os.getcwd()}")
print(f"Python path includes RAG: {str(rag_path) in sys.path}")

# Try to import RAG modules
rag_available = False
try:
    from rag_engine import RAGEngine
    from report_generator import generate_report, save_report
    rag_available = True
    print("RAG modules imported successfully")
except ImportError as e:
    print(f"RAG import failed: {e}")
    RAGEngine = None
    generate_report = None
    save_report = None
except Exception as e:
    print(f"RAG import error: {e}")
    RAGEngine = None
    generate_report = None
    save_report = None

router = APIRouter()

class QueryRequest(BaseModel):
    query: str
    top_k: int = 5

class QueryResponse(BaseModel):
    query: str
    result: dict = None
    report_saved: bool = False
    report_path: str = None
    error: str = None

@router.post("/query", response_model=QueryResponse)
async def query_rag(request: QueryRequest):
    # Import RAG modules here to avoid module-level import issues
    try:
        if not rag_available:
            # Try to import again in case the module-level import failed
            from rag_engine import RAGEngine
            from report_generator import generate_report, save_report

        engine = RAGEngine(persist_dir=str(rag_path / "chroma_db"))
        result = engine.answer(request.query, top_k=request.top_k)

        report_text = generate_report(result)
        report_path = save_report(report_text, reports_dir=str(rag_path / "reports"))

        return QueryResponse(
            query=request.query,
            result=result,
            report_saved=True,
            report_path=str(report_path) if report_path else None
        )
    except ImportError as e:
        return QueryResponse(
            query=request.query,
            error=f"RAG modules not available: {str(e)}"
        )
    except Exception as e:
        return QueryResponse(
            query=request.query,
            error=f"RAG query failed: {str(e)}"
        )

@router.get("/health")
async def rag_health_check():
    # Try to import RAG modules here as well
    try:
        if not rag_available:
            from rag_engine import RAGEngine
            from report_generator import generate_report, save_report
            rag_available_local = True
        else:
            rag_available_local = True

        return {
            "status": "available",
            "rag_path": str(rag_path),
            "rag_path_exists": rag_path.exists(),
            "rag_available": rag_available_local
        }
    except ImportError as e:
        return {
            "status": "unavailable",
            "rag_path": str(rag_path),
            "rag_path_exists": rag_path.exists(),
            "error": f"RAG modules not available: {str(e)}"
        }
    except Exception as e:
        return {
            "status": "error",
            "rag_path": str(rag_path),
            "rag_path_exists": rag_path.exists(),
            "error": str(e)
        }

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

class SyncResponse(BaseModel):
    status: str
    message: str
    patients_synced: int = None
    details: dict = None
    error: str = None

@router.post("/sync", response_model=SyncResponse)
async def sync_db_to_rag(db: Session = Depends(get_db)):
    """
    Synchronize patient data from backend SQLite database to RAG system (ChromaDB).
    This endpoint:
    1. Exports all patients from backend DB
    2. Clears existing RAG index
    3. Re-ingests data into ChromaDB with fresh embeddings
    
    Useful after adding/updating patients in the backend.
    """
    try:
        result = ingest_db_patients_to_rag(db, persist_dir=str(rag_path / "chroma_db"))
        
        if result.get("status") == "success":
            return SyncResponse(
                status="success",
                message=result.get("message", "Sync completed"),
                patients_synced=result.get("records_ingested", 0),
                details=result
            )
        else:
            return SyncResponse(
                status="error",
                message=result.get("message", "Sync failed"),
                error=result.get("message")
            )
    except Exception as e:
        return SyncResponse(
            status="error",
            message=f"Sync failed with exception",
            error=str(e)
        )

@router.post("/export")
async def export_db_to_json(db: Session = Depends(get_db)):
    """
    Export backend SQLite patient data to JSON file.
    Useful for debugging and manual RAG ingestion.
    """
    try:
        output_path = export_to_json_file(db)
        
        return {
            "status": "success",
            "message": "Data exported to JSON",
            "output_file": output_path,
            "patients_exported": len(db.query(db.query(db.query.__self__.__class__).all()) if hasattr(db, 'query') else [])
        }
    except Exception as e:
        return {
            "status": "error",
            "message": "Export failed",
            "error": str(e)
        }
