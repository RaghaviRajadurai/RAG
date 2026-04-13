from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
import sys
import os
from pathlib import Path
from app.auth.rbac import get_current_user, require_roles
from app.rag_sync import ingest_db_patients_to_rag, export_to_json_file, get_patients_data

# Resolve backend-oriented paths for RAG modules and data directories.
current_file = Path(__file__).resolve()
backend_dir = current_file.parents[2]
project_root = backend_dir.parent
rag_path = backend_dir / "rag_healthcare"
chroma_path = backend_dir / "chroma_db"
reports_path = project_root / "reports"

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
async def query_rag(request: QueryRequest, current_user: dict = Depends(get_current_user)):
    require_roles(current_user, {"doctor", "admin"})

    # Import RAG modules here to avoid module-level import issues
    try:
        engine_cls = RAGEngine
        generate_report_fn = generate_report
        save_report_fn = save_report

        if engine_cls is None or generate_report_fn is None or save_report_fn is None:
            # Try to import again in case the module-level import failed
            from rag_engine import RAGEngine as ImportedRAGEngine
            from report_generator import generate_report as imported_generate_report, save_report as imported_save_report
            engine_cls = ImportedRAGEngine
            generate_report_fn = imported_generate_report
            save_report_fn = imported_save_report

        engine = engine_cls(persist_dir=str(chroma_path))
        result = engine.answer(request.query, top_k=request.top_k)

        report_text = generate_report_fn(result)
        report_path = save_report_fn(report_text, reports_dir=str(reports_path))

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
async def rag_health_check(current_user: dict = Depends(get_current_user)):
    require_roles(current_user, {"doctor", "admin"})

    # Try to import RAG modules here as well
    try:
        if RAGEngine is None or generate_report is None or save_report is None:
            from rag_engine import RAGEngine as _ImportedRAGEngine
            from report_generator import generate_report as _imported_generate_report, save_report as _imported_save_report
            rag_available_local = bool(_ImportedRAGEngine and _imported_generate_report and _imported_save_report)
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

class SyncResponse(BaseModel):
    status: str
    message: str
    patients_synced: int = None
    details: dict = None
    error: str = None

@router.post("/sync", response_model=SyncResponse)
async def sync_db_to_rag(current_user: dict = Depends(get_current_user)):
    require_roles(current_user, {"admin"})

    """
    Synchronize patient data from backend MongoDB to RAG system (ChromaDB).
    This endpoint:
    1. Exports all patients from backend DB
    2. Clears existing RAG index
    3. Re-ingests data into ChromaDB with fresh embeddings
    
    Useful after adding/updating patients in the backend.
    """
    try:
        result = ingest_db_patients_to_rag(persist_dir=str(chroma_path))
        
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
async def export_db_to_json(current_user: dict = Depends(get_current_user)):
    require_roles(current_user, {"admin"})

    """
    Export backend MongoDB patient data to JSON file.
    Useful for debugging and manual RAG ingestion.
    """
    try:
        patients_count = len(get_patients_data())
        output_path = export_to_json_file()
        
        return {
            "status": "success",
            "message": "Data exported to JSON",
            "output_file": output_path,
            "patients_exported": patients_count
        }
    except Exception as e:
        return {
            "status": "error",
            "message": "Export failed",
            "error": str(e)
        }
