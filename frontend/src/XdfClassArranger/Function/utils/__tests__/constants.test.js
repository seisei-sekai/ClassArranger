import { describe, it, expect } from 'vitest';
import {
  EXCEL_COLUMNS,
  TEACHER_COLUMNS,
  JAPANESE_COLORS,
  STANDARD_START,
  STANDARD_END,
  SLOTS_PER_DAY,
  DAY_NAME_TO_NUMBER,
  getRandomJapaneseColor,
} from '../constants';

describe('constants.js', () => {
  describe('EXCEL_COLUMNS', () => {
    it('should be defined', () => {
      expect(EXCEL_COLUMNS).toBeDefined();
      expect(typeof EXCEL_COLUMNS).toBe('string');
    });

    it('should contain tab-separated columns', () => {
      expect(EXCEL_COLUMNS).toContain('\t');
      const columns = EXCEL_COLUMNS.split('\t');
      expect(columns.length).toBeGreaterThan(0);
    });
  });

  describe('TEACHER_COLUMNS', () => {
    it('should be defined', () => {
      expect(TEACHER_COLUMNS).toBeDefined();
      expect(typeof TEACHER_COLUMNS).toBe('string');
    });

    it('should contain tab-separated columns', () => {
      expect(TEACHER_COLUMNS).toContain('\t');
      const columns = TEACHER_COLUMNS.split('\t');
      expect(columns.length).toBeGreaterThan(0);
    });

    it('should contain expected teacher fields', () => {
      expect(TEACHER_COLUMNS).toContain('老师姓名');
      expect(TEACHER_COLUMNS).toContain('教师级别');
      expect(TEACHER_COLUMNS).toContain('可带时间');
    });
  });

  describe('JAPANESE_COLORS', () => {
    it('should be an array', () => {
      expect(Array.isArray(JAPANESE_COLORS)).toBe(true);
    });

    it('should contain valid hex colors', () => {
      JAPANESE_COLORS.forEach(color => {
        expect(color).toMatch(/^#[0-9A-Fa-f]{6}$/);
      });
    });

    it('should have at least one color', () => {
      expect(JAPANESE_COLORS.length).toBeGreaterThan(0);
    });
  });

  describe('Time constants', () => {
    it('should have valid STANDARD_START', () => {
      expect(STANDARD_START).toBe(9);
      expect(typeof STANDARD_START).toBe('number');
    });

    it('should have valid STANDARD_END', () => {
      expect(STANDARD_END).toBe(21.5);
      expect(typeof STANDARD_END).toBe('number');
    });

    it('should have valid SLOTS_PER_DAY', () => {
      expect(SLOTS_PER_DAY).toBe(25);
      expect(typeof SLOTS_PER_DAY).toBe('number');
    });

    it('should have correct calculation', () => {
      const calculatedSlots = (STANDARD_END - STANDARD_START) / 0.5;
      expect(SLOTS_PER_DAY).toBe(calculatedSlots);
    });
  });

  describe('DAY_NAME_TO_NUMBER', () => {
    it('should be an object', () => {
      expect(typeof DAY_NAME_TO_NUMBER).toBe('object');
    });

    it('should map Chinese weekday names correctly', () => {
      expect(DAY_NAME_TO_NUMBER['周一']).toBe(1);
      expect(DAY_NAME_TO_NUMBER['周二']).toBe(2);
      expect(DAY_NAME_TO_NUMBER['周三']).toBe(3);
      expect(DAY_NAME_TO_NUMBER['周四']).toBe(4);
      expect(DAY_NAME_TO_NUMBER['周五']).toBe(5);
      expect(DAY_NAME_TO_NUMBER['周六']).toBe(6);
      expect(DAY_NAME_TO_NUMBER['周日']).toBe(0);
    });

    it('should map English weekday names correctly', () => {
      expect(DAY_NAME_TO_NUMBER['monday']).toBe(1);
      expect(DAY_NAME_TO_NUMBER['tuesday']).toBe(2);
      expect(DAY_NAME_TO_NUMBER['wednesday']).toBe(3);
      expect(DAY_NAME_TO_NUMBER['thursday']).toBe(4);
      expect(DAY_NAME_TO_NUMBER['friday']).toBe(5);
      expect(DAY_NAME_TO_NUMBER['saturday']).toBe(6);
      expect(DAY_NAME_TO_NUMBER['sunday']).toBe(0);
    });
  });

  describe('getRandomJapaneseColor', () => {
    it('should return a valid color', () => {
      const color = getRandomJapaneseColor();
      expect(JAPANESE_COLORS).toContain(color);
    });

    it('should return a hex color', () => {
      const color = getRandomJapaneseColor();
      expect(color).toMatch(/^#[0-9A-Fa-f]{6}$/);
    });

    it('should return different colors on multiple calls (probabilistic)', () => {
      const colors = new Set();
      for (let i = 0; i < 100; i++) {
        colors.add(getRandomJapaneseColor());
      }
      // 如果颜色数组有多个颜色，100次调用应该至少得到2个不同的颜色
      if (JAPANESE_COLORS.length > 1) {
        expect(colors.size).toBeGreaterThan(1);
      }
    });
  });
});

