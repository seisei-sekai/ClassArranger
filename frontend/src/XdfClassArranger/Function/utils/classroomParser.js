/**
 * Classroom Data Parser
 * 教室数据解析器
 * 
 * Parses Excel data from Classroom_data.xlsx and converts it into structured classroom objects
 * 解析Classroom_data.xlsx的Excel数据并转换为结构化的教室对象
 */

import { SLOTS_PER_DAY } from './constants';

/**
 * Parse classroom rows from Excel data
 * 从Excel数据解析教室行
 * 
 * @param {string} rawData - Tab-separated Excel data
 * @returns {Array<Object>} Array of parsed classroom objects
 */
export const parseClassroomRows = (rawData) => {
  if (!rawData || typeof rawData !== 'string') {
    return [];
  }

  const lines = rawData.trim().split('\n');
  if (lines.length === 0) {
    return [];
  }

  // Skip header row if it exists
  const dataLines = lines[0].includes('教室名称') || lines[0].includes('校区') 
    ? lines.slice(1) 
    : lines;

  return dataLines
    .map((line, index) => parseClassroomRow(line, index))
    .filter(classroom => classroom !== null);
};

/**
 * Parse a single classroom row
 * 解析单个教室行
 * 
 * Expected columns (实际格式):
 * 0: 校区 (Campus)
 * 1: 区域/类别 (Area/Category)
 * 2: 教室名 (Room Name)
 * 3: 录入名称 (Entry Name)
 * 4: 类型 (Type)
 * 5: 优先级 (Priority)
 * 6: 时间段开始 (Start Time)
 * 7: 时间段结束 (End Time)
 * 8: 班容 (Capacity)
 * 9: 备注 (Notes)
 * 
 * @param {string} line - Single line of tab-separated data
 * @param {number} index - Row index
 * @returns {Object|null} Parsed classroom object or null if invalid
 */
export const parseClassroomRow = (line, index) => {
  if (!line || line.trim() === '') {
    return null;
  }

  const values = line.split('\t').map(v => v.trim());
  
  const campus = values[0] || '';
  const area = values[1] || '';
  const roomName = values[2] || '';
  const entryName = values[3] || '';
  const type = values[4] || '';
  const priority = parseInt(values[5]) || 3; // Default priority 3
  const startTime = values[6] || '9:00';
  const endTime = values[7] || '21:30';
  const capacity = parseInt(values[8]) || 2; // Default capacity 2 for 1v1
  const notes = values[9] || '';

  // Use entryName as the main name, fall back to roomName
  const name = entryName || roomName;

  if (!name || !campus) {
    console.warn(`[ClassroomParser] Skipping row ${index}: missing name or campus`);
    return null;
  }

  // Construct available time text from start and end times
  const availableTimeText = `${startTime}-${endTime}`;

  const classroom = {
    id: `classroom-${index}-${Date.now()}`,
    name: name,
    campus: campus,
    area: area,
    roomName: roomName,
    entryName: entryName,
    capacity: capacity,
    priority: priority,
    type: type || determineClassroomType(name, capacity),
    availableTimeRanges: parseAvailableTime(availableTimeText),
    notes: notes,
    rawData: line
  };

  return classroom;
};

/**
 * Parse available time text into time slot ranges
 * 将可用时间文本解析为时间槽范围
 * 
 * Examples:
 * "9:00-21:30" -> All days (Mon-Sun) from 9:00 to 21:30
 * "9:30-21:00" -> All days (Mon-Sun) from 9:30 to 21:00
 * "周一到周五 9:00-21:30" -> Monday to Friday 9:00 to 21:30
 * 
 * @param {string} timeText - Available time description
 * @returns {Array<Object>} Array of time ranges { day, startSlot, endSlot }
 */
export const parseAvailableTime = (timeText) => {
  if (!timeText || timeText.trim() === '') {
    // Default: Available all week from 9:00 to 21:30
    return createDefaultTimeRanges();
  }

  const ranges = [];
  const text = timeText.toLowerCase();

  // Determine which days (default to all days if not specified)
  const days = parseDays(text);

  // Parse time range (e.g., "9:00-21:30" or "9:30-21:00")
  // Support both - and 到/至 as separators
  const timeMatch = text.match(/(\d{1,2}):(\d{2})\s*[-到至]\s*(\d{1,2}):(\d{2})/);
  
  let startSlot, endSlot;
  if (timeMatch) {
    const startHour = parseInt(timeMatch[1]);
    const startMin = parseInt(timeMatch[2]);
    const endHour = parseInt(timeMatch[3]);
    const endMin = parseInt(timeMatch[4]);
    
    // Convert to slot index (9:00 = slot 0, each slot = 5 minutes)
    startSlot = timeToSlot(startHour, startMin);
    endSlot = timeToSlot(endHour, endMin);
  } else {
    // Default time: 9:00-21:30
    startSlot = 0; // 9:00
    endSlot = 150; // 21:30
  }

  // Create ranges for each day
  days.forEach(day => {
    ranges.push({
      day: day,
      startSlot: startSlot,
      endSlot: endSlot
    });
  });

  return ranges.length > 0 ? ranges : createDefaultTimeRanges();
};

/**
 * Parse day descriptions from text
 * 从文本解析星期描述
 * 
 * @param {string} text - Day description text
 * @returns {Array<number>} Array of day numbers (0=Sunday, 1=Monday, ..., 6=Saturday)
 */
const parseDays = (text) => {
  // Check if text contains any day-related keywords
  const hasDayKeywords = text.includes('周') || text.includes('星期') || 
                         text.includes('工作日') || text.includes('平日') || 
                         text.includes('周末');

  // If no day keywords, default to all days (Mon-Sun for classroom availability)
  if (!hasDayKeywords) {
    return [1, 2, 3, 4, 5, 6, 0]; // Mon, Tue, Wed, Thu, Fri, Sat, Sun
  }

  // Default: all days of the week
  let days = [0, 1, 2, 3, 4, 5, 6];

  if (text.includes('周一') && text.includes('周五') && (text.includes('到') || text.includes('-'))) {
    // Monday to Friday
    days = [1, 2, 3, 4, 5];
  } else if (text.includes('周末') && !text.includes('不')) {
    // Weekend only
    days = [0, 6]; // Sunday and Saturday
  } else if (text.includes('工作日') || text.includes('平日')) {
    // Weekdays
    days = [1, 2, 3, 4, 5];
  }

  return days;
};

/**
 * Convert time to slot index
 * 将时间转换为时间槽索引
 * 
 * 9:00 = slot 0
 * Each slot = 5 minutes
 * 
 * @param {number} hour - Hour (0-23)
 * @param {number} minute - Minute (0-59)
 * @returns {number} Slot index
 */
const timeToSlot = (hour, minute) => {
  const minutesSince9AM = (hour - 9) * 60 + minute;
  return Math.floor(minutesSince9AM / 5);
};

/**
 * Create default time ranges (all week, 9:00-21:30)
 * 创建默认时间范围（全周，9:00-21:30）
 * 
 * @returns {Array<Object>} Default time ranges
 */
const createDefaultTimeRanges = () => {
  return [0, 1, 2, 3, 4, 5, 6].map(day => ({
    day: day,
    startSlot: 0,   // 9:00
    endSlot: 150    // 21:30
  }));
};

/**
 * Determine classroom type based on name and capacity
 * 根据名称和容量判断教室类型
 * 
 * @param {string} name - Classroom name
 * @param {number} capacity - Classroom capacity
 * @returns {string} Classroom type
 */
const determineClassroomType = (name, capacity) => {
  const nameLower = name.toLowerCase();
  
  // Priority order: check name keywords first, then capacity
  // 优先级顺序：先检查名称关键词，再检查容量
  if (nameLower.includes('自习')) {
    return '自习室';
  } else if (nameLower.includes('会议')) {
    return '会议室';
  } else if (nameLower.includes('事务所')) {
    return '事务所';
  } else if (nameLower.includes('个别指导') || nameLower.includes('vip')) {
    return '1v1教室';
  } else if (capacity <= 2) {
    return '1v1教室';
  } else {
    return '班课教室';
  }
};

/**
 * Check if classroom is available at a specific time slot
 * 检查教室在特定时间槽是否可用
 * 
 * @param {Object} classroom - Classroom object
 * @param {number} day - Day number (0-6)
 * @param {number} slot - Slot index
 * @returns {boolean} True if available
 */
export const isClassroomAvailable = (classroom, day, slot) => {
  if (!classroom || !classroom.availableTimeRanges) {
    return false;
  }

  return classroom.availableTimeRanges.some(range => 
    range.day === day && slot >= range.startSlot && slot < range.endSlot
  );
};

/**
 * Get classroom statistics
 * 获取教室统计信息
 * 
 * @param {Array<Object>} classrooms - Array of classroom objects
 * @returns {Object} Statistics object
 */
export const getClassroomStatistics = (classrooms) => {
  if (!classrooms || classrooms.length === 0) {
    return {
      total: 0,
      byCampus: {},
      byType: {},
      totalCapacity: 0
    };
  }

  const stats = {
    total: classrooms.length,
    byCampus: {},
    byType: {},
    totalCapacity: 0
  };

  classrooms.forEach(classroom => {
    // Count by campus
    stats.byCampus[classroom.campus] = (stats.byCampus[classroom.campus] || 0) + 1;
    
    // Count by type
    stats.byType[classroom.type] = (stats.byType[classroom.type] || 0) + 1;
    
    // Sum capacity
    stats.totalCapacity += classroom.capacity;
  });

  return stats;
};

export default {
  parseClassroomRows,
  parseClassroomRow,
  parseAvailableTime,
  isClassroomAvailable,
  getClassroomStatistics
};

