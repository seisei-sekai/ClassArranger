/**
 * Greedy Scheduling Algorithm
 * 贪心排课算法
 * 
 * Simple and fast scheduling algorithm that assigns courses sequentially
 */

import { 
  timeSlotsOverlap, 
  findOverlap, 
  createCourse,
  deepClone 
} from '../utils/dataStructures.js';

/**
 * Greedy Scheduler
 * 贪心调度器
 */
export class GreedyScheduler {
  constructor(config = {}) {
    this.teachers = config.teachers || [];
    this.students = config.students || [];
    this.granularity = config.granularity;
    this.onProgress = config.onProgress || (() => {});
  }

  /**
   * Run the greedy scheduling algorithm
   * 运行贪心排课算法
   */
  schedule() {
    const startTime = Date.now();
    const results = {
      courses: [],
      conflicts: [],
      stats: {
        totalStudents: this.students.length,
        scheduledStudents: 0,
        totalAttempts: 0,
        successRate: 0
      }
    };

    // Initialize teacher availability map
    const teacherAvailability = this.initializeTeacherAvailability();
    
    // Process each student
    this.students.forEach((student, index) => {
      this.onProgress({
        current: index + 1,
        total: this.students.length,
        message: `正在为 ${student.name} 排课...`
      });

      const result = this.scheduleStudent(student, teacherAvailability);
      results.stats.totalAttempts++;

      if (result.success) {
        results.courses.push(result.course);
        results.stats.scheduledStudents++;
        
        // Update teacher availability
        this.updateTeacherAvailability(
          teacherAvailability,
          result.course.teacher.id,
          result.course.timeSlot
        );
      } else {
        results.conflicts.push({
          student,
          reason: result.reason
        });
      }
    });

    // Calculate statistics
    const endTime = Date.now();
    results.stats.executionTime = endTime - startTime;
    results.stats.successRate = (results.stats.scheduledStudents / results.stats.totalStudents) * 100;

    return results;
  }

  /**
   * Initialize teacher availability map
   * 初始化教师可用时间映射
   */
  initializeTeacherAvailability() {
    const availability = {};
    
    this.teachers.forEach(teacher => {
      availability[teacher.id] = {
        teacher: teacher,
        availableSlots: deepClone(teacher.availableTimeSlots),
        hoursUsed: 0
      };
    });

    return availability;
  }

  /**
   * Schedule a single student
   * 为单个学生排课
   */
  scheduleStudent(student, teacherAvailability) {
    // Step 1: Find eligible teachers (can teach the subject)
    const eligibleTeachers = this.findEligibleTeachers(student.subject, teacherAvailability);
    
    if (eligibleTeachers.length === 0) {
      return {
        success: false,
        reason: `没有教师可以教授"${student.subject}"科目`
      };
    }

    // Step 2: Check if student has remaining hours
    if (student.remainingHours <= 0) {
      return {
        success: false,
        reason: '学生没有剩余课时'
      };
    }

    // Step 3: Try to find a valid time slot
    const courseDuration = student.constraints.duration || 24; // Default 2 hours
    const failureReasons = [];

    for (const teacherInfo of eligibleTeachers) {
      const teacher = teacherInfo.teacher;
      
      // Check if teacher hasn't exceeded max hours
      const hoursNeeded = (courseDuration * this.granularity.minutes) / 60;
      if (teacherInfo.hoursUsed + hoursNeeded > teacher.maxHoursPerWeek) {
        failureReasons.push(`教师${teacher.name}已达周课时上限`);
        continue;
      }

      // Find overlapping time slots between student and teacher
      const validSlots = this.findValidTimeSlots(
        student,
        teacherInfo.availableSlots,
        courseDuration
      );

      if (validSlots.length > 0) {
        // Found a valid slot - assign it
        const timeSlot = validSlots[0];
        
        const course = createCourse({
          student: student,
          teacher: teacher,
          subject: student.subject,
          timeSlot: timeSlot,
          isRecurring: this.shouldBeRecurring(student.constraints.frequency),
          recurrencePattern: 'weekly'
        });

        return {
          success: true,
          course: course
        };
      } else {
        failureReasons.push(`与教师${teacher.name}没有共同时间段`);
      }
    }

    // Construct detailed failure reason
    let reason = '没有找到满足所有约束的时间槽';
    if (failureReasons.length > 0) {
      reason += ': ' + failureReasons.slice(0, 3).join('; ');
      if (failureReasons.length > 3) {
        reason += ` (还有${failureReasons.length - 3}个原因)`;
      }
    }

    return {
      success: false,
      reason: reason
    };
  }

  /**
   * Find teachers who can teach the subject
   * 找到可以教授该科目的教师
   */
  findEligibleTeachers(subject, teacherAvailability) {
    return Object.values(teacherAvailability)
      .filter(info => info.teacher.subjects.includes(subject))
      .sort((a, b) => {
        // Sort by least hours used first (load balancing)
        return a.hoursUsed - b.hoursUsed;
      });
  }

  /**
   * Find valid time slots for a student with a specific teacher
   * 为学生找到与特定教师的有效时间槽
   */
  findValidTimeSlots(student, teacherSlots, duration) {
    const validSlots = [];
    const studentRanges = student.constraints.allowedTimeRanges || [];

    for (const studentRange of studentRanges) {
      // Check if day is allowed
      if (!student.constraints.allowedDays.has(studentRange.day)) {
        continue;
      }

      for (const teacherSlot of teacherSlots) {
        // Check if there's overlap
        const overlap = findOverlap(studentRange, teacherSlot);
        
        if (!overlap) continue;

        // Check if overlap is long enough for the course
        const overlapDuration = overlap.endSlot - overlap.startSlot;
        if (overlapDuration < duration) continue;

        // Check against excluded time ranges
        const hasExclusion = this.hasExcludedTimeConflict(
          overlap,
          student.constraints.excludedTimeRanges || []
        );
        if (hasExclusion) continue;

        // Create time slot candidates within the overlap
        // Convert slot indices to time strings
        const minutesPerSlot = this.granularity.minutes;
        const startMinutes = overlap.startSlot * minutesPerSlot;
        const endMinutes = (overlap.startSlot + duration) * minutesPerSlot;
        
        const startHour = 9 + Math.floor(startMinutes / 60);
        const startMin = startMinutes % 60;
        const endHour = 9 + Math.floor(endMinutes / 60);
        const endMin = endMinutes % 60;
        
        const startTime = `${String(startHour).padStart(2, '0')}:${String(startMin).padStart(2, '0')}`;
        const endTime = `${String(endHour).padStart(2, '0')}:${String(endMin).padStart(2, '0')}`;
        
        validSlots.push({
          day: overlap.day,
          startSlot: overlap.startSlot,
          endSlot: overlap.startSlot + duration,
          duration: duration,
          start: startTime,
          end: endTime
        });
      }
    }

    return validSlots;
  }

  /**
   * Check if a time slot conflicts with excluded ranges
   * 检查时间槽是否与排除时间段冲突
   */
  hasExcludedTimeConflict(timeSlot, excludedRanges) {
    return excludedRanges.some(excluded => timeSlotsOverlap(timeSlot, excluded));
  }

  /**
   * Update teacher availability after assigning a course
   * 分配课程后更新教师可用时间
   */
  updateTeacherAvailability(availabilityMap, teacherId, assignedSlot) {
    const teacherInfo = availabilityMap[teacherId];
    if (!teacherInfo) return;
    
    // Validate assignedSlot parameter
    if (!assignedSlot || assignedSlot.day === undefined || assignedSlot.startSlot === undefined || assignedSlot.endSlot === undefined) {
      console.error('[Greedy.updateTeacherAvailability] Invalid assignedSlot:', assignedSlot);
      return;
    }

    // Remove the assigned time slot from available slots
    teacherInfo.availableSlots = teacherInfo.availableSlots
      .filter(slot => slot != null) // Filter out null/undefined slots
      .map(slot => {
        if (slot.day !== assignedSlot.day) return slot;
        
        const overlap = findOverlap(slot, assignedSlot);
        if (!overlap) return slot;

        // Split the slot if necessary
        const splitSlots = [];
        
        // Add time before the assigned slot
        if (slot.startSlot < assignedSlot.startSlot) {
          splitSlots.push({
            day: slot.day,
            startSlot: slot.startSlot,
            endSlot: assignedSlot.startSlot
          });
        }
        
        // Add time after the assigned slot
        if (slot.endSlot > assignedSlot.endSlot) {
          splitSlots.push({
            day: slot.day,
            startSlot: assignedSlot.endSlot,
            endSlot: slot.endSlot
          });
        }

        return splitSlots;
      })
      .flat()
      .filter(slot => slot != null && slot.endSlot > slot.startSlot);

    // Update hours used
    const hoursUsed = (assignedSlot.duration * this.granularity.minutes) / 60;
    teacherInfo.hoursUsed += hoursUsed;
  }

  /**
   * Determine if a course should be recurring based on frequency
   * 根据频率判断课程是否应该循环
   */
  shouldBeRecurring(frequency) {
    if (!frequency) return false;
    
    const match = frequency.match(/(\d+)次/);
    if (!match) return false;
    
    const timesPerWeek = parseInt(match[1]);
    return timesPerWeek > 0;
  }

  /**
   * Get scheduling statistics
   * 获取排课统计信息
   */
  getStats(results) {
    return {
      totalStudents: results.stats.totalStudents,
      scheduledStudents: results.stats.scheduledStudents,
      unscheduledStudents: results.stats.totalStudents - results.stats.scheduledStudents,
      successRate: results.stats.successRate.toFixed(1),
      executionTime: results.stats.executionTime,
      averageTimePerStudent: (results.stats.executionTime / results.stats.totalStudents).toFixed(2),
      conflictReasons: this.analyzeConflictReasons(results.conflicts)
    };
  }

  /**
   * Analyze conflict reasons
   * 分析冲突原因
   */
  analyzeConflictReasons(conflicts) {
    const reasons = {};
    
    conflicts.forEach(conflict => {
      const reason = conflict.reason;
      reasons[reason] = (reasons[reason] || 0) + 1;
    });

    return Object.entries(reasons)
      .map(([reason, count]) => ({ reason, count }))
      .sort((a, b) => b.count - a.count);
  }
}

/**
 * Factory function to create and run greedy scheduler
 * 工厂函数：创建并运行贪心调度器
 */
export function runGreedyScheduler(config) {
  const scheduler = new GreedyScheduler(config);
  return scheduler.schedule();
}
