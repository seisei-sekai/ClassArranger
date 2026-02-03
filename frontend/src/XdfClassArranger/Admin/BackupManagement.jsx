/**
 * Backup Management Component
 * Admin-only component for managing database backups
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../Auth/AuthContext';
import * as backupService from '../../services/backupService';
import toast from 'react-hot-toast';
import './BackupManagement.css';

const BackupManagement = () => {
  const { isAdmin } = useAuth();
  const [backups, setBackups] = useState([]);
  const [status, setStatus] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    if (isAdmin()) {
      loadBackups();
      loadStatus();
    }
  }, []);

  const loadBackups = async () => {
    try {
      const data = await backupService.listBackups();
      setBackups(data);
    } catch (error) {
      console.error('Failed to load backups:', error);
    }
  };

  const loadStatus = async () => {
    try {
      const data = await backupService.getBackupStatus();
      setStatus(data);
    } catch (error) {
      console.error('Failed to load status:', error);
    }
  };

  const handleCreateBackup = async () => {
    setIsCreating(true);
    try {
      await backupService.createBackup();
      toast.success('Backup created successfully');
      await loadBackups();
      await loadStatus();
    } catch (error) {
      toast.error(error.message || 'Failed to create backup');
    } finally {
      setIsCreating(false);
    }
  };

  const handleDownloadBackup = async (backupId) => {
    try {
      await backupService.downloadBackup(backupId);
      toast.success('Backup downloaded');
    } catch (error) {
      toast.error('Failed to download backup');
    }
  };

  const handleDeleteBackup = async (backupId) => {
    if (!confirm('Are you sure you want to delete this backup?')) {
      return;
    }

    try {
      await backupService.deleteBackup(backupId);
      toast.success('Backup deleted');
      await loadBackups();
      await loadStatus();
    } catch (error) {
      toast.error('Failed to delete backup');
    }
  };

  const handleToggleAutoBackup = async () => {
    setIsLoading(true);
    try {
      const newEnabled = !status?.enabled;
      await backupService.toggleAutoBackup(newEnabled);
      toast.success(`Auto backup ${newEnabled ? 'enabled' : 'disabled'}`);
      await loadStatus();
    } catch (error) {
      toast.error('Failed to toggle auto backup');
    } finally {
      setIsLoading(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDate = (dateStr) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateStr;
    }
  };

  if (!isAdmin()) {
    return null;
  }

  return (
    <div className="backup-management">
      <div className="backup-header">
        <div className="backup-title-section">
          <h2 className="backup-title">Database Backup</h2>
          <p className="backup-subtitle">Manage database backups and restore points</p>
        </div>
      </div>

      {/* Backup Status */}
      {status && (
        <div className="backup-status-card">
          <div className="status-row">
            <div className="status-item">
              <span className="status-label">Auto Backup:</span>
              <div className="status-value">
                <span className={`status-badge ${status.enabled ? 'enabled' : 'disabled'}`}>
                  {status.enabled ? 'Enabled' : 'Disabled'}
                </span>
                <button
                  className="toggle-button"
                  onClick={handleToggleAutoBackup}
                  disabled={isLoading}
                >
                  {status.enabled ? 'Disable' : 'Enable'}
                </button>
              </div>
            </div>
            
            {status.next_run_time && (
              <div className="status-item">
                <span className="status-label">Next Backup:</span>
                <span className="status-value">{formatDate(status.next_run_time)}</span>
              </div>
            )}
            
            <div className="status-item">
              <span className="status-label">Total Backups:</span>
              <span className="status-value">{status.backups_count}</span>
            </div>
          </div>
          
          <div className="backup-info-text">
            Backups are retained for 30 days. Weekly automatic backups run on Sundays at 2 AM.
          </div>
        </div>
      )}

      {/* Manual Backup Button */}
      <div className="backup-actions">
        <button
          className="create-backup-button"
          onClick={handleCreateBackup}
          disabled={isCreating}
        >
          {isCreating ? (
            <>
              <span className="spinner"></span>
              Creating Backup...
            </>
          ) : (
            <>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              Create Manual Backup
            </>
          )}
        </button>
      </div>

      {/* Backups List */}
      <div className="backups-list">
        <h3 className="list-title">Available Backups</h3>
        
        {backups.length === 0 ? (
          <div className="empty-backups">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" style={{opacity: 0.3}}>
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" stroke="currentColor" strokeWidth="2"/>
            </svg>
            <p>No backups available</p>
            <p className="empty-hint">Create your first backup to get started</p>
          </div>
        ) : (
          <div className="backup-items">
            {backups.map((backup) => (
              <div key={backup.backup_id} className="backup-item">
                <div className="backup-item-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                </div>
                <div className="backup-item-info">
                  <div className="backup-item-name">{backup.backup_id}</div>
                  <div className="backup-item-meta">
                    {formatDate(backup.created_at)} • {formatFileSize(backup.file_size)}
                  </div>
                </div>
                <div className="backup-item-actions">
                  <button
                    className="action-button download"
                    onClick={() => handleDownloadBackup(backup.backup_id)}
                    title="Download"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                  </button>
                  <button
                    className="action-button delete"
                    onClick={() => handleDeleteBackup(backup.backup_id)}
                    title="Delete"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" stroke="currentColor" strokeWidth="2"/>
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default BackupManagement;
