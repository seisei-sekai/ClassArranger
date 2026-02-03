/**
 * Real Business Data Structures for Experiment2
 * Experiment2 真实业务数据结构
 * 
 * Based on 前途塾1v1约课 Excel format (33 columns)
 */

/**
 * Time granularity settings
 */
export const TIME_GRANULARITY = {
  FIVE_MIN: {
    minutes: 5,
    slotsPerHour: 12,
    slotsPerDay: 150, // 9:00-21:30
    label: '5分钟'
  },
  FIFTEEN_MIN: {
    minutes: 15,
    slotsPerHour: 4,
    slotsPerDay: 50,
    label: '15分钟'
  }
};

export const DAY_NAMES = ['日', '一', '二', '三', '四', '五', '六'];
export const DAY_NAMES_FULL = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

/**
 * Campus options (校区选项)
 */
export const CAMPUSES = ['高马', '本校'];

/**
 * Subject options (科目选项)
 */
export const SUBJECTS = [
  '数学', '物理', '化学', '生物',
  '英语', '日语', '韩语',
  '历史', '地理', '政治',
  '计算机', '编程', '论文指导',
  '其他'
];

/**
 * Frequency options (频次选项)
 */
export const FREQUENCIES = ['1次', '2次', '3次', '多次'];

/**
 * Format options (形式选项)
 */
export const FORMATS = ['线上', '线下', '混合'];

/**
 * Create a Student object (真实业务格式)
 */
export function createStudent({
  id = null,
  // 基础信息 (Excel columns 0-3)
  campus = '',
  manager = '',
  name = '',
  batch = '',
  
  // 课程信息 (Excel columns 4-10)
  entryDate = new Date(),
  frequency = '1次',
  duration = 2,
  format = '线下',
  subject = '',
  level = '',
  hoursUsed = 0,
  
  // 大学信息 (Excel columns 11-12)
  targetUniversity = '',
  targetMajor = '',
  
  // 时间约束 (Excel columns 13-17)
  timeRange = { start: new Date(), end: new Date() },
  preferredTimes = '',
  specificTime = '',
  weeklyFrequency = 2,
  content = '',
  notes = '',
  
  // 计算字段
  totalHours = 0,
  constraints = {}
} = {}) {
  const studentId = id || `student-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  return {
    id: studentId,
    
    // 基础信息
    campus,
    manager,
    name,
    batch,
    
    // 课程信息
    entryDate,
    frequency,
    duration,
    format,
    subject,
    level,
    hoursUsed,
    
    // 大学信息
    targetUniversity,
    targetMajor,
    
    // 时间信息
    timeRange,
    preferredTimes,
    specificTime,
    weeklyFrequency,
    content,
    notes,
    
    // 课时信息
    totalHours,
    remainingHours: totalHours - hoursUsed,
    
    // 约束信息
    constraints: {
      allowedDays: constraints.allowedDays || new Set([1, 2, 3, 4, 5]),
      allowedTimeRanges: constraints.allowedTimeRanges || [],
      excludedTimeRanges: constraints.excludedTimeRanges || [],
      frequency: constraints.frequency || frequency,
      duration: constraints.duration || duration * 12, // Convert hours to 5-min slots
      advancedConstraints: constraints.advancedConstraints || []
    },
    
    type: 'student',
    createdAt: new Date()
  };
}

/**
 * Create a Teacher object
 */
export function createTeacher({
  id = null,
  name = '',
  subjects = [],
  level = '',
  availableTimeSlots = [],
  maxHoursPerWeek = 40,
  hourlyRate = 300,
  campus = [],
  employmentType = '',
  notes = ''
} = {}) {
  return {
    id: id || `teacher-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    name,
    subjects: Array.isArray(subjects) ? subjects : [],
    level,
    availableTimeSlots: Array.isArray(availableTimeSlots) ? availableTimeSlots : [],
    maxHoursPerWeek,
    hourlyRate,
    campus: Array.isArray(campus) ? campus : [campus],
    employmentType,
    notes,
    type: 'teacher',
    createdAt: new Date()
  };
}

/**
 * Create a Classroom object
 */
export function createClassroom({
  id = null,
  name = '',
  campus = '',
  capacity = 2,
  type = '1v1教室',
  availableTimeSlots = [],
  notes = ''
} = {}) {
  return {
    id: id || `classroom-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    name,
    campus,
    capacity,
    type,
    availableTimeSlots: Array.isArray(availableTimeSlots) ? availableTimeSlots : [],
    notes,
    type: 'classroom',
    createdAt: new Date()
  };
}

/**
 * Create a Course (scheduled class)
 */
export function createCourse({
  id = null,
  student = null,
  teacher = null,
  classroom = null,
  subject = '',
  timeSlot = null,
  isRecurring = false,
  recurrencePattern = 'weekly'
} = {}) {
  return {
    id: id || `course-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    student,
    teacher,
    classroom,
    subject,
    timeSlot,
    isRecurring,
    recurrencePattern,
    createdAt: new Date(),
    type: 'course'
  };
}

/**
 * Create a TimeSlot object
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
 */
export function slotToTime(slotIndex, granularity = TIME_GRANULARITY.FIVE_MIN) {
  const startHour = 9;
  const totalMinutes = slotIndex * granularity.minutes;
  const hour = startHour + Math.floor(totalMinutes / 60);
  const minute = totalMinutes % 60;
  
  return { hour, minute };
}

/**
 * Convert time to slot index
 */
export function timeToSlot(hour, minute, granularity = TIME_GRANULARITY.FIVE_MIN) {
  const startHour = 9;
  const totalMinutes = (hour - startHour) * 60 + minute;
  return Math.floor(totalMinutes / granularity.minutes);
}

/**
 * Format time as HH:MM
 */
export function formatTime(hour, minute) {
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

/**
 * Check if two time slots overlap
 */
export function timeSlotsOverlap(slot1, slot2) {
  if (slot1.day !== slot2.day) return false;
  return !(slot1.endSlot <= slot2.startSlot || slot2.endSlot <= slot1.startSlot);
}

/**
 * Find overlapping time between two slots
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
 * Deep clone an object
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

/**
 * Parse frequency string to number
 * "2次/周" -> 2, "多次" -> 3
 */
export function parseFrequency(frequencyStr) {
  if (!frequencyStr) return 1;
  
  if (frequencyStr.includes('多次')) return 3;
  
  const match = frequencyStr.match(/(\d+)次/);
  return match ? parseInt(match[1]) : 1;
}

/**
 * Parse duration string to number (hours)
 * "2h" -> 2, "1.5小时" -> 1.5
 */
export function parseDuration(durationStr) {
  if (!durationStr) return 2;
  
  const str = String(durationStr);
  const match = str.match(/([\d.]+)/);
  return match ? parseFloat(match[1]) : 2;
}

/**
 * Calculate total hours from frequency and duration
 */
export function calculateTotalHours(frequency, duration, weeks = 20) {
  const timesPerWeek = parseFrequency(frequency);
  const hoursPerTime = parseDuration(duration);
  return timesPerWeek * hoursPerTime * weeks;
}
