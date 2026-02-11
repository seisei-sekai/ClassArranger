/**
 * 测试数据工厂 - Ground Truth Test Data Factory
 * 
 * 提供创建deterministic测试数据的工具函数
 */

// 时间槽系统常量
const TIME_GRANULARITY = 5; // 5分钟/槽
const STANDARD_START = 9; // 9:00
const SLOTS_PER_HOUR = 12; // 每小时12个槽

/**
 * 时间字符串转槽位
 * @param {string} timeStr - 如 "13:30"
 * @returns {number} 槽位索引 (0-149)
 */
export function timeToSlot(timeStr) {
  const [hourStr, minStr = '0'] = timeStr.split(':');
  const hour = parseInt(hourStr);
  const minute = parseInt(minStr);
  return Math.floor((hour - STANDARD_START) * SLOTS_PER_HOUR + minute / TIME_GRANULARITY);
}

/**
 * 槽位转时间字符串
 * @param {number} slot - 槽位索引 (0-149)
 * @returns {string} 时间字符串 "HH:MM"
 */
export function slotToTime(slot) {
  const totalMinutes = slot * TIME_GRANULARITY + (STANDARD_START * 60);
  const hour = Math.floor(totalMinutes / 60);
  const minute = totalMinutes % 60;
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

/**
 * 创建时间范围
 * @param {number} day - 星期 (0-6)
 * @param {string} startTime - 开始时间 "HH:MM"
 * @param {string} endTime - 结束时间 "HH:MM"
 * @returns {object} { day, startSlot, endSlot }
 */
export function createTimeRange(day, startTime, endTime) {
  return {
    day,
    startSlot: timeToSlot(startTime),
    endSlot: timeToSlot(endTime)
  };
}

/**
 * 创建V4格式学生
 */
export function createStudent(config = {}) {
  const {
    name = '测试学生',
    campus = '新宿校区',
    subject = '数学',
    manager = '李老师',
    batch = '2026春季',
    level = 'N1',
    
    // 课时
    totalHours = 20,
    usedHours = 0,
    timesPerWeek = 1,
    hoursPerClass = 2,
    
    // 时间约束
    allowedDays = [1, 2, 3, 4, 5],
    allowedTimeRanges = [
      { day: 1, start: '13:00', end: '18:00' }
    ],
    excludedTimeRanges = [],
    
    // 频率约束
    frequency = '1次/周',
    duration = 120, // 分钟
    schedulingMode = 'fixed',
    isRecurringFixed = true,
    
    // 模式约束
    mode = 'offline',
    preferredTeachers = [],
    
    // UI
    selected = false,
    color = '#FF6B6B'
  } = config;
  
  // 处理allowedTimeRanges（支持字符串时间输入）
  const processedTimeRanges = allowedTimeRanges.map(range => {
    if (typeof range.start === 'string') {
      return createTimeRange(range.day, range.start, range.end);
    }
    return range;
  });
  
  const processedExcludedRanges = excludedTimeRanges.map(range => {
    if (typeof range.start === 'string') {
      return createTimeRange(range.day, range.start, range.end);
    }
    return range;
  });
  
  const weekly = timesPerWeek * hoursPerClass;
  const remaining = totalHours - usedHours;
  
  return {
    _id: `student_test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    _version: 4,
    _createdAt: new Date(),
    _updatedAt: new Date(),
    
    name,
    campus,
    manager,
    batch,
    subject,
    level,
    
    courseHours: {
      total: totalHours,
      used: usedHours,
      remaining,
      weekly,
      timesPerWeek,
      hoursPerClass
    },
    
    scheduling: {
      timeConstraints: {
        allowedDays,
        allowedTimeRanges: processedTimeRanges,
        excludedTimeRanges: processedExcludedRanges
      },
      frequencyConstraints: {
        frequency,
        duration,
        isRecurringFixed,
        schedulingMode
      },
      teacherConstraints: {
        preferredTeachers,
        excludedTeachers: []
      },
      modeConstraints: {
        mode,
        preferredClassrooms: []
      }
    },
    
    _raw: {
      excelData: `${campus}\t${manager}\t${name}\t${batch}\t...\t${frequency}\t${duration}分钟\t${mode}\t${subject}\t${level}`,
      aiParsingResult: null,
      originalConstraints: null
    },
    
    _ui: {
      selected,
      showAvailability: false,
      color
    }
  };
}

/**
 * 创建V4格式教师
 */
export function createTeacher(config = {}) {
  const {
    name = '测试教师',
    level = 'S级',
    subject = '数学',
    major = '数学教育',
    
    // 教学能力
    subjects = ['数学'],
    campuses = ['新宿校区'],
    modes = ['offline'],
    hourlyRate = 500,
    maxHoursPerWeek = 40,
    
    // 可用性
    availableTimeSlots = [
      { day: 1, start: '9:00', end: '21:30' },
      { day: 2, start: '9:00', end: '21:30' },
      { day: 3, start: '9:00', end: '21:30' },
      { day: 4, start: '9:00', end: '21:30' },
      { day: 5, start: '9:00', end: '21:30' }
    ],
    
    color = '#3498db'
  } = config;
  
  // 处理可用时间槽
  const processedTimeSlots = availableTimeSlots.map(slot => {
    if (typeof slot.start === 'string') {
      return createTimeRange(slot.day, slot.start, slot.end);
    }
    return slot;
  });
  
  return {
    _id: `teacher_test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    _version: 4,
    _createdAt: new Date(),
    _updatedAt: new Date(),
    
    name,
    level,
    subject,
    major,
    
    teaching: {
      subjects,
      campuses,
      modes,
      hourlyRate,
      maxHoursPerWeek
    },
    
    availability: {
      timeSlots: processedTimeSlots
    },
    
    _raw: {
      excelData: `${level}\t${name}\t...\t${subjects.join(',')}\t${campuses.join(',')}`,
      availabilityText: availableTimeSlots.map(s => 
        `周${['日', '一', '二', '三', '四', '五', '六'][s.day]} ${s.start}-${s.end}`
      ).join(', ')
    },
    
    _ui: {
      showAvailability: false,
      color
    }
  };
}

/**
 * 创建V4格式教室
 */
export function createClassroom(config = {}) {
  const {
    name = '1v1教室A',
    campus = '新宿校区',
    area = 'A区',
    type = '1v1教室',
    capacity = 2,
    priority = 5,
    
    // 可用性 - 默认全时段可用
    availableTimeSlots = [
      { day: 1, start: '9:00', end: '21:30' },
      { day: 2, start: '9:00', end: '21:30' },
      { day: 3, start: '9:00', end: '21:30' },
      { day: 4, start: '9:00', end: '21:30' },
      { day: 5, start: '9:00', end: '21:30' }
    ]
  } = config;
  
  const processedTimeSlots = availableTimeSlots.map(slot => {
    if (typeof slot.start === 'string') {
      return createTimeRange(slot.day, slot.start, slot.end);
    }
    return slot;
  });
  
  return {
    _id: `classroom_test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    _version: 4,
    _createdAt: new Date(),
    _updatedAt: new Date(),
    
    name,
    campus,
    area,
    type,
    capacity,
    priority,
    
    availability: {
      timeSlots: processedTimeSlots
    },
    
    _raw: {
      excelData: `${campus}\t${area}\t${name}\t${type}\t${capacity}`
    }
  };
}

/**
 * 创建带旧格式兼容的学生（用于测试向后兼容）
 */
export function createLegacyStudent(config = {}) {
  const v4Student = createStudent(config);
  
  // 添加旧格式字段
  return {
    ...v4Student,
    id: v4Student._id,
    
    // 旧格式约束
    constraints: {
      allowedDays: new Set(v4Student.scheduling.timeConstraints.allowedDays),
      allowedTimeRanges: v4Student.scheduling.timeConstraints.allowedTimeRanges,
      excludedTimeRanges: v4Student.scheduling.timeConstraints.excludedTimeRanges,
      duration: v4Student.scheduling.frequencyConstraints.duration / 5, // 分钟转为5分钟槽数
      frequency: v4Student.scheduling.frequencyConstraints.frequency
    },
    
    // parsedData
    parsedData: {
      allowedDays: v4Student.scheduling.timeConstraints.allowedDays,
      allowedTimeRanges: v4Student.scheduling.timeConstraints.allowedTimeRanges.map(r => ({
        day: r.day,
        start: r.startSlot,
        end: r.endSlot
      })),
      excludedTimeRanges: v4Student.scheduling.timeConstraints.excludedTimeRanges.map(r => ({
        day: r.day,
        start: r.startSlot,
        end: r.endSlot
      }))
    },
    
    // 顶级字段
    frequency: v4Student.scheduling.frequencyConstraints.frequency,
    duration: `${v4Student.scheduling.frequencyConstraints.duration / 60}小时`,
    mode: v4Student.scheduling.modeConstraints.mode,
    schedulingMode: v4Student.scheduling.frequencyConstraints.schedulingMode,
    isRecurringFixed: v4Student.scheduling.frequencyConstraints.isRecurringFixed,
    preferredTeacher: v4Student.scheduling.teacherConstraints.preferredTeachers[0] || null,
    
    // courseHours (algorithmAdapter期望的格式)
    courseHours: {
      totalHours: v4Student.courseHours.total,
      remainingHours: v4Student.courseHours.remaining,
      weekly: v4Student.courseHours.weekly,
      timesPerWeek: v4Student.courseHours.timesPerWeek,
      hoursPerClass: v4Student.courseHours.hoursPerClass
    },
    
    rawData: {
      学生姓名: v4Student.name,
      校区: v4Student.campus,
      学管姓名: v4Student.manager,
      学生批次: v4Student.batch,
      内容: v4Student.subject,
      频次: v4Student.scheduling.frequencyConstraints.frequency,
      时长: `${v4Student.scheduling.frequencyConstraints.duration}分钟`,
      形式: v4Student.scheduling.modeConstraints.mode
    },
    
    selected: v4Student._ui.selected,
    showAvailability: v4Student._ui.showAvailability,
    color: v4Student._ui.color,
    
    remainingHours: v4Student.courseHours.remaining
  };
}

/**
 * 创建带旧格式兼容的教师
 */
export function createLegacyTeacher(config = {}) {
  const v4Teacher = createTeacher(config);
  
  // 转换timeSlots格式: {day, startSlot, endSlot} -> {dayOfWeek, startTime, endTime}
  const convertedSlots = v4Teacher.availability.timeSlots.map(slot => ({
    dayOfWeek: slot.day,
    startTime: slotToTime(slot.startSlot),
    endTime: slotToTime(slot.endSlot)
  }));
  
  return {
    ...v4Teacher,
    id: v4Teacher._id,
    
    subjects: v4Teacher.teaching.subjects,
    campuses: v4Teacher.teaching.campuses,
    campus: v4Teacher.teaching.campuses[0],
    modes: v4Teacher.teaching.modes,
    hourlyRate: v4Teacher.teaching.hourlyRate,
    maxHoursPerWeek: v4Teacher.teaching.maxHoursPerWeek,
    
    availableTimeSlots: v4Teacher.availability.timeSlots,
    availability: {
      slots: convertedSlots
    },
    
    rawData: v4Teacher._raw.excelData,
    availabilityText: v4Teacher._raw.availabilityText,
    showAvailability: v4Teacher._ui.showAvailability,
    color: v4Teacher._ui.color
  };
}

/**
 * 创建带旧格式兼容的教室
 */
export function createLegacyClassroom(config = {}) {
  const v4Classroom = createClassroom(config);
  
  return {
    ...v4Classroom,
    id: v4Classroom._id,
    
    availableTimeRanges: v4Classroom.availability.timeSlots,
    rawData: v4Classroom._raw.excelData
  };
}

/**
 * 解析频率字符串
 * @param {string} frequency - 如 "2次/周"
 * @returns {number} 次数
 */
export function parseFrequency(frequency) {
  const match = frequency.match(/(\d+)次/);
  return match ? parseInt(match[1]) : 1;
}

/**
 * 解析时长字符串
 * @param {string} duration - 如 "2小时" 或 "1.5小时"
 * @returns {number} 分钟数
 */
export function parseDurationToMinutes(duration) {
  if (typeof duration === 'number') return duration;
  const match = duration.match(/(\d+\.?\d*)/);
  return match ? parseFloat(match[1]) * 60 : 120;
}

/**
 * 创建完整的测试场景
 */
export function createTestScenario(config) {
  const {
    studentConfig = {},
    teacherConfigs = [{}],
    classroomConfigs = [{}],
    useLegacyFormat = false
  } = config;
  
  const createFn = useLegacyFormat ? {
    student: createLegacyStudent,
    teacher: createLegacyTeacher,
    classroom: createLegacyClassroom
  } : {
    student: createStudent,
    teacher: createTeacher,
    classroom: createClassroom
  };
  
  return {
    student: createFn.student(studentConfig),
    teachers: teacherConfigs.map(cfg => createFn.teacher(cfg)),
    classrooms: classroomConfigs.map(cfg => createFn.classroom(cfg))
  };
}

/**
 * 预定义的时间范围模板
 */
export const TIME_RANGE_TEMPLATES = {
  // 工作日上午
  weekdayMorning: (day) => createTimeRange(day, '9:00', '12:00'),
  
  // 工作日下午
  weekdayAfternoon: (day) => createTimeRange(day, '13:00', '18:00'),
  
  // 工作日晚上
  weekdayEvening: (day) => createTimeRange(day, '18:00', '21:00'),
  
  // 全天
  fullDay: (day) => createTimeRange(day, '9:00', '21:30'),
  
  // 上午+下午
  morningAndAfternoon: (day) => createTimeRange(day, '9:00', '18:00'),
  
  // 下午+晚上
  afternoonAndEvening: (day) => createTimeRange(day, '13:00', '21:00')
};

/**
 * 创建工作日全天可用的时间范围
 */
export function createWeekdayFullTime() {
  return [1, 2, 3, 4, 5].map(day => TIME_RANGE_TEMPLATES.fullDay(day));
}

/**
 * 创建全周全天可用的时间范围
 */
export function createFullWeekFullTime() {
  return [0, 1, 2, 3, 4, 5, 6].map(day => TIME_RANGE_TEMPLATES.fullDay(day));
}

/**
 * 验证学生数据完整性
 */
export function validateStudentData(student) {
  const errors = [];
  
  // V4 Schema检查
  if (!student.scheduling) {
    errors.push('缺少 scheduling 字段');
  } else {
    if (!student.scheduling.timeConstraints) {
      errors.push('缺少 scheduling.timeConstraints');
    }
    if (!student.scheduling.frequencyConstraints) {
      errors.push('缺少 scheduling.frequencyConstraints');
    }
  }
  
  // 时间槽范围检查
  if (student.scheduling?.timeConstraints?.allowedTimeRanges) {
    student.scheduling.timeConstraints.allowedTimeRanges.forEach((range, idx) => {
      if (range.day === undefined || range.day === null) {
        errors.push(`allowedTimeRanges[${idx}] 缺少 day 字段`);
      }
      if (range.startSlot === undefined || range.startSlot < 0 || range.startSlot >= 150) {
        errors.push(`allowedTimeRanges[${idx}] startSlot 超出范围 (0-149): ${range.startSlot}`);
      }
      if (range.endSlot === undefined || range.endSlot < 0 || range.endSlot > 150) {
        errors.push(`allowedTimeRanges[${idx}] endSlot 超出范围 (0-149): ${range.endSlot}`);
      }
      if (range.startSlot >= range.endSlot) {
        errors.push(`allowedTimeRanges[${idx}] startSlot >= endSlot`);
      }
    });
  }
  
  // Duration检查
  const duration = student.scheduling?.frequencyConstraints?.duration;
  if (duration && (duration < 30 || duration > 300)) {
    errors.push(`duration 超出合理范围 (30-300分钟): ${duration}`);
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * 验证同步完整性（V4 ↔ 旧格式）
 */
export function validateSync(student) {
  const errors = [];
  
  if (!student.scheduling) {
    errors.push('V4格式：缺少 scheduling');
    return { valid: false, errors };
  }
  
  // 验证 V4 → 旧格式同步
  if (student.parsedData) {
    // allowedDays
    const v4Days = student.scheduling.timeConstraints.allowedDays;
    const parsedDays = student.parsedData.allowedDays;
    if (JSON.stringify(v4Days) !== JSON.stringify(parsedDays)) {
      errors.push(`allowedDays 不同步: V4=[${v4Days}], parsedData=[${parsedDays}]`);
    }
    
    // allowedTimeRanges
    const v4Ranges = student.scheduling.timeConstraints.allowedTimeRanges;
    const parsedRanges = student.parsedData.allowedTimeRanges;
    
    if (v4Ranges.length !== parsedRanges.length) {
      errors.push(`allowedTimeRanges 数量不同步: V4=${v4Ranges.length}, parsedData=${parsedRanges.length}`);
    } else {
      v4Ranges.forEach((v4Range, idx) => {
        const parsedRange = parsedRanges[idx];
        if (v4Range.day !== parsedRange.day) {
          errors.push(`Range[${idx}] day 不同步: V4=${v4Range.day}, parsedData=${parsedRange.day}`);
        }
        if (v4Range.startSlot !== parsedRange.start) {
          errors.push(`Range[${idx}] start 不同步: V4.startSlot=${v4Range.startSlot}, parsedData.start=${parsedRange.start}`);
        }
        if (v4Range.endSlot !== parsedRange.end) {
          errors.push(`Range[${idx}] end 不同步: V4.endSlot=${v4Range.endSlot}, parsedData.end=${parsedRange.end}`);
        }
      });
    }
  }
  
  // 验证 constraints
  if (student.constraints) {
    const v4Days = student.scheduling.timeConstraints.allowedDays;
    const constraintDays = Array.from(student.constraints.allowedDays || []);
    
    if (JSON.stringify(v4Days.sort()) !== JSON.stringify(constraintDays.sort())) {
      errors.push(`constraints.allowedDays 不同步`);
    }
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * 深度克隆对象（避免引用问题）
 */
export function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj, (key, value) => {
    // 处理Set
    if (value instanceof Set) {
      return Array.from(value);
    }
    // 处理Date
    if (value instanceof Date) {
      return value.toISOString();
    }
    return value;
  }));
}

/**
 * 比较两个对象是否相等（忽略某些字段）
 */
export function deepEqual(obj1, obj2, ignoreFields = ['_id', '_createdAt', '_updatedAt', 'color']) {
  const clone1 = deepClone(obj1);
  const clone2 = deepClone(obj2);
  
  // 移除忽略字段
  ignoreFields.forEach(field => {
    delete clone1[field];
    delete clone2[field];
  });
  
  return JSON.stringify(clone1) === JSON.stringify(clone2);
}

export default {
  timeToSlot,
  slotToTime,
  createTimeRange,
  createStudent,
  createTeacher,
  createClassroom,
  createLegacyStudent,
  createLegacyTeacher,
  createLegacyClassroom,
  createTestScenario,
  parseFrequency,
  parseDurationToMinutes,
  validateStudentData,
  validateSync,
  deepClone,
  deepEqual,
  TIME_RANGE_TEMPLATES,
  createWeekdayFullTime,
  createFullWeekFullTime
};
