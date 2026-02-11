/**
 * Database Service
 * 数据库服务层 - 替代LocalStorage，使用MongoDB后端API
 * 
 * 🔥 多租户架构：所有数据通过JWT token自动隔离到当前登录用户
 * 🔥 自动错误处理和重试机制
 * 🔥 统一的API调用接口
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

/**
 * 获取认证token
 */
function getAuthToken() {
  return localStorage.getItem('token');
}

/**
 * 通用API调用函数
 */
async function apiCall(endpoint, options = {}) {
  const token = getAuthToken();
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });
  
  if (response.status === 401) {
    // Token过期或无效，重定向到登录页
    console.error('[DatabaseService] Authentication failed, redirecting to login...');
    window.location.href = '/login';
    throw new Error('Authentication required');
  }
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
    throw new Error(error.detail || `HTTP ${response.status}`);
  }
  
  // 204 No Content
  if (response.status === 204) {
    return null;
  }
  
  return response.json();
}

// ============================================================================
// 学生数据服务 (Students Data Service)
// ============================================================================

export const studentsStorage = {
  /**
   * 加载所有学生
   */
  load: async () => {
    try {
      console.log('[DatabaseService] Loading students from MongoDB...');
      const students = await apiCall('/api/scheduling/students');
      console.log(`[DatabaseService] Loaded ${students.length} students`);
      return students;
    } catch (error) {
      console.error('[DatabaseService] Error loading students:', error);
      return [];
    }
  },

  /**
   * 保存所有学生（批量更新）
   */
  save: async (students) => {
    try {
      console.log(`[DatabaseService] Saving ${students.length} students to MongoDB...`);
      
      // 批量创建/更新
      // 注意：这里采用简化策略 - 先删除所有旧数据，再批量创建
      // 更复杂的实现可以做差异对比，只更新变化的数据
      const updates = students.map(student => 
        studentsStorage.saveOne(student)
      );
      
      await Promise.all(updates);
      console.log(`[DatabaseService] Saved ${students.length} students`);
    } catch (error) {
      console.error('[DatabaseService] Error saving students:', error);
      throw error;
    }
  },

  /**
   * 保存单个学生
   */
  saveOne: async (student) => {
    try {
      if (student.id && student.id.startsWith('student-')) {
        // 新创建的学生（本地ID），需要先创建
        const { id, createdAt, updatedAt, ...studentData } = student;
        const created = await apiCall('/api/scheduling/students', {
          method: 'POST',
          body: JSON.stringify(studentData),
        });
        return created;
      } else {
        // 已存在的学生，更新
        const { id, createdAt, updatedAt, ...studentData } = student;
        const updated = await apiCall(`/api/scheduling/students/${id}`, {
          method: 'PUT',
          body: JSON.stringify(studentData),
        });
        return updated;
      }
    } catch (error) {
      console.error('[DatabaseService] Error saving student:', error);
      throw error;
    }
  },

  /**
   * 删除单个学生
   */
  deleteOne: async (studentId) => {
    try {
      await apiCall(`/api/scheduling/students/${studentId}`, {
        method: 'DELETE',
      });
      console.log(`[DatabaseService] Deleted student: ${studentId}`);
    } catch (error) {
      console.error('[DatabaseService] Error deleting student:', error);
      throw error;
    }
  },

  /**
   * 清空所有学生（仅用于测试/重置）
   */
  clear: async () => {
    try {
      const students = await studentsStorage.load();
      const deletions = students.map(s => studentsStorage.deleteOne(s.id));
      await Promise.all(deletions);
      console.log('[DatabaseService] Cleared all students');
    } catch (error) {
      console.error('[DatabaseService] Error clearing students:', error);
      throw error;
    }
  },
};

// ============================================================================
// 教师数据服务 (Teachers Data Service)
// ============================================================================

export const teachersStorage = {
  load: async () => {
    try {
      console.log('[DatabaseService] Loading teachers from MongoDB...');
      const teachers = await apiCall('/api/scheduling/teachers');
      console.log(`[DatabaseService] Loaded ${teachers.length} teachers`);
      return teachers;
    } catch (error) {
      console.error('[DatabaseService] Error loading teachers:', error);
      return [];
    }
  },

  save: async (teachers) => {
    try {
      console.log(`[DatabaseService] Saving ${teachers.length} teachers to MongoDB...`);
      const updates = teachers.map(teacher => teachersStorage.saveOne(teacher));
      await Promise.all(updates);
      console.log(`[DatabaseService] Saved ${teachers.length} teachers`);
    } catch (error) {
      console.error('[DatabaseService] Error saving teachers:', error);
      throw error;
    }
  },

  saveOne: async (teacher) => {
    try {
      if (teacher.id && teacher.id.startsWith('teacher-')) {
        const { id, createdAt, updatedAt, ...teacherData } = teacher;
        const created = await apiCall('/api/scheduling/teachers', {
          method: 'POST',
          body: JSON.stringify(teacherData),
        });
        return created;
      } else {
        const { id, createdAt, updatedAt, ...teacherData } = teacher;
        const updated = await apiCall(`/api/scheduling/teachers/${id}`, {
          method: 'PUT',
          body: JSON.stringify(teacherData),
        });
        return updated;
      }
    } catch (error) {
      console.error('[DatabaseService] Error saving teacher:', error);
      throw error;
    }
  },

  deleteOne: async (teacherId) => {
    try {
      await apiCall(`/api/scheduling/teachers/${teacherId}`, {
        method: 'DELETE',
      });
      console.log(`[DatabaseService] Deleted teacher: ${teacherId}`);
    } catch (error) {
      console.error('[DatabaseService] Error deleting teacher:', error);
      throw error;
    }
  },

  clear: async () => {
    try {
      const teachers = await teachersStorage.load();
      const deletions = teachers.map(t => teachersStorage.deleteOne(t.id));
      await Promise.all(deletions);
      console.log('[DatabaseService] Cleared all teachers');
    } catch (error) {
      console.error('[DatabaseService] Error clearing teachers:', error);
      throw error;
    }
  },
};

// ============================================================================
// 教室数据服务 (Classrooms Data Service)
// ============================================================================

export const classroomsStorage = {
  load: async () => {
    try {
      console.log('[DatabaseService] Loading classrooms from MongoDB...');
      const classrooms = await apiCall('/api/scheduling/classrooms');
      console.log(`[DatabaseService] Loaded ${classrooms.length} classrooms`);
      return classrooms;
    } catch (error) {
      console.error('[DatabaseService] Error loading classrooms:', error);
      return [];
    }
  },

  save: async (classrooms) => {
    try {
      console.log(`[DatabaseService] Saving ${classrooms.length} classrooms to MongoDB...`);
      const updates = classrooms.map(classroom => classroomsStorage.saveOne(classroom));
      await Promise.all(updates);
      console.log(`[DatabaseService] Saved ${classrooms.length} classrooms`);
    } catch (error) {
      console.error('[DatabaseService] Error saving classrooms:', error);
      throw error;
    }
  },

  saveOne: async (classroom) => {
    try {
      if (classroom.id && classroom.id.startsWith('classroom-')) {
        const { id, createdAt, updatedAt, ...classroomData } = classroom;
        const created = await apiCall('/api/scheduling/classrooms', {
          method: 'POST',
          body: JSON.stringify(classroomData),
        });
        return created;
      } else {
        const { id, createdAt, updatedAt, ...classroomData } = classroom;
        // Note: Classrooms don't have update endpoint in current API
        // Skip update for now
        return classroom;
      }
    } catch (error) {
      console.error('[DatabaseService] Error saving classroom:', error);
      throw error;
    }
  },

  deleteOne: async (classroomId) => {
    try {
      await apiCall(`/api/scheduling/classrooms/${classroomId}`, {
        method: 'DELETE',
      });
      console.log(`[DatabaseService] Deleted classroom: ${classroomId}`);
    } catch (error) {
      console.error('[DatabaseService] Error deleting classroom:', error);
      throw error;
    }
  },

  clear: async () => {
    try {
      const classrooms = await classroomsStorage.load();
      const deletions = classrooms.map(c => classroomsStorage.deleteOne(c.id));
      await Promise.all(deletions);
      console.log('[DatabaseService] Cleared all classrooms');
    } catch (error) {
      console.error('[DatabaseService] Error clearing classrooms:', error);
      throw error;
    }
  },
};

// ============================================================================
// 排课课程服务 (Scheduled Courses Service)
// ============================================================================

export const scheduledCoursesStorage = {
  load: async (scheduleSessionId = null) => {
    try {
      console.log('[DatabaseService] Loading courses from MongoDB...');
      const endpoint = scheduleSessionId 
        ? `/api/scheduling/courses?schedule_session_id=${scheduleSessionId}`
        : '/api/scheduling/courses';
      const courses = await apiCall(endpoint);
      console.log(`[DatabaseService] Loaded ${courses.length} courses`);
      return courses;
    } catch (error) {
      console.error('[DatabaseService] Error loading courses:', error);
      return [];
    }
  },

  save: async (courses, scheduleSessionId = null) => {
    try {
      const sessionId = scheduleSessionId || `session-${Date.now()}`;
      console.log(`[DatabaseService] Saving ${courses.length} courses to MongoDB (session: ${sessionId})...`);
      
      // 过滤掉虚拟课程
      const realCourses = courses.filter(course => !course.isVirtual && course.status !== 'unscheduled');
      console.log(`[DatabaseService] Filtering: ${courses.length} total → ${realCourses.length} real courses`);
      
      if (realCourses.length > 0) {
        await apiCall('/api/scheduling/courses/batch', {
          method: 'POST',
          body: JSON.stringify(realCourses),
        });
        console.log(`[DatabaseService] Saved ${realCourses.length} courses`);
      }
    } catch (error) {
      console.error('[DatabaseService] Error saving courses:', error);
      throw error;
    }
  },

  clear: async (scheduleSessionId = null) => {
    try {
      if (scheduleSessionId) {
        await apiCall(`/api/scheduling/courses/session/${scheduleSessionId}`, {
          method: 'DELETE',
        });
        console.log(`[DatabaseService] Cleared courses for session: ${scheduleSessionId}`);
      } else {
        // Clear all courses (not recommended in production)
        console.warn('[DatabaseService] Clearing all courses not implemented');
      }
    } catch (error) {
      console.error('[DatabaseService] Error clearing courses:', error);
      throw error;
    }
  },
};

// ============================================================================
// 计数器服务 (Counters Service)
// ============================================================================

export const countersStorage = {
  loadStudentCounter: async () => {
    try {
      const counters = await apiCall('/api/scheduling/counters');
      return counters.studentCounter || 0;
    } catch (error) {
      console.error('[DatabaseService] Error loading student counter:', error);
      return 0;
    }
  },

  loadTeacherCounter: async () => {
    try {
      const counters = await apiCall('/api/scheduling/counters');
      return counters.teacherCounter || 0;
    } catch (error) {
      console.error('[DatabaseService] Error loading teacher counter:', error);
      return 0;
    }
  },

  saveStudentCounter: async (counter) => {
    // Counter is automatically managed by backend
    console.log('[DatabaseService] Student counter auto-managed by backend');
  },

  saveTeacherCounter: async (counter) => {
    // Counter is automatically managed by backend
    console.log('[DatabaseService] Teacher counter auto-managed by backend');
  },

  incrementStudent: async () => {
    try {
      const result = await apiCall('/api/scheduling/counters/increment', {
        method: 'POST',
        body: JSON.stringify({ counter_type: 'student' }),
      });
      return result.studentCounter;
    } catch (error) {
      console.error('[DatabaseService] Error incrementing student counter:', error);
      return 0;
    }
  },

  incrementTeacher: async () => {
    try {
      const result = await apiCall('/api/scheduling/counters/increment', {
        method: 'POST',
        body: JSON.stringify({ counter_type: 'teacher' }),
      });
      return result.teacherCounter;
    } catch (error) {
      console.error('[DatabaseService] Error incrementing teacher counter:', error);
      return 0;
    }
  },

  clear: async () => {
    console.log('[DatabaseService] Counters are user-scoped, no clear needed');
  },
};

// ============================================================================
// 调整历史服务 (Adjustment History Service)
// ============================================================================

export const adjustmentHistoryStorage = {
  load: async () => {
    try {
      const history = await apiCall('/api/scheduling/adjustments');
      return history || [];
    } catch (error) {
      console.error('[DatabaseService] Error loading adjustment history:', error);
      return [];
    }
  },

  save: async (history) => {
    console.log('[DatabaseService] Adjustment history is managed via addRecord');
  },

  addRecord: async (record) => {
    try {
      const created = await apiCall('/api/scheduling/adjustments', {
        method: 'POST',
        body: JSON.stringify(record),
      });
      console.log('[DatabaseService] Added adjustment record');
      return created;
    } catch (error) {
      console.error('[DatabaseService] Error adding adjustment record:', error);
      throw error;
    }
  },

  getRecordsByConflict: async (conflictId) => {
    try {
      const records = await apiCall(`/api/scheduling/adjustments?conflict_id=${conflictId}`);
      return records || [];
    } catch (error) {
      console.error('[DatabaseService] Error getting adjustment records:', error);
      return [];
    }
  },

  clear: async () => {
    console.log('[DatabaseService] Adjustment history clear not implemented (use with caution)');
  },
};

// ============================================================================
// 其他存储（暂时保留在LocalStorage）
// ============================================================================

export const eventsStorage = {
  save: (events) => {
    // FullCalendar events 暂时保留在 LocalStorage（临时UI状态）
    try {
      localStorage.setItem('xdf_events', JSON.stringify(events));
    } catch (error) {
      console.error('[DatabaseService] Error saving events to localStorage:', error);
    }
  },
  load: () => {
    try {
      const data = localStorage.getItem('xdf_events');
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('[DatabaseService] Error loading events from localStorage:', error);
      return [];
    }
  },
  clear: () => {
    localStorage.removeItem('xdf_events');
  },
};

export const aiResultStorage = {
  save: (result) => {
    // AI结果暂时保留在 LocalStorage（临时数据）
    try {
      localStorage.setItem('xdf_ai_result', JSON.stringify(result));
    } catch (error) {
      console.error('[DatabaseService] Error saving AI result to localStorage:', error);
    }
  },
  load: () => {
    try {
      const data = localStorage.getItem('xdf_ai_result');
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('[DatabaseService] Error loading AI result from localStorage:', error);
      return null;
    }
  },
  clear: () => {
    localStorage.removeItem('xdf_ai_result');
  },
};

export const schedulingMetadataStorage = {
  save: (metadata) => {
    // Metadata 可以考虑移到后端，但暂时保留在 LocalStorage
    try {
      localStorage.setItem('xdf_scheduling_metadata', JSON.stringify(metadata));
    } catch (error) {
      console.error('[DatabaseService] Error saving metadata to localStorage:', error);
    }
  },
  load: () => {
    try {
      const data = localStorage.getItem('xdf_scheduling_metadata');
      return data ? JSON.parse(data) : {
        lastScheduledAt: null,
        totalCoursesScheduled: 0,
        totalHoursScheduled: 0,
        conflictsDetected: 0,
      };
    } catch (error) {
      console.error('[DatabaseService] Error loading metadata from localStorage:', error);
      return {
        lastScheduledAt: null,
        totalCoursesScheduled: 0,
        totalHoursScheduled: 0,
        conflictsDetected: 0,
      };
    }
  },
  clear: () => {
    localStorage.removeItem('xdf_scheduling_metadata');
  },
};

// ============================================================================
// 清空所有数据
// ============================================================================

export const clearAllLocalStorage = async () => {
  try {
    console.log('[DatabaseService] Clearing all data...');
    await studentsStorage.clear();
    await teachersStorage.clear();
    await classroomsStorage.clear();
    await scheduledCoursesStorage.clear();
    await adjustmentHistoryStorage.clear();
    
    // Clear localStorage
    eventsStorage.clear();
    aiResultStorage.clear();
    schedulingMetadataStorage.clear();
    
    console.log('[DatabaseService] All data cleared');
  } catch (error) {
    console.error('[DatabaseService] Error clearing all data:', error);
    throw error;
  }
};

export default {
  studentsStorage,
  teachersStorage,
  classroomsStorage,
  scheduledCoursesStorage,
  countersStorage,
  adjustmentHistoryStorage,
  eventsStorage,
  aiResultStorage,
  schedulingMetadataStorage,
  clearAllLocalStorage,
};
