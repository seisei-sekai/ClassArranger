/**
 * Local Storage Service
 * LocalStorage服务
 * 
 * Provides centralized localStorage management for the application
 * 为应用提供集中的localStorage管理
 */

// Storage keys
const STORAGE_KEYS = {
  STUDENTS: 'xdf_students',
  TEACHERS: 'xdf_teachers',
  CLASSROOMS: 'xdf_classrooms',
  SCHEDULED_COURSES: 'xdf_scheduled_courses',
  SCHEDULING_METADATA: 'xdf_scheduling_metadata',
  EVENTS: 'xdf_events',
  AI_RESULT: 'xdf_ai_result',
  STUDENT_COUNTER: 'xdf_student_counter',
  TEACHER_COUNTER: 'xdf_teacher_counter',
  ADJUSTMENT_HISTORY: 'xdf_adjustment_history', // 新增：调整历史记录
  SCHEMA_VERSION: 'xdf_schema_version'
};

// Current schema version
const CURRENT_SCHEMA_VERSION = 3; // V3: Added isModified and modificationHistory fields, adjustment history

/**
 * Save data to localStorage
 * 保存数据到localStorage
 * 
 * @param {string} key - Storage key
 * @param {any} data - Data to save
 */
export const saveToLocalStorage = (key, data) => {
  try {
    const serialized = JSON.stringify(data);
    const sizeInKB = (new Blob([serialized]).size / 1024).toFixed(2);
    
    // Check if size is too large (> 2MB for safety)
    if (new Blob([serialized]).size > 2 * 1024 * 1024) {
      console.warn(`[LocalStorage] Warning: ${key} is large (${sizeInKB} KB). Consider data reduction.`);
    }
    
    localStorage.setItem(key, serialized);
    console.log(`[LocalStorage] Saved ${key} (${sizeInKB} KB)`);
  } catch (error) {
    if (error.name === 'QuotaExceededError') {
      console.error(`[LocalStorage] QuotaExceeded for ${key}. Attempting cleanup...`);
      
      // Try to free up space by clearing old data
      try {
        // Clear events and AI result (less critical data)
        removeFromLocalStorage(STORAGE_KEYS.EVENTS);
        removeFromLocalStorage(STORAGE_KEYS.AI_RESULT);
        console.log('[LocalStorage] Cleared events and AI result to free space');
        
        // Retry save
        const serialized = JSON.stringify(data);
        localStorage.setItem(key, serialized);
        console.log(`[LocalStorage] Saved ${key} after cleanup`);
      } catch (retryError) {
        console.error(`[LocalStorage] Failed to save ${key} even after cleanup:`, retryError);
        alert('存储空间不足！已自动清理缓存，请重新执行操作。如仍失败，请清空浏览器缓存。');
      }
    } else {
      console.error(`[LocalStorage] Error saving ${key}:`, error);
    }
  }
};

/**
 * Load data from localStorage
 * 从localStorage加载数据
 * 
 * @param {string} key - Storage key
 * @param {any} defaultValue - Default value if key doesn't exist
 * @returns {any} Loaded data or default value
 */
export const loadFromLocalStorage = (key, defaultValue = null) => {
  try {
    const serialized = localStorage.getItem(key);
    if (serialized === null) {
      return defaultValue;
    }
    const data = JSON.parse(serialized);
    console.log(`[LocalStorage] Loaded ${key}`);
    return data;
  } catch (error) {
    console.error(`[LocalStorage] Error loading ${key}:`, error);
    return defaultValue;
  }
};

/**
 * Remove data from localStorage
 * 从localStorage移除数据
 * 
 * @param {string} key - Storage key
 */
export const removeFromLocalStorage = (key) => {
  try {
    localStorage.removeItem(key);
    console.log(`[LocalStorage] Removed ${key}`);
  } catch (error) {
    console.error(`[LocalStorage] Error removing ${key}:`, error);
  }
};

/**
 * Clear all application data from localStorage
 * 清空localStorage中的所有应用数据
 */
export const clearAllLocalStorage = () => {
  try {
    Object.values(STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
    console.log('[LocalStorage] Cleared all application data');
  } catch (error) {
    console.error('[LocalStorage] Error clearing localStorage:', error);
  }
};

/**
 * Get all storage keys
 * 获取所有存储键
 */
export const getStorageKeys = () => STORAGE_KEYS;

/**
 * Data migration functions
 * 数据迁移函数
 */

/**
 * Migrate student data from V1 to V2
 * 从V1迁移学生数据到V2
 */
function migrateStudentV1ToV2(student) {
  if (student.constraints) {
    return student; // Already V2
  }

  // Infer default constraints with maximum freedom
  const defaultConstraints = [];
  
  // Add default time_window
  defaultConstraints.push({
    id: `constraint_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    kind: 'time_window',
    strength: 'soft',
    priority: 5,
    operator: 'allow',
    weekdays: [1, 2, 3, 4, 5, 6, 7],
    timeRanges: [{ start: '09:00', end: '21:00' }],
    source: [],
    confidence: 0.5,
    note: '自动迁移：默认全周可用'
  });

  return {
    ...student,
    constraints: defaultConstraints,
    constraintsModified: false,
    aiParsed: false,
    inferredDefaults: {
      rationale: '数据迁移时自动添加的默认约束'
    }
  };
}

/**
 * Check and run migrations if needed
 * 检查并运行必要的数据迁移
 */
function checkAndMigrate() {
  const currentVersion = loadFromLocalStorage(STORAGE_KEYS.SCHEMA_VERSION, 1);
  
  if (currentVersion < CURRENT_SCHEMA_VERSION) {
    console.log(`[LocalStorage] 检测到旧版本数据 (v${currentVersion})，开始迁移到 v${CURRENT_SCHEMA_VERSION}...`);
    
    // Migrate students V1 -> V2
    if (currentVersion < 2) {
      const students = loadFromLocalStorage(STORAGE_KEYS.STUDENTS, []);
      const migratedStudents = students.map(migrateStudentV1ToV2);
      saveToLocalStorage(STORAGE_KEYS.STUDENTS, migratedStudents);
      console.log(`[LocalStorage] 迁移了 ${migratedStudents.length} 个学生数据到 V2`);
    }
    
    // Update version
    saveToLocalStorage(STORAGE_KEYS.SCHEMA_VERSION, CURRENT_SCHEMA_VERSION);
    console.log('[LocalStorage] 数据迁移完成');
  }
}

// Run migration check on module load
checkAndMigrate();

// Individual data accessors
export const studentsStorage = {
  save: (students) => saveToLocalStorage(STORAGE_KEYS.STUDENTS, students),
  load: () => loadFromLocalStorage(STORAGE_KEYS.STUDENTS, []),
  clear: () => removeFromLocalStorage(STORAGE_KEYS.STUDENTS),
};

export const teachersStorage = {
  save: (teachers) => saveToLocalStorage(STORAGE_KEYS.TEACHERS, teachers),
  load: () => loadFromLocalStorage(STORAGE_KEYS.TEACHERS, []),
  clear: () => removeFromLocalStorage(STORAGE_KEYS.TEACHERS),
};

export const classroomsStorage = {
  save: (classrooms) => saveToLocalStorage(STORAGE_KEYS.CLASSROOMS, classrooms),
  load: () => loadFromLocalStorage(STORAGE_KEYS.CLASSROOMS, []),
  clear: () => removeFromLocalStorage(STORAGE_KEYS.CLASSROOMS),
};

export const scheduledCoursesStorage = {
  save: (courses) => {
    // 🔥 过滤掉虚拟课程，避免 LocalStorage 配额超出
    const realCourses = courses.filter(course => !course.isVirtual && course.status !== 'unscheduled');
    console.log(`[LocalStorage] Filtering courses: ${courses.length} total → ${realCourses.length} real courses (${courses.length - realCourses.length} virtual excluded)`);
    saveToLocalStorage(STORAGE_KEYS.SCHEDULED_COURSES, realCourses);
  },
  load: () => loadFromLocalStorage(STORAGE_KEYS.SCHEDULED_COURSES, []),
  clear: () => removeFromLocalStorage(STORAGE_KEYS.SCHEDULED_COURSES),
};

export const schedulingMetadataStorage = {
  save: (metadata) => saveToLocalStorage(STORAGE_KEYS.SCHEDULING_METADATA, metadata),
  load: () => loadFromLocalStorage(STORAGE_KEYS.SCHEDULING_METADATA, {
    lastScheduledAt: null,
    totalCoursesScheduled: 0,
    totalHoursScheduled: 0,
    conflictsDetected: 0,
  }),
  clear: () => removeFromLocalStorage(STORAGE_KEYS.SCHEDULING_METADATA),
};

export const eventsStorage = {
  save: (events) => saveToLocalStorage(STORAGE_KEYS.EVENTS, events),
  load: () => loadFromLocalStorage(STORAGE_KEYS.EVENTS, []),
  clear: () => removeFromLocalStorage(STORAGE_KEYS.EVENTS),
};

export const aiResultStorage = {
  save: (result) => saveToLocalStorage(STORAGE_KEYS.AI_RESULT, result),
  load: () => loadFromLocalStorage(STORAGE_KEYS.AI_RESULT, null),
  clear: () => removeFromLocalStorage(STORAGE_KEYS.AI_RESULT),
};

export const countersStorage = {
  saveStudentCounter: (counter) => saveToLocalStorage(STORAGE_KEYS.STUDENT_COUNTER, counter),
  loadStudentCounter: () => loadFromLocalStorage(STORAGE_KEYS.STUDENT_COUNTER, 0),
  saveTeacherCounter: (counter) => saveToLocalStorage(STORAGE_KEYS.TEACHER_COUNTER, counter),
  loadTeacherCounter: () => loadFromLocalStorage(STORAGE_KEYS.TEACHER_COUNTER, 0),
  clear: () => {
    removeFromLocalStorage(STORAGE_KEYS.STUDENT_COUNTER);
    removeFromLocalStorage(STORAGE_KEYS.TEACHER_COUNTER);
  },
};

export const adjustmentHistoryStorage = {
  save: (history) => saveToLocalStorage(STORAGE_KEYS.ADJUSTMENT_HISTORY, history),
  load: () => loadFromLocalStorage(STORAGE_KEYS.ADJUSTMENT_HISTORY, []),
  clear: () => removeFromLocalStorage(STORAGE_KEYS.ADJUSTMENT_HISTORY),
  
  // 添加单条记录
  addRecord: (record) => {
    const history = loadFromLocalStorage(STORAGE_KEYS.ADJUSTMENT_HISTORY, []);
    history.push(record);
    saveToLocalStorage(STORAGE_KEYS.ADJUSTMENT_HISTORY, history);
  },
  
  // 获取指定冲突的记录
  getRecordsByConflict: (conflictId) => {
    const history = loadFromLocalStorage(STORAGE_KEYS.ADJUSTMENT_HISTORY, []);
    return history.filter(r => r.conflictId === conflictId);
  }
};

export default {
  saveToLocalStorage,
  loadFromLocalStorage,
  removeFromLocalStorage,
  clearAllLocalStorage,
  getStorageKeys,
  studentsStorage,
  teachersStorage,
  classroomsStorage,
  scheduledCoursesStorage,
  schedulingMetadataStorage,
  eventsStorage,
  aiResultStorage,
  countersStorage,
  adjustmentHistoryStorage,
};
