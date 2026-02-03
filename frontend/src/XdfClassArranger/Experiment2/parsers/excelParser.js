/**
 * Excel Parser for Experiment2
 * Excel解析器（简化版）
 * 
 * Parses data from 前途塾1v1约课 Excel format
 * Only extracts key columns needed for scheduling
 */

import { 
  createStudent, 
  createTeacher, 
  createClassroom,
  parseFrequency,
  parseDuration,
  calculateTotalHours,
  TIME_GRANULARITY
} from '../utils/realBusinessDataStructures.js';

/**
 * Column mapping for Student Excel (前途塾格式)
 * 只映射排课必需的关键列
 */
const STUDENT_COLUMN_MAP = {
  0: 'campus',          // 校区
  1: 'manager',         // 学管姓名
  2: 'name',           // 学生姓名
  3: 'batch',          // 学生批次
  4: 'entryDate',      // 录入日期
  5: 'frequency',      // 频次
  6: 'duration',       // 时长
  7: 'format',         // 形式
  8: 'subject',        // 内容（科目）
  9: 'level',          // 级别
  10: 'hoursUsed',     // 已用课时
  11: 'targetUniversity', // 目标大学
  12: 'targetMajor',   // 目标专业
  13: 'timeRange',     // 起止时间
  14: 'preferredTimes', // 希望时间段
  15: 'specificTime',  // 特殊时间
  16: 'weeklyFrequency', // 每周频次
  17: 'content'        // 课上具体内容
};

/**
 * Parse student data from Excel paste
 * 从Excel粘贴解析学生数据
 */
export function parseStudentExcel(pastedText, granularity = TIME_GRANULARITY.FIVE_MIN) {
  const rows = pastedText.trim().split('\n');
  const students = [];
  const errors = [];
  
  rows.forEach((row, rowIndex) => {
    try {
      const columns = row.split('\t');
      
      // Skip if no student name (column 2)
      if (columns.length < 3 || !columns[2] || columns[2].trim() === '') {
        return;
      }
      
      // Extract basic fields
      const campus = (columns[0] || '').trim();
      const manager = (columns[1] || '').trim();
      const name = columns[2].trim();
      const batch = (columns[3] || '').trim();
      const frequency = (columns[5] || '1次').trim();
      const durationStr = (columns[6] || '2').trim();
      const duration = parseDuration(durationStr);
      const subject = (columns[8] || '').trim();
      
      // Calculate total hours
      const totalHours = calculateTotalHours(frequency, duration);
      const hoursUsed = parseFloat(columns[10]) || 0;
      
      // Parse time constraints (简化解析)
      const preferredTimes = (columns[14] || '').trim();
      const specificTime = (columns[15] || '').trim();
      const weeklyFrequency = parseInt(columns[16]) || parseFrequency(frequency);
      
      // Parse basic time constraints from preferredTimes
      const constraints = parseBasicConstraints(preferredTimes, specificTime, duration, granularity);
      
      const student = createStudent({
        campus,
        manager,
        name,
        batch,
        entryDate: parseDate(columns[4]),
        frequency,
        duration,
        format: (columns[7] || '线下').trim(),
        subject,
        level: (columns[9] || '').trim(),
        hoursUsed,
        targetUniversity: (columns[11] || '').trim(),
        targetMajor: (columns[12] || '').trim(),
        timeRange: parseTimeRange(columns[13]),
        preferredTimes,
        specificTime,
        weeklyFrequency,
        content: (columns[17] || '').trim(),
        totalHours,
        constraints
      });
      
      students.push(student);
      
    } catch (error) {
      errors.push({
        row: rowIndex + 1,
        message: error.message
      });
    }
  });
  
  return {
    students,
    errors,
    parsed: students.length,
    failed: errors.length
  };
}

/**
 * Parse basic time constraints from text
 * 从文本解析基础时间约束
 */
function parseBasicConstraints(preferredTimes, specificTime, duration, granularity) {
  const constraints = {
    allowedDays: new Set(),
    allowedTimeRanges: [],
    excludedTimeRanges: [],
    duration: duration * granularity.slotsPerHour, // Convert hours to slots
    frequency: '1次/周'
  };
  
  // Parse days from preferredTimes (e.g., "周一-周五下午")
  const dayMap = {
    '周一': 1, '周二': 2, '周三': 3, '周四': 4, 
    '周五': 5, '周六': 6, '周日': 0
  };
  
  Object.entries(dayMap).forEach(([dayName, dayNum]) => {
    if (preferredTimes.includes(dayName)) {
      constraints.allowedDays.add(dayNum);
    }
  });
  
  // If no days found, default to weekdays
  if (constraints.allowedDays.size === 0) {
    constraints.allowedDays = new Set([1, 2, 3, 4, 5]);
  }
  
  // Parse time ranges (e.g., "下午", "上午", "14:00-18:00")
  const timeRanges = parseTimeRangeText(preferredTimes, granularity);
  
  // Create allowed time ranges for each day
  Array.from(constraints.allowedDays).forEach(day => {
    timeRanges.forEach(range => {
      constraints.allowedTimeRanges.push({
        day,
        startSlot: range.startSlot,
        endSlot: range.endSlot
      });
    });
  });
  
  // Store advanced text for optional NLP processing
  if (specificTime && specificTime.trim()) {
    constraints.advancedText = specificTime.trim();
  }
  
  return constraints;
}

/**
 * Parse time range text to slot indices
 * 解析时间文本为槽位索引
 */
function parseTimeRangeText(text, granularity) {
  const ranges = [];
  
  // Parse specific times like "14:00-18:00"
  const timePattern = /(\d{1,2}):(\d{2})\s*[-–到]\s*(\d{1,2}):(\d{2})/g;
  let match;
  
  while ((match = timePattern.exec(text)) !== null) {
    const startHour = parseInt(match[1]);
    const startMin = parseInt(match[2]);
    const endHour = parseInt(match[3]);
    const endMin = parseInt(match[4]);
    
    const startSlot = (startHour - 9) * granularity.slotsPerHour + Math.floor(startMin / granularity.minutes);
    const endSlot = (endHour - 9) * granularity.slotsPerHour + Math.floor(endMin / granularity.minutes);
    
    ranges.push({ startSlot, endSlot });
  }
  
  // If no specific times, use general time periods
  if (ranges.length === 0) {
    if (text.includes('上午') || text.includes('早上')) {
      ranges.push({ startSlot: 0, endSlot: 36 }); // 9:00-12:00
    }
    if (text.includes('下午') || text.includes('午后')) {
      ranges.push({ startSlot: 48, endSlot: 108 }); // 13:00-18:00
    }
    if (text.includes('晚上') || text.includes('傍晚')) {
      ranges.push({ startSlot: 108, endSlot: 150 }); // 18:00-21:30
    }
    if (text.includes('全天') || ranges.length === 0) {
      ranges.push({ startSlot: 0, endSlot: 150 }); // 9:00-21:30
    }
  }
  
  return ranges;
}

/**
 * Parse date string
 */
function parseDate(dateStr) {
  if (!dateStr) return new Date();
  
  try {
    const date = new Date(dateStr);
    return isNaN(date.getTime()) ? new Date() : date;
  } catch {
    return new Date();
  }
}

/**
 * Parse time range (起止时间)
 */
function parseTimeRange(rangeStr) {
  if (!rangeStr || rangeStr.trim() === '') {
    const now = new Date();
    const sixMonthsLater = new Date();
    sixMonthsLater.setMonth(sixMonthsLater.getMonth() + 6);
    
    return {
      start: now,
      end: sixMonthsLater
    };
  }
  
  // Try to parse range like "2026/1/1-2026/6/30"
  const parts = rangeStr.split(/[-–到]/);
  
  return {
    start: parts[0] ? parseDate(parts[0]) : new Date(),
    end: parts[1] ? parseDate(parts[1]) : new Date(Date.now() + 6 * 30 * 24 * 60 * 60 * 1000)
  };
}

/**
 * Parse teacher data from Excel paste
 * 从Excel粘贴解析教师数据
 */
export function parseTeacherExcel(pastedText, granularity = TIME_GRANULARITY.FIVE_MIN) {
  const rows = pastedText.trim().split('\n');
  const teachers = [];
  const errors = [];
  
  rows.forEach((row, rowIndex) => {
    try {
      const columns = row.split('\t');
      
      // Assume format: 姓名, 科目, 可用时间, 时薪, 校区
      if (columns.length < 2 || !columns[0] || columns[0].trim() === '') {
        return;
      }
      
      const name = columns[0].trim();
      const subjectsStr = (columns[1] || '').trim();
      const subjects = subjectsStr.split(/[,，、]/).map(s => s.trim()).filter(s => s);
      const availabilityStr = (columns[2] || '').trim();
      const hourlyRate = parseFloat(columns[3]) || 300;
      const campusStr = (columns[4] || '').trim();
      const campus = campusStr.split(/[,，、]/).map(s => s.trim()).filter(s => s);
      
      // Parse availability
      const availableTimeSlots = parseTeacherAvailability(availabilityStr, granularity);
      
      const teacher = createTeacher({
        name,
        subjects,
        availableTimeSlots,
        hourlyRate,
        campus: campus.length > 0 ? campus : ['高马', '本校'],
        maxHoursPerWeek: 40
      });
      
      teachers.push(teacher);
      
    } catch (error) {
      errors.push({
        row: rowIndex + 1,
        message: error.message
      });
    }
  });
  
  return {
    teachers,
    errors,
    parsed: teachers.length,
    failed: errors.length
  };
}

/**
 * Parse teacher availability text
 * 解析教师可用时间文本
 */
function parseTeacherAvailability(text, granularity) {
  const slots = [];
  
  if (!text || text.trim() === '') {
    // Default: weekdays, 9-17
    for (let day = 1; day <= 5; day++) {
      slots.push({
        day,
        startSlot: 0,
        endSlot: 96 // 9:00-17:00 in 5-min slots
      });
    }
    return slots;
  }
  
  // Parse patterns like "周一/周三/周五 14:00-18:00"
  const dayMap = {
    '周一': 1, '周二': 2, '周三': 3, '周四': 4, 
    '周五': 5, '周六': 6, '周日': 0
  };
  
  const days = [];
  Object.entries(dayMap).forEach(([dayName, dayNum]) => {
    if (text.includes(dayName)) {
      days.push(dayNum);
    }
  });
  
  // If no days found, use all weekdays
  if (days.length === 0) {
    days.push(1, 2, 3, 4, 5);
  }
  
  // Parse time ranges
  const timeRanges = parseTimeRangeText(text, granularity);
  if (timeRanges.length === 0) {
    timeRanges.push({ startSlot: 0, endSlot: 96 }); // Default 9-17
  }
  
  // Combine days and time ranges
  days.forEach(day => {
    timeRanges.forEach(range => {
      slots.push({
        day,
        startSlot: range.startSlot,
        endSlot: range.endSlot
      });
    });
  });
  
  return slots;
}

/**
 * Parse classroom data from Excel paste
 * 从Excel粘贴解析教室数据
 */
export function parseClassroomExcel(pastedText, granularity = TIME_GRANULARITY.FIVE_MIN) {
  const rows = pastedText.trim().split('\n');
  const classrooms = [];
  const errors = [];
  
  rows.forEach((row, rowIndex) => {
    try {
      const columns = row.split('\t');
      
      // Assume format: 校区, 教室名, 容量, 类型
      if (columns.length < 2 || !columns[1] || columns[1].trim() === '') {
        return;
      }
      
      const campus = (columns[0] || '').trim();
      const name = columns[1].trim();
      const capacity = parseInt(columns[2]) || 2;
      const type = (columns[3] || '1v1教室').trim();
      
      // Default: available all day, all weekdays
      const availableTimeSlots = [];
      for (let day = 1; day <= 6; day++) {
        availableTimeSlots.push({
          day,
          startSlot: 0,
          endSlot: granularity.slotsPerDay
        });
      }
      
      const classroom = createClassroom({
        campus,
        name,
        capacity,
        type,
        availableTimeSlots
      });
      
      classrooms.push(classroom);
      
    } catch (error) {
      errors.push({
        row: rowIndex + 1,
        message: error.message
      });
    }
  });
  
  return {
    classrooms,
    errors,
    parsed: classrooms.length,
    failed: errors.length
  };
}

/**
 * Validate Excel data before parsing
 * 验证Excel数据格式
 */
export function validateExcelFormat(pastedText, type = 'student') {
  const rows = pastedText.trim().split('\n');
  
  if (rows.length === 0) {
    return {
      valid: false,
      message: '没有数据'
    };
  }
  
  const firstRow = rows[0].split('\t');
  
  if (type === 'student' && firstRow.length < 3) {
    return {
      valid: false,
      message: '学生数据至少需要3列（校区、学管、学生姓名）'
    };
  }
  
  if (type === 'teacher' && firstRow.length < 2) {
    return {
      valid: false,
      message: '教师数据至少需要2列（姓名、科目）'
    };
  }
  
  if (type === 'classroom' && firstRow.length < 2) {
    return {
      valid: false,
      message: '教室数据至少需要2列（校区、教室名）'
    };
  }
  
  return {
    valid: true,
    rowCount: rows.length,
    columnCount: firstRow.length
  };
}
