/**
 * Data Structure Definitions for 1v1 Scheduling System
 * 1v1排课系统数据结构定义
 */

/**
 * Time granularity settings
 * 时间粒度设置
 */
export const TIME_GRANULARITY = {
  FIVE_MIN: {
    minutes: 5,
    slotsPerHour: 12,
    slotsPerDay: 150, // 9:00-21:30 = 12.5 hours * 12 slots
    label: '5分钟'
  },
  FIFTEEN_MIN: {
    minutes: 15,
    slotsPerHour: 4,
    slotsPerDay: 50, // 9:00-21:30 = 12.5 hours * 4 slots
    label: '15分钟'
  }
};

/**
 * Days of week (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
 * 星期枚举
 */
export const DAYS_OF_WEEK = {
  SUNDAY: 0,
  MONDAY: 1,
  TUESDAY: 2,
  WEDNESDAY: 3,
  THURSDAY: 4,
  FRIDAY: 5,
  SATURDAY: 6
};

export const DAY_NAMES = ['日', '一', '二', '三', '四', '五', '六'];
export const DAY_NAMES_FULL = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

/**
 * Common subjects
 * 常见科目
 */
export const SUBJECTS = [
  '数学', '物理', '化学', '生物',
  '英语', '日语', '韩语',
  '历史', '地理', '政治',
  '计算机', '编程', '其他'
];

/**
 * Create a Teacher object
 * 创建教师对象
 */
export function createTeacher({
  id = null,
  name = '',
  subjects = [],
  availableTimeSlots = [],
  hourlyRate = 0,
  maxHoursPerWeek = 40,
  preferences = {}
} = {}) {
  return {
    id: id || `teacher-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    name,
    subjects: Array.isArray(subjects) ? subjects : [],
    availableTimeSlots: Array.isArray(availableTimeSlots) ? availableTimeSlots : [],
    hourlyRate,
    maxHoursPerWeek,
    preferences,
    type: 'teacher'
  };
}

/**
 * Create a Student object
 * 创建学生对象
 */
export function createStudent({
  id = null,
  name = '',
  subject = '',
  totalHours = 0,
  usedHours = 0,
  validPeriod = { start: new Date(), end: new Date() },
  constraints = {}
} = {}) {
  return {
    id: id || `student-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    name,
    subject,
    totalHours,
    usedHours,
    remainingHours: totalHours - usedHours,
    validPeriod,
    constraints: {
      allowedDays: new Set(constraints.allowedDays || [1, 2, 3, 4, 5]), // Default: weekdays
      allowedTimeRanges: constraints.allowedTimeRanges || [],
      excludedTimeRanges: constraints.excludedTimeRanges || [],
      frequency: constraints.frequency || '1次/周',
      duration: constraints.duration || 24, // Default: 2 hours in 5-min slots
      preferredTeacher: constraints.preferredTeacher || null
    },
    type: 'student'
  };
}

/**
 * Create a Course (scheduled class)
 * 创建课程（已排课）
 */
export function createCourse({
  id = null,
  student = null,
  teacher = null,
  subject = '',
  timeSlot = null,
  isRecurring = false,
  recurrencePattern = 'weekly',
  room = null
} = {}) {
  return {
    id: id || `course-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    student,
    teacher,
    subject,
    timeSlot,
    isRecurring,
    recurrencePattern,
    room,
    createdAt: new Date(),
    type: 'course'
  };
}

/**
 * Create a TimeSlot object
 * 创建时间槽对象
 */
export function createTimeSlot({
  day = 1,
  startSlot = 0,
  endSlot = 24,
  granularity = TIME_GRANULARITY.FIVE_MIN
} = {}) {
  const duration = endSlot - startSlot;
  const startTime = slotToTime(startSlot, granularity);
  const endTime = slotToTime(endSlot, granularity);
  
  return {
    day,
    startSlot,
    endSlot,
    duration,
    start: formatTime(startTime.hour, startTime.minute),
    end: formatTime(endTime.hour, endTime.minute)
  };
}

/**
 * Convert slot index to time
 * 将槽索引转换为时间
 */
export function slotToTime(slotIndex, granularity = TIME_GRANULARITY.FIVE_MIN) {
  const startHour = 9; // 9:00 AM
  const totalMinutes = slotIndex * granularity.minutes;
  const hour = startHour + Math.floor(totalMinutes / 60);
  const minute = totalMinutes % 60;
  
  return { hour, minute };
}

/**
 * Convert time to slot index
 * 将时间转换为槽索引
 */
export function timeToSlot(hour, minute, granularity = TIME_GRANULARITY.FIVE_MIN) {
  const startHour = 9; // 9:00 AM
  const totalMinutes = (hour - startHour) * 60 + minute;
  return Math.floor(totalMinutes / granularity.minutes);
}

/**
 * Format time as HH:MM
 * 格式化时间
 */
export function formatTime(hour, minute) {
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

/**
 * Check if two time slots overlap
 * 检查两个时间槽是否重叠
 */
export function timeSlotsOverlap(slot1, slot2) {
  if (slot1.day !== slot2.day) return false;
  return !(slot1.endSlot <= slot2.startSlot || slot2.endSlot <= slot1.startSlot);
}

/**
 * Find overlapping time between two slots
 * 找到两个时间槽的重叠部分
 */
export function findOverlap(slot1, slot2) {
  if (!timeSlotsOverlap(slot1, slot2)) return null;
  
  return {
    day: slot1.day,
    startSlot: Math.max(slot1.startSlot, slot2.startSlot),
    endSlot: Math.min(slot1.endSlot, slot2.endSlot)
  };
}

/**
 * Validate teacher object
 * 验证教师对象
 */
export function validateTeacher(teacher) {
  const errors = [];
  
  if (!teacher.id) errors.push('教师ID不能为空');
  if (!teacher.name || teacher.name.trim() === '') errors.push('教师姓名不能为空');
  if (!Array.isArray(teacher.subjects) || teacher.subjects.length === 0) {
    errors.push('教师必须至少有一个可教科目');
  }
  if (!Array.isArray(teacher.availableTimeSlots) || teacher.availableTimeSlots.length === 0) {
    errors.push('教师必须至少有一个可用时间段');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Validate student object
 * 验证学生对象
 */
export function validateStudent(student) {
  const errors = [];
  
  if (!student.id) errors.push('学生ID不能为空');
  if (!student.name || student.name.trim() === '') errors.push('学生姓名不能为空');
  if (!student.subject || student.subject.trim() === '') errors.push('学生科目不能为空');
  if (student.totalHours <= 0) errors.push('总课时必须大于0');
  if (student.usedHours < 0) errors.push('已用课时不能为负数');
  if (student.usedHours > student.totalHours) errors.push('已用课时不能超过总课时');
  
  // Validate constraints
  if (student.constraints) {
    if (student.constraints.allowedDays && student.constraints.allowedDays.size === 0) {
      errors.push('必须至少有一天可用');
    }
    if (student.constraints.duration && student.constraints.duration <= 0) {
      errors.push('课程时长必须大于0');
    }
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Validate time slot
 * 验证时间槽
 */
export function validateTimeSlot(timeSlot, granularity = TIME_GRANULARITY.FIVE_MIN) {
  const errors = [];
  
  if (timeSlot.day < 0 || timeSlot.day > 6) {
    errors.push('日期必须在0-6之间（0=周日，6=周六）');
  }
  if (timeSlot.startSlot < 0 || timeSlot.startSlot >= granularity.slotsPerDay) {
    errors.push(`开始槽位必须在0-${granularity.slotsPerDay - 1}之间`);
  }
  if (timeSlot.endSlot <= timeSlot.startSlot) {
    errors.push('结束槽位必须大于开始槽位');
  }
  if (timeSlot.endSlot > granularity.slotsPerDay) {
    errors.push(`结束槽位不能超过${granularity.slotsPerDay}`);
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Clone an object deeply
 * 深度克隆对象
 */
export function deepClone(obj) {
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return new Date(obj.getTime());
  if (obj instanceof Set) return new Set(Array.from(obj));
  if (obj instanceof Map) return new Map(Array.from(obj));
  if (Array.isArray(obj)) return obj.map(item => deepClone(item));
  
  const cloned = {};
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      cloned[key] = deepClone(obj[key]);
    }
  }
  return cloned;
}
