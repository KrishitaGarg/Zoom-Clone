# FastAPI Application configuration and core server startup handler.
from fastapi import FastAPI, APIRouter
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.database import Base, engine, SessionLocal
from app.seed import seed_database
from app.api.users import router as users_router
from app.api.meetings import router as meetings_router
from app.api.participants import router as participants_router

# Initialize the SQLAlchemy Database Tables on startup
print("[App] Initializing database tables...")
Base.metadata.create_all(bind=engine)

# Idempotently seed the application database on boot
db = SessionLocal()
try:
    seed_database(db)
finally:
    db.close()

# Initialize FastAPI application
app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Zoom Clone Web Application backend exposing REST APIs with integrated SQLite support.",
    version="1.0.0",
    debug=settings.DEBUG
)

# Configure CORS Middleware
# Allows request authentication and transfer from the Next.js client
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Root-level status diagnostics endpoint
@app.get("/api/health", tags=["system"])
def health_check():
    """
    Diagnostic endpoint used to verify the operational state of the FastAPI container.
    """
    return {
        "status": "healthy",
        "service": "Zoom Clone Backend Service",
        "database": "SQLite (Connected)"
    }

# Assemble the global API routers
api_router = APIRouter(prefix="/api")
api_router.include_router(users_router)
api_router.include_router(meetings_router)
api_router.include_router(participants_router)

# Mount global API router on the main app
app.include_router(api_router)

if __name__ == "__main__":
    import uvicorn
    # If invoked directly, run the uvicorn development container
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
