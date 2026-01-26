import { TEACHER_COLUMNS } from './constants';

/**
 * 解析教师数据行
 * Parse teacher data rows
 * 
 * 处理从 Excel 复制的教师数据，支持多行数据
 * Handles teacher data copied from Excel, supports multi-line data
 * 
 * 能够正确处理单元格内的换行符
 * Properly handles line breaks within cells
 * 
 * @param {string} rawData - 从 Excel 复制的原始数据 (Raw data copied from Excel)
 * @returns {Array} 解析后的教师对象数组 (Array of parsed teacher objects)
 */
export const parseTeacherRows = (rawData) => {
  if (!rawData || !rawData.trim()) {
    return [];
  }

  const rawLines = rawData.split('\n');
  const MIN_TABS_FOR_NEW_TEACHER = 10; // 启发式：至少10个制表符才是新的教师行（15列数据需要14个制表符，设为10提供容错空间）

  // 合并跨行的单元格内容 (Merge multi-line cell content)
  const mergedLines = [];
  rawLines.forEach(line => {
    if (line.trim() === '') return;

    const tabCount = (line.match(/\t/g) || []).length;

    if (tabCount >= MIN_TABS_FOR_NEW_TEACHER) {
      // 这是一个新的教师记录 (This is a new teacher record)
      mergedLines.push(line);
    } else if (mergedLines.length > 0) {
      // 这是上一个教师记录的延续（单元格内换行） (Continuation of previous record)
      mergedLines[mergedLines.length - 1] += ' ' + line;
    } else {
      // 第一行但制表符不够，也保留 (First line but insufficient tabs, keep it)
      mergedLines.push(line);
    }
  });

  // 解析每一行为教师对象 (Parse each line into teacher object)
  return mergedLines.map((line, index) => {
    const values = line.split('\t');
    
    // 获取教师姓名（第2列，索引1） (Get teacher name - column 2, index 1)
    let teacherName = values[1] ? values[1].trim() : '';

    // 如果姓名为空，生成默认名称 (Generate default name if empty)
    if (!teacherName) {
      const now = new Date();
      const timestamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`;
      teacherName = `教师${timestamp}`;
    }

    // 解析可带科目 (Parse subjects)
    const subjectsText = values[7] ? values[7].trim() : '';
    const subjects = parseSubjects(subjectsText);
    
    // 解析可带时间 (Parse availability time)
    const availabilityText = values[9] ? values[9].trim() : '';
    const availableTimeSlots = parseAvailability(availabilityText);

    return {
      rawData: line,
      name: teacherName,
      values: values,
      // 提取关键信息 (Extract key information)
      level: values[0] ? values[0].trim() : '-', // 教师级别 (Teacher level)
      gender: values[2] ? values[2].trim() : '-', // 性别 (Gender)
      employmentType: values[3] ? values[3].trim() : '-', // 兼职/正社员 (Employment type)
      university: values[4] ? values[4].trim() : '-', // 出身校 (University)
      subject: values[5] ? values[5].trim() : '-', // 学科分类 (Subject category)
      major: values[6] ? values[6].trim() : '-', // 专业 (Major)
      possibleSubjects: subjectsText, // 可带科目原文 (Original subjects text)
      subjects: subjects, // 解析后的科目数组 (Parsed subjects array)
      canModifyStatement: values[8] ? values[8].trim() : '-', // 可否修改志望理由书 (Can modify SOP)
      availability: availabilityText, // 可带时间原文 (Original availability text)
      availableTimeSlots: availableTimeSlots, // 解析后的可用时间槽 (Parsed time slots)
      teachingMode: values[10] ? values[10].trim() : '-', // 上课形式 (Teaching mode)
      teachingStyle: values[11] ? values[11].trim() : '-', // 授课风格 (Teaching style)
      experience: values[12] ? values[12].trim() : '-', // 教龄 (Teaching experience)
      hourlyRate: values[13] ? values[13].trim() : '-', // 时薪 (Hourly rate)
      notes: values[14] ? values[14].trim() : '-' // 备注 (Notes)
    };
  });
};

/**
 * 解析科目列表
 * Parse subject list
 * 
 * @param {string} subjectsText - Comma-separated subjects text
 * @returns {Array<string>} Array of subject names
 */
export const parseSubjects = (subjectsText) => {
  if (!subjectsText || subjectsText.trim() === '' || subjectsText === '-') {
    return [];
  }

  // Split by comma or Chinese comma
  return subjectsText
    .split(/[,，]/)
    .map(s => s.trim())
    .filter(s => s.length > 0);
};

/**
 * 解析教师可用时间
 * Parse teacher availability time
 * 
 * Examples:
 * - "周一到周五白天" -> Weekdays daytime slots
 * - "晚上" -> Evening slots all week
 * - "周末全天" -> Weekend all day
 * - "随时" -> All time slots
 * 
 * @param {string} availabilityText - Availability description
 * @returns {Array<Object>} Array of time slot ranges { day, startSlot, endSlot }
 */
export const parseAvailability = (availabilityText) => {
  if (!availabilityText || availabilityText.trim() === '' || availabilityText === '-') {
    // Default: available all week, all hours
    return createAllWeekTimeSlots();
  }

  const text = availabilityText.toLowerCase();
  const timeSlots = [];

  // Parse days
  let days = [];
  if (text.includes('周一') && text.includes('周五') && (text.includes('到') || text.includes('-'))) {
    // Monday to Friday
    days = [1, 2, 3, 4, 5];
  } else if (text.includes('周末')) {
    // Weekend
    days = [0, 6];
  } else if (text.includes('工作日') || text.includes('平日')) {
    // Weekdays
    days = [1, 2, 3, 4, 5];
  } else if (text.includes('随时') || text.includes('全天')) {
    // All days
    days = [0, 1, 2, 3, 4, 5, 6];
  } else {
    // Check for specific days
    days = parseSpecificDays(text);
    if (days.length === 0) {
      // Default to all days
      days = [0, 1, 2, 3, 4, 5, 6];
    }
  }

  // Parse time periods
  let startSlot, endSlot;
  if (text.includes('白天') || text.includes('日中')) {
    // Daytime: 9:00-17:00
    startSlot = 0; // 9:00
    endSlot = 96; // 17:00
  } else if (text.includes('下午')) {
    // Afternoon: 13:00-18:00
    startSlot = 48; // 13:00
    endSlot = 108; // 18:00
  } else if (text.includes('晚上') || text.includes('夜間')) {
    // Evening: 18:00-21:30
    startSlot = 108; // 18:00
    endSlot = 150; // 21:30
  } else if (text.includes('上午') || text.includes('午前')) {
    // Morning: 9:00-12:00
    startSlot = 0; // 9:00
    endSlot = 36; // 12:00
  } else if (text.includes('全天') || text.includes('随时')) {
    // All day: 9:00-21:30
    startSlot = 0;
    endSlot = 150;
  } else {
    // Try to parse specific time range
    const timeRange = parseTimeRange(text);
    if (timeRange) {
      startSlot = timeRange.startSlot;
      endSlot = timeRange.endSlot;
    } else {
      // Default: all day
      startSlot = 0;
      endSlot = 150;
    }
  }

  // Create time slots for each day
  days.forEach(day => {
    timeSlots.push({
      day: day,
      startSlot: startSlot,
      endSlot: endSlot
    });
  });

  return timeSlots.length > 0 ? timeSlots : createAllWeekTimeSlots();
};

/**
 * Parse specific days from text
 * 从文本解析具体星期
 * 
 * @param {string} text - Text containing day names
 * @returns {Array<number>} Array of day numbers
 */
const parseSpecificDays = (text) => {
  const days = [];
  const dayMap = {
    '周日': 0, '日曜': 0, 'sunday': 0,
    '周一': 1, '月曜': 1, 'monday': 1,
    '周二': 2, '火曜': 2, 'tuesday': 2,
    '周三': 3, '水曜': 3, 'wednesday': 3,
    '周四': 4, '木曜': 4, 'thursday': 4,
    '周五': 5, '金曜': 5, 'friday': 5,
    '周六': 6, '土曜': 6, 'saturday': 6
  };

  Object.keys(dayMap).forEach(dayName => {
    if (text.includes(dayName)) {
      const dayNum = dayMap[dayName];
      if (!days.includes(dayNum)) {
        days.push(dayNum);
      }
    }
  });

  return days.sort();
};

/**
 * Parse time range from text
 * 从文本解析时间范围
 * 
 * @param {string} text - Text containing time range
 * @returns {Object|null} { startSlot, endSlot } or null
 */
const parseTimeRange = (text) => {
  // Pattern: HH:MM-HH:MM or HH:MM～HH:MM
  const match = text.match(/(\d{1,2}):(\d{2})\s*[-～〜到至]\s*(\d{1,2}):(\d{2})/);
  if (match) {
    const startHour = parseInt(match[1]);
    const startMin = parseInt(match[2]);
    const endHour = parseInt(match[3]);
    const endMin = parseInt(match[4]);
    
    return {
      startSlot: timeToSlot(startHour, startMin),
      endSlot: timeToSlot(endHour, endMin)
    };
  }
  return null;
};

/**
 * Convert time to slot index
 * 将时间转换为时间槽索引
 * 
 * @param {number} hour - Hour (0-23)
 * @param {number} minute - Minute (0-59)
 * @returns {number} Slot index (0 = 9:00, each slot = 5 minutes)
 */
const timeToSlot = (hour, minute) => {
  const minutesSince9AM = (hour - 9) * 60 + minute;
  return Math.floor(minutesSince9AM / 5);
};

/**
 * Create time slots for all week
 * 创建全周时间槽
 * 
 * @returns {Array<Object>} Time slots for all week, 9:00-21:30
 */
const createAllWeekTimeSlots = () => {
  return [0, 1, 2, 3, 4, 5, 6].map(day => ({
    day: day,
    startSlot: 0,    // 9:00
    endSlot: 150     // 21:30
  }));
};

/**
 * Check if teacher is available at a specific time slot
 * 检查教师在特定时间槽是否可用
 * 
 * @param {Object} teacher - Teacher object
 * @param {number} day - Day number (0-6)
 * @param {number} slot - Slot index
 * @returns {boolean} True if available
 */
export const isTeacherAvailable = (teacher, day, slot) => {
  if (!teacher || !teacher.availableTimeSlots) {
    return false;
  }

  return teacher.availableTimeSlots.some(range => 
    range.day === day && slot >= range.startSlot && slot < range.endSlot
  );
};

/**
 * Get teacher statistics
 * 获取教师统计信息
 * 
 * @param {Array<Object>} teachers - Array of teacher objects
 * @returns {Object} Statistics object
 */
export const getTeacherStatistics = (teachers) => {
  if (!teachers || teachers.length === 0) {
    return {
      total: 0,
      byLevel: {},
      byEmploymentType: {},
      bySubject: {},
      averageExperience: 0
    };
  }

  const stats = {
    total: teachers.length,
    byLevel: {},
    byEmploymentType: {},
    bySubject: {},
    totalExperience: 0,
    teachersWithExperience: 0
  };

  teachers.forEach(teacher => {
    // Count by level
    if (teacher.level && teacher.level !== '-') {
      stats.byLevel[teacher.level] = (stats.byLevel[teacher.level] || 0) + 1;
    }
    
    // Count by employment type
    if (teacher.employmentType && teacher.employmentType !== '-') {
      stats.byEmploymentType[teacher.employmentType] = (stats.byEmploymentType[teacher.employmentType] || 0) + 1;
    }
    
    // Count by subject
    if (teacher.subject && teacher.subject !== '-') {
      stats.bySubject[teacher.subject] = (stats.bySubject[teacher.subject] || 0) + 1;
    }
    
    // Sum experience
    const exp = parseInt(teacher.experience);
    if (!isNaN(exp) && exp > 0) {
      stats.totalExperience += exp;
      stats.teachersWithExperience++;
    }
  });

  stats.averageExperience = stats.teachersWithExperience > 0 
    ? stats.totalExperience / stats.teachersWithExperience 
    : 0;

  return stats;
};

