/**
 * Schedule Data Transformer for Experiment3
 * 排课数据转换器
 * 
 * Transforms data between different formats used in the system
 */

import { slotIndexToTime } from './constants.js';

/**
 * Transform scheduling result to storage format
 * 将排课结果转换为存储格式
 */
export function transformResultToStorage(result) {
  return {
    courses: result.courses || [],
    conflicts: result.conflicts || [],
    stats: result.stats || {},
    timestamp: new Date().toISOString(),
    version: '1.0'
  };
}

/**
 * Transform storage format back to scheduling result
 * 将存储格式转回排课结果
 */
export function transformStorageToResult(stored) {
  return {
    courses: stored.courses || [],
    conflicts: stored.conflicts || [],
    stats: stored.stats || {},
    timestamp: stored.timestamp
  };
}

/**
 * Extract courses that can be displayed
 * 提取可显示的课程
 */
export function extractDisplayableCourses(courses) {
  return courses.filter(course => {
    return (
      course &&
      course.student &&
      course.teacher &&
      course.timeSlot &&
      course.timeSlot.day !== undefined &&
      course.timeSlot.startSlot !== undefined &&
      course.timeSlot.endSlot !== undefined
    );
  });
}

/**
 * Group courses by student
 * 按学生分组课程
 */
export function groupCoursesByStudent(courses) {
  const grouped = {};
  
  courses.forEach(course => {
    const studentId = course.student?.id;
    if (!studentId) return;
    
    if (!grouped[studentId]) {
      grouped[studentId] = {
        student: course.student,
        courses: []
      };
    }
    
    grouped[studentId].courses.push(course);
  });
  
  return grouped;
}

/**
 * Group courses by teacher
 * 按教师分组课程
 */
export function groupCoursesByTeacher(courses) {
  const grouped = {};
  
  courses.forEach(course => {
    const teacherId = course.teacher?.id;
    if (!teacherId) return;
    
    if (!grouped[teacherId]) {
      grouped[teacherId] = {
        teacher: course.teacher,
        courses: []
      };
    }
    
    grouped[teacherId].courses.push(course);
  });
  
  return grouped;
}

/**
 * Group courses by day
 * 按星期分组课程
 */
export function groupCoursesByDay(courses) {
  const grouped = {
    0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: []
  };
  
  courses.forEach(course => {
    const day = course.timeSlot?.day;
    if (day !== undefined && grouped[day]) {
      grouped[day].push(course);
    }
  });
  
  return grouped;
}

/**
 * Calculate schedule summary statistics
 * 计算排课汇总统计
 */
export function calculateScheduleSummary(courses, students, teachers, classrooms) {
  const scheduledStudents = new Set(courses.map(c => c.student?.id).filter(Boolean));
  const activeTeachers = new Set(courses.map(c => c.teacher?.id).filter(Boolean));
  const usedClassrooms = new Set(courses.map(c => c.classroom?.id).filter(Boolean));
  
  return {
    totalCourses: courses.length,
    totalStudents: students.length,
    scheduledStudents: scheduledStudents.size,
    unscheduledStudents: students.length - scheduledStudents.size,
    successRate: (scheduledStudents.size / students.length * 100).toFixed(1),
    
    totalTeachers: teachers.length,
    activeTeachers: activeTeachers.size,
    teacherUtilization: (activeTeachers.size / teachers.length * 100).toFixed(1),
    
    totalClassrooms: classrooms.length,
    usedClassrooms: usedClassrooms.size,
    classroomUtilization: classrooms.length > 0 
      ? (usedClassrooms.size / classrooms.length * 100).toFixed(1)
      : '0.0'
  };
}

/**
 * Validate course data integrity
 * 验证课程数据完整性
 */
export function validateCourseData(course) {
  const errors = [];
  
  if (!course.id) errors.push('缺少课程ID');
  if (!course.student) errors.push('缺少学生信息');
  if (!course.teacher) errors.push('缺少教师信息');
  if (!course.timeSlot) errors.push('缺少时间槽信息');
  
  if (course.timeSlot) {
    if (course.timeSlot.day === undefined) errors.push('缺少星期信息');
    if (course.timeSlot.startSlot === undefined) errors.push('缺少开始时间槽');
    if (course.timeSlot.endSlot === undefined) errors.push('缺少结束时间槽');
    if (course.timeSlot.startSlot >= course.timeSlot.endSlot) errors.push('时间槽范围无效');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}
