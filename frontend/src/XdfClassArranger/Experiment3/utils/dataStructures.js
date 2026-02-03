/**
 * Data Structures and Utility Functions
 * 数据结构和工具函数
 */

import { SLOTS_PER_DAY, STANDARD_START } from './constants';

/**
 * Deep clone an object
 * 深度克隆对象
 */
export function deepClone(obj) {
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return new Date(obj.getTime());
  if (obj instanceof Array) return obj.map(item => deepClone(item));
  
  const clonedObj = {};
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      clonedObj[key] = deepClone(obj[key]);
    }
  }
  return clonedObj;
}

/**
 * Create a course object
 * 创建课程对象
 * Supports two calling patterns:
 * 1. Legacy: {id, studentId, teacherId, day, startTime, endTime, ...}
 * 2. New: {student, teacher, classroom, timeSlot, subject, ...}
 */
export function createCourse(params) {
  // Check if using new pattern (with student/teacher/timeSlot objects)
  if (params.student && params.teacher && params.timeSlot) {
    const { student, teacher, classroom, timeSlot, subject, isRecurring, recurrencePattern, color } = params;
    
    return {
      id: params.id || `course-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      studentId: student.id,
      teacherId: teacher.id,
      classroomId: classroom?.id || null,
      day: timeSlot.day,
      startTime: timeSlot.start || timeSlot.startTime,
      endTime: timeSlot.end || timeSlot.endTime,
      startSlot: timeSlot.startSlot,
      endSlot: timeSlot.endSlot,
      duration: timeSlot.duration,
      studentName: student.name,
      teacherName: teacher.name,
      classroomName: classroom?.name || '',
      subject: subject || student.subject || '',
      color: color || student.color || '#4A90E2',
      isRecurring: isRecurring || false,
      recurrencePattern: recurrencePattern || null,
      timeSlot: timeSlot, // Keep original timeSlot for updateAvailability
      student: student,
      teacher: teacher,
      classroom: classroom,
      createdAt: new Date().toISOString()
    };
  }
  
  // Legacy pattern
  const { 
    id, 
    studentId, 
    teacherId, 
    classroomId = null,
    day, 
    startTime, 
    endTime,
    studentName,
    teacherName,
    classroomName = '',
    subject = '',
    color = '#4A90E2'
  } = params;
  
  return {
    id: id || `course-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    studentId,
    teacherId,
    classroomId,
    day,
    startTime,
    endTime,
    studentName,
    teacherName,
    classroomName,
    subject,
    color,
    createdAt: new Date().toISOString()
  };
}

/**
 * Check if two time slots overlap
 * 检查两个时间段是否重叠
 * Supports both slot-based (startSlot/endSlot) and time-based (startTime/endTime) formats
 */
export function timeSlotsOverlap(slot1, slot2) {
  if (!slot1 || !slot2) return false;
  if (slot1.day !== slot2.day) return false;
  
  // Determine if using slot-based or time-based format
  const useSlots = (slot1.startSlot !== undefined && slot2.startSlot !== undefined);
  
  let start1, end1, start2, end2;
  
  if (useSlots) {
    // Slot-based format (already in slot units)
    start1 = slot1.startSlot;
    end1 = slot1.endSlot;
    start2 = slot2.startSlot;
    end2 = slot2.endSlot;
  } else {
    // Time-based format (convert to minutes)
    start1 = timeToMinutes(slot1.startTime);
    end1 = timeToMinutes(slot1.endTime);
    start2 = timeToMinutes(slot2.startTime);
    end2 = timeToMinutes(slot2.endTime);
  }
  
  return !(end1 <= start2 || end2 <= start1);
}

/**
 * Find overlap between two time ranges
 * 查找两个时间范围的重叠部分
 * Supports both slot-based (startSlot/endSlot) and time-based (startTime/endTime) formats
 */
export function findOverlap(range1, range2) {
  if (!range1 || !range2) return null;
  if (range1.day !== range2.day) return null;
  
  // Determine if using slot-based or time-based format
  const useSlots = (range1.startSlot !== undefined && range2.startSlot !== undefined);
  
  let start1, end1, start2, end2;
  
  if (useSlots) {
    // Slot-based format (already in slot units)
    start1 = range1.startSlot;
    end1 = range1.endSlot;
    start2 = range2.startSlot;
    end2 = range2.endSlot;
  } else {
    // Time-based format (convert to minutes)
    start1 = timeToMinutes(range1.startTime);
    end1 = timeToMinutes(range1.endTime);
    start2 = timeToMinutes(range2.startTime);
    end2 = timeToMinutes(range2.endTime);
  }
  
  const overlapStart = Math.max(start1, start2);
  const overlapEnd = Math.min(end1, end2);
  
  if (overlapStart >= overlapEnd) return null;
  
  if (useSlots) {
    // Return in slot format
    return {
      day: range1.day,
      startSlot: overlapStart,
      endSlot: overlapEnd
    };
  } else {
    // Return in time format
    return {
      day: range1.day,
      startTime: minutesToTime(overlapStart),
      endTime: minutesToTime(overlapEnd)
    };
  }
}

/**
 * Convert time string to minutes since midnight
 * 将时间字符串转换为从午夜开始的分钟数
 */
export function timeToMinutes(timeStr) {
  if (!timeStr) return 0;
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
}

/**
 * Convert minutes since midnight to time string
 * 将从午夜开始的分钟数转换为时间字符串
 */
export function minutesToTime(minutes) {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
}

/**
 * Convert slot index to time string
 * 将时间槽索引转换为时间字符串
 */
export function slotToTime(slotIndex, granularity = 5) {
  const totalMinutes = (STANDARD_START * 60) + (slotIndex * granularity);
  return minutesToTime(totalMinutes);
}

/**
 * Format time string (ensure HH:MM format)
 * 格式化时间字符串
 * Supports two calling patterns:
 * - formatTime(timeStr) - single string argument
 * - formatTime(hours, minutes) - two number arguments
 */
export function formatTime(hoursOrTimeStr, minutes) {
  // Two-argument form: formatTime(hours, minutes)
  if (minutes !== undefined) {
    const hours = hoursOrTimeStr;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
  }
  
  // Single-argument form: formatTime(timeStr)
  const timeStr = hoursOrTimeStr;
  if (!timeStr) return '00:00';
  if (typeof timeStr === 'string' && timeStr.includes(':')) {
    const [hours, mins] = timeStr.split(':');
    return `${String(hours).padStart(2, '0')}:${String(mins || '00').padStart(2, '0')}`;
  }
  return String(timeStr);
}

/**
 * Parse time string to slot index
 * 将时间字符串解析为时间槽索引
 */
export function timeToSlotIndex(timeStr, granularity = 5) {
  const minutes = timeToMinutes(timeStr);
  return Math.floor((minutes - (STANDARD_START * 60)) / granularity);
}

/**
 * Get day name in Chinese
 * 获取中文星期名称
 */
export function getDayName(dayIndex) {
  const days = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  return days[dayIndex] || '';
}

/**
 * Validate course data
 * 验证课程数据
 */
export function validateCourse(course) {
  if (!course) return false;
  if (!course.studentId || !course.teacherId) return false;
  if (course.day < 0 || course.day > 6) return false;
  if (!course.startTime || !course.endTime) return false;
  
  const start = timeToMinutes(course.startTime);
  const end = timeToMinutes(course.endTime);
  if (start >= end) return false;
  
  return true;
}
