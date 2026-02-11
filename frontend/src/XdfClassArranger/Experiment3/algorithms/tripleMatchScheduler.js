/**
 * Triple Match Scheduler - Experiment2
 * 三方匹配调度器
 * 
 * Matches students with teachers and classrooms
 * Based on Experiment's greedy algorithm
 */

import { 
  createCourse,
  deepClone,
  findOverlap,
  timeSlotsOverlap,
  slotToTime,
  formatTime
} from '../utils/dataStructures.js';

export class TripleMatchScheduler {
  constructor({ students, teachers, classrooms, granularity, onProgress }) {
    this.students = students || [];
    this.teachers = teachers || [];
    this.classrooms = classrooms || [];
    this.granularity = granularity;
    this.onProgress = onProgress || (() => {});
  }

  /**
   * Run the scheduling algorithm
   * 运行排课算法
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

    // Initialize resource availability
    const teacherAvailability = this.initializeAvailability(this.teachers);
    const classroomAvailability = this.initializeAvailability(this.classrooms);

    // Sort students by priority (fewer remaining hours = higher priority)
    const sortedStudents = [...this.students].sort((a, b) => 
      a.remainingHours - b.remainingHours
    );

    // Schedule each student
    sortedStudents.forEach((student, index) => {
      this.onProgress({
        current: index + 1,
        total: sortedStudents.length,
        message: `正在为 ${student.name} 排课...`
      });

      const result = this.scheduleStudent(
        student,
        teacherAvailability,
        classroomAvailability
      );

      results.stats.totalAttempts++;

      if (result.success) {
        results.courses.push(result.course);
        results.stats.scheduledStudents++;

        // Update resource availability
        this.updateAvailability(
          teacherAvailability,
          result.teacher.id,
          result.course.timeSlot
        );
        this.updateAvailability(
          classroomAvailability,
          result.classroom.id,
          result.course.timeSlot
        );
      } else {
        results.conflicts.push({
          student,
          reason: result.reason
        });
      }
    });

    // Calculate final statistics
    const endTime = Date.now();
    results.stats.executionTime = endTime - startTime;
    results.stats.successRate = (results.stats.scheduledStudents / results.stats.totalStudents) * 100;

    return results;
  }

  /**
   * Initialize resource availability map
   * 初始化资源可用性映射
   */
  initializeAvailability(resources) {
    const availability = {};
    
    resources.forEach(resource => {
      availability[resource.id] = {
        resource: resource,
        availableSlots: deepClone(resource.availableTimeSlots || []),
        hoursUsed: 0
      };
    });

    return availability;
  }

  /**
   * Schedule a single student
   * 为单个学生排课
   */
  scheduleStudent(student, teacherAvailability, classroomAvailability) {
    console.log(`[TripleMatch] 开始为学生排课:`, {
      name: student.name,
      subject: student.subject,
      campus: student.campus,
      frequency: student.frequency,
      schedulingMode: student.schedulingMode,
      isRecurringFixed: student.isRecurringFixed
    });
    
    // Check remaining hours
    if (student.remainingHours <= 0) {
      return {
        success: false,
        reason: '学生没有剩余课时'
      };
    }

    // Find eligible teachers
    const eligibleTeachers = this.findEligibleTeachers(
      student.subject,
      student.campus,
      teacherAvailability
    );

    console.log(`[TripleMatch] 找到符合条件的教师数量: ${eligibleTeachers.length}`);

    if (eligibleTeachers.length === 0) {
      return {
        success: false,
        reason: `没有教师可以在${student.campus}教授"${student.subject}"科目`
      };
    }

    // Try each teacher
    const failureReasons = [];
    for (const teacherInfo of eligibleTeachers) {
      const teacher = teacherInfo.resource;
      console.log(`[TripleMatch] 尝试教师: ${teacher.name}`);

      // Check teacher's weekly hours limit
      const hoursNeeded = (student.constraints.duration * this.granularity.minutes) / 60;
      if (teacherInfo.hoursUsed + hoursNeeded > teacher.maxHoursPerWeek) {
        failureReasons.push(`教师${teacher.name}已达周课时上限`);
        continue;
      }

      // Find common time slots between student and teacher
      const commonSlots = this.findCommonTimeSlots(
        student,
        teacherInfo.availableSlots
      );

      console.log(`[TripleMatch] 与教师${teacher.name}的共同时间槽数量: ${commonSlots.length}`);

      if (commonSlots.length === 0) {
        failureReasons.push(`与教师${teacher.name}没有共同时间段`);
        console.log(`[TripleMatch] ❌ 与教师${teacher.name}没有共同时间段`);
        continue;
      }

      // 检查是否为灵活排课模式
      // V4 Schema > 旧字段
      const isFlexibleMode = student.scheduling?.frequencyConstraints?.schedulingMode === 'flexible'
        || student.schedulingMode === 'flexible' 
        || student.scheduling?.frequencyConstraints?.isRecurringFixed === false
        || student.isRecurringFixed === false;
      
      // 获取频率：V4 Schema > 旧字段
      const frequencyStr = student.scheduling?.frequencyConstraints?.frequency || student.frequency || '1次/周';
      const frequencyNum = parseInt(frequencyStr) || 1;
      
      console.log(`[TripleMatch] 排课模式检查:`, {
        isFlexibleMode,
        schedulingMode: student.schedulingMode,
        isRecurringFixed: student.isRecurringFixed,
        frequency: student.frequency,
        frequencyNum
      });
      
      // 灵活排课模式：尝试为每次课找不同的时间槽
      if (isFlexibleMode && frequencyNum > 1) {
        console.log(`[TripleMatch] ✅ 学生${student.name}使用灵活排课模式，需要安排${frequencyNum}次课`);
        
        const scheduledSlots = [];
        const usedDays = new Set();
        
        // 尝试为每次课找一个时间槽
        for (let i = 0; i < frequencyNum; i++) {
          let slotFound = false;
          console.log(`[TripleMatch] 尝试安排第${i + 1}/${frequencyNum}次课...`);
          
          for (const timeSlot of commonSlots) {
            // 避免同一天安排多次课
            if (usedDays.has(timeSlot.day)) {
              console.log(`[TripleMatch]   跳过时间槽（同一天）:`, timeSlot);
              continue;
            }
            
            // 检查这个时间槽是否已被使用
            const isSlotUsed = scheduledSlots.some(s => 
              s.day === timeSlot.day && 
              timeSlotsOverlap(s, timeSlot)
            );
            if (isSlotUsed) {
              console.log(`[TripleMatch]   跳过时间槽（已使用）:`, timeSlot);
              continue;
            }
            
            console.log(`[TripleMatch]   检查时间槽:`, timeSlot);
            
            // Find available classroom
            const classroomInfo = this.findAvailableClassroom(
              student.campus,
              timeSlot,
              classroomAvailability
            );

            if (classroomInfo) {
              console.log(`[TripleMatch]   ✅ 找到可用教室: ${classroomInfo.resource.name}`);
              scheduledSlots.push(timeSlot);
              usedDays.add(timeSlot.day);
              
              // 临时标记这个时间槽为已占用（防止重复使用）
              this.updateAvailability(
                teacherAvailability,
                teacher.id,
                timeSlot
              );
              this.updateAvailability(
                classroomAvailability,
                classroomInfo.resource.id,
                timeSlot
              );
              
              slotFound = true;
              break;
            } else {
              console.log(`[TripleMatch]   ❌ 该时间槽无可用教室`);
            }
          }
          
          if (!slotFound) {
            console.log(`[TripleMatch] ❌ 灵活排课：无法为第${i + 1}次课找到时间槽`);
            console.log(`[TripleMatch]    已安排: ${scheduledSlots.length}次，需要: ${frequencyNum}次`);
            // 回滚已占用的时间槽
            scheduledSlots.forEach(slot => {
              // 这里简化处理，实际应该恢复 availability
            });
            break;
          }
        }
        
        // 检查是否成功安排了所有课程
        if (scheduledSlots.length === frequencyNum) {
          console.log(`[TripleMatch] 灵活排课成功！为${student.name}安排了${scheduledSlots.length}个不同时间段`);
          
          // 创建第一个课程（代表整个系列）
          const course = createCourse({
            student: student,
            teacher: teacher,
            classroom: classroomAvailability[Object.keys(classroomAvailability)[0]].resource,
            subject: student.subject,
            timeSlot: scheduledSlots[0],
            isRecurring: false, // 灵活模式不是固定重复
            recurrencePattern: 'flexible',
            flexibleSlots: scheduledSlots, // 保存所有时间槽
            schedulingMode: 'flexible'
          });

          return {
            success: true,
            course: course,
            teacher: teacher,
            classroom: classroomAvailability[Object.keys(classroomAvailability)[0]].resource,
            flexibleSlots: scheduledSlots
          };
        } else {
          failureReasons.push(`灵活排课：只能安排${scheduledSlots.length}/${frequencyNum}次课`);
          continue; // 尝试下一个教师
        }
      } else {
        // 传统固定时间模式
        for (const timeSlot of commonSlots) {
          // Find available classroom
          const classroomInfo = this.findAvailableClassroom(
            student.campus,
            timeSlot,
            classroomAvailability
          );

          if (classroomInfo) {
            // Success! Found a complete match
            const course = createCourse({
              student: student,
              teacher: teacher,
              classroom: classroomInfo.resource,
              subject: student.subject,
              timeSlot: timeSlot,
              isRecurring: student.frequency !== '1次',
              recurrencePattern: 'weekly'
            });

            return {
              success: true,
              course: course,
              teacher: teacher,
              classroom: classroomInfo.resource
            };
          }
        }
      }
      
      failureReasons.push(`与教师${teacher.name}找到共同时间但无可用教室`);
    }

    // Construct detailed failure reason
    let reason = '无法找到满足所有条件的教师、教室和时间组合';
    if (failureReasons.length > 0) {
      reason += ': ' + failureReasons.slice(0, 3).join('; ');
      if (failureReasons.length > 3) {
        reason += ` (还有${failureReasons.length - 3}个原因)`;
      }
    }
    
    console.error(`[TripleMatch] ❌ 排课失败`, {
      studentName: student.name,
      studentSubject: student.subject,
      studentCampus: student.campus,
      studentSchedulingMode: student.schedulingMode,
      studentIsRecurringFixed: student.isRecurringFixed,
      studentFrequency: student.frequency,
      studentConstraints: student.constraints,
      studentScheduling: student.scheduling,
      eligibleTeachersCount: eligibleTeachers.length,
      failureReasonsCount: failureReasons.length,
      failureReasons: failureReasons,
      reason: reason
    });

    return {
      success: false,
      reason: reason,
      details: {
        failureReasons,
        eligibleTeachersCount: eligibleTeachers.length
      }
    };
  }

  /**
   * Find eligible teachers for a student
   * 查找符合条件的教师
   */
  findEligibleTeachers(subject, campus, teacherAvailability) {
    const allTeachers = Object.values(teacherAvailability);
    
    const eligible = allTeachers
      .filter(info => {
        const teacher = info.resource;
        
        // Must teach the subject
        if (!teacher.subjects || !Array.isArray(teacher.subjects)) {
          return false;
        }
        
        if (!teacher.subjects.includes(subject)) {
          return false;
        }
        
        // Must be available at the campus
        // Support both 'campus' and 'campuses' field names
        const teacherCampuses = teacher.campuses || teacher.campus || [];
        const campusArray = Array.isArray(teacherCampuses) ? teacherCampuses : [teacherCampuses];
        
        if (campusArray.length === 0) {
          return false;
        }
        
        if (!campusArray.includes(campus)) {
          return false;
        }
        
        return true;
      })
      .sort((a, b) => {
        // Sort by least hours used (load balancing)
        return a.hoursUsed - b.hoursUsed;
      });
    
    // Debug log only when no teachers found
    if (eligible.length === 0) {
      console.error(`[TripleMatch] ❌ 没有教师可以教授 "${subject}" 在 "${campus}"`);
    }
    
    return eligible;
  }

  /**
   * Find common time slots between student and teacher
   * 查找学生和教师的共同可用时间
   */
  findCommonTimeSlots(student, teacherSlots) {
    const validSlots = [];
    
    // 优先级：V4 Schema > constraints > parsedData
    let studentRanges = [];
    let allowedDaysSet = new Set([1,2,3,4,5]);
    
    // V4 Schema (最高优先级)
    if (student.scheduling?.timeConstraints) {
      studentRanges = student.scheduling.timeConstraints.allowedTimeRanges || [];
      allowedDaysSet = new Set(student.scheduling.timeConstraints.allowedDays || [1,2,3,4,5]);
      console.log(`[findCommonTimeSlots] ✅ 使用 V4 Schema (student.scheduling)`);
    }
    // 旧的constraints系统
    else if (student.constraints?.allowedTimeRanges && student.constraints.allowedTimeRanges.length > 0) {
      studentRanges = student.constraints.allowedTimeRanges;
      allowedDaysSet = student.constraints.allowedDays || new Set([1,2,3,4,5]);
      console.log(`[findCommonTimeSlots] ✅ 使用 student.constraints`);
    }
    // parsedData (AI解析结果)
    else if (student.parsedData?.allowedTimeRanges && student.parsedData.allowedTimeRanges.length > 0) {
      studentRanges = student.parsedData.allowedTimeRanges;
      allowedDaysSet = student.parsedData.allowedDays || [1,2,3,4,5];
      console.log(`[findCommonTimeSlots] ✅ 使用 student.parsedData`);
    } else {
      console.warn(`[findCommonTimeSlots] ⚠️ 学生 ${student.name} 没有时间约束！`);
    }
    
    // Duration: V4 Schema > constraints > student.duration
    const duration = student.scheduling?.frequencyConstraints?.duration / 10 
      || student.constraints?.duration 
      || student.duration 
      || 15;

    console.log(`[findCommonTimeSlots] 学生${student.name}时间约束:`, {
      source: student.constraints?.allowedTimeRanges ? 'constraints' : 'parsedData',
      studentRanges: studentRanges.length,
      studentRangesDetail: studentRanges,
      duration,
      allowedDays: Array.isArray(allowedDaysSet) ? allowedDaysSet : Array.from(allowedDaysSet),
      teacherSlotsCount: teacherSlots.length
    });

    for (const studentRange of studentRanges) {
      // Check if day is allowed
      const allowedDays = Array.isArray(allowedDaysSet) ? allowedDaysSet : Array.from(allowedDaysSet);
      
      // 如果 studentRange 没有 day 字段，为每个允许的天数创建范围
      const rangesWithDay = [];
      if (studentRange.day !== undefined && studentRange.day !== null) {
        if (!allowedDays.includes(studentRange.day)) {
          console.log(`[findCommonTimeSlots]   跳过范围（天数不允许）:`, studentRange);
          continue;
        }
        rangesWithDay.push(studentRange);
      } else {
        // 如果没有 day 字段，这个范围适用于所有允许的天数
        console.log(`[findCommonTimeSlots]   范围无 day 字段，扩展到所有允许的天数:`, studentRange);
        allowedDays.forEach(day => {
          rangesWithDay.push({
            day,
            startSlot: studentRange.start || studentRange.startSlot,
            endSlot: studentRange.end || studentRange.endSlot
          });
        });
      }
      
      // 对每个有 day 的范围进行匹配
      for (const rangeWithDay of rangesWithDay) {
        for (const teacherSlot of teacherSlots) {
          // Find overlap
          const overlap = findOverlap(rangeWithDay, teacherSlot);
          
          if (!overlap) {
            continue;
          }

          // Check if overlap is long enough
          const overlapDuration = overlap.endSlot - overlap.startSlot;
          
          if (overlapDuration < duration) {
            continue;
          }

          // Check against excluded ranges
          const hasExclusion = this.hasExcludedConflict(
            overlap,
            student.constraints?.excludedTimeRanges || []
          );
          if (hasExclusion) continue;

          // Create time slot with formatted times
          const minutesPerSlot = this.granularity.minutes;
          const startMinutes = overlap.startSlot * minutesPerSlot;
          const endMinutes = (overlap.startSlot + duration) * minutesPerSlot;
          
          const startHour = 9 + Math.floor(startMinutes / 60);
          const startMin = startMinutes % 60;
          const endHour = 9 + Math.floor(endMinutes / 60);
          const endMin = endMinutes % 60;
          
          validSlots.push({
            day: overlap.day,
            startSlot: overlap.startSlot,
            endSlot: overlap.startSlot + duration,
            duration: duration,
            start: formatTime(startHour, startMin),
            end: formatTime(endHour, endMin)
          });
        }
      }
    }

    return validSlots;
  }

  /**
   * Find available classroom for a time slot
   * 为时间槽查找可用教室
   */
  findAvailableClassroom(campus, timeSlot, classroomAvailability) {
    const eligibleClassrooms = Object.values(classroomAvailability)
      .filter(info => {
        const classroom = info.resource;
        
        // Must be at the same campus
        if (classroom.campus !== campus) {
          return false;
        }
        
        // Must have available slots at that time
        const hasAvailability = info.availableSlots.some(slot => {
          if (slot.day !== timeSlot.day) return false;
          
          // Check if classroom slot covers the needed time
          return slot.startSlot <= timeSlot.startSlot && 
                 slot.endSlot >= timeSlot.endSlot;
        });
        
        return hasAvailability;
      });

    // Return first available classroom
    return eligibleClassrooms.length > 0 ? eligibleClassrooms[0] : null;
  }

  /**
   * Check if time slot conflicts with excluded ranges
   * 检查是否与排除时间段冲突
   */
  hasExcludedConflict(timeSlot, excludedRanges) {
    return excludedRanges.some(excluded => timeSlotsOverlap(timeSlot, excluded));
  }

  /**
   * Update resource availability after assignment
   * 更新资源可用性
   */
  updateAvailability(availabilityMap, resourceId, assignedSlot) {
    const resourceInfo = availabilityMap[resourceId];
    if (!resourceInfo) return;
    
    // Validate assignedSlot parameter
    if (!assignedSlot || assignedSlot.day === undefined || assignedSlot.startSlot === undefined || assignedSlot.endSlot === undefined) {
      console.error('[TripleMatch.updateAvailability] Invalid assignedSlot:', assignedSlot);
      return;
    }

    // Remove the assigned time from available slots
    resourceInfo.availableSlots = resourceInfo.availableSlots
      .filter(slot => slot != null) // Filter out null/undefined slots
      .map(slot => {
        if (slot.day !== assignedSlot.day) return slot;
        
        const overlap = findOverlap(slot, assignedSlot);
        if (!overlap) return slot;

        // Split the slot if necessary
        const splitSlots = [];
        
        // Time before assigned slot
        if (slot.startSlot < assignedSlot.startSlot) {
          splitSlots.push({
            day: slot.day,
            startSlot: slot.startSlot,
            endSlot: assignedSlot.startSlot
          });
        }
        
        // Time after assigned slot
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
    resourceInfo.hoursUsed += hoursUsed;
  }
}

/**
 * Factory function to run the scheduler
 */
export function runTripleMatchScheduler(config) {
  const scheduler = new TripleMatchScheduler(config);
  return scheduler.schedule();
}
