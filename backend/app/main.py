from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI
from app.routes import auth_routes, patient_routes
from app.routes import medical_record_routes
from app.routes import doctor_routes, records_routes
from app.routes import admin_routes

# Create FastAPI app
app = FastAPI(title="Healthcare API", description="Healthcare Management System")

# CORS settings
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5174",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routers
app.include_router(auth_routes.router, prefix="/auth", tags=["Authentication"])
app.include_router(patient_routes.router, prefix="/api", tags=["Patients"])
app.include_router(medical_record_routes.router, prefix="/api", tags=["Medical Records"])
app.include_router(doctor_routes.router, prefix="/api", tags=["Doctors"])
app.include_router(records_routes.router, prefix="/api", tags=["Records"])
app.include_router(admin_routes.router, prefix="/api", tags=["Admin"])

# Include RAG routes if available
try:
    from app.routes.rag_routes import router as rag_router
    app.include_router(rag_router, prefix="/api/rag", tags=["RAG"])
    print("RAG routes loaded successfully")
except ImportError as e:
    print(f"Warning: RAG routes not available: {e}")
except Exception as e:
    print(f"Warning: Error loading RAG routes: {e}")

@app.get("/")
def home():
    return {"message": "Healthcare API Running", "version": "1.0.0"}

