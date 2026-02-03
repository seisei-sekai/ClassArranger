/**
 * Schedule Data Type Definitions
 * 
 * This file contains all type definitions for the scheduling system.
 * Provides clear structure and documentation for schedule-related data.
 */

/**
 * @typedef {Object} StudentInfo
 * @property {string} id - Unique student identifier
 * @property {string} name - Student name
 * @property {string} color - Student's assigned color for UI
 */

/**
 * @typedef {Object} TeacherInfo
 * @property {string} id - Unique teacher identifier
 * @property {string} name - Teacher name
 */

/**
 * @typedef {Object} RoomInfo
 * @property {string} id - Unique classroom identifier
 * @property {string} name - Classroom name
 * @property {string} campus - Campus location
 */

/**
 * @typedef {Object} TimeSlot
 * @property {string} day - Day of week (e.g., '周一', '周二')
 * @property {number} startSlot - Start slot index (0-based)
 * @property {number} duration - Duration in slots (12 slots = 1 hour)
 * @property {string} start - Start time string (e.g., '09:00')
 * @property {string} end - End time string (e.g., '10:00')
 */

/**
 * @typedef {Object} ScheduledCourse
 * @property {string} id - Unique course identifier
 * @property {StudentInfo} student - Student information
 * @property {TeacherInfo} teacher - Teacher information
 * @property {RoomInfo} room - Classroom information
 * @property {TimeSlot} timeSlot - Time slot information
 * @property {string} subject - Course subject
 * @property {number} score - Match score from algorithm
 */

/**
 * @typedef {Object} ScheduleResult
 * @property {number} successCount - Number of successfully scheduled students
 * @property {number} failedCount - Number of students that couldn't be scheduled
 * @property {number} totalHoursScheduled - Total course hours scheduled
 * @property {number} conflictsDetected - Number of conflicts detected
 * @property {ScheduledCourse[]} scheduledCourses - Array of scheduled courses
 * @property {string[]} errors - Array of error messages
 */

/**
 * @typedef {Object} ScheduleProgress
 * @property {boolean} isScheduling - Whether scheduling is in progress
 * @property {number} progress - Progress percentage (0-100)
 * @property {string} currentStudent - Name of student currently being scheduled
 */

/**
 * Create an empty ScheduleResult object
 * @returns {ScheduleResult}
 */
export function createEmptyScheduleResult() {
  return {
    successCount: 0,
    failedCount: 0,
    totalHoursScheduled: 0,
    conflictsDetected: 0,
    scheduledCourses: [],
    errors: []
  };
}

/**
 * Create a ScheduledCourse object
 * @param {Object} params
 * @param {StudentInfo} params.student
 * @param {TeacherInfo} params.teacher
 * @param {RoomInfo} params.room
 * @param {TimeSlot} params.timeSlot
 * @param {string} params.subject
 * @param {number} params.score
 * @returns {ScheduledCourse}
 */
export function createScheduledCourse({ student, teacher, room, timeSlot, subject, score }) {
  return {
    id: `course-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    student,
    teacher,
    room,
    timeSlot,
    subject: subject || '一般课程',
    score: score || 0
  };
}

/**
 * Create a TimeSlot object
 * @param {Object} params
 * @param {string} params.day
 * @param {number} params.startSlot
 * @param {number} params.duration
 * @param {Function} params.slotToTime - Function to convert slot index to time string
 * @returns {TimeSlot}
 */
export function createTimeSlot({ day, startSlot, duration, slotToTime }) {
  return {
    day,
    startSlot,
    duration,
    start: slotToTime(startSlot),
    end: slotToTime(startSlot + duration)
  };
}

/**
 * Add a scheduled course to result
 * @param {ScheduleResult} result
 * @param {ScheduledCourse} course
 * @param {number} hoursConsumed
 */
export function addCourseToResult(result, course, hoursConsumed) {
  result.scheduledCourses.push(course);
  result.totalHoursScheduled += hoursConsumed;
}

/**
 * Record a scheduling error
 * @param {ScheduleResult} result
 * @param {string} studentName
 * @param {string} errorMessage
 */
export function addSchedulingError(result, studentName, errorMessage) {
  result.failedCount++;
  result.errors.push(`${studentName}: ${errorMessage}`);
}

/**
 * Validate ScheduledCourse object
 * @param {ScheduledCourse} course
 * @returns {boolean}
 */
export function isValidScheduledCourse(course) {
  return !!(
    course &&
    course.id &&
    course.student?.id &&
    course.teacher?.id &&
    course.room?.id &&
    course.timeSlot?.day &&
    typeof course.timeSlot?.startSlot === 'number'
  );
}
