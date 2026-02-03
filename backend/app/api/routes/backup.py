"""
Backup Routes
API endpoints for database backup operations
"""
from fastapi import APIRouter, HTTPException, Depends, status
from fastapi.responses import FileResponse
from pydantic import BaseModel
from typing import List

from app.services.backup_service import get_backup_service
from app.services.backup_scheduler import get_backup_scheduler
from app.api.routes.auth import require_admin

router = APIRouter()


class BackupInfo(BaseModel):
    backup_id: str
    created_at: str
    file_size: int


class BackupStatusResponse(BaseModel):
    enabled: bool
    next_run_time: str = None
    backups_count: int
    latest_backup: str = None


class ToggleBackupRequest(BaseModel):
    enabled: bool


@router.post("/create")
async def create_backup(admin_user: dict = Depends(require_admin)):
    """
    Create manual backup (Admin only)
    
    Creates an immediate backup of the database.
    """
    backup_service = get_backup_service()
    
    try:
        result = await backup_service.create_backup()
        return {
            "message": "Backup created successfully",
            "backup": result
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Backup failed: {str(e)}"
        )


@router.get("/list", response_model=List[BackupInfo])
async def list_backups(admin_user: dict = Depends(require_admin)):
    """
    List all backups (Admin only)
    
    Returns list of available backup files.
    """
    backup_service = get_backup_service()
    backups = backup_service.list_backups()
    return backups


@router.get("/download/{backup_id}")
async def download_backup(
    backup_id: str,
    admin_user: dict = Depends(require_admin)
):
    """
    Download backup file (Admin only)
    
    Downloads the specified backup file.
    """
    backup_service = get_backup_service()
    backup_path = backup_service.get_backup(backup_id)
    
    if not backup_path:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Backup not found"
        )
    
    return FileResponse(
        path=backup_path,
        filename=backup_id,
        media_type="application/json"
    )


@router.delete("/{backup_id}")
async def delete_backup(
    backup_id: str,
    admin_user: dict = Depends(require_admin)
):
    """
    Delete backup (Admin only)
    
    Deletes the specified backup file.
    """
    backup_service = get_backup_service()
    
    if not backup_service.delete_backup(backup_id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Backup not found"
        )
    
    return {"message": "Backup deleted successfully"}


@router.post("/toggle")
async def toggle_auto_backup(
    request: ToggleBackupRequest,
    admin_user: dict = Depends(require_admin)
):
    """
    Enable/disable automatic backups (Admin only)
    
    Toggles the automatic backup scheduler.
    """
    scheduler = get_backup_scheduler()
    scheduler.toggle(request.enabled)
    
    return {
        "message": f"Automatic backups {'enabled' if request.enabled else 'disabled'}",
        "enabled": scheduler.is_enabled()
    }


@router.get("/status", response_model=BackupStatusResponse)
async def get_backup_status(admin_user: dict = Depends(require_admin)):
    """
    Get backup status (Admin only)
    
    Returns current backup configuration and status.
    """
    scheduler = get_backup_scheduler()
    backup_service = get_backup_service()
    
    backups = backup_service.list_backups()
    next_run = scheduler.get_next_run_time()
    
    return {
        "enabled": scheduler.is_enabled(),
        "next_run_time": next_run.isoformat() if next_run else None,
        "backups_count": len(backups),
        "latest_backup": backups[0]["backup_id"] if backups else None
    }
