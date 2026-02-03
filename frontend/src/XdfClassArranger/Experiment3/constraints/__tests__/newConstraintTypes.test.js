/**
 * Tests for New Constraint Types
 * 新约束类型系统测试
 */

import {
  validateConstraint,
  createDefaultConstraint,
  getConstraintDescription,
  TIME_WINDOW_METADATA,
  BLACKOUT_METADATA,
  ALL_CONSTRAINT_TYPES
} from '../newConstraintTypes';

describe('New Constraint Types', () => {
  describe('validateConstraint', () => {
    test('should validate a valid time_window constraint', () => {
      const constraint = createDefaultConstraint('time_window', {
        weekdays: [1, 2, 3],
        timeRanges: [{ start: '09:00', end: '17:00' }]
      });

      const result = validateConstraint(constraint);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should reject time_window without weekdays', () => {
      const constraint = createDefaultConstraint('time_window', {
        weekdays: [],
        timeRanges: [{ start: '09:00', end: '17:00' }]
      });

      const result = validateConstraint(constraint);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('请选择至少一个星期');
    });

    test('should reject time_window without timeRanges', () => {
      const constraint = createDefaultConstraint('time_window', {
        weekdays: [1, 2, 3],
        timeRanges: []
      });

      const result = validateConstraint(constraint);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('请添加至少一个时间段');
    });

    test('should validate a valid blackout constraint', () => {
      const constraint = createDefaultConstraint('blackout', {
        weekdays: [1, 2, 3, 4, 5],
        timeRanges: [{ start: '09:00', end: '16:00' }],
        reason: 'language_school'
      });

      const result = validateConstraint(constraint);
      expect(result.valid).toBe(true);
    });

    test('should validate session_plan', () => {
      const constraint = createDefaultConstraint('session_plan', {
        totalSessions: 8,
        sessionDurationMin: 120,
        sessionsPerWeek: 2
      });

      const result = validateConstraint(constraint);
      expect(result.valid).toBe(true);
    });
  });

  describe('createDefaultConstraint', () => {
    test('should create a time_window with defaults', () => {
      const constraint = createDefaultConstraint('time_window');
      
      expect(constraint.kind).toBe('time_window');
      expect(constraint.strength).toBe('soft');
      expect(constraint.weekdays).toEqual([1, 2, 3, 4, 5, 6, 7]);
      expect(constraint.timeRanges).toHaveLength(1);
      expect(constraint.id).toBeDefined();
    });

    test('should allow overrides', () => {
      const constraint = createDefaultConstraint('time_window', {
        weekdays: [6, 7],
        note: 'Custom note'
      });

      expect(constraint.weekdays).toEqual([6, 7]);
      expect(constraint.note).toBe('Custom note');
    });
  });

  describe('getConstraintDescription', () => {
    test('should describe time_window', () => {
      const constraint = createDefaultConstraint('time_window', {
        weekdays: [1, 2, 3, 4, 5],
        timeRanges: [{ start: '18:00', end: '21:00' }],
        operator: 'prefer'
      });

      const desc = getConstraintDescription(constraint);
      expect(desc).toContain('周一');
      expect(desc).toContain('18:00-21:00');
      expect(desc).toContain('偏好');
    });

    test('should describe blackout', () => {
      const constraint = createDefaultConstraint('blackout', {
        weekdays: [1, 2, 3, 4, 5],
        timeRanges: [{ start: '09:00', end: '16:00' }]
      });

      const desc = getConstraintDescription(constraint);
      expect(desc).toContain('禁止排课');
      expect(desc).toContain('09:00-16:00');
    });

    test('should describe resource_preference', () => {
      const constraint = createDefaultConstraint('resource_preference', {
        resourceType: 'teacher',
        prefer: ['林博杰']
      });

      const desc = getConstraintDescription(constraint);
      expect(desc).toContain('教师');
      expect(desc).toContain('林博杰');
    });
  });

  describe('ALL_CONSTRAINT_TYPES', () => {
    test('should have all 10 types', () => {
      const types = Object.keys(ALL_CONSTRAINT_TYPES);
      expect(types).toHaveLength(10);
      expect(types).toContain('time_window');
      expect(types).toContain('blackout');
      expect(types).toContain('fixed_slot');
      expect(types).toContain('horizon');
      expect(types).toContain('session_plan');
      expect(types).toContain('resource_preference');
      expect(types).toContain('no_overlap');
      expect(types).toContain('strategy');
      expect(types).toContain('entitlement');
      expect(types).toContain('workflow_gate');
    });

    test('should have metadata for each type', () => {
      Object.entries(ALL_CONSTRAINT_TYPES).forEach(([kind, metadata]) => {
        expect(metadata.name).toBeDefined();
        expect(metadata.description).toBeDefined();
        expect(metadata.icon).toBeDefined();
        expect(metadata.defaultValue).toBeDefined();
        expect(metadata.defaultValue.kind).toBe(kind);
      });
    });
  });
});
