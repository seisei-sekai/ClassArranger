/**
 * Constraint Validator
 * 约束验证器
 * 
 * Validates parsed constraints for logical consistency and conflicts
 * 验证解析的约束的逻辑一致性和冲突
 */

import { SLOTS_PER_DAY, timeToSlotIndex } from './constants';

/**
 * Validate a single constraint
 * 验证单个约束
 * 
 * @param {Object} constraint - Parsed constraint object
 * @returns {Object} Validation result {valid, errors, warnings}
 */
export function validateConstraint(constraint) {
  const errors = [];
  const warnings = [];

  if (!constraint) {
    errors.push('约束对象为空');
    return { valid: false, errors, warnings };
  }

  // Validate allowed days
  if (!Array.isArray(constraint.allowedDays) || constraint.allowedDays.length === 0) {
    errors.push('允许日期列表为空或无效');
  } else {
    constraint.allowedDays.forEach(day => {
      if (day < 0 || day > 6) {
        errors.push(`无效的日期值: ${day} (应为0-6)`);
      }
    });
  }

  // Validate time ranges
  if (constraint.allowedTimeRanges) {
    constraint.allowedTimeRanges.forEach((range, idx) => {
      const rangeErrors = validateTimeRange(range, `允许时间范围[${idx}]`);
      errors.push(...rangeErrors);
    });
  }

  if (constraint.excludedTimeRanges) {
    constraint.excludedTimeRanges.forEach((range, idx) => {
      const rangeErrors = validateTimeRange(range, `排除时间范围[${idx}]`);
      errors.push(...rangeErrors);
    });
  }

  // Check for logical contradictions
  const contradictions = checkContradictions(constraint);
  errors.push(...contradictions.errors);
  warnings.push(...contradictions.warnings);

  // Check for availability
  const availability = checkAvailability(constraint);
  if (!availability.hasAvailability) {
    errors.push('约束过于严格，没有可用的时间段');
  } else if (availability.limitedAvailability) {
    warnings.push(`可用时间段较少 (仅${availability.availableSlots}个时间槽)`);
  }

  // Validate confidence
  if (typeof constraint.confidence !== 'number' || 
      constraint.confidence < 0 || 
      constraint.confidence > 1) {
    warnings.push('置信度值无效或超出范围 [0, 1]');
  }

  // Validate strictness
  if (!['strict', 'flexible', 'preferred'].includes(constraint.strictness)) {
    warnings.push(`未知的约束类型: ${constraint.strictness}`);
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Validate time range
 * 验证时间范围
 * 
 * @param {Object} range - Time range object
 * @param {string} label - Label for error messages
 * @returns {Array<string>} Array of error messages
 */
function validateTimeRange(range, label) {
  const errors = [];

  if (!range || typeof range !== 'object') {
    errors.push(`${label}: 范围对象无效`);
    return errors;
  }

  // Validate day (can be null for all days)
  if (range.day !== null && range.day !== undefined) {
    if (range.day < 0 || range.day > 6) {
      errors.push(`${label}: 无效的日期 ${range.day}`);
    }
  }

  // Validate start slot
  if (typeof range.start !== 'number') {
    errors.push(`${label}: 起始槽无效`);
  } else if (range.start < 0 || range.start >= SLOTS_PER_DAY) {
    errors.push(`${label}: 起始槽超出范围 (${range.start}, 应为0-${SLOTS_PER_DAY - 1})`);
  }

  // Validate end slot
  if (typeof range.end !== 'number') {
    errors.push(`${label}: 结束槽无效`);
  } else if (range.end < 0 || range.end > SLOTS_PER_DAY) {
    errors.push(`${label}: 结束槽超出范围 (${range.end}, 应为0-${SLOTS_PER_DAY})`);
  }

  // Check logical order
  if (typeof range.start === 'number' && typeof range.end === 'number') {
    if (range.start >= range.end) {
      errors.push(`${label}: 起始槽(${range.start})应小于结束槽(${range.end})`);
    }
  }

  return errors;
}

/**
 * Check for logical contradictions in constraints
 * 检查约束中的逻辑矛盾
 * 
 * @param {Object} constraint - Constraint object
 * @returns {Object} {errors, warnings}
 */
function checkContradictions(constraint) {
  const errors = [];
  const warnings = [];

  if (!constraint.allowedTimeRanges || !constraint.excludedTimeRanges) {
    return { errors, warnings };
  }

  // Check if allowed and excluded ranges overlap
  constraint.allowedTimeRanges.forEach((allowed, aidx) => {
    constraint.excludedTimeRanges.forEach((excluded, eidx) => {
      const overlap = rangesOverlap(allowed, excluded);
      if (overlap) {
        errors.push(
          `允许时间范围[${aidx}]与排除时间范围[${eidx}]冲突`
        );
      }
    });
  });

  // Check if excluded days conflict with allowed days
  const excludedDays = new Set();
  constraint.excludedTimeRanges?.forEach(range => {
    if (range.day !== null && range.day !== undefined) {
      // Check if this day is completely excluded
      if (range.start === 0 && range.end === SLOTS_PER_DAY) {
        excludedDays.add(range.day);
      }
    }
  });

  constraint.allowedDays?.forEach(day => {
    if (excludedDays.has(day)) {
      warnings.push(`日期${day}在允许列表中，但该天所有时间都被排除`);
    }
  });

  return { errors, warnings };
}

/**
 * Check if two time ranges overlap
 * 检查两个时间范围是否重叠
 * 
 * @param {Object} range1 - First time range
 * @param {Object} range2 - Second time range
 * @returns {boolean} True if ranges overlap
 */
function rangesOverlap(range1, range2) {
  // Check day compatibility
  if (range1.day !== null && range2.day !== null && range1.day !== range2.day) {
    return false; // Different specific days, no overlap
  }

  // Check time overlap
  return range1.start < range2.end && range2.start < range1.end;
}

/**
 * Check if constraint has available time slots
 * 检查约束是否有可用的时间槽
 * 
 * @param {Object} constraint - Constraint object
 * @returns {Object} Availability info
 */
function checkAvailability(constraint) {
  // Build availability matrix for allowed days
  const availabilityMatrix = {};
  
  constraint.allowedDays?.forEach(day => {
    availabilityMatrix[day] = new Array(SLOTS_PER_DAY).fill(true);
  });

  // Apply allowed time ranges (if any)
  if (constraint.allowedTimeRanges && constraint.allowedTimeRanges.length > 0) {
    // First, mark everything as unavailable
    Object.keys(availabilityMatrix).forEach(day => {
      availabilityMatrix[day].fill(false);
    });

    // Then mark only allowed ranges as available
    constraint.allowedTimeRanges.forEach(range => {
      const days = range.day !== null ? [range.day] : constraint.allowedDays || [];
      days.forEach(day => {
        if (availabilityMatrix[day]) {
          for (let slot = range.start; slot < range.end; slot++) {
            if (slot >= 0 && slot < SLOTS_PER_DAY) {
              availabilityMatrix[day][slot] = true;
            }
          }
        }
      });
    });
  }

  // Apply excluded time ranges
  if (constraint.excludedTimeRanges) {
    constraint.excludedTimeRanges.forEach(range => {
      const days = range.day !== null ? [range.day] : constraint.allowedDays || [];
      days.forEach(day => {
        if (availabilityMatrix[day]) {
          for (let slot = range.start; slot < range.end; slot++) {
            if (slot >= 0 && slot < SLOTS_PER_DAY) {
              availabilityMatrix[day][slot] = false;
            }
          }
        }
      });
    });
  }

  // Count available slots
  let availableSlots = 0;
  Object.values(availabilityMatrix).forEach(daySlots => {
    availableSlots += daySlots.filter(slot => slot).length;
  });

  return {
    hasAvailability: availableSlots > 0,
    limitedAvailability: availableSlots < 24, // Less than 2 hours total
    availableSlots,
    totalPossibleSlots: constraint.allowedDays.length * SLOTS_PER_DAY
  };
}

/**
 * Detect conflicts between multiple students' constraints
 * 检测多个学生约束之间的冲突
 * 
 * @param {Array<Object>} constraints - Array of constraint objects with student info
 * @returns {Array<Object>} Array of detected conflicts
 */
export function detectConflicts(constraints) {
  const conflicts = [];

  // Build a map of time slot usage
  const slotUsage = {}; // key: "day_slot", value: array of student names

  constraints.forEach(({ studentName, constraint }) => {
    if (!constraint || !constraint.allowedDays) return;

    // For each allowed day
    constraint.allowedDays.forEach(day => {
      // Determine available slots for this day
      const daySlots = new Array(SLOTS_PER_DAY).fill(true);

      // Apply allowed time ranges if any
      if (constraint.allowedTimeRanges && constraint.allowedTimeRanges.length > 0) {
        daySlots.fill(false);
        constraint.allowedTimeRanges.forEach(range => {
          if (range.day === null || range.day === day) {
            for (let slot = range.start; slot < range.end; slot++) {
              if (slot >= 0 && slot < SLOTS_PER_DAY) {
                daySlots[slot] = true;
              }
            }
          }
        });
      }

      // Apply excluded time ranges
      if (constraint.excludedTimeRanges) {
        constraint.excludedTimeRanges.forEach(range => {
          if (range.day === null || range.day === day) {
            for (let slot = range.start; slot < range.end; slot++) {
              if (slot >= 0 && slot < SLOTS_PER_DAY) {
                daySlots[slot] = false;
              }
            }
          }
        });
      }

      // Record usage
      daySlots.forEach((available, slot) => {
        if (available) {
          const key = `${day}_${slot}`;
          if (!slotUsage[key]) slotUsage[key] = [];
          slotUsage[key].push(studentName);
        }
      });
    });
  });

  // Analyze slot usage for high contention
  Object.entries(slotUsage).forEach(([key, students]) => {
    if (students.length > 5) { // High contention threshold
      const [day, slot] = key.split('_').map(Number);
      conflicts.push({
        type: 'high_contention',
        day,
        slot,
        studentCount: students.length,
        students: students,
        severity: students.length > 10 ? 'critical' : 'warning',
        message: `时间槽 ${key} 有 ${students.length} 个学生竞争`
      });
    }
  });

  // Check for students with no overlap
  const studentAvailability = {};
  constraints.forEach(({ studentName, constraint }) => {
    if (!constraint) return;
    const slots = new Set();
    
    constraint.allowedDays?.forEach(day => {
      for (let slot = 0; slot < SLOTS_PER_DAY; slot++) {
        const key = `${day}_${slot}`;
        if (slotUsage[key] && slotUsage[key].includes(studentName)) {
          slots.add(key);
        }
      }
    });
    
    studentAvailability[studentName] = slots;
  });

  // Find students with minimal overlap with others
  Object.entries(studentAvailability).forEach(([student, slots]) => {
    if (slots.size < 12) { // Less than 1 hour available
      conflicts.push({
        type: 'limited_availability',
        student,
        availableSlots: slots.size,
        severity: slots.size < 6 ? 'critical' : 'warning',
        message: `学生 ${student} 可用时间极少 (${slots.size} 个槽)`
      });
    }
  });

  return conflicts;
}

/**
 * Suggest constraint improvements
 * 建议约束改进
 * 
 * @param {Object} constraint - Constraint object
 * @returns {Array<string>} Array of suggestions
 */
export function suggestImprovements(constraint) {
  const suggestions = [];

  if (!constraint) return suggestions;

  // Check if too restrictive
  const availability = checkAvailability(constraint);
  if (availability.limitedAvailability) {
    suggestions.push('约束过于严格，建议增加可用时间段以提高排课成功率');
  }

  // Check if too vague
  if (constraint.allowedDays.length === 7 && 
      (!constraint.allowedTimeRanges || constraint.allowedTimeRanges.length === 0) &&
      (!constraint.excludedTimeRanges || constraint.excludedTimeRanges.length === 0)) {
    suggestions.push('约束过于宽松，建议添加偏好时间段以优化排课质量');
  }

  // Check confidence
  if (constraint.confidence < 0.6) {
    suggestions.push('解析置信度较低，建议人工审核或提供更明确的时间描述');
  }

  // Check for incomplete exclusions
  if (constraint.excludedTimeRanges && constraint.excludedTimeRanges.length > 0) {
    const totalExcluded = constraint.excludedTimeRanges.reduce((sum, range) => 
      sum + (range.end - range.start), 0
    );
    if (totalExcluded > SLOTS_PER_DAY * constraint.allowedDays.length * 0.7) {
      suggestions.push('排除时间过多，建议使用"允许时间"而非"排除时间"来简化约束');
    }
  }

  return suggestions;
}

export default {
  validateConstraint,
  detectConflicts,
  suggestImprovements
};

