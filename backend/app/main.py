from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes import auth, ai, users, backup, scheduling
from app.core.database import connect_to_mongodb, close_mongodb_connection
from app.services.auth_service import initialize_admin_user
from app.services.backup_scheduler import get_backup_scheduler
import os

app = FastAPI(
    title="ClassArranger API",
    description="Backend API for ClassArranger application",
    version="1.0.0"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:3000",
        "https://*.run.app",  # Cloud Run
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Startup and shutdown events
@app.on_event("startup")
async def startup_db_client():
    """Startup: Connect to database and initialize services"""
    await connect_to_mongodb()
    print("✅ MongoDB connected")
    
    # Initialize admin user
    await initialize_admin_user()
    
    # Start backup scheduler
    backup_scheduler = get_backup_scheduler()
    backup_scheduler.start()
    
    print("✅ Application started successfully")


@app.on_event("shutdown")
async def shutdown_db_client():
    """Shutdown: Close database connection and stop services"""
    # Stop backup scheduler
    backup_scheduler = get_backup_scheduler()
    backup_scheduler.stop()
    
    await close_mongodb_connection()
    print("👋 Application shutdown")


# Register routers
app.include_router(auth.router, prefix="/auth", tags=["authentication"])
app.include_router(users.router, prefix="/users", tags=["users"])
app.include_router(backup.router, prefix="/backup", tags=["backup"])
app.include_router(ai.router, prefix="/ai", tags=["ai"])
app.include_router(scheduling.router, prefix="/api/scheduling", tags=["scheduling"])

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "ClassArranger API",
        "version": "1.0.0",
        "status": "running"
    }

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
