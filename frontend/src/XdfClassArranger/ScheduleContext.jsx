/**
 * Schedule Context - Global State Management
 * 课表上下文 - 全局状态管理
 * 
 * Provides global state for scheduled courses, students, teachers, and classrooms
 * 提供已排课程、学生、老师和教室的全局状态
 */

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { getCourseHoursManager } from './Function/utils/courseHoursManager';

const ScheduleContext = createContext();

/**
 * Schedule Provider Component
 * 课表提供者组件
 * 
 * Wraps the application and provides scheduling state
 * 包裹应用并提供排课状态
 */
export const ScheduleProvider = ({ children }) => {
  // Scheduled courses state
  // 已排课程状态
  const [scheduledCourses, setScheduledCourses] = useState([]);
  
  // All students (including those not yet scheduled)
  // 所有学生（包括尚未排课的）
  const [allStudents, setAllStudents] = useState([]);
  
  // All teachers
  // 所有老师
  const [allTeachers, setAllTeachers] = useState([]);
  
  // All classrooms
  // 所有教室
  const [allClassrooms, setAllClassrooms] = useState([]);
  
  // Course hours manager instance
  // 课时管理器实例
  const [hoursManager] = useState(() => getCourseHoursManager());
  
  // Scheduling metadata
  // 排课元数据
  const [schedulingMetadata, setSchedulingMetadata] = useState({
    lastScheduledAt: null,
    totalCoursesScheduled: 0,
    totalHoursScheduled: 0,
    conflictsDetected: 0
  });

  /**
   * Add scheduled courses
   * 添加已排课程
   * 
   * @param {Array<Object>} courses - Array of course objects to add
   */
  const addScheduledCourses = useCallback((courses) => {
    if (!Array.isArray(courses) || courses.length === 0) {
      console.warn('[ScheduleContext] No courses to add');
      return;
    }

    setScheduledCourses(prev => {
      // Avoid duplicates by checking course IDs
      const existingIds = new Set(prev.map(c => c.id));
      const newCourses = courses.filter(c => !existingIds.has(c.id));
      
      console.log(`[ScheduleContext] Adding ${newCourses.length} new courses`);
      return [...prev, ...newCourses];
    });

    // Update metadata
    setSchedulingMetadata(prev => ({
      ...prev,
      lastScheduledAt: new Date().toISOString(),
      totalCoursesScheduled: prev.totalCoursesScheduled + courses.length
    }));
  }, []);

  /**
   * Remove a scheduled course
   * 移除已排课程
   * 
   * @param {string} courseId - Course ID to remove
   */
  const removeScheduledCourse = useCallback((courseId) => {
    setScheduledCourses(prev => {
      const course = prev.find(c => c.id === courseId);
      if (course && course.student && course.student.id) {
        // Refund hours if course had hours tracked
        try {
          const duration = course.timeSlot?.duration || 24; // Default 2 hours = 24 slots
          const hoursToRefund = hoursManager.calculateHoursConsumed(duration);
          hoursManager.refundHours(course.student.id, hoursToRefund, courseId);
        } catch (error) {
          console.error('[ScheduleContext] Error refunding hours:', error);
        }
      }
      
      return prev.filter(c => c.id !== courseId);
    });
  }, [hoursManager]);

  /**
   * Clear all scheduled courses
   * 清空所有已排课程
   */
  const clearSchedule = useCallback(() => {
    console.log('[ScheduleContext] Clearing all scheduled courses');
    setScheduledCourses([]);
    hoursManager.reset();
    setSchedulingMetadata({
      lastScheduledAt: null,
      totalCoursesScheduled: 0,
      totalHoursScheduled: 0,
      conflictsDetected: 0
    });
  }, [hoursManager]);

  /**
   * Update students list
   * 更新学生列表
   * 
   * @param {Array<Object>} students - Array of student objects
   */
  const updateStudents = useCallback((students) => {
    setAllStudents(students);
    
    // Initialize hours for each student
    students.forEach(student => {
      if (student.courseHours && student.courseHours.totalHours > 0) {
        try {
          hoursManager.initializeStudentHours(student, student.courseHours.totalHours);
        } catch (error) {
          // Student may already be initialized
          console.debug('[ScheduleContext] Student hours already initialized:', student.id);
        }
      }
    });
  }, [hoursManager]);

  /**
   * Update teachers list
   * 更新老师列表
   * 
   * @param {Array<Object>} teachers - Array of teacher objects
   */
  const updateTeachers = useCallback((teachers) => {
    console.log(`[ScheduleContext] Updating teachers list: ${teachers.length} teachers`);
    setAllTeachers(teachers);
  }, []);

  /**
   * Update classrooms list
   * 更新教室列表
   * 
   * @param {Array<Object>} classrooms - Array of classroom objects
   */
  const updateClassrooms = useCallback((classrooms) => {
    console.log(`[ScheduleContext] Updating classrooms list: ${classrooms.length} classrooms`);
    setAllClassrooms(classrooms);
  }, []);

  /**
   * Get scheduled courses for a specific student
   * 获取特定学生的已排课程
   * 
   * @param {string} studentId - Student ID
   * @returns {Array<Object>} Array of courses for this student
   */
  const getStudentCourses = useCallback((studentId) => {
    return scheduledCourses.filter(course => 
      course.student && course.student.id === studentId
    );
  }, [scheduledCourses]);

  /**
   * Get scheduled courses for a specific teacher
   * 获取特定老师的已排课程
   * 
   * @param {string} teacherId - Teacher ID
   * @returns {Array<Object>} Array of courses for this teacher
   */
  const getTeacherCourses = useCallback((teacherId) => {
    return scheduledCourses.filter(course => 
      course.teacher && course.teacher.id === teacherId
    );
  }, [scheduledCourses]);

  /**
   * Get scheduled courses for a specific classroom
   * 获取特定教室的已排课程
   * 
   * @param {string} classroomId - Classroom ID
   * @returns {Array<Object>} Array of courses for this classroom
   */
  const getClassroomCourses = useCallback((classroomId) => {
    return scheduledCourses.filter(course => 
      course.room && course.room.id === classroomId
    );
  }, [scheduledCourses]);

  /**
   * Get students with scheduled courses
   * 获取有已排课程的学生
   * 
   * @returns {Array<Object>} Array of students who have courses scheduled
   */
  const getScheduledStudents = useCallback(() => {
    const studentIds = new Set(
      scheduledCourses
        .filter(c => c.student && c.student.id)
        .map(c => c.student.id)
    );
    
    return allStudents.filter(s => studentIds.has(s.id));
  }, [scheduledCourses, allStudents]);

  /**
   * Get teachers with scheduled courses
   * 获取有已排课程的老师
   * 
   * @returns {Array<Object>} Array of teachers who have courses scheduled
   */
  const getScheduledTeachers = useCallback(() => {
    const teacherIds = new Set(
      scheduledCourses
        .filter(c => c.teacher && c.teacher.id)
        .map(c => c.teacher.id)
    );
    
    return allTeachers.filter(t => teacherIds.has(t.id));
  }, [scheduledCourses, allTeachers]);

  /**
   * Get classrooms with scheduled courses
   * 获取有已排课程的教室
   * 
   * @returns {Array<Object>} Array of classrooms that have courses scheduled
   */
  const getScheduledClassrooms = useCallback(() => {
    const classroomIds = new Set(
      scheduledCourses
        .filter(c => c.room && c.room.id)
        .map(c => c.room.id)
    );
    
    return allClassrooms.filter(r => classroomIds.has(r.id));
  }, [scheduledCourses, allClassrooms]);

  /**
   * Get overall schedule statistics
   * 获取整体课表统计
   * 
   * @returns {Object} Statistics object
   */
  const getScheduleStatistics = useCallback(() => {
    const stats = {
      totalCourses: scheduledCourses.length,
      uniqueStudents: new Set(scheduledCourses.map(c => c.student?.id).filter(Boolean)).size,
      uniqueTeachers: new Set(scheduledCourses.map(c => c.teacher?.id).filter(Boolean)).size,
      uniqueClassrooms: new Set(scheduledCourses.map(c => c.room?.id).filter(Boolean)).size,
      totalHoursScheduled: 0,
      coursesByDay: {},
      coursesByCampus: {}
    };

    scheduledCourses.forEach(course => {
      // Calculate total hours
      const duration = course.timeSlot?.duration || 24; // Default 2 hours
      stats.totalHoursScheduled += hoursManager.calculateHoursConsumed(duration);

      // Count by day
      const day = course.timeSlot?.day;
      if (day !== undefined) {
        stats.coursesByDay[day] = (stats.coursesByDay[day] || 0) + 1;
      }

      // Count by campus
      const campus = course.room?.campus || 'Unknown';
      stats.coursesByCampus[campus] = (stats.coursesByCampus[campus] || 0) + 1;
    });

    // Get hours statistics from hours manager
    const hoursStats = hoursManager.getHoursStatistics();
    stats.hoursStatistics = hoursStats;

    return stats;
  }, [scheduledCourses, hoursManager]);

  // Context value
  const value = {
    // State
    scheduledCourses,
    allStudents,
    allTeachers,
    allClassrooms,
    schedulingMetadata,
    hoursManager,

    // Actions
    addScheduledCourses,
    removeScheduledCourse,
    clearSchedule,
    updateStudents,
    updateTeachers,
    updateClassrooms,

    // Queries
    getStudentCourses,
    getTeacherCourses,
    getClassroomCourses,
    getScheduledStudents,
    getScheduledTeachers,
    getScheduledClassrooms,
    getScheduleStatistics
  };

  return (
    <ScheduleContext.Provider value={value}>
      {children}
    </ScheduleContext.Provider>
  );
};

/**
 * Custom hook to use Schedule Context
 * 使用课表上下文的自定义钩子
 * 
 * @returns {Object} Schedule context value
 */
export const useSchedule = () => {
  const context = useContext(ScheduleContext);
  
  if (!context) {
    throw new Error('useSchedule must be used within a ScheduleProvider');
  }
  
  return context;
};

export default ScheduleContext;

