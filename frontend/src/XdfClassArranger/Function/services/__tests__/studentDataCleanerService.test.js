/**
 * Tests for Student Data Cleaner Service
 * 学生数据清洗服务测试
 */

import { describe, it, expect, vi } from 'vitest';
import { needsCleaning } from '../studentDataCleanerService';

describe('Student Data Cleaner Service', () => {
  describe('needsCleaning', () => {
    it('should return true for missing frequency', () => {
      const student = {
        name: '测试学生',
        frequency: '',
        duration: '2小时',
        courseHours: { totalHours: 20 }
      };
      expect(needsCleaning(student)).toBe(true);
    });

    it('should return true for ambiguous frequency', () => {
      const student = {
        name: '测试学生',
        frequency: '多次',
        duration: '2小时',
        courseHours: { totalHours: 20 }
      };
      expect(needsCleaning(student)).toBe(true);
    });

    it('should return true for missing duration', () => {
      const student = {
        name: '测试学生',
        frequency: '2次',
        duration: '',
        courseHours: { totalHours: 20 }
      };
      expect(needsCleaning(student)).toBe(true);
    });

    it('should return true for ambiguous duration', () => {
      const student = {
        name: '测试学生',
        frequency: '2次',
        duration: '待定',
        courseHours: { totalHours: 20 }
      };
      expect(needsCleaning(student)).toBe(true);
    });

    it('should return true for missing total hours', () => {
      const student = {
        name: '测试学生',
        frequency: '2次',
        duration: '2小时',
        courseHours: { totalHours: 0 }
      };
      expect(needsCleaning(student)).toBe(true);
    });

    it('should return false for valid data', () => {
      const student = {
        name: '测试学生',
        frequency: '2次',
        duration: '2小时',
        courseHours: { totalHours: 48 }
      };
      expect(needsCleaning(student)).toBe(false);
    });

    it('should return false for decimal duration', () => {
      const student = {
        name: '测试学生',
        frequency: '3次',
        duration: '1.5小时',
        courseHours: { totalHours: 54 }
      };
      expect(needsCleaning(student)).toBe(false);
    });

    it('should handle missing courseHours object', () => {
      const student = {
        name: '测试学生',
        frequency: '2次',
        duration: '2小时'
      };
      expect(needsCleaning(student)).toBe(true);
    });
  });
});

