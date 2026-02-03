/**
 * New Constraint Engine
 * 新约束引擎
 * 
 * Implements constraint validation, checking, and scoring
 * for the 10-type constraint system.
 */

import {
  validateConstraint,
  createDefaultConstraint,
  getConstraintDescription,
  ALL_CONSTRAINT_TYPES
} from './newConstraintTypes.js';

/**
 * New Constraint Engine for 10-type constraint system
 */
export class NewConstraintEngine {
  constructor() {
    this.constraints = new Map(); // id -> constraint
    this.enabled = new Set(); // Set of enabled constraint IDs
  }

  /**
   * Add a constraint
   * @param {Object} constraint
   * @returns {string} constraint ID
   */
  addConstraint(constraint) {
    const validation = validateConstraint(constraint);
    if (!validation.valid) {
      throw new Error(`Invalid constraint: ${validation.errors.join(', ')}`);
    }
    
    this.constraints.set(constraint.id, constraint);
    this.enabled.add(constraint.id);
    return constraint.id;
  }

  /**
   * Remove a constraint
   * @param {string} constraintId
   */
  removeConstraint(constraintId) {
    this.constraints.delete(constraintId);
    this.enabled.delete(constraintId);
  }

  /**
   * Update a constraint
   * @param {string} constraintId
   * @param {Object} updates
   */
  updateConstraint(constraintId, updates) {
    const existing = this.constraints.get(constraintId);
    if (!existing) {
      throw new Error(`Constraint not found: ${constraintId}`);
    }
    
    const updated = { ...existing, ...updates };
    const validation = validateConstraint(updated);
    if (!validation.valid) {
      throw new Error(`Invalid constraint update: ${validation.errors.join(', ')}`);
    }
    
    this.constraints.set(constraintId, updated);
  }

  /**
   * Enable/disable a constraint
   * @param {string} constraintId
   * @param {boolean} enabled
   */
  setConstraintEnabled(constraintId, enabled) {
    if (enabled) {
      this.enabled.add(constraintId);
    } else {
      this.enabled.delete(constraintId);
    }
  }

  /**
   * Get all constraints
   * @returns {Array<Object>}
   */
  getAllConstraints() {
    return Array.from(this.constraints.values());
  }

  /**
   * Get enabled constraints
   * @returns {Array<Object>}
   */
  getEnabledConstraints() {
    return Array.from(this.constraints.values())
      .filter(c => this.enabled.has(c.id));
  }

  /**
   * Validate all constraints for a student
   * @param {Array<Object>} constraints
   * @returns {{valid: boolean, errors: Array<{constraintId: string, errors: string[]}>}}
   */
  validateAllConstraints(constraints) {
    if (!Array.isArray(constraints)) {
      return { valid: false, errors: [{ constraintId: 'N/A', errors: ['约束必须是数组'] }] };
    }
    
    const allErrors = [];
    
    for (const constraint of constraints) {
      const validation = validateConstraint(constraint);
      if (!validation.valid) {
        allErrors.push({
          constraintId: constraint.id,
          errors: validation.errors
        });
      }
    }
    
    return {
      valid: allErrors.length === 0,
      errors: allErrors
    };
  }

  /**
   * Check hard constraints for a schedule
   * @param {Object} schedule - Current schedule state
   * @param {string} studentId
   * @param {Array<Object>} constraints
   * @returns {{valid: boolean, violations: Array<Object>}}
   */
  checkHardConstraints(schedule, studentId, constraints) {
    const violations = [];
    
    const hardConstraints = constraints.filter(c => c.strength === 'hard');
    
    for (const constraint of hardConstraints) {
      const violation = this._checkConstraint(constraint, schedule, studentId);
      if (violation) {
        violations.push({
          constraintId: constraint.id,
          constraintKind: constraint.kind,
          description: getConstraintDescription(constraint),
          violation
        });
      }
    }
    
    return {
      valid: violations.length === 0,
      violations
    };
  }

  /**
   * Calculate soft constraint score for a schedule
   * @param {Object} schedule - Current schedule state
   * @param {string} studentId
   * @param {Array<Object>} constraints
   * @returns {number} score (higher is better)
   */
  calculateSoftScore(schedule, studentId, constraints) {
    const softConstraints = constraints.filter(c => c.strength === 'soft');
    
    let totalScore = 0;
    let totalWeight = 0;
    
    for (const constraint of softConstraints) {
      const satisfaction = this._calculateSatisfaction(constraint, schedule, studentId);
      const weight = constraint.priority || 5;
      
      totalScore += satisfaction * weight;
      totalWeight += weight;
    }
    
    return totalWeight > 0 ? totalScore / totalWeight : 1.0;
  }

  /**
   * Merge multiple constraints, handling conflicts
   * @param {Array<Object>} constraints
   * @returns {Array<Object>} merged constraints
   */
  mergeConstraints(constraints) {
    // Group by kind
    const byKind = {};
    for (const c of constraints) {
      if (!byKind[c.kind]) byKind[c.kind] = [];
      byKind[c.kind].push(c);
    }
    
    const merged = [];
    
    for (const [kind, group] of Object.entries(byKind)) {
      if (group.length === 1) {
        merged.push(group[0]);
        continue;
      }
      
      // Merge logic depends on constraint type
      switch (kind) {
        case 'time_window':
          // Merge time windows: take intersection of allowed times
          merged.push(this._mergeTimeWindows(group));
          break;
        
        case 'blackout':
          // Merge blackouts: take union of blocked times
          merged.push(this._mergeBlackouts(group));
          break;
        
        case 'resource_preference':
          // Merge resource preferences: prioritize hard constraints
          merged.push(this._mergeResourcePreferences(group));
          break;
        
        default:
          // For other types, keep all (or take highest priority)
          merged.push(...group);
      }
    }
    
    return merged;
  }

  /**
   * Infer missing constraints with maximum freedom
   * @param {Object} student
   * @returns {Array<Object>} inferred constraints
   */
  inferMissingConstraints(student) {
    const existing = student.constraints || [];
    const existingKinds = new Set(existing.map(c => c.kind));
    
    const inferred = [];
    
    // If no time_window, assume all week all day
    if (!existingKinds.has('time_window')) {
      inferred.push(createDefaultConstraint('time_window', {
        note: '推断：未指定时间窗口，假设全周可用',
        confidence: 0.5,
        weekdays: [1, 2, 3, 4, 5, 6, 7],
        timeRanges: [{ start: '09:00', end: '21:00' }]
      }));
    }
    
    // If no session_plan, infer from rawData
    if (!existingKinds.has('session_plan') && student.courseHours) {
      const duration = this._inferDuration(student);
      const frequency = this._inferFrequency(student);
      
      if (duration || frequency) {
        inferred.push(createDefaultConstraint('session_plan', {
          note: '推断：从课时信息推断',
          confidence: 0.7,
          sessionDurationMin: duration || 120,
          sessionsPerWeek: frequency || 2
        }));
      }
    }
    
    return inferred;
  }

  // ==================== Private Methods ====================

  /**
   * Check a single constraint against the schedule
   * @private
   */
  _checkConstraint(constraint, schedule, studentId) {
    switch (constraint.kind) {
      case 'blackout':
        return this._checkBlackout(constraint, schedule, studentId);
      
      case 'fixed_slot':
        return this._checkFixedSlot(constraint, schedule, studentId);
      
      case 'horizon':
        return this._checkHorizon(constraint, schedule, studentId);
      
      case 'no_overlap':
        return this._checkNoOverlap(constraint, schedule, studentId);
      
      case 'entitlement':
        return this._checkEntitlement(constraint, schedule, studentId);
      
      default:
        return null; // No violation
    }
  }

  /**
   * Calculate satisfaction for a soft constraint
   * @private
   */
  _calculateSatisfaction(constraint, schedule, studentId) {
    switch (constraint.kind) {
      case 'time_window':
        return this._satisfactionTimeWindow(constraint, schedule, studentId);
      
      case 'resource_preference':
        return this._satisfactionResourcePreference(constraint, schedule, studentId);
      
      case 'strategy':
        return this._satisfactionStrategy(constraint, schedule, studentId);
      
      case 'session_plan':
        return this._satisfactionSessionPlan(constraint, schedule, studentId);
      
      default:
        return 1.0; // Fully satisfied by default
    }
  }

  /**
   * Check blackout constraint
   * @private
   */
  _checkBlackout(constraint, schedule, studentId) {
    const studentCourses = schedule.courses?.filter(c => c.studentId === studentId) || [];
    
    for (const course of studentCourses) {
      const courseDay = course.dayOfWeek; // 1-7
      const courseTime = { start: course.startTime, end: course.endTime };
      
      if (constraint.weekdays.includes(courseDay)) {
        for (const blackoutTime of constraint.timeRanges) {
          if (this._timesOverlap(courseTime, blackoutTime)) {
            return `课程时间 ${course.startTime}-${course.endTime} 与禁排时间冲突`;
          }
        }
      }
    }
    
    return null;
  }

  /**
   * Check fixed slot constraint
   * @private
   */
  _checkFixedSlot(constraint, schedule, studentId) {
    if (!constraint.locked) return null;
    
    const studentCourses = schedule.courses?.filter(c => c.studentId === studentId) || [];
    const scheduledSlots = studentCourses.map(c => ({
      start: `${c.date}T${c.startTime}`,
      end: `${c.date}T${c.endTime}`
    }));
    
    for (const fixedSlot of constraint.slots) {
      const found = scheduledSlots.some(s => 
        s.start === fixedSlot.start && s.end === fixedSlot.end
      );
      
      if (!found) {
        return `缺少固定课时：${fixedSlot.start} 至 ${fixedSlot.end}`;
      }
    }
    
    return null;
  }

  /**
   * Check horizon constraint
   * @private
   */
  _checkHorizon(constraint, schedule, studentId) {
    const studentCourses = schedule.courses?.filter(c => c.studentId === studentId) || [];
    
    if (studentCourses.length === 0) return null;
    
    const dates = studentCourses.map(c => new Date(c.date));
    const minDate = new Date(Math.min(...dates));
    const maxDate = new Date(Math.max(...dates));
    
    if (constraint.earliest) {
      const earliest = new Date(constraint.earliest);
      if (minDate < earliest) {
        return `课程开始时间 ${minDate.toISOString().split('T')[0]} 早于最早允许时间 ${constraint.earliest}`;
      }
    }
    
    if (constraint.latest) {
      const latest = new Date(constraint.latest);
      if (maxDate > latest) {
        return `课程结束时间 ${maxDate.toISOString().split('T')[0]} 晚于最晚允许时间 ${constraint.latest}`;
      }
    }
    
    if (constraint.mustFinishBy) {
      const deadline = new Date(constraint.mustFinishBy);
      if (maxDate > deadline) {
        return `课程结束时间 ${maxDate.toISOString().split('T')[0]} 晚于截止日期 ${constraint.mustFinishBy}`;
      }
    }
    
    return null;
  }

  /**
   * Check no-overlap constraint
   * @private
   */
  _checkNoOverlap(constraint, schedule, studentId) {
    const studentCourses = schedule.courses?.filter(c => c.studentId === studentId) || [];
    
    for (const event of constraint.with) {
      if (!event.time) continue;
      
      for (const course of studentCourses) {
        const courseTime = {
          start: `${course.date}T${course.startTime}`,
          end: `${course.date}T${course.endTime}`
        };
        
        if (this._timesOverlap(courseTime, event.time, constraint.bufferMin)) {
          return `课程与事件"${event.title || event.id}"冲突`;
        }
      }
    }
    
    return null;
  }

  /**
   * Check entitlement constraint
   * @private
   */
  _checkEntitlement(constraint, schedule, studentId) {
    if (constraint.paymentStatus === 'pending') {
      return '课时尚未到账，无法排课';
    }
    
    if (constraint.orderCodes.length === 0) {
      return '缺少订单编码信息';
    }
    
    return null;
  }

  /**
   * Calculate satisfaction for time_window
   * @private
   */
  _satisfactionTimeWindow(constraint, schedule, studentId) {
    const studentCourses = schedule.courses?.filter(c => c.studentId === studentId) || [];
    
    if (studentCourses.length === 0) return 1.0;
    
    let matchCount = 0;
    
    for (const course of studentCourses) {
      const courseDay = course.dayOfWeek;
      const courseTime = { start: course.startTime, end: course.endTime };
      
      if (constraint.weekdays.includes(courseDay)) {
        for (const timeRange of constraint.timeRanges) {
          if (this._timesOverlap(courseTime, timeRange)) {
            matchCount++;
            break;
          }
        }
      }
    }
    
    return matchCount / studentCourses.length;
  }

  /**
   * Calculate satisfaction for resource_preference
   * @private
   */
  _satisfactionResourcePreference(constraint, schedule, studentId) {
    const studentCourses = schedule.courses?.filter(c => c.studentId === studentId) || [];
    
    if (studentCourses.length === 0) return 1.0;
    
    let matchCount = 0;
    
    for (const course of studentCourses) {
      let resource;
      switch (constraint.resourceType) {
        case 'teacher':
          resource = course.teacherId;
          break;
        case 'campus':
          resource = course.campus;
          break;
        case 'room':
          resource = course.roomId;
          break;
        case 'delivery_mode':
          resource = course.deliveryMode;
          break;
      }
      
      if (constraint.prefer?.includes(resource)) {
        matchCount++;
      } else if (constraint.include?.length > 0 && constraint.include.includes(resource)) {
        matchCount++;
      } else if (constraint.exclude?.length > 0 && !constraint.exclude.includes(resource)) {
        matchCount += 0.5;
      }
    }
    
    return matchCount / studentCourses.length;
  }

  /**
   * Calculate satisfaction for strategy
   * @private
   */
  _satisfactionStrategy(constraint, schedule, studentId) {
    // Simplified: just return 1.0 for now
    // Full implementation would check spread_evenly, min_sessions_by_date, etc.
    return 1.0;
  }

  /**
   * Calculate satisfaction for session_plan
   * @private
   */
  _satisfactionSessionPlan(constraint, schedule, studentId) {
    const studentCourses = schedule.courses?.filter(c => c.studentId === studentId) || [];
    
    if (studentCourses.length === 0) return 0.0;
    
    let score = 1.0;
    
    // Check total sessions
    if (constraint.totalSessions) {
      const ratio = studentCourses.length / constraint.totalSessions;
      score *= ratio > 1 ? 0.5 : ratio; // Penalty for over-scheduling
    }
    
    // Check duration
    if (constraint.sessionDurationMin) {
      const avgDuration = studentCourses.reduce((sum, c) => {
        const duration = this._calculateDuration(c.startTime, c.endTime);
        return sum + duration;
      }, 0) / studentCourses.length;
      
      const durationRatio = Math.abs(avgDuration - constraint.sessionDurationMin) / constraint.sessionDurationMin;
      score *= Math.max(0, 1 - durationRatio);
    }
    
    return score;
  }

  /**
   * Merge time window constraints
   * @private
   */
  _mergeTimeWindows(constraints) {
    // Take intersection of weekdays
    const allWeekdays = constraints.map(c => new Set(c.weekdays));
    const intersection = [...allWeekdays[0]].filter(day => 
      allWeekdays.every(set => set.has(day))
    );
    
    // Merge time ranges (simplified: just take all)
    const allTimeRanges = constraints.flatMap(c => c.timeRanges);
    
    return createDefaultConstraint('time_window', {
      weekdays: intersection,
      timeRanges: allTimeRanges,
      operator: 'allow',
      note: '合并自多个时间窗口约束',
      confidence: Math.min(...constraints.map(c => c.confidence || 1.0))
    });
  }

  /**
   * Merge blackout constraints
   * @private
   */
  _mergeBlackouts(constraints) {
    // Take union of all blackout times
    const allWeekdays = [...new Set(constraints.flatMap(c => c.weekdays))];
    const allTimeRanges = constraints.flatMap(c => c.timeRanges);
    
    return createDefaultConstraint('blackout', {
      weekdays: allWeekdays,
      timeRanges: allTimeRanges,
      reason: 'other',
      note: '合并自多个禁排时间约束',
      confidence: Math.max(...constraints.map(c => c.confidence || 1.0))
    });
  }

  /**
   * Merge resource preference constraints
   * @private
   */
  _mergeResourcePreferences(constraints) {
    const hardConstraints = constraints.filter(c => c.strength === 'hard');
    if (hardConstraints.length > 0) {
      return hardConstraints[0]; // Prioritize hard constraints
    }
    
    // Merge soft constraints
    const merged = createDefaultConstraint('resource_preference', {
      resourceType: constraints[0].resourceType,
      include: [...new Set(constraints.flatMap(c => c.include || []))],
      exclude: [...new Set(constraints.flatMap(c => c.exclude || []))],
      prefer: [...new Set(constraints.flatMap(c => c.prefer || []))],
      note: '合并自多个资源偏好约束'
    });
    
    return merged;
  }

  /**
   * Check if two time ranges overlap
   * @private
   */
  _timesOverlap(time1, time2, bufferMin = 0) {
    const t1Start = this._timeToMinutes(time1.start);
    const t1End = this._timeToMinutes(time1.end);
    const t2Start = this._timeToMinutes(time2.start);
    const t2End = this._timeToMinutes(time2.end);
    
    return !(t1End + bufferMin <= t2Start || t2End + bufferMin <= t1Start);
  }

  /**
   * Convert time string to minutes
   * @private
   */
  _timeToMinutes(timeStr) {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  }

  /**
   * Calculate duration between two times
   * @private
   */
  _calculateDuration(startTime, endTime) {
    return this._timeToMinutes(endTime) - this._timeToMinutes(startTime);
  }

  /**
   * Infer duration from student data
   * @private
   */
  _inferDuration(student) {
    if (student.duration) {
      const match = student.duration.match(/(\d+)/);
      return match ? parseInt(match[1]) * 60 : null;
    }
    return null;
  }

  /**
   * Infer frequency from student data
   * @private
   */
  _inferFrequency(student) {
    if (student.frequency) {
      const match = student.frequency.match(/(\d+)/);
      return match ? parseInt(match[1]) : null;
    }
    return null;
  }
}

export default NewConstraintEngine;
