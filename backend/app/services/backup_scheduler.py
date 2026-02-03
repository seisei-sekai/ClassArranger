"""
Backup Scheduler
Scheduled backup operations using APScheduler
"""
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from datetime import datetime

from app.core.config import settings
from app.services.backup_service import get_backup_service


class BackupScheduler:
    """Scheduler for automatic backups"""
    
    def __init__(self):
        self.scheduler = AsyncIOScheduler()
        self.backup_service = get_backup_service()
        self._enabled = settings.backup_enabled
    
    async def perform_backup(self):
        """Perform scheduled backup"""
        try:
            print(f"[{datetime.now()}] Starting scheduled backup...")
            result = await self.backup_service.create_backup()
            print(f"[{datetime.now()}] Backup completed: {result['backup_id']}")
            
            # Cleanup old backups
            deleted_count = self.backup_service.cleanup_old_backups(days=30)
            if deleted_count > 0:
                print(f"[{datetime.now()}] Cleaned up {deleted_count} old backup(s)")
        except Exception as e:
            print(f"[{datetime.now()}] Backup failed: {str(e)}")
    
    def start(self):
        """Start the scheduler"""
        if not self._enabled:
            print("Backup scheduler is disabled (BACKUP_ENABLED=false)")
            return
        
        # Weekly backup every Sunday at 2 AM
        self.scheduler.add_job(
            self.perform_backup,
            CronTrigger(day_of_week='sun', hour=2, minute=0),
            id='weekly_backup',
            name='Weekly Database Backup',
            replace_existing=True
        )
        
        self.scheduler.start()
        print("Backup scheduler started (Weekly backups on Sundays at 2 AM)")
    
    def stop(self):
        """Stop the scheduler"""
        if self.scheduler.running:
            self.scheduler.shutdown()
            print("Backup scheduler stopped")
    
    def toggle(self, enabled: bool):
        """Enable or disable automatic backups"""
        self._enabled = enabled
        
        if enabled and not self.scheduler.running:
            self.start()
        elif not enabled and self.scheduler.running:
            self.stop()
    
    def is_enabled(self) -> bool:
        """Check if scheduler is enabled"""
        return self._enabled and self.scheduler.running
    
    def get_next_run_time(self):
        """Get next scheduled backup time"""
        if not self.scheduler.running:
            return None
        
        job = self.scheduler.get_job('weekly_backup')
        if job:
            return job.next_run_time
        
        return None


# Singleton instance
_backup_scheduler = None


def get_backup_scheduler() -> BackupScheduler:
    """Get backup scheduler instance"""
    global _backup_scheduler
    if _backup_scheduler is None:
        _backup_scheduler = BackupScheduler()
    return _backup_scheduler
