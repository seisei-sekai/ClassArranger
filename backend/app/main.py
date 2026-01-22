from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes import auth, ai  # diaries route removed - using mock data only
from app.core.database import connect_to_mongodb, close_mongodb_connection
import os

app = FastAPI(
    title="ClassArranger API",
    description="Backend API for ClassArranger application",
    version="1.0.0"
)

# CORS 配置
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

# 启动和关闭事件
@app.on_event("startup")
async def startup_db_client():
    """启动时连接数据库"""
    await connect_to_mongodb()
    print("✅ Application started successfully")


@app.on_event("shutdown")
async def shutdown_db_client():
    """关闭时断开数据库连接"""
    await close_mongodb_connection()
    print("👋 Application shutdown")


# 注册路由
app.include_router(auth.router, prefix="/auth", tags=["authentication"])
app.include_router(ai.router, prefix="/ai", tags=["ai"])
# app.include_router(diaries.router, prefix="/diaries", tags=["diaries"])  # Commented out - route file doesn't exist

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
