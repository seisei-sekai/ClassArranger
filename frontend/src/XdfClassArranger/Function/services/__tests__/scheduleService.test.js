/**
 * Unit Tests for Schedule Service
 */

import {
  calculateHoursConsumed,
  markSlotsOccupied,
  isSlotAvailable,
  createCourseFromMatch
} from '../scheduleService';

describe('scheduleService', () => {
  describe('calculateHoursConsumed', () => {
    it('should convert 12 slots to 1 hour', () => {
      expect(calculateHoursConsumed(12)).toBe(1);
    });

    it('should convert 24 slots to 2 hours', () => {
      expect(calculateHoursConsumed(24)).toBe(2);
    });

    it('should handle fractional hours', () => {
      expect(calculateHoursConsumed(18)).toBe(1.5);
    });

    it('should handle zero slots', () => {
      expect(calculateHoursConsumed(0)).toBe(0);
    });
  });

  describe('markSlotsOccupied', () => {
    it('should mark slots as occupied for teacher and room', () => {
      const occupiedSlots = {};
      const course = {
        timeSlot: { day: '周一', startSlot: 0, duration: 12 },
        teacher: { id: 't1' },
        room: { id: 'r1' }
      };

      markSlotsOccupied(occupiedSlots, course);

      expect(occupiedSlots['周一']).toBeDefined();
      expect(occupiedSlots['周一'][0].teachers.has('t1')).toBe(true);
      expect(occupiedSlots['周一'][0].rooms.has('r1')).toBe(true);
    });

    it('should mark all slots in duration', () => {
      const occupiedSlots = {};
      const course = {
        timeSlot: { day: '周一', startSlot: 0, duration: 3 },
        teacher: { id: 't1' },
        room: { id: 'r1' }
      };

      markSlotsOccupied(occupiedSlots, course);

      expect(occupiedSlots['周一'][0].teachers.has('t1')).toBe(true);
      expect(occupiedSlots['周一'][1].teachers.has('t1')).toBe(true);
      expect(occupiedSlots['周一'][2].teachers.has('t1')).toBe(true);
      expect(occupiedSlots['周一'][3]).toBeUndefined();
    });

    it('should handle multiple courses in same day', () => {
      const occupiedSlots = {};
      const course1 = {
        timeSlot: { day: '周一', startSlot: 0, duration: 12 },
        teacher: { id: 't1' },
        room: { id: 'r1' }
      };
      const course2 = {
        timeSlot: { day: '周一', startSlot: 12, duration: 12 },
        teacher: { id: 't2' },
        room: { id: 'r2' }
      };

      markSlotsOccupied(occupiedSlots, course1);
      markSlotsOccupied(occupiedSlots, course2);

      expect(occupiedSlots['周一'][0].teachers.has('t1')).toBe(true);
      expect(occupiedSlots['周一'][0].teachers.has('t2')).toBe(false);
      expect(occupiedSlots['周一'][12].teachers.has('t2')).toBe(true);
      expect(occupiedSlots['周一'][12].teachers.has('t1')).toBe(false);
    });
  });

  describe('isSlotAvailable', () => {
    it('should return true for empty day', () => {
      const occupiedSlots = {};
      const result = isSlotAvailable(occupiedSlots, '周一', 0, 12, 't1', 'r1');
      expect(result).toBe(true);
    });

    it('should return false if teacher is occupied', () => {
      const occupiedSlots = {
        '周一': {
          0: { teachers: new Set(['t1']), rooms: new Set(['r2']) }
        }
      };
      const result = isSlotAvailable(occupiedSlots, '周一', 0, 12, 't1', 'r1');
      expect(result).toBe(false);
    });

    it('should return false if room is occupied', () => {
      const occupiedSlots = {
        '周一': {
          0: { teachers: new Set(['t2']), rooms: new Set(['r1']) }
        }
      };
      const result = isSlotAvailable(occupiedSlots, '周一', 0, 12, 't1', 'r1');
      expect(result).toBe(false);
    });

    it('should return true if teacher and room are different', () => {
      const occupiedSlots = {
        '周一': {
          0: { teachers: new Set(['t2']), rooms: new Set(['r2']) }
        }
      };
      const result = isSlotAvailable(occupiedSlots, '周一', 0, 12, 't1', 'r1');
      expect(result).toBe(true);
    });

    it('should check all slots in duration', () => {
      const occupiedSlots = {
        '周一': {
          5: { teachers: new Set(['t1']), rooms: new Set(['r2']) }
        }
      };
      // Slot 5 is occupied, checking slots 0-11
      const result = isSlotAvailable(occupiedSlots, '周一', 0, 12, 't1', 'r1');
      expect(result).toBe(false);
    });

    it('should return true if occupied slot is outside range', () => {
      const occupiedSlots = {
        '周一': {
          20: { teachers: new Set(['t1']), rooms: new Set(['r2']) }
        }
      };
      // Slot 20 is occupied, checking slots 0-11
      const result = isSlotAvailable(occupiedSlots, '周一', 0, 12, 't1', 'r1');
      expect(result).toBe(true);
    });
  });

  describe('createCourseFromMatch', () => {
    const mockSlotToTime = (slot) => {
      const hours = Math.floor(slot / 12) + 9;
      const minutes = (slot % 12) * 5;
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    };

    it('should create a course from match result', () => {
      const match = {
        teacher: { id: 't1', name: 'Teacher A' },
        classroom: { id: 'r1', name: 'Room 101', campus: 'Main' },
        day: '周一',
        startSlot: 0,
        subject: 'Math',
        score: 95
      };

      const student = {
        id: 's1',
        name: 'Student A',
        color: '#ff0000'
      };

      const course = createCourseFromMatch({
        match,
        student,
        courseDuration: 12,
        slotToTime: mockSlotToTime
      });

      expect(course.student.name).toBe('Student A');
      expect(course.teacher.name).toBe('Teacher A');
      expect(course.room.name).toBe('Room 101');
      expect(course.timeSlot.day).toBe('周一');
      expect(course.timeSlot.start).toBe('09:00');
      expect(course.timeSlot.end).toBe('10:00');
      expect(course.subject).toBe('Math');
      expect(course.score).toBe(95);
    });

    it('should correctly calculate time slots', () => {
      const match = {
        teacher: { id: 't1', name: 'Teacher A' },
        classroom: { id: 'r1', name: 'Room 101', campus: 'Main' },
        day: '周二',
        startSlot: 24, // 11:00
        subject: 'English'
      };

      const student = {
        id: 's1',
        name: 'Student B',
        color: '#00ff00'
      };

      const course = createCourseFromMatch({
        match,
        student,
        courseDuration: 24, // 2 hours
        slotToTime: mockSlotToTime
      });

      expect(course.timeSlot.start).toBe('11:00');
      expect(course.timeSlot.end).toBe('13:00');
      expect(course.timeSlot.duration).toBe(24);
    });
  });
});
