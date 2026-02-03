"""
Backup Service
MongoDB backup and restore operations
"""
import os
import json
from datetime import datetime, timedelta
from typing import List, Dict, Optional
from pathlib import Path

from app.core.config import settings
from app.core.database import get_database


class BackupService:
    """Service for database backup operations"""
    
    def __init__(self):
        self.backup_dir = Path(settings.backup_path)
        self.backup_dir.mkdir(parents=True, exist_ok=True)
    
    async def create_backup(self) -> Dict[str, any]:
        """
        Create a backup of the users collection
        
        Returns:
            Dict with backup information
        """
        db = get_database()
        timestamp = datetime.now().strftime("%Y-%m-%d_%H-%M-%S")
        backup_filename = f"backup_{timestamp}.json"
        backup_path = self.backup_dir / backup_filename
        
        # Export users collection
        users_collection = db["users"]
        users = []
        
        async for user in users_collection.find():
            # Convert ObjectId to string for JSON serialization
            user["_id"] = str(user["_id"])
            users.append(user)
        
        # Create backup data
        backup_data = {
            "created_at": datetime.now().isoformat(),
            "collection": "users",
            "count": len(users),
            "data": users
        }
        
        # Write to file
        with open(backup_path, 'w', encoding='utf-8') as f:
            json.dump(backup_data, f, indent=2, ensure_ascii=False, default=str)
        
        return {
            "backup_id": backup_filename,
            "created_at": datetime.now().isoformat(),
            "count": len(users),
            "file_size": os.path.getsize(backup_path)
        }
    
    def list_backups(self) -> List[Dict[str, any]]:
        """
        List all available backups
        
        Returns:
            List of backup information
        """
        backups = []
        
        for backup_file in self.backup_dir.glob("backup_*.json"):
            stat = backup_file.stat()
            backups.append({
                "backup_id": backup_file.name,
                "created_at": datetime.fromtimestamp(stat.st_mtime).isoformat(),
                "file_size": stat.st_size,
                "file_path": str(backup_file)
            })
        
        # Sort by creation time (newest first)
        backups.sort(key=lambda x: x["created_at"], reverse=True)
        
        return backups
    
    def get_backup(self, backup_id: str) -> Optional[Path]:
        """
        Get backup file path
        
        Args:
            backup_id: Backup filename
            
        Returns:
            Path to backup file or None
        """
        backup_path = self.backup_dir / backup_id
        
        if backup_path.exists() and backup_path.is_file():
            return backup_path
        
        return None
    
    def delete_backup(self, backup_id: str) -> bool:
        """
        Delete a backup file
        
        Args:
            backup_id: Backup filename
            
        Returns:
            True if deleted, False otherwise
        """
        backup_path = self.backup_dir / backup_id
        
        if backup_path.exists() and backup_path.is_file():
            backup_path.unlink()
            return True
        
        return False
    
    def cleanup_old_backups(self, days: int = 30) -> int:
        """
        Delete backups older than specified days
        
        Args:
            days: Number of days to keep backups
            
        Returns:
            Number of backups deleted
        """
        cutoff_date = datetime.now() - timedelta(days=days)
        deleted_count = 0
        
        for backup_file in self.backup_dir.glob("backup_*.json"):
            stat = backup_file.stat()
            file_date = datetime.fromtimestamp(stat.st_mtime)
            
            if file_date < cutoff_date:
                backup_file.unlink()
                deleted_count += 1
        
        return deleted_count
    
    async def restore_backup(self, backup_id: str) -> Dict[str, any]:
        """
        Restore from backup (future implementation)
        
        Args:
            backup_id: Backup filename
            
        Returns:
            Restore information
        """
        backup_path = self.get_backup(backup_id)
        
        if not backup_path:
            raise ValueError(f"Backup {backup_id} not found")
        
        # Load backup data
        with open(backup_path, 'r', encoding='utf-8') as f:
            backup_data = json.load(f)
        
        # Future: Implement restore logic
        # For now, just return info
        return {
            "backup_id": backup_id,
            "collection": backup_data.get("collection"),
            "count": backup_data.get("count"),
            "message": "Restore functionality not yet implemented"
        }


# Singleton instance
_backup_service = None


def get_backup_service() -> BackupService:
    """Get backup service instance"""
    global _backup_service
    if _backup_service is None:
        _backup_service = BackupService()
    return _backup_service
