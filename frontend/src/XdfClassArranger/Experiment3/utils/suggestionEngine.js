/**
 * 智能建议生成引擎
 * Suggestion Engine
 * 
 * 功能：
 * - 根据冲突类型生成针对性建议
 * - 查询可用时间槽、教师、教室
 * - 计算建议的置信度
 * - 提供一键应用建议的回调函数
 */

import {
  ConflictType,
  SuggestionType,
  createSuggestion
} from '../types/adjustmentTypes';
import { timeSlotsOverlap, timeToMinutes, slotToTime } from './dataStructures';

/**
 * 为冲突生成所有类型的建议
 * @param {EnhancedConflict} conflict - 增强的冲突对象
 * @param {Array} allStudents - 所有学生列表
 * @param {Array} allTeachers - 所有教师列表
 * @param {Array} allClassrooms - 所有教室列表
 * @param {Array} scheduledCourses - 已排课程列表
 * @returns {Array<Suggestion>} 建议列表
 */
export function generateSuggestions(conflict, allStudents, allTeachers, allClassrooms, scheduledCourses) {
  const suggestions = [];
  
  switch (conflict.conflictType) {
    case ConflictType.NO_TIME:
      suggestions.push(...generateTimeSlotSuggestions(conflict, allTeachers, scheduledCourses));
      break;
      
    case ConflictType.NO_TEACHER:
      suggestions.push(...generateTeacherSuggestions(conflict, allTeachers, scheduledCourses));
      break;
      
    case ConflictType.NO_SUBJECT:
      suggestions.push(...generateTeacherSubjectSuggestions(conflict, allTeachers));
      break;
      
    case ConflictType.NO_ROOM:
      suggestions.push(...generateRoomSuggestions(conflict, allClassrooms, scheduledCourses));
      break;
      
    case ConflictType.HOUR_LIMIT:
      suggestions.push(...generateConstraintRelaxSuggestions(conflict));
      break;
      
    case ConflictType.OTHER:
      // 对于其他类型，提供通用建议
      suggestions.push(...generateTimeSlotSuggestions(conflict, allTeachers, scheduledCourses));
      suggestions.push(...generateTeacherSuggestions(conflict, allTeachers, scheduledCourses));
      break;
  }
  
  // 按置信度降序排序
  return suggestions.sort((a, b) => b.confidence - a.confidence);
}

/**
 * 生成时间槽建议
 * @param {EnhancedConflict} conflict - 冲突对象
 * @param {Array} allTeachers - 所有教师列表
 * @param {Array} scheduledCourses - 已排课程列表
 * @returns {Array<Suggestion>} 时间槽建议列表
 */
function generateTimeSlotSuggestions(conflict, allTeachers, scheduledCourses) {
  const suggestions = [];
  const student = conflict.student;
  
  // 获取可教该学生科目的教师列表
  const eligibleTeachers = allTeachers.filter(teacher => 
    canTeacherTeachSubject(teacher, student.subject) &&
    canTeacherTeachAtCampus(teacher, student.campus)
  );
  
  if (eligibleTeachers.length === 0) {
    return suggestions;
  }
  
  // 分析学生的可用时间
  const studentAvailability = parseStudentAvailability(student);
  
  // 为每个符合条件的教师找共同空闲时间
  eligibleTeachers.forEach(teacher => {
    const teacherAvailability = parseTeacherAvailability(teacher);
    const commonSlots = findCommonTimeSlots(studentAvailability, teacherAvailability, scheduledCourses, student, teacher);
    
    commonSlots.forEach(slot => {
      const confidence = calculateTimeSlotConfidence(slot, student, teacher, scheduledCourses);
      
      suggestions.push(createSuggestion(
        SuggestionType.TIME,
        `${slot.dayName} ${slot.startTime}-${slot.endTime}`,
        `与教师 ${teacher.name} 的共同空闲时间`,
        confidence,
        {
          teacher,
          timeSlot: slot,
          student
        },
        (service) => applyTimeSlotSuggestion(service, conflict, teacher, slot)
      ));
    });
  });
  
  // 限制返回数量（前5个最高置信度）
  return suggestions.slice(0, 5);
}

/**
 * 生成教师建议
 * @param {EnhancedConflict} conflict - 冲突对象
 * @param {Array} allTeachers - 所有教师列表
 * @param {Array} scheduledCourses - 已排课程列表
 * @returns {Array<Suggestion>} 教师建议列表
 */
function generateTeacherSuggestions(conflict, allTeachers, scheduledCourses) {
  const suggestions = [];
  const student = conflict.student;
  
  // 找到可教该科目和校区的教师
  const eligibleTeachers = allTeachers.filter(teacher =>
    canTeacherTeachSubject(teacher, student.subject) &&
    canTeacherTeachAtCampus(teacher, student.campus)
  );
  
  eligibleTeachers.forEach(teacher => {
    // 计算该教师的工作负载
    const teacherLoad = calculateTeacherLoad(teacher, scheduledCourses);
    const availability = parseTeacherAvailability(teacher);
    
    // 计算置信度
    let confidence = 0.7; // 基础置信度
    
    // 如果教师工作负载低，提高置信度
    if (teacherLoad.usageRate < 0.5) {
      confidence += 0.2;
    } else if (teacherLoad.usageRate < 0.7) {
      confidence += 0.1;
    }
    
    // 如果教师有充足的可用时间，提高置信度
    if (availability.length > 10) {
      confidence += 0.1;
    }
    
    confidence = Math.min(confidence, 1.0);
    
    suggestions.push(createSuggestion(
      SuggestionType.TEACHER,
      `推荐教师：${teacher.name}`,
      `工作负载：${Math.round(teacherLoad.usageRate * 100)}%，可用时间槽：${availability.length}`,
      confidence,
      {
        teacher,
        teacherLoad,
        availability
      },
      (service) => applyTeacherSuggestion(service, conflict, teacher)
    ));
  });
  
  // 按置信度排序，返回前3个
  return suggestions.sort((a, b) => b.confidence - a.confidence).slice(0, 3);
}

/**
 * 生成教师科目匹配建议
 * @param {EnhancedConflict} conflict - 冲突对象
 * @param {Array} allTeachers - 所有教师列表
 * @returns {Array<Suggestion>} 建议列表
 */
function generateTeacherSubjectSuggestions(conflict, allTeachers) {
  const suggestions = [];
  const student = conflict.student;
  
  // 找到在该校区的所有教师
  const campusTeachers = allTeachers.filter(teacher =>
    canTeacherTeachAtCampus(teacher, student.campus)
  );
  
  if (campusTeachers.length > 0) {
    // 建议1：修改学生科目以匹配可用教师
    const teacherSubjects = new Set();
    campusTeachers.forEach(teacher => {
      if (teacher.subjects) {
        teacher.subjects.forEach(subject => teacherSubjects.add(subject));
      }
    });
    
    Array.from(teacherSubjects).forEach(subject => {
      suggestions.push(createSuggestion(
        SuggestionType.CONSTRAINT,
        `修改学生科目为：${subject}`,
        `该校区有 ${campusTeachers.filter(t => canTeacherTeachSubject(t, subject)).length} 位教师可教此科目`,
        0.6,
        {
          newSubject: subject,
          availableTeachers: campusTeachers.filter(t => canTeacherTeachSubject(t, subject)).length
        },
        (service) => applySubjectChangeSuggestion(service, conflict, subject)
      ));
    });
  }
  
  // 建议2：为现有教师添加科目
  campusTeachers.forEach(teacher => {
    suggestions.push(createSuggestion(
      SuggestionType.TEACHER,
      `为教师 ${teacher.name} 添加科目：${student.subject}`,
      `扩展教师的授课范围`,
      0.5,
      {
        teacher,
        newSubject: student.subject
      },
      (service) => applyAddSubjectToTeacherSuggestion(service, conflict, teacher, student.subject)
    ));
  });
  
  return suggestions.slice(0, 5);
}

/**
 * 生成教室建议
 * @param {EnhancedConflict} conflict - 冲突对象
 * @param {Array} allClassrooms - 所有教室列表
 * @param {Array} scheduledCourses - 已排课程列表
 * @returns {Array<Suggestion>} 教室建议列表
 */
function generateRoomSuggestions(conflict, allClassrooms, scheduledCourses) {
  const suggestions = [];
  const student = conflict.student;
  
  // 筛选同校区的教室
  const campusRooms = allClassrooms.filter(room => room.campus === student.campus);
  
  campusRooms.forEach(room => {
    // 计算教室使用率
    const roomUsage = calculateRoomUsage(room, scheduledCourses);
    
    let confidence = 0.8;
    
    // 使用率越低，置信度越高
    if (roomUsage.usageRate < 0.3) {
      confidence = 0.95;
    } else if (roomUsage.usageRate < 0.6) {
      confidence = 0.85;
    } else {
      confidence = 0.7;
    }
    
    suggestions.push(createSuggestion(
      SuggestionType.ROOM,
      `推荐教室：${room.name}`,
      `使用率：${Math.round(roomUsage.usageRate * 100)}%，可用时间槽多`,
      confidence,
      {
        room,
        roomUsage
      },
      (service) => applyRoomSuggestion(service, conflict, room)
    ));
  });
  
  return suggestions.sort((a, b) => b.confidence - a.confidence).slice(0, 3);
}

/**
 * 生成约束放宽建议
 * @param {EnhancedConflict} conflict - 冲突对象
 * @returns {Array<Suggestion>} 约束建议列表
 */
function generateConstraintRelaxSuggestions(conflict) {
  const suggestions = [];
  const student = conflict.student;
  
  // 建议1：增加教师周课时上限
  if (conflict.reason.includes('周课时') || conflict.reason.includes('课时上限')) {
    suggestions.push(createSuggestion(
      SuggestionType.CONSTRAINT,
      '增加教师周课时上限',
      '允许教师承担更多课时',
      0.7,
      {
        action: 'increase_teacher_hours',
        suggestedIncrease: 5
      },
      (service) => applyIncreaseTeacherHoursSuggestion(service, conflict)
    ));
  }
  
  // 建议2：放宽学生时间约束
  suggestions.push(createSuggestion(
    SuggestionType.CONSTRAINT,
    '放宽学生时间约束',
    '扩大学生可用时间范围',
    0.6,
    {
      action: 'relax_time_constraint',
      suggestion: '增加可用时间段或天数'
    },
    (service) => applyRelaxTimeConstraintSuggestion(service, conflict)
  ));
  
  // 建议3：减少学生课时需求
  if (student.courseHours && parseInt(student.courseHours) > 10) {
    suggestions.push(createSuggestion(
      SuggestionType.CONSTRAINT,
      '调整学生课时需求',
      `当前需求：${student.courseHours}课时，建议分批安排`,
      0.5,
      {
        action: 'reduce_course_hours',
        currentHours: student.courseHours
      },
      (service) => applyReduceCourseHoursSuggestion(service, conflict)
    ));
  }
  
  return suggestions;
}

// ========== 辅助函数 ==========

/**
 * 检查教师是否能教授指定科目
 */
function canTeacherTeachSubject(teacher, subject) {
  if (!subject || !teacher.subjects) return false;
  return teacher.subjects.includes(subject);
}

/**
 * 检查教师是否能在指定校区授课
 */
function canTeacherTeachAtCampus(teacher, campus) {
  if (!campus) return true;
  const teacherCampuses = teacher.campuses || teacher.campus || [];
  const campusArray = Array.isArray(teacherCampuses) ? teacherCampuses : [teacherCampuses];
  return campusArray.includes(campus);
}

/**
 * 解析学生可用时间
 */
function parseStudentAvailability(student) {
  // 简化实现：返回学生的可用时间槽
  // 实际应调用 availabilityCalculator
  if (student.parsedData?.allowedTimeRanges) {
    return student.parsedData.allowedTimeRanges;
  }
  
  // 默认：周一到周五 9:00-21:00
  const defaultSlots = [];
  for (let day = 1; day <= 5; day++) {
    defaultSlots.push({
      day,
      dayName: ['', '周一', '周二', '周三', '周四', '周五'][day],
      startTime: '09:00',
      endTime: '21:00',
      startSlot: 0,
      endSlot: 144
    });
  }
  return defaultSlots;
}

/**
 * 解析教师可用时间
 */
function parseTeacherAvailability(teacher) {
  if (teacher.availability?.slots) {
    return teacher.availability.slots.map(slot => ({
      day: slot.dayOfWeek || slot.day,
      dayName: ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][slot.dayOfWeek || slot.day],
      startTime: slot.startTime,
      endTime: slot.endTime,
      startSlot: slot.startSlot,
      endSlot: slot.endSlot
    }));
  }
  
  return [];
}

/**
 * 找到学生和教师的共同空闲时间槽
 */
function findCommonTimeSlots(studentSlots, teacherSlots, scheduledCourses, student, teacher) {
  const commonSlots = [];
  
  studentSlots.forEach(studentSlot => {
    teacherSlots.forEach(teacherSlot => {
      // 同一天
      if (studentSlot.day === teacherSlot.day) {
        // 计算重叠部分
        const startMinutes = Math.max(
          timeToMinutes(studentSlot.startTime),
          timeToMinutes(teacherSlot.startTime)
        );
        const endMinutes = Math.min(
          timeToMinutes(studentSlot.endTime),
          timeToMinutes(teacherSlot.endTime)
        );
        
        if (endMinutes > startMinutes && (endMinutes - startMinutes) >= 60) {
          // 至少1小时的重叠
          commonSlots.push({
            day: studentSlot.day,
            dayName: studentSlot.dayName,
            startTime: minutesToTime(startMinutes),
            endTime: minutesToTime(endMinutes),
            duration: endMinutes - startMinutes
          });
        }
      }
    });
  });
  
  return commonSlots;
}

/**
 * 计算时间槽建议的置信度
 */
function calculateTimeSlotConfidence(slot, student, teacher, scheduledCourses) {
  let confidence = 0.7; // 基础置信度
  
  // 时长越长，置信度越高
  if (slot.duration >= 120) {
    confidence += 0.15;
  } else if (slot.duration >= 90) {
    confidence += 0.1;
  }
  
  // 检查该时间段是否已有冲突
  const hasConflict = scheduledCourses.some(course => {
    if (course.day !== slot.day) return false;
    return timeSlotsOverlap(
      { startTime: course.startTime, endTime: course.endTime },
      { startTime: slot.startTime, endTime: slot.endTime }
    );
  });
  
  if (!hasConflict) {
    confidence += 0.1;
  }
  
  return Math.min(confidence, 1.0);
}

/**
 * 计算教师工作负载
 */
function calculateTeacherLoad(teacher, scheduledCourses) {
  const teacherCourses = scheduledCourses.filter(c => c.teacherId === teacher.id);
  const totalHours = teacherCourses.reduce((sum, c) => {
    const duration = (timeToMinutes(c.endTime) - timeToMinutes(c.startTime)) / 60;
    return sum + duration;
  }, 0);
  
  const maxHours = teacher.maxHoursPerWeek || 40;
  
  return {
    totalHours,
    maxHours,
    usageRate: totalHours / maxHours,
    courseCount: teacherCourses.length
  };
}

/**
 * 计算教室使用率
 */
function calculateRoomUsage(room, scheduledCourses) {
  const roomCourses = scheduledCourses.filter(c => c.classroomId === room.id);
  
  return {
    courseCount: roomCourses.length,
    usageRate: roomCourses.length / 50 // 假设50为满负荷
  };
}

/**
 * 分钟转时间字符串
 */
function minutesToTime(minutes) {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
}

// ========== 应用建议的回调函数 ==========

function applyTimeSlotSuggestion(service, conflict, teacher, timeSlot) {
  // 应用时间槽建议的逻辑
  console.log('[SuggestionEngine] Apply time slot suggestion:', { conflict, teacher, timeSlot });
  // 实际实现将在 service 中处理
}

function applyTeacherSuggestion(service, conflict, teacher) {
  console.log('[SuggestionEngine] Apply teacher suggestion:', { conflict, teacher });
}

function applySubjectChangeSuggestion(service, conflict, newSubject) {
  console.log('[SuggestionEngine] Apply subject change:', { conflict, newSubject });
}

function applyAddSubjectToTeacherSuggestion(service, conflict, teacher, newSubject) {
  console.log('[SuggestionEngine] Apply add subject to teacher:', { conflict, teacher, newSubject });
}

function applyRoomSuggestion(service, conflict, room) {
  console.log('[SuggestionEngine] Apply room suggestion:', { conflict, room });
}

function applyIncreaseTeacherHoursSuggestion(service, conflict) {
  console.log('[SuggestionEngine] Apply increase teacher hours:', { conflict });
}

function applyRelaxTimeConstraintSuggestion(service, conflict) {
  console.log('[SuggestionEngine] Apply relax time constraint:', { conflict });
}

function applyReduceCourseHoursSuggestion(service, conflict) {
  console.log('[SuggestionEngine] Apply reduce course hours:', { conflict });
}
