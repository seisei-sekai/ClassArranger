/**
 * Constraint Engine
 * 约束引擎核心
 * 
 * Manages and validates all scheduling constraints
 * 管理和验证所有排课约束
 */

import { ConstraintTypes, DEFAULT_WEIGHTS, CONSTRAINT_METADATA } from './constraintTypes';

class ConstraintEngine {
  constructor() {
    this.constraints = new Map();
    this.customConstraints = [];
    this.weights = { ...DEFAULT_WEIGHTS };
    this.enabled = new Set();
    
    // Initialize default constraints (初始化默认约束)
    this.initializeDefaultConstraints();
  }
  
  /**
   * Initialize default constraint validators
   * 初始化默认约束验证器
   */
  initializeDefaultConstraints() {
    // Time conflict validator (时间冲突验证器)
    this.registerConstraint(ConstraintTypes.HARD.TIME_CONFLICT, {
      type: 'hard',
      weight: this.weights[ConstraintTypes.HARD.TIME_CONFLICT],
      check: (schedule) => this.checkTimeConflicts(schedule),
      enabled: true
    });
    
    // Teacher availability validator (教师可用性验证器)
    this.registerConstraint(ConstraintTypes.HARD.TEACHER_AVAILABILITY, {
      type: 'hard',
      weight: this.weights[ConstraintTypes.HARD.TEACHER_AVAILABILITY],
      check: (schedule, data) => this.checkTeacherAvailability(schedule, data),
      enabled: true
    });
    
    // Student availability validator (学生可用性验证器)
    this.registerConstraint(ConstraintTypes.HARD.STUDENT_AVAILABILITY, {
      type: 'hard',
      weight: this.weights[ConstraintTypes.HARD.STUDENT_AVAILABILITY],
      check: (schedule, data) => this.checkStudentAvailability(schedule, data),
      enabled: true
    });
    
    // Classroom capacity validator (教室容量验证器)
    this.registerConstraint(ConstraintTypes.HARD.CLASSROOM_CAPACITY, {
      type: 'hard',
      weight: this.weights[ConstraintTypes.HARD.CLASSROOM_CAPACITY],
      check: (schedule, data) => this.checkClassroomCapacity(schedule, data),
      enabled: true
    });
    
    // Subject match validator (科目匹配验证器)
    this.registerConstraint(ConstraintTypes.HARD.SUBJECT_MATCH, {
      type: 'hard',
      weight: this.weights[ConstraintTypes.HARD.SUBJECT_MATCH],
      check: (schedule, data) => this.checkSubjectMatch(schedule, data),
      enabled: true
    });
    
    // Lunch break validator (午休时间验证器)
    this.registerConstraint(ConstraintTypes.SOFT.LUNCH_BREAK, {
      type: 'soft',
      weight: this.weights[ConstraintTypes.SOFT.LUNCH_BREAK],
      check: (schedule) => this.checkLunchBreak(schedule),
      enabled: true
    });
    
    // Consecutive limit validator (连续上课限制验证器)
    this.registerConstraint(ConstraintTypes.SOFT.CONSECUTIVE_LIMIT, {
      type: 'soft',
      weight: this.weights[ConstraintTypes.SOFT.CONSECUTIVE_LIMIT],
      check: (schedule) => this.checkConsecutiveLimit(schedule),
      enabled: true
    });
    
    // Distribution validator (课程分散度验证器)
    this.registerConstraint(ConstraintTypes.SOFT.DISTRIBUTION, {
      type: 'soft',
      weight: this.weights[ConstraintTypes.SOFT.DISTRIBUTION],
      check: (schedule) => this.checkDistribution(schedule),
      enabled: true
    });
  }
  
  /**
   * Register a constraint
   * 注册约束
   */
  registerConstraint(id, constraint) {
    this.constraints.set(id, {
      id,
      ...constraint,
      metadata: CONSTRAINT_METADATA[id] || {}
    });
    
    if (constraint.enabled) {
      this.enabled.add(id);
    }
  }
  
  /**
   * Validate a single constraint
   * 验证单个约束
   */
  validate(schedule, constraintId, data = null) {
    const constraint = this.constraints.get(constraintId);
    if (!constraint || !this.enabled.has(constraintId)) {
      return { valid: true, violations: 0 };
    }
    
    return constraint.check(schedule, data);
  }
  
  /**
   * Calculate total violation score
   * 计算总违规分数
   * 
   * @param {Array} schedule - Course schedule array
   * @param {Object} data - Additional data (teachers, students, classrooms)
   * @returns {Object} { score, violations, details }
   */
  calculateViolationScore(schedule, data = {}) {
    let score = 100;
    const violations = {};
    const details = [];
    
    // Check each enabled constraint (检查每个启用的约束)
    this.constraints.forEach((constraint, id) => {
      if (!this.enabled.has(id)) return;
      
      const result = constraint.check(schedule, data);
      const violationCount = result.violations || 0;
      
      if (violationCount > 0) {
        const penalty = violationCount * constraint.weight;
        score -= penalty;
        
        violations[id] = violationCount;
        details.push({
          constraintId: id,
          name: constraint.metadata.name || id,
          type: constraint.type,
          violations: violationCount,
          penalty,
          weight: constraint.weight
        });
      }
    });
    
    return {
      score: Math.max(0, score),
      violations,
      details,
      totalViolations: Object.values(violations).reduce((sum, v) => sum + v, 0)
    };
  }
  
  /**
   * Add custom constraint
   * 添加自定义约束
   */
  addCustomConstraint(name, checkFunction, weight = 5, type = 'soft') {
    const constraint = {
      id: `custom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name,
      type,
      check: checkFunction,
      weight,
      isCustom: true,
      enabled: true,
      metadata: {
        name,
        nameEn: name,
        description: '自定义约束',
        descriptionEn: 'Custom constraint',
        category: type,
        editable: true
      }
    };
    
    this.customConstraints.push(constraint);
    this.registerConstraint(constraint.id, constraint);
    
    return constraint.id;
  }
  
  /**
   * Remove custom constraint
   * 移除自定义约束
   */
  removeCustomConstraint(constraintId) {
    if (!constraintId.startsWith('custom_')) return false;
    
    this.constraints.delete(constraintId);
    this.enabled.delete(constraintId);
    this.customConstraints = this.customConstraints.filter(c => c.id !== constraintId);
    
    return true;
  }
  
  /**
   * Enable/disable constraint
   * 启用/禁用约束
   */
  setConstraintEnabled(constraintId, enabled) {
    if (!this.constraints.has(constraintId)) return false;
    
    if (enabled) {
      this.enabled.add(constraintId);
    } else {
      this.enabled.delete(constraintId);
    }
    
    return true;
  }
  
  /**
   * Update constraint weight
   * 更新约束权重
   */
  setConstraintWeight(constraintId, weight) {
    const constraint = this.constraints.get(constraintId);
    if (!constraint) return false;
    
    constraint.weight = weight;
    this.weights[constraintId] = weight;
    
    return true;
  }
  
  /**
   * Get all constraints
   * 获取所有约束
   */
  getAllConstraints() {
    return Array.from(this.constraints.values());
  }
  
  /**
   * Get enabled constraints
   * 获取启用的约束
   */
  getEnabledConstraints() {
    return Array.from(this.constraints.values()).filter(c => this.enabled.has(c.id));
  }
  
  // ==================== Constraint Check Methods ====================
  // ==================== 约束检查方法 ====================
  
  /**
   * Check time conflicts
   * 检查时间冲突
   */
  checkTimeConflicts(schedule) {
    let violations = 0;
    const conflicts = [];
    
    for (let i = 0; i < schedule.length; i++) {
      for (let j = i + 1; j < schedule.length; j++) {
        const course1 = schedule[i];
        const course2 = schedule[j];
        
        // Check if same time slot (检查是否同一时间槽)
        if (this.timesOverlap(course1, course2)) {
          // Teacher conflict (教师冲突)
          if (course1.teacher === course2.teacher) {
            violations++;
            conflicts.push({ type: 'teacher', course1: course1.id, course2: course2.id });
          }
          
          // Student conflict (学生冲突)
          if (course1.student === course2.student) {
            violations++;
            conflicts.push({ type: 'student', course1: course1.id, course2: course2.id });
          }
          
          // Classroom conflict (教室冲突)
          if (course1.room && course2.room && course1.room.id === course2.room.id) {
            violations++;
            conflicts.push({ type: 'classroom', course1: course1.id, course2: course2.id });
          }
        }
      }
    }
    
    return { violations, conflicts };
  }
  
  /**
   * Check if two courses overlap in time
   * 检查两门课程是否时间重叠
   */
  timesOverlap(course1, course2) {
    if (!course1.timeSlot || !course2.timeSlot) return false;
    if (course1.timeSlot.day !== course2.timeSlot.day) return false;
    
    const start1 = course1.timeSlot.startSlot || 0;
    const end1 = start1 + (course1.duration || 24); // duration in slots (时长以slot为单位)
    const start2 = course2.timeSlot.startSlot || 0;
    const end2 = start2 + (course2.duration || 24);
    
    return start1 < end2 && end1 > start2;
  }
  
  /**
   * Check teacher availability
   * 检查教师可用性
   */
  checkTeacherAvailability(schedule, data) {
    let violations = 0;
    // TODO: Implement teacher availability check
    // This requires teacher data with availability information
    return { violations };
  }
  
  /**
   * Check student availability
   * 检查学生可用性
   */
  checkStudentAvailability(schedule, data) {
    let violations = 0;
    // TODO: Implement student availability check
    // This requires student data with availability information
    return { violations };
  }
  
  /**
   * Check classroom capacity
   * 检查教室容量
   */
  checkClassroomCapacity(schedule, data) {
    let violations = 0;
    
    schedule.forEach(course => {
      if (course.room && course.room.capacity < 2) {
        violations++;
      }
    });
    
    return { violations };
  }
  
  /**
   * Check subject matching
   * 检查科目匹配
   */
  checkSubjectMatch(schedule, data) {
    let violations = 0;
    // TODO: Implement subject matching check
    // This requires teacher qualification data
    return { violations };
  }
  
  /**
   * Check lunch break violations
   * 检查午休时间违规
   */
  checkLunchBreak(schedule) {
    let violations = 0;
    
    schedule.forEach(course => {
      if (course.timeSlot && course.timeSlot.start) {
        const hour = parseInt(course.timeSlot.start.split(':')[0]);
        if (hour === 12) {
          violations++;
        }
      }
    });
    
    return { violations };
  }
  
  /**
   * Check consecutive class limit
   * 检查连续上课限制
   */
  checkConsecutiveLimit(schedule) {
    let violations = 0;
    // TODO: Implement consecutive limit check
    return { violations };
  }
  
  /**
   * Check course distribution
   * 检查课程分散度
   */
  checkDistribution(schedule) {
    const dailyLoad = {};
    
    schedule.forEach(course => {
      const day = course.timeSlot?.day || 'unknown';
      dailyLoad[day] = (dailyLoad[day] || 0) + 1;
    });
    
    const loads = Object.values(dailyLoad);
    if (loads.length === 0) return { violations: 0, score: 10 };
    
    const avg = loads.reduce((a, b) => a + b, 0) / loads.length;
    const variance = loads.reduce((sum, load) => sum + Math.pow(load - avg, 2), 0) / loads.length;
    
    // High variance means poor distribution (高方差意味着分散度差)
    const violations = Math.floor(variance);
    
    return { violations, variance, score: Math.max(0, 10 - variance) };
  }
}

export default ConstraintEngine;

