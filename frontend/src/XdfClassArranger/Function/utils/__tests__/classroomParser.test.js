import { describe, it, expect } from 'vitest';
import { parseClassroomRows, parseClassroomRow } from '../classroomParser';

describe('classroomParser.js', () => {
  describe('parseClassroomRow', () => {
    it('should parse single classroom row with all fields', () => {
      const input = '旗舰校\t个别指导室\t个别指导室1\t个别指导室1\t个别指导室\t5\t9:00\t21:30\t2\t空闲时优先排 1,3,5，防止旁边教室吵';
      const result = parseClassroomRow(input, 0);
      
      expect(result).not.toBeNull();
      expect(result.campus).toBe('旗舰校');
      expect(result.area).toBe('个别指导室');
      expect(result.roomName).toBe('个别指导室1');
      expect(result.entryName).toBe('个别指导室1');
      expect(result.name).toBe('个别指导室1');
      expect(result.type).toBe('个别指导室');
      expect(result.priority).toBe(5);
      expect(result.capacity).toBe(2);
      expect(result.notes).toBe('空闲时优先排 1,3,5，防止旁边教室吵');
      expect(result.availableTimeRanges).toHaveLength(7); // All 7 days
      expect(result.availableTimeRanges[0].startSlot).toBe(0); // 9:00
      expect(result.availableTimeRanges[0].endSlot).toBe(150); // 21:30
    });

    it('should parse classroom with different time range', () => {
      const input = '东京本校（板桥第二校舍）\t教室\t101\t板二101\t教室\t5\t9:30\t21:00\t30\t(只有板桥学生校区去东京本校）';
      const result = parseClassroomRow(input, 1);
      
      expect(result).not.toBeNull();
      expect(result.campus).toBe('东京本校（板桥第二校舍）');
      expect(result.name).toBe('板二101');
      expect(result.capacity).toBe(30);
      expect(result.availableTimeRanges[0].startSlot).toBe(6); // 9:30 = 6 slots from 9:00
      expect(result.availableTimeRanges[0].endSlot).toBe(144); // 21:00 = 144 slots from 9:00
    });

    it('should parse classroom without notes', () => {
      const input = '旗舰校\t班课教室\t开成\t开成\t班课教室\t5\t9:00\t21:30\t50';
      const result = parseClassroomRow(input, 2);
      
      expect(result).not.toBeNull();
      expect(result.campus).toBe('旗舰校');
      expect(result.name).toBe('开成');
      expect(result.type).toBe('班课教室');
      expect(result.capacity).toBe(50);
      expect(result.notes).toBe('');
    });

    it('should parse VIP classroom', () => {
      const input = 'VIP中心\t教室\t403\t403\tVIP教室\t5\t9:00\t21:30\t2\t靠窗';
      const result = parseClassroomRow(input, 3);
      
      expect(result).not.toBeNull();
      expect(result.campus).toBe('VIP中心');
      expect(result.name).toBe('403');
      expect(result.type).toBe('VIP教室');
      expect(result.capacity).toBe(2);
      expect(result.notes).toBe('靠窗');
    });

    it('should handle empty type field', () => {
      const input = '旗舰校\t班课教室\t会议室\t会议室\t\t3\t9:00\t21:30\t2';
      const result = parseClassroomRow(input, 4);
      
      expect(result).not.toBeNull();
      expect(result.name).toBe('会议室');
      expect(result.type).toBe('会议室'); // Should determine type from name
      expect(result.priority).toBe(3);
    });

    it('should return null for empty input', () => {
      expect(parseClassroomRow('', 0)).toBeNull();
      expect(parseClassroomRow('   ', 0)).toBeNull();
    });

    it('should return null for missing required fields', () => {
      const input = '\t\t\t\t\t5\t9:00\t21:30\t2'; // Missing campus and name
      const result = parseClassroomRow(input, 0);
      expect(result).toBeNull();
    });
  });

  describe('parseClassroomRows', () => {
    it('should parse multiple classroom rows', () => {
      const input = `旗舰校\t班课教室\t开成\t开成\t班课教室\t5\t9:00\t21:30\t50
旗舰校\t个别指导室\t个别指导室1\t个别指导室1\t个别指导室\t5\t9:00\t21:30\t2\t空闲时优先排
东京本校（板桥第二校舍）\t教室\t101\t板二101\t教室\t5\t9:30\t21:00\t30`;
      
      const result = parseClassroomRows(input);
      
      expect(result).toHaveLength(3);
      expect(result[0].name).toBe('开成');
      expect(result[1].name).toBe('个别指导室1');
      expect(result[2].name).toBe('板二101');
    });

    it('should skip header row if present', () => {
      const input = `校区\t区域/类别\t教室名\t录入名称\t类型\t优先级\t时间段开始\t时间段结束\t班容\t备注
旗舰校\t班课教室\t开成\t开成\t班课教室\t5\t9:00\t21:30\t50`;
      
      const result = parseClassroomRows(input);
      
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('开成');
    });

    it('should handle empty input', () => {
      expect(parseClassroomRows('')).toEqual([]);
      expect(parseClassroomRows(null)).toEqual([]);
      expect(parseClassroomRows(undefined)).toEqual([]);
    });

    it('should filter out invalid rows', () => {
      const input = `旗舰校\t班课教室\t开成\t开成\t班课教室\t5\t9:00\t21:30\t50
\t\t\t\t\t\t\t\t\t
东京本校（板桥第二校舍）\t教室\t101\t板二101\t教室\t5\t9:30\t21:00\t30`;
      
      const result = parseClassroomRows(input);
      
      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('开成');
      expect(result[1].name).toBe('板二101');
    });
  });

  describe('time slot calculation', () => {
    it('should correctly calculate time slots for 9:00-21:30', () => {
      const input = '旗舰校\t教室\t测试\t测试\t教室\t5\t9:00\t21:30\t10';
      const result = parseClassroomRow(input, 0);
      
      expect(result.availableTimeRanges[0].startSlot).toBe(0); // 9:00 = slot 0
      expect(result.availableTimeRanges[0].endSlot).toBe(150); // 21:30 = slot 150
    });

    it('should correctly calculate time slots for 9:30-21:00', () => {
      const input = '校区\t教室\t测试\t测试\t教室\t5\t9:30\t21:00\t10';
      const result = parseClassroomRow(input, 0);
      
      // 9:30 = 30 minutes from 9:00 = 30/5 = 6 slots
      expect(result.availableTimeRanges[0].startSlot).toBe(6);
      // 21:00 = 12 hours from 9:00 = 12*60/5 = 144 slots
      expect(result.availableTimeRanges[0].endSlot).toBe(144);
    });
  });

  describe('classroom type determination', () => {
    it('should identify 1v1 classrooms', () => {
      const input = '旗舰校\t个别指导室\t个别指导室1\t个别指导室1\t个别指导室\t5\t9:00\t21:30\t2';
      const result = parseClassroomRow(input, 0);
      expect(result.type).toBe('个别指导室');
    });

    it('should identify regular classrooms', () => {
      const input = '旗舰校\t班课教室\t开成\t开成\t班课教室\t5\t9:00\t21:30\t50';
      const result = parseClassroomRow(input, 0);
      expect(result.type).toBe('班课教室');
    });

    it('should identify self-study rooms', () => {
      const input = '旗舰校\t班课教室\t大隈\t大隈\t自习室\t5\t9:00\t21:30\t50\t自习室';
      const result = parseClassroomRow(input, 0);
      expect(result.type).toBe('自习室');
    });

    it('should identify office', () => {
      const input = '东京本校（板桥第二校舍）\t事务所\t201\t板二201\t事务所\t3\t9:30\t21:00\t2';
      const result = parseClassroomRow(input, 0);
      expect(result.type).toBe('事务所');
    });
  });
});

