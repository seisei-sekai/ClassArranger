/**
 * Unit tests for availabilityCalculator
 * 可用性计算器单元测试
 */

import { describe, it, expect } from 'vitest';
import {
  parseEntryDate,
  isDateAfterEntry,
  calculateOverlappingAvailability
} from '../availabilityCalculator';

describe('parseEntryDate', () => {
  it('should parse MM/DD/YY format (12/1/25)', () => {
    const rawData = 'test\ttest\ttest\ttest\t12/1/25\ttest';
    const date = parseEntryDate(rawData);
    
    expect(date).toBeInstanceOf(Date);
    expect(date.getFullYear()).toBe(2025);
    expect(date.getMonth()).toBe(11); // December (0-indexed)
    expect(date.getDate()).toBe(1);
  });

  it('should parse YYYY/MM/DD format (2025/12/1)', () => {
    const rawData = 'test\ttest\ttest\ttest\t2025/12/1\ttest';
    const date = parseEntryDate(rawData);
    
    expect(date).toBeInstanceOf(Date);
    expect(date.getFullYear()).toBe(2025);
    expect(date.getMonth()).toBe(11);
    expect(date.getDate()).toBe(1);
  });

  it('should parse YYYY-MM-DD format (2025-12-01)', () => {
    const rawData = 'test\ttest\ttest\ttest\t2025-12-01\ttest';
    const date = parseEntryDate(rawData);
    
    expect(date).toBeInstanceOf(Date);
    expect(date.getFullYear()).toBe(2025);
    expect(date.getMonth()).toBe(11);
    expect(date.getDate()).toBe(1);
  });

  it('should return null for empty entry date', () => {
    const rawData = 'test\ttest\ttest\ttest\t\ttest';
    const date = parseEntryDate(rawData);
    
    expect(date).toBeNull();
  });

  it('should return null for invalid date format', () => {
    const rawData = 'test\ttest\ttest\ttest\tinvalid\ttest';
    const date = parseEntryDate(rawData);
    
    expect(date).toBeNull();
  });

  it('should return null for null rawData', () => {
    const date = parseEntryDate(null);
    expect(date).toBeNull();
  });
});

describe('isDateAfterEntry', () => {
  it('should return true when target date equals entry date', () => {
    const entryDate = new Date(2025, 11, 1); // Dec 1, 2025
    const targetDate = new Date(2025, 11, 1);
    
    expect(isDateAfterEntry(targetDate, entryDate)).toBe(true);
  });

  it('should return true when target date is after entry date', () => {
    const entryDate = new Date(2025, 11, 1); // Dec 1, 2025
    const targetDate = new Date(2025, 11, 5); // Dec 5, 2025
    
    expect(isDateAfterEntry(targetDate, entryDate)).toBe(true);
  });

  it('should return false when target date is before entry date', () => {
    const entryDate = new Date(2025, 11, 1); // Dec 1, 2025
    const targetDate = new Date(2025, 10, 30); // Nov 30, 2025
    
    expect(isDateAfterEntry(targetDate, entryDate)).toBe(false);
  });

  it('should return true when entry date is null (no restriction)', () => {
    const targetDate = new Date(2025, 10, 30);
    
    expect(isDateAfterEntry(targetDate, null)).toBe(true);
  });

  it('should return false when target date is null', () => {
    const entryDate = new Date(2025, 11, 1);
    
    expect(isDateAfterEntry(null, entryDate)).toBe(false);
  });

  it('should ignore time components (only compare dates)', () => {
    const entryDate = new Date(2025, 11, 1, 15, 30, 0); // Dec 1, 2025 at 3:30pm
    const targetDate = new Date(2025, 11, 1, 9, 0, 0); // Dec 1, 2025 at 9:00am
    
    expect(isDateAfterEntry(targetDate, entryDate)).toBe(true);
  });
});

describe('calculateOverlappingAvailability - Entry Date Filtering', () => {
  it('should exclude student from dates before entry date', () => {
    // 臧泽衡: entry date 12/1/25
    const rawData = '本校\t胡润江\t臧泽衡\t2404\t12/1/25\t1次\t2小时/节\t线下\t1v1大学面试练习\t\t已有现地课时\t日本大学\t理工学部電気工学部\t12/4全天或12/5上午或晚上\t\t\t一次\t\t';
    
    const students = [{
      id: 'student-1',
      name: '臧泽衡',
      color: '#7A8C9E',
      rawData: rawData
    }];

    // Week of Nov 24 - Nov 30 (Sunday to Saturday)
    const weekStart = new Date(2025, 10, 24); // Nov 24, 2025 (Sunday)
    weekStart.setHours(0, 0, 0, 0);

    const result = calculateOverlappingAvailability(students, weekStart);

    // Nov 24-30 are all BEFORE Dec 1, so student should not appear on any day
    for (let d = 0; d < 7; d++) {
      const dayTotal = result.overlap[d].reduce((sum, count) => sum + count, 0);
      expect(dayTotal).toBe(0); // No availability on any day this week
    }

    // Total students with availability should be 0 for this week
    expect(result.totalStudents).toBe(0);
  });

  it('should include student from entry date onwards', () => {
    // 臧泽衡: entry date 12/1/25
    const rawData = '本校\t胡润江\t臧泽衡\t2404\t12/1/25\t1次\t2小时/节\t线下\t1v1大学面试练习\t\t已有现地课时\t日本大学\t理工学部電気工学部\t12/4全天或12/5上午或晚上\t\t\t一次\t\t';
    
    const students = [{
      id: 'student-1',
      name: '臧泽衡',
      color: '#7A8C9E',
      rawData: rawData
    }];

    // Week of Dec 1 - Dec 7 (Monday to Sunday)
    // weekStart should be Nov 30 (the Sunday before Dec 1)
    const weekStart = new Date(2025, 10, 30); // Nov 30, 2025 (Sunday)
    weekStart.setHours(0, 0, 0, 0);

    const result = calculateOverlappingAvailability(students, weekStart);

    // Day 0 (Nov 30): BEFORE entry date, should be 0
    const nov30Total = result.overlap[0].reduce((sum, count) => sum + count, 0);
    expect(nov30Total).toBe(0);

    // Day 1 (Dec 1): ON entry date, should have availability
    const dec1Total = result.overlap[1].reduce((sum, count) => sum + count, 0);
    expect(dec1Total).toBeGreaterThan(0);

    // Day 2+ (Dec 2-7): AFTER entry date, should have availability
    for (let d = 2; d < 7; d++) {
      const dayTotal = result.overlap[d].reduce((sum, count) => sum + count, 0);
      expect(dayTotal).toBeGreaterThan(0);
    }
  });

  it('should handle multiple students with different entry dates correctly', () => {
    const students = [
      {
        id: 'student-1',
        name: '潘文浩',
        color: '#7A8C9E',
        rawData: '本校\t胡润江\t潘文浩\t2404\t11/25/25\t1次\t2小时/节\t线下\t1v1\t\t已有课时\t早稻田\t理工学部\t\t\t\t一次\t\t'
      },
      {
        id: 'student-2',
        name: '臧泽衡',
        color: '#7A8C9E',
        rawData: '本校\t胡润江\t臧泽衡\t2404\t12/1/25\t1次\t2小时/节\t线下\t1v1\t\t已有课时\t日本大学\t理工\t\t\t\t一次\t\t'
      }
    ];

    // Week of Nov 30 - Dec 6 (Sunday to Saturday)
    const weekStart = new Date(2025, 10, 30); // Nov 30, 2025 (Sunday)
    weekStart.setHours(0, 0, 0, 0);

    const result = calculateOverlappingAvailability(students, weekStart);

    // Nov 30 (day 0): Only 潘文浩 (entry 11/25), not 臧泽衡 (entry 12/1)
    // Check students in a slot on Nov 30
    const nov30Students = result.studentRefs[0][0]; // First slot of Sunday
    expect(nov30Students.length).toBe(1);
    expect(nov30Students[0].name).toBe('潘文浩');

    // Dec 1 (day 1): Both students should appear
    const dec1Students = result.studentRefs[1][0]; // First slot of Monday
    expect(dec1Students.length).toBe(2);
    const names = dec1Students.map(s => s.name);
    expect(names).toContain('潘文浩');
    expect(names).toContain('臧泽衡');
  });
});

describe('calculateOverlappingAvailability - No Entry Date', () => {
  it('should include student on all days when entry date is missing', () => {
    const rawData = '本校\t胡润江\t测试学生\t2404\t\t1次\t2小时/节\t线下\t1v1\t\t已有课时\t早稻田\t理工\t\t\t\t一次\t\t';
    
    const students = [{
      id: 'student-1',
      name: '测试学生',
      color: '#7A8C9E',
      rawData: rawData
    }];

    const weekStart = new Date(2025, 10, 24); // Nov 24, 2025
    weekStart.setHours(0, 0, 0, 0);

    const result = calculateOverlappingAvailability(students, weekStart);

    // Should have availability on all 7 days
    for (let d = 0; d < 7; d++) {
      const dayTotal = result.overlap[d].reduce((sum, count) => sum + count, 0);
      expect(dayTotal).toBeGreaterThan(0);
    }
  });
});
