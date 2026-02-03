/**
 * Validation Utilities for Constraints
 * 约束验证工具
 */

import { timeSlotsOverlap, validateTimeSlot, TIME_GRANULARITY } from './dataStructures.js';

/**
 * Validate constraint consistency
 * 验证约束一致性
 */
export function validateConstraints(constraints, granularity = TIME_GRANULARITY.FIVE_MIN) {
  const errors = [];
  const warnings = [];
  
  // Check if allowed days is empty
  if (!constraints.allowedDays || constraints.allowedDays.size === 0) {
    errors.push('必须至少选择一天可用时间');
  }
  
  // Check if duration is valid
  if (!constraints.duration || constraints.duration <= 0) {
    errors.push('课程时长必须大于0');
  }
  
  // Validate all time ranges
  if (constraints.allowedTimeRanges) {
    constraints.allowedTimeRanges.forEach((range, index) => {
      const validation = validateTimeSlot(range, granularity);
      if (!validation.valid) {
        errors.push(`允许时间段${index + 1}无效: ${validation.errors.join(', ')}`);
      }
    });
  }
  
  if (constraints.excludedTimeRanges) {
    constraints.excludedTimeRanges.forEach((range, index) => {
      const validation = validateTimeSlot(range, granularity);
      if (!validation.valid) {
        errors.push(`排除时间段${index + 1}无效: ${validation.errors.join(', ')}`);
      }
    });
  }
  
  // Check for contradictions between allowed and excluded ranges
  if (constraints.allowedTimeRanges && constraints.excludedTimeRanges) {
    constraints.allowedTimeRanges.forEach((allowed, i) => {
      constraints.excludedTimeRanges.forEach((excluded, j) => {
        if (timeSlotsOverlap(allowed, excluded)) {
          warnings.push(`允许时间段${i + 1}与排除时间段${j + 1}重叠`);
        }
      });
    });
  }
  
  // Check if frequency is valid
  if (constraints.frequency) {
    const freqMatch = constraints.frequency.match(/(\d+)次/);
    if (!freqMatch) {
      warnings.push('频率格式可能不正确，应为"N次/周"');
    }
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Check if a student can be scheduled
 * 检查学生是否可以被安排
 */
export function canScheduleStudent(student, teachers, granularity = TIME_GRANULARITY.FIVE_MIN) {
  const issues = [];
  
  // Check if student has remaining hours
  if (student.remainingHours <= 0) {
    issues.push('学生没有剩余课时');
    return { possible: false, issues };
  }
  
  // Check if there are teachers who can teach the subject
  const eligibleTeachers = teachers.filter(t => t.subjects.includes(student.subject));
  if (eligibleTeachers.length === 0) {
    issues.push(`没有教师可以教授"${student.subject}"科目`);
    return { possible: false, issues };
  }
  
  // Check if student has valid time constraints
  const validation = validateConstraints(student.constraints, granularity);
  if (!validation.valid) {
    issues.push(...validation.errors);
    return { possible: false, issues };
  }
  
  // Check if there's any time overlap with eligible teachers
  let hasOverlap = false;
  for (const teacher of eligibleTeachers) {
    for (const studentRange of student.constraints.allowedTimeRanges) {
      for (const teacherRange of teacher.availableTimeSlots) {
        if (timeSlotsOverlap(studentRange, teacherRange)) {
          hasOverlap = true;
          break;
        }
      }
      if (hasOverlap) break;
    }
    if (hasOverlap) break;
  }
  
  if (!hasOverlap) {
    issues.push('学生的可用时间与所有合格教师的时间都不重叠');
    return { possible: false, issues };
  }
  
  return { possible: true, issues: [] };
}

/**
 * Calculate availability overlap
 * 计算可用时间重叠度
 */
export function calculateAvailabilityOverlap(studentRanges, teacherRanges) {
  let totalOverlapSlots = 0;
  
  for (const studentRange of studentRanges) {
    for (const teacherRange of teacherRanges) {
      if (timeSlotsOverlap(studentRange, teacherRange)) {
        const overlapStart = Math.max(studentRange.startSlot, teacherRange.startSlot);
        const overlapEnd = Math.min(studentRange.endSlot, teacherRange.endSlot);
        totalOverlapSlots += (overlapEnd - overlapStart);
      }
    }
  }
  
  return totalOverlapSlots;
}

/**
 * Check for scheduling conflicts
 * 检查排课冲突
 */
export function checkConflicts(newCourse, existingCourses) {
  const conflicts = [];
  
  for (const existing of existingCourses) {
    // Check teacher conflict
    if (existing.teacher.id === newCourse.teacher.id) {
      if (timeSlotsOverlap(existing.timeSlot, newCourse.timeSlot)) {
        conflicts.push({
          type: 'teacher',
          message: `教师${existing.teacher.name}在此时间已有课程`,
          existingCourse: existing
        });
      }
    }
    
    // Check student conflict
    if (existing.student.id === newCourse.student.id) {
      if (timeSlotsOverlap(existing.timeSlot, newCourse.timeSlot)) {
        conflicts.push({
          type: 'student',
          message: `学生${existing.student.name}在此时间已有课程`,
          existingCourse: existing
        });
      }
    }
    
    // Check room conflict (if applicable)
    if (newCourse.room && existing.room && existing.room.id === newCourse.room.id) {
      if (timeSlotsOverlap(existing.timeSlot, newCourse.timeSlot)) {
        conflicts.push({
          type: 'room',
          message: `教室${existing.room.name}在此时间已被占用`,
          existingCourse: existing
        });
      }
    }
  }
  
  return conflicts;
}

/**
 * Suggest fixes for invalid constraints
 * 为无效约束建议修复方案
 */
export function suggestConstraintFixes(validationResult, student, teachers) {
  const suggestions = [];
  
  if (!validationResult.valid) {
    validationResult.errors.forEach(error => {
      if (error.includes('至少选择一天')) {
        suggestions.push('建议添加至少一个可用星期（如周一到周五）');
      }
      if (error.includes('课程时长')) {
        suggestions.push('建议设置课程时长为1-4小时（12-48个5分钟槽位）');
      }
      if (error.includes('不重叠')) {
        const eligibleTeachers = teachers.filter(t => t.subjects.includes(student.subject));
        if (eligibleTeachers.length > 0) {
          const commonTimes = findCommonAvailableTimes(student, eligibleTeachers[0]);
          if (commonTimes.length > 0) {
            suggestions.push(`建议将时间调整为: ${formatTimeRange(commonTimes[0])}`);
          }
        }
      }
    });
  }
  
  return suggestions;
}

/**
 * Find common available times between student and teacher
 * 找到学生和教师的共同可用时间
 */
function findCommonAvailableTimes(student, teacher) {
  const commonTimes = [];
  
  for (const studentRange of student.constraints.allowedTimeRanges) {
    for (const teacherRange of teacher.availableTimeSlots) {
      if (timeSlotsOverlap(studentRange, teacherRange)) {
        const overlapStart = Math.max(studentRange.startSlot, teacherRange.startSlot);
        const overlapEnd = Math.min(studentRange.endSlot, teacherRange.endSlot);
        
        commonTimes.push({
          day: studentRange.day,
          startSlot: overlapStart,
          endSlot: overlapEnd
        });
      }
    }
  }
  
  return commonTimes;
}

/**
 * Format time range for display
 * 格式化时间段用于显示
 */
function formatTimeRange(range) {
  const dayNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  const startTime = slotToTimeString(range.startSlot);
  const endTime = slotToTimeString(range.endSlot);
  
  return `${dayNames[range.day]} ${startTime}-${endTime}`;
}

/**
 * Convert slot to time string
 * 将槽位转换为时间字符串
 */
function slotToTimeString(slot) {
  const startHour = 9;
  const minutes = slot * 5;
  const hour = startHour + Math.floor(minutes / 60);
  const minute = minutes % 60;
  
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}
