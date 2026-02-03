/**
 * Backup Service
 * Frontend service for backup operations
 */

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const TOKEN_KEY = 'auth_token';

/**
 * Get authorization headers
 */
const getAuthHeaders = () => {
  const token = localStorage.getItem(TOKEN_KEY);
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
};

/**
 * Create manual backup
 */
export const createBackup = async () => {
  try {
    const response = await fetch(`${API_URL}/backup/create`, {
      method: 'POST',
      headers: getAuthHeaders()
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Backup creation failed');
    }

    return await response.json();
  } catch (error) {
    console.error('Create backup error:', error);
    throw error;
  }
};

/**
 * List all backups
 */
export const listBackups = async () => {
  try {
    const response = await fetch(`${API_URL}/backup/list`, {
      headers: getAuthHeaders()
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to list backups');
    }

    return await response.json();
  } catch (error) {
    console.error('List backups error:', error);
    throw error;
  }
};

/**
 * Download backup file
 */
export const downloadBackup = async (backupId) => {
  try {
    const token = localStorage.getItem(TOKEN_KEY);
    const response = await fetch(`${API_URL}/backup/download/${backupId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to download backup');
    }

    // Create download link
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = backupId;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  } catch (error) {
    console.error('Download backup error:', error);
    throw error;
  }
};

/**
 * Delete backup
 */
export const deleteBackup = async (backupId) => {
  try {
    const response = await fetch(`${API_URL}/backup/${backupId}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to delete backup');
    }

    return await response.json();
  } catch (error) {
    console.error('Delete backup error:', error);
    throw error;
  }
};

/**
 * Toggle auto backup
 */
export const toggleAutoBackup = async (enabled) => {
  try {
    const response = await fetch(`${API_URL}/backup/toggle`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ enabled })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to toggle auto backup');
    }

    return await response.json();
  } catch (error) {
    console.error('Toggle auto backup error:', error);
    throw error;
  }
};

/**
 * Get backup status
 */
export const getBackupStatus = async () => {
  try {
    const response = await fetch(`${API_URL}/backup/status`, {
      headers: getAuthHeaders()
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to get backup status');
    }

    return await response.json();
  } catch (error) {
    console.error('Get backup status error:', error);
    throw error;
  }
};

export default {
  createBackup,
  listBackups,
  downloadBackup,
  deleteBackup,
  toggleAutoBackup,
  getBackupStatus
};
