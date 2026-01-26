/**
 * Unit tests for parsedData-based availability calculation
 * 基于NLP解析数据的可用性计算测试
 */

import { describe, it, expect } from 'vitest';
import {
  parseStudentAvailability,
  parseStudentAvailabilityFromParsedData,
  calculateOverlappingAvailability
} from '../availabilityCalculator';

describe('parseStudentAvailabilityFromParsedData', () => {
  it('should parse allowedDays correctly', () => {
    const parsedData = {
      success: true,
      allowedDays: [1, 2, 3, 4, 5], // Monday to Friday
      allowedTimeRanges: [],
      excludedTimeRanges: []
    };

    const availability = parseStudentAvailabilityFromParsedData(parsedData);
    
    expect(availability).not.toBeNull();
    
    // Sunday (0) and Saturday (6) should be all false
    expect(availability[0].every(slot => slot === false)).toBe(true);
    expect(availability[6].every(slot => slot === false)).toBe(true);
    
    // Monday-Friday should be all true
    for (let d = 1; d <= 5; d++) {
      expect(availability[d].every(slot => slot === true)).toBe(true);
    }
  });

  it('should parse allowedTimeRanges for all days', () => {
    const parsedData = {
      success: true,
      allowedDays: [0, 1, 2, 3, 4, 5, 6],
      allowedTimeRanges: [
        { day: null, start: 0, end: 48 } // 9:00-21:00 for all days
      ],
      excludedTimeRanges: []
    };

    const availability = parseStudentAvailabilityFromParsedData(parsedData);
    
    // All days should have slots 0-47 available
    for (let d = 0; d < 7; d++) {
      for (let s = 0; s < 48; s++) {
        expect(availability[d][s]).toBe(true);
      }
      for (let s = 48; s < 150; s++) {
        expect(availability[d][s]).toBe(false);
      }
    }
  });

  it('should parse excludedTimeRanges correctly', () => {
    const parsedData = {
      success: true,
      allowedDays: [0, 1, 2, 3, 4, 5, 6],
      allowedTimeRanges: [],
      excludedTimeRanges: [
        { day: null, start: 42, end: 108 } // 12:30-18:00 excluded for all days
      ]
    };

    const availability = parseStudentAvailabilityFromParsedData(parsedData);
    
    // All days should have slots 42-107 unavailable
    for (let d = 0; d < 7; d++) {
      for (let s = 42; s < 108; s++) {
        expect(availability[d][s]).toBe(false);
      }
    }
  });

  it('should parse specific day time ranges', () => {
    const parsedData = {
      success: true,
      allowedDays: [0, 1, 2, 3, 4, 5, 6],
      allowedTimeRanges: [
        { day: 1, start: 0, end: 36 },      // Monday 9:00-12:00
        { day: 1, start: 108, end: 150 }   // Monday 18:00-21:30
      ],
      excludedTimeRanges: []
    };

    const availability = parseStudentAvailabilityFromParsedData(parsedData);
    
    // Monday (1) should have specific slots available
    for (let s = 0; s < 36; s++) {
      expect(availability[1][s]).toBe(true);
    }
    for (let s = 36; s < 108; s++) {
      expect(availability[1][s]).toBe(false);
    }
    for (let s = 108; s < 150; s++) {
      expect(availability[1][s]).toBe(true);
    }
  });
});

describe('parseStudentAvailability - Unified Entry Point', () => {
  it('should prioritize parsedData over rawData', () => {
    const student = {
      name: '测试学生',
      parsedData: {
        success: true,
        allowedDays: [1, 2], // Only Monday and Tuesday
        allowedTimeRanges: [],
        excludedTimeRanges: []
      },
      rawData: '本校\ttest\t测试学生\t2404\t12/1/25\t1次\t2小时/节\t线下\t1v1\t\t课时\t大学\t学部\t\t都可以\t\t\t\t' // Says "都可以"
    };

    const availability = parseStudentAvailability(student);
    
    // Should use parsedData (Mon-Tue only), not rawData (all days)
    expect(availability[0].every(slot => slot === false)).toBe(true); // Sunday unavailable
    expect(availability[1].every(slot => slot === true)).toBe(true);  // Monday available
    expect(availability[2].every(slot => slot === true)).toBe(true);  // Tuesday available
    expect(availability[3].every(slot => slot === false)).toBe(true); // Wednesday unavailable
  });

  it('should fallback to rawData if parsedData is missing', () => {
    const student = {
      name: '测试学生',
      parsedData: null,
      rawData: '本校\ttest\t测试学生\t2404\t12/1/25\t1次\t2小时/节\t线下\t1v1\t\t课时\t大学\t学部\t\t周一到周五\t\t\t\t'
    };

    const availability = parseStudentAvailability(student);
    
    // Should parse from rawData
    expect(availability[0].every(slot => slot === false)).toBe(true); // Sunday unavailable
    expect(availability[6].every(slot => slot === false)).toBe(true); // Saturday unavailable
    expect(availability[1].some(slot => slot === true)).toBe(true);   // Weekdays available
  });

  it('should use constraint field if parsedData is missing', () => {
    const student = {
      name: '测试学生',
      parsedData: null,
      constraint: {
        success: true,
        allowedDays: [6], // Saturday only
        allowedTimeRanges: [],
        excludedTimeRanges: []
      },
      rawData: '本校\ttest\t测试学生\t2404\t12/1/25\t1次\t2小时/节\t线下\t1v1\t\t课时\t大学\t学部\t\t\t\t\t\t'
    };

    const availability = parseStudentAvailability(student);
    
    // Should use constraint data
    expect(availability[6].every(slot => slot === true)).toBe(true);  // Saturday available
    expect(availability[0].every(slot => slot === false)).toBe(true); // Other days unavailable
  });
});

describe('Real-world student data - 臧泽衡', () => {
  it('should correctly parse 臧泽衡 availability', () => {
    const student = {
      name: '臧泽衡',
      campus: '本校',
      rawData: '本校\t胡润江\t臧泽衡\t2404\t12/1/25\t1次\t2小时/节\t线下\t1v1大学面试练习\t\t已有现地课时\t日本大学\t理工学部電気工学部\t12/4全天或12/5上午或晚上\t12/5的12：30~18点之间不能排课\t\t一次\t\t',
      parsedData: {
        allowedDays: [0, 1, 2, 3, 4, 5, 6],
        allowedTimeRanges: [
          { day: null, start: 0, end: 150 },
          { day: 1, start: 0, end: 36 },
          { day: 1, start: 108, end: 150 }
        ],
        excludedTimeRanges: [
          { day: null, start: 42, end: 108 }
        ],
        strictness: 'strict',
        confidence: 0.75,
        success: true
      }
    };

    const availability = parseStudentAvailability(student);
    
    expect(availability).not.toBeNull();
    
    // Check that 12:30-18:00 (slots 42-107) is excluded
    for (let d = 0; d < 7; d++) {
      for (let s = 42; s < 108; s++) {
        expect(availability[d][s]).toBe(false);
      }
    }
  });
});

describe('Integration with entry date filtering', () => {
  it('should combine parsedData availability with entry date filtering', () => {
    const students = [
      {
        id: 'student-1',
        name: '臧泽衡',
        color: '#7A8C9E',
        rawData: '本校\t胡润江\t臧泽衡\t2404\t12/1/25\t1次\t2小时/节\t线下\t1v1\t\t课时\t大学\t学部\t\t\t\t\t\t',
        parsedData: {
          success: true,
          allowedDays: [0, 1, 2, 3, 4, 5, 6],
          allowedTimeRanges: [],
          excludedTimeRanges: []
        }
      }
    ];

    // Week of Nov 29 - Dec 5 (weekStart = Nov 29)
    const weekStart = new Date(2025, 10, 29); // Nov 29, 2025
    weekStart.setHours(0, 0, 0, 0);

    const result = calculateOverlappingAvailability(students, weekStart);

    // Nov 29 and Nov 30 (days 0-1) should have NO availability (before entry date 12/1)
    const nov29Total = result.overlap[0].reduce((sum, count) => sum + count, 0);
    const nov30Total = result.overlap[1].reduce((sum, count) => sum + count, 0);
    expect(nov29Total).toBe(0);
    expect(nov30Total).toBe(0);

    // Dec 1 onwards (day 2+) should have availability
    for (let d = 2; d < 7; d++) {
      const dayTotal = result.overlap[d].reduce((sum, count) => sum + count, 0);
      expect(dayTotal).toBeGreaterThan(0);
    }
  });
});
