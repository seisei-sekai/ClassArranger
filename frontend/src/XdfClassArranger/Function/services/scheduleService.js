/**
 * Schedule Service
 * 
 * Core business logic for scheduling operations.
 * Separates scheduling logic from React components.
 */

import {
  createEmptyScheduleResult,
  createScheduledCourse,
  createTimeSlot,
  addCourseToResult,
  addSchedulingError,
  isValidScheduledCourse
} from '../models/scheduleTypes';

/**
 * Schedule Configuration
 */
const SLOTS_PER_HOUR = 12;
const SCHEDULE_DELAY_MS = 50; // Small delay between students for UI updates

/**
 * Calculate hours consumed based on slot duration
 * @param {number} durationInSlots
 * @returns {number} Hours consumed
 */
export function calculateHoursConsumed(durationInSlots) {
  return durationInSlots / SLOTS_PER_HOUR;
}

/**
 * Mark time slots as occupied
 * @param {Object} occupiedSlots - Occupied slots tracking object
 * @param {ScheduledCourse} course - Scheduled course
 */
export function markSlotsOccupied(occupiedSlots, course) {
  const { day, startSlot, duration } = course.timeSlot;
  const { id: teacherId } = course.teacher;
  const { id: roomId } = course.room;

  if (!occupiedSlots[day]) {
    occupiedSlots[day] = {};
  }

  for (let slot = startSlot; slot < startSlot + duration; slot++) {
    if (!occupiedSlots[day][slot]) {
      occupiedSlots[day][slot] = { teachers: new Set(), rooms: new Set() };
    }
    occupiedSlots[day][slot].teachers.add(teacherId);
    occupiedSlots[day][slot].rooms.add(roomId);
  }
}

/**
 * Check if a time slot is available
 * @param {Object} occupiedSlots - Occupied slots tracking object
 * @param {string} day - Day of week
 * @param {number} startSlot - Start slot index
 * @param {number} duration - Duration in slots
 * @param {string} teacherId - Teacher ID to check
 * @param {string} roomId - Room ID to check
 * @returns {boolean} True if available
 */
export function isSlotAvailable(occupiedSlots, day, startSlot, duration, teacherId, roomId) {
  if (!occupiedSlots[day]) {
    return true;
  }

  for (let slot = startSlot; slot < startSlot + duration; slot++) {
    const slotData = occupiedSlots[day][slot];
    if (!slotData) continue;

    if (slotData.teachers.has(teacherId) || slotData.rooms.has(roomId)) {
      return false;
    }
  }

  return true;
}

/**
 * Create a scheduled course from match result
 * @param {Object} params
 * @param {Object} params.match - Match result from matching engine
 * @param {Object} params.student - Student data
 * @param {number} params.courseDuration - Course duration in slots
 * @param {Function} params.slotToTime - Function to convert slot to time
 * @returns {ScheduledCourse}
 */
export function createCourseFromMatch({ match, student, courseDuration, slotToTime }) {
  const timeSlot = createTimeSlot({
    day: match.day,
    startSlot: match.startSlot,
    duration: courseDuration,
    slotToTime
  });

  return createScheduledCourse({
    student: {
      id: student.id,
      name: student.name,
      color: student.color
    },
    teacher: {
      id: match.teacher.id,
      name: match.teacher.name
    },
    room: {
      id: match.classroom.id,
      name: match.classroom.name,
      campus: match.classroom.campus
    },
    timeSlot,
    subject: match.subject,
    score: match.score
  });
}

/**
 * Process scheduling for a single student
 * @param {Object} params
 * @param {Object} params.student - Student to schedule
 * @param {Array} params.teachers - Available teachers
 * @param {Array} params.classrooms - Available classrooms
 * @param {Object} params.occupiedSlots - Current occupied slots
 * @param {Object} params.matchingEngine - Matching engine instance
 * @param {Object} params.constraintEngine - Constraint engine instance
 * @param {Function} params.slotToTime - Slot to time converter
 * @param {Object} params.hoursManager - Hours management context
 * @returns {Promise<{courses: ScheduledCourse[], errors: string[]}>}
 */
export async function scheduleStudent({
  student,
  teachers,
  classrooms,
  occupiedSlots,
  matchingEngine,
  constraintEngine,
  slotToTime,
  hoursManager
}) {
  const scheduledCourses = [];
  const errors = [];

  try {
    const parsedData = student.parsedData;
    const totalCourses = parsedData.frequency?.times || 1;
    const courseDuration = Math.round((parsedData.duration?.minutes || 60) / 5); // Convert to slots

    console.log(`[ScheduleService] Processing ${student.name}: ${totalCourses} courses`);

    for (let courseNum = 0; courseNum < totalCourses; courseNum++) {
      const match = matchingEngine.findBestMatch(
        student,
        teachers,
        classrooms,
        occupiedSlots,
        courseDuration,
        constraintEngine
      );

      if (!match) {
        errors.push(`Course ${courseNum + 1}: No suitable time slot found`);
        continue;
      }

      const scheduledCourse = createCourseFromMatch({
        match,
        student,
        courseDuration,
        slotToTime
      });

      if (!isValidScheduledCourse(scheduledCourse)) {
        errors.push(`Course ${courseNum + 1}: Invalid course data`);
        continue;
      }

      // Mark slots as occupied
      markSlotsOccupied(occupiedSlots, scheduledCourse);

      // Track the course
      scheduledCourses.push(scheduledCourse);

      // Consume hours
      const hoursConsumed = calculateHoursConsumed(courseDuration);
      if (hoursManager) {
        hoursManager.consumeHours(
          student.id,
          hoursConsumed,
          scheduledCourse.id,
          {
            teacher: match.teacher.name,
            day: match.day,
            time: scheduledCourse.timeSlot.start
          }
        );
      }
    }

    return { courses: scheduledCourses, errors };
  } catch (error) {
    console.error(`[ScheduleService] Error scheduling ${student.name}:`, error);
    return { courses: scheduledCourses, errors: [error.message] };
  }
}

/**
 * Batch schedule multiple students
 * @param {Object} params
 * @param {Array} params.students - Students to schedule
 * @param {Array} params.teachers - Available teachers
 * @param {Array} params.classrooms - Available classrooms
 * @param {Object} params.matchingEngine - Matching engine instance
 * @param {Object} params.constraintEngine - Constraint engine instance
 * @param {Function} params.slotToTime - Slot to time converter
 * @param {Object} params.hoursManager - Hours management context
 * @param {Function} params.onProgress - Progress callback
 * @returns {Promise<ScheduleResult>}
 */
export async function batchScheduleStudents({
  students,
  teachers,
  classrooms,
  matchingEngine,
  constraintEngine,
  slotToTime,
  hoursManager,
  onProgress
}) {
  const result = createEmptyScheduleResult();
  const occupiedSlots = {};

  for (let i = 0; i < students.length; i++) {
    const student = students[i];
    const progress = Math.round(((i + 1) / students.length) * 100);

    if (onProgress) {
      onProgress(progress, student.name);
    }

    const { courses, errors } = await scheduleStudent({
      student,
      teachers,
      classrooms,
      occupiedSlots,
      matchingEngine,
      constraintEngine,
      slotToTime,
      hoursManager
    });

    if (courses.length > 0) {
      result.successCount++;
      courses.forEach(course => {
        const hoursConsumed = calculateHoursConsumed(course.timeSlot.duration);
        addCourseToResult(result, course, hoursConsumed);
      });
    } else {
      addSchedulingError(result, student.name, '无法找到合适的时间和资源');
    }

    if (errors.length > 0) {
      errors.forEach(error => {
        result.errors.push(`${student.name}: ${error}`);
      });
    }

    // Small delay for UI update
    await new Promise(resolve => setTimeout(resolve, SCHEDULE_DELAY_MS));
  }

  return result;
}

export default {
  calculateHoursConsumed,
  markSlotsOccupied,
  isSlotAvailable,
  createCourseFromMatch,
  scheduleStudent,
  batchScheduleStudents
};
