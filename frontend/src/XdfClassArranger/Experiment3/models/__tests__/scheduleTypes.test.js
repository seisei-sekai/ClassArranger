/**
 * Unit Tests for Schedule Types
 */

import {
  createEmptyScheduleResult,
  createScheduledCourse,
  createTimeSlot,
  addCourseToResult,
  addSchedulingError,
  isValidScheduledCourse
} from '../scheduleTypes';

describe('scheduleTypes', () => {
  describe('createEmptyScheduleResult', () => {
    it('should create an empty result with all fields initialized', () => {
      const result = createEmptyScheduleResult();

      expect(result.successCount).toBe(0);
      expect(result.failedCount).toBe(0);
      expect(result.totalHoursScheduled).toBe(0);
      expect(result.conflictsDetected).toBe(0);
      expect(result.scheduledCourses).toEqual([]);
      expect(result.errors).toEqual([]);
    });
  });

  describe('createScheduledCourse', () => {
    it('should create a valid scheduled course', () => {
      const course = createScheduledCourse({
        student: { id: 's1', name: 'Student A', color: '#ff0000' },
        teacher: { id: 't1', name: 'Teacher A' },
        room: { id: 'r1', name: 'Room 101', campus: 'Main' },
        timeSlot: {
          day: '周一',
          startSlot: 0,
          duration: 12,
          start: '09:00',
          end: '10:00'
        },
        subject: 'Math',
        score: 95
      });

      expect(course.id).toBeDefined();
      expect(course.student.name).toBe('Student A');
      expect(course.teacher.name).toBe('Teacher A');
      expect(course.room.name).toBe('Room 101');
      expect(course.subject).toBe('Math');
      expect(course.score).toBe(95);
    });

    it('should use default values when subject or score not provided', () => {
      const course = createScheduledCourse({
        student: { id: 's1', name: 'Student A', color: '#ff0000' },
        teacher: { id: 't1', name: 'Teacher A' },
        room: { id: 'r1', name: 'Room 101', campus: 'Main' },
        timeSlot: {
          day: '周一',
          startSlot: 0,
          duration: 12,
          start: '09:00',
          end: '10:00'
        }
      });

      expect(course.subject).toBe('一般课程');
      expect(course.score).toBe(0);
    });

    it('should generate unique IDs for different courses', () => {
      const course1 = createScheduledCourse({
        student: { id: 's1', name: 'Student A', color: '#ff0000' },
        teacher: { id: 't1', name: 'Teacher A' },
        room: { id: 'r1', name: 'Room 101', campus: 'Main' },
        timeSlot: {
          day: '周一',
          startSlot: 0,
          duration: 12,
          start: '09:00',
          end: '10:00'
        }
      });

      const course2 = createScheduledCourse({
        student: { id: 's1', name: 'Student A', color: '#ff0000' },
        teacher: { id: 't1', name: 'Teacher A' },
        room: { id: 'r1', name: 'Room 101', campus: 'Main' },
        timeSlot: {
          day: '周一',
          startSlot: 0,
          duration: 12,
          start: '09:00',
          end: '10:00'
        }
      });

      expect(course1.id).not.toBe(course2.id);
    });
  });

  describe('createTimeSlot', () => {
    const mockSlotToTime = (slot) => {
      const hours = Math.floor(slot / 12) + 9;
      const minutes = (slot % 12) * 5;
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    };

    it('should create a valid time slot', () => {
      const timeSlot = createTimeSlot({
        day: '周一',
        startSlot: 0,
        duration: 12,
        slotToTime: mockSlotToTime
      });

      expect(timeSlot.day).toBe('周一');
      expect(timeSlot.startSlot).toBe(0);
      expect(timeSlot.duration).toBe(12);
      expect(timeSlot.start).toBe('09:00');
      expect(timeSlot.end).toBe('10:00');
    });

    it('should correctly calculate start and end times', () => {
      const timeSlot = createTimeSlot({
        day: '周二',
        startSlot: 24, // 11:00
        duration: 24, // 2 hours
        slotToTime: mockSlotToTime
      });

      expect(timeSlot.start).toBe('11:00');
      expect(timeSlot.end).toBe('13:00');
    });
  });

  describe('addCourseToResult', () => {
    it('should add course to result and update hours', () => {
      const result = createEmptyScheduleResult();
      const course = createScheduledCourse({
        student: { id: 's1', name: 'Student A', color: '#ff0000' },
        teacher: { id: 't1', name: 'Teacher A' },
        room: { id: 'r1', name: 'Room 101', campus: 'Main' },
        timeSlot: {
          day: '周一',
          startSlot: 0,
          duration: 12,
          start: '09:00',
          end: '10:00'
        }
      });

      addCourseToResult(result, course, 1.5);

      expect(result.scheduledCourses).toHaveLength(1);
      expect(result.scheduledCourses[0]).toBe(course);
      expect(result.totalHoursScheduled).toBe(1.5);
    });

    it('should accumulate hours across multiple courses', () => {
      const result = createEmptyScheduleResult();
      const course1 = createScheduledCourse({
        student: { id: 's1', name: 'Student A', color: '#ff0000' },
        teacher: { id: 't1', name: 'Teacher A' },
        room: { id: 'r1', name: 'Room 101', campus: 'Main' },
        timeSlot: {
          day: '周一',
          startSlot: 0,
          duration: 12,
          start: '09:00',
          end: '10:00'
        }
      });
      const course2 = createScheduledCourse({
        student: { id: 's2', name: 'Student B', color: '#00ff00' },
        teacher: { id: 't2', name: 'Teacher B' },
        room: { id: 'r2', name: 'Room 102', campus: 'Main' },
        timeSlot: {
          day: '周二',
          startSlot: 0,
          duration: 12,
          start: '09:00',
          end: '10:00'
        }
      });

      addCourseToResult(result, course1, 1.0);
      addCourseToResult(result, course2, 2.0);

      expect(result.scheduledCourses).toHaveLength(2);
      expect(result.totalHoursScheduled).toBe(3.0);
    });
  });

  describe('addSchedulingError', () => {
    it('should add error and increment failed count', () => {
      const result = createEmptyScheduleResult();

      addSchedulingError(result, 'Student A', 'No available time slot');

      expect(result.failedCount).toBe(1);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toBe('Student A: No available time slot');
    });

    it('should accumulate multiple errors', () => {
      const result = createEmptyScheduleResult();

      addSchedulingError(result, 'Student A', 'Error 1');
      addSchedulingError(result, 'Student B', 'Error 2');

      expect(result.failedCount).toBe(2);
      expect(result.errors).toHaveLength(2);
    });
  });

  describe('isValidScheduledCourse', () => {
    it('should return true for valid course', () => {
      const course = createScheduledCourse({
        student: { id: 's1', name: 'Student A', color: '#ff0000' },
        teacher: { id: 't1', name: 'Teacher A' },
        room: { id: 'r1', name: 'Room 101', campus: 'Main' },
        timeSlot: {
          day: '周一',
          startSlot: 0,
          duration: 12,
          start: '09:00',
          end: '10:00'
        }
      });

      expect(isValidScheduledCourse(course)).toBe(true);
    });

    it('should return false for course with missing student ID', () => {
      const course = {
        id: 'c1',
        student: { name: 'Student A', color: '#ff0000' },
        teacher: { id: 't1', name: 'Teacher A' },
        room: { id: 'r1', name: 'Room 101', campus: 'Main' },
        timeSlot: {
          day: '周一',
          startSlot: 0,
          duration: 12,
          start: '09:00',
          end: '10:00'
        }
      };

      expect(isValidScheduledCourse(course)).toBe(false);
    });

    it('should return false for course with missing teacher ID', () => {
      const course = {
        id: 'c1',
        student: { id: 's1', name: 'Student A', color: '#ff0000' },
        teacher: { name: 'Teacher A' },
        room: { id: 'r1', name: 'Room 101', campus: 'Main' },
        timeSlot: {
          day: '周一',
          startSlot: 0,
          duration: 12,
          start: '09:00',
          end: '10:00'
        }
      };

      expect(isValidScheduledCourse(course)).toBe(false);
    });

    it('should return false for null or undefined', () => {
      expect(isValidScheduledCourse(null)).toBe(false);
      expect(isValidScheduledCourse(undefined)).toBe(false);
    });
  });
});
