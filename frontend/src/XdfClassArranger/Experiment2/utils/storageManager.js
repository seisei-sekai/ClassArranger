/**
 * Storage Manager for Experiment2
 * LocalStorage管理器
 * 
 * Simple and reliable storage management
 */

/**
 * Storage keys
 */
const STORAGE_KEYS = {
  STUDENTS: 'experiment2_students',
  TEACHERS: 'experiment2_teachers',
  CLASSROOMS: 'experiment2_classrooms',
  COURSES: 'experiment2_courses',
  SETTINGS: 'experiment2_settings',
  METADATA: 'experiment2_metadata'
};

/**
 * Storage Manager Class
 */
class StorageManager {
  /**
   * Save data to localStorage
   */
  static save(key, data) {
    try {
      const storageKey = STORAGE_KEYS[key];
      if (!storageKey) {
        console.error(`Invalid storage key: ${key}`);
        return false;
      }
      
      localStorage.setItem(storageKey, JSON.stringify(data));
      
      // Update metadata
      this.updateMetadata(key);
      
      return true;
    } catch (error) {
      console.error(`Failed to save ${key}:`, error);
      return false;
    }
  }
  
  /**
   * Load data from localStorage
   */
  static load(key, defaultValue = []) {
    try {
      const storageKey = STORAGE_KEYS[key];
      if (!storageKey) {
        console.error(`Invalid storage key: ${key}`);
        return defaultValue;
      }
      
      const data = localStorage.getItem(storageKey);
      if (!data) return defaultValue;
      
      const parsed = JSON.parse(data);
      
      // Handle Set objects in constraints
      if (key === 'STUDENTS' && Array.isArray(parsed)) {
        return parsed.map(student => ({
          ...student,
          constraints: student.constraints ? {
            ...student.constraints,
            allowedDays: new Set(student.constraints.allowedDays || [])
          } : student.constraints
        }));
      }
      
      return parsed;
    } catch (error) {
      console.error(`Failed to load ${key}:`, error);
      return defaultValue;
    }
  }
  
  /**
   * Clear specific key
   */
  static clear(key) {
    try {
      const storageKey = STORAGE_KEYS[key];
      if (!storageKey) return false;
      
      localStorage.removeItem(storageKey);
      return true;
    } catch (error) {
      console.error(`Failed to clear ${key}:`, error);
      return false;
    }
  }
  
  /**
   * Clear all Experiment2 data
   */
  static clearAll() {
    try {
      Object.values(STORAGE_KEYS).forEach(key => {
        localStorage.removeItem(key);
      });
      return true;
    } catch (error) {
      console.error('Failed to clear all data:', error);
      return false;
    }
  }
  
  /**
   * Export all data as JSON
   */
  static exportAll() {
    try {
      const data = {};
      
      Object.entries(STORAGE_KEYS).forEach(([key, storageKey]) => {
        const value = localStorage.getItem(storageKey);
        if (value) {
          data[key] = JSON.parse(value);
        }
      });
      
      return data;
    } catch (error) {
      console.error('Failed to export data:', error);
      return null;
    }
  }
  
  /**
   * Import data from JSON
   */
  static importAll(data) {
    try {
      Object.entries(data).forEach(([key, value]) => {
        this.save(key, value);
      });
      return true;
    } catch (error) {
      console.error('Failed to import data:', error);
      return false;
    }
  }
  
  /**
   * Update metadata (last modified time, etc.)
   */
  static updateMetadata(key) {
    try {
      const metadata = this.load('METADATA', {});
      metadata[key] = {
        lastModified: new Date().toISOString(),
        version: '1.0.0'
      };
      localStorage.setItem(STORAGE_KEYS.METADATA, JSON.stringify(metadata));
    } catch (error) {
      console.error('Failed to update metadata:', error);
    }
  }
  
  /**
   * Get storage size
   */
  static getStorageSize() {
    try {
      let totalSize = 0;
      Object.values(STORAGE_KEYS).forEach(key => {
        const value = localStorage.getItem(key);
        if (value) {
          totalSize += value.length;
        }
      });
      return totalSize;
    } catch (error) {
      console.error('Failed to get storage size:', error);
      return 0;
    }
  }
}

export default StorageManager;
