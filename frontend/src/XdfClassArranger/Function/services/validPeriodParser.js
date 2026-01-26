/**
 * Valid Period Parser Service
 * 有效周期解析服务
 * 
 * Uses AI to parse student contract valid period from entry date and time range
 * 使用AI从录入时间和起止时间解析学生合同有效周期
 */

/**
 * Parse valid period using AI
 * 使用AI解析有效周期
 * 
 * @param {string} entryDate - Entry date (e.g., "2024-01-15", "2024年1月15日")
 * @param {string} timeRange - Time range (e.g., "1月-3月", "2024.1.15-2024.3.31", "春季")
 * @returns {Promise<Object>} { startDate, endDate, totalWeeks, isValid }
 */
export const parseValidPeriod = async (entryDate, timeRange) => {
  // For now, implement a rule-based parser
  // In the future, this can call an AI API
  
  const result = {
    startDate: null,
    endDate: null,
    totalWeeks: 0,
    isValid: false,
    parsedFrom: 'rule-based'
  };
  
  try {
    // Parse entry date
    const entryDateObj = parseDateString(entryDate);
    
    // Parse time range
    const { start, end } = parseTimeRangeString(timeRange, entryDateObj);
    
    if (start && end) {
      result.startDate = start;
      result.endDate = end;
      
      // Calculate total weeks
      const diffTime = end.getTime() - start.getTime();
      const diffDays = diffTime / (1000 * 60 * 60 * 24);
      result.totalWeeks = Math.ceil(diffDays / 7);
      
      result.isValid = true;
    } else if (start) {
      // Only start date, estimate 12 weeks
      result.startDate = start;
      result.endDate = new Date(start);
      result.endDate.setDate(result.endDate.getDate() + (12 * 7));
      result.totalWeeks = 12;
      result.isValid = true;
    } else if (end) {
      // Only end date, work backwards 12 weeks
      result.endDate = end;
      result.startDate = new Date(end);
      result.startDate.setDate(result.startDate.getDate() - (12 * 7));
      result.totalWeeks = 12;
      result.isValid = true;
    } else if (entryDateObj) {
      // Only entry date, estimate 12 weeks from entry
      result.startDate = entryDateObj;
      result.endDate = new Date(entryDateObj);
      result.endDate.setDate(result.endDate.getDate() + (12 * 7));
      result.totalWeeks = 12;
      result.isValid = true;
    }
    
  } catch (error) {
    console.error('[ValidPeriodParser] Error parsing valid period:', error);
  }
  
  return result;
};

/**
 * Parse date string into Date object
 * 解析日期字符串为Date对象
 * 
 * Supports formats:
 * - "2024-01-15"
 * - "2024/01/15"
 * - "2024.01.15"
 * - "2024年1月15日"
 * - "20240115"
 * 
 * @param {string} dateStr - Date string
 * @returns {Date|null} Parsed date or null
 */
const parseDateString = (dateStr) => {
  if (!dateStr || typeof dateStr !== 'string') {
    return null;
  }
  
  const str = dateStr.trim();
  
  // Try ISO format first
  const isoMatch = str.match(/(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
  if (isoMatch) {
    const [, year, month, day] = isoMatch;
    return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  }
  
  // Try Japanese format: "2024年1月15日"
  const jpMatch = str.match(/(\d{4})年(\d{1,2})月(\d{1,2})日/);
  if (jpMatch) {
    const [, year, month, day] = jpMatch;
    return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  }
  
  // Try compact format: "20240115"
  const compactMatch = str.match(/^(\d{4})(\d{2})(\d{2})$/);
  if (compactMatch) {
    const [, year, month, day] = compactMatch;
    return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  }
  
  // Try native Date parsing as fallback
  const parsed = new Date(str);
  if (!isNaN(parsed.getTime())) {
    return parsed;
  }
  
  return null;
};

/**
 * Parse time range string into start and end dates
 * 解析起止时间字符串为开始和结束日期
 * 
 * Supports formats:
 * - "1月-3月" (only month range, use entry date's year)
 * - "2024.1.15-2024.3.31" (full date range)
 * - "2024-01-15 至 2024-03-31"
 * - "春季" (season, estimate dates)
 * - "3个月" (duration, calculate from entry date)
 * 
 * @param {string} rangeStr - Time range string
 * @param {Date} entryDate - Entry date for context
 * @returns {Object} { start: Date|null, end: Date|null }
 */
const parseTimeRangeString = (rangeStr, entryDate) => {
  const result = { start: null, end: null };
  
  if (!rangeStr || typeof rangeStr !== 'string') {
    return result;
  }
  
  const str = rangeStr.trim();
  const currentYear = entryDate ? entryDate.getFullYear() : new Date().getFullYear();
  
  // Pattern 1: Full date range "2024.1.15-2024.3.31" or "2024-01-15 至 2024-03-31"
  const fullRangeMatch = str.match(/(\d{4})[-./](\d{1,2})[-./](\d{1,2})\s*[-~至到]\s*(\d{4})[-./](\d{1,2})[-./](\d{1,2})/);
  if (fullRangeMatch) {
    const [, y1, m1, d1, y2, m2, d2] = fullRangeMatch;
    result.start = new Date(parseInt(y1), parseInt(m1) - 1, parseInt(d1));
    result.end = new Date(parseInt(y2), parseInt(m2) - 1, parseInt(d2));
    return result;
  }
  
  // Pattern 2: Month range "1月-3月" or "1月~3月"
  const monthRangeMatch = str.match(/(\d{1,2})月\s*[-~至到]\s*(\d{1,2})月/);
  if (monthRangeMatch) {
    const [, m1, m2] = monthRangeMatch;
    result.start = new Date(currentYear, parseInt(m1) - 1, 1);
    result.end = new Date(currentYear, parseInt(m2), 0); // Last day of m2
    return result;
  }
  
  // Pattern 3: Season "春季", "夏季", "秋季", "冬季"
  const seasonMap = {
    '春季': { startMonth: 2, endMonth: 4 },  // March-May
    '夏季': { startMonth: 5, endMonth: 7 },  // June-August
    '秋季': { startMonth: 8, endMonth: 10 }, // September-November
    '冬季': { startMonth: 11, endMonth: 1 }  // December-February (next year)
  };
  
  for (const [season, months] of Object.entries(seasonMap)) {
    if (str.includes(season)) {
      result.start = new Date(currentYear, months.startMonth, 1);
      if (season === '冬季') {
        result.end = new Date(currentYear + 1, months.endMonth, 0);
      } else {
        result.end = new Date(currentYear, months.endMonth + 1, 0);
      }
      return result;
    }
  }
  
  // Pattern 4: Duration "3个月", "12周"
  const monthDurationMatch = str.match(/(\d+)\s*个?月/);
  if (monthDurationMatch && entryDate) {
    const [, months] = monthDurationMatch;
    result.start = new Date(entryDate);
    result.end = new Date(entryDate);
    result.end.setMonth(result.end.getMonth() + parseInt(months));
    return result;
  }
  
  const weekDurationMatch = str.match(/(\d+)\s*[周週]/);
  if (weekDurationMatch && entryDate) {
    const [, weeks] = weekDurationMatch;
    result.start = new Date(entryDate);
    result.end = new Date(entryDate);
    result.end.setDate(result.end.getDate() + (parseInt(weeks) * 7));
    return result;
  }
  
  // Pattern 5: Single date (treat as start or end depending on context)
  const singleDate = parseDateString(str);
  if (singleDate) {
    // If single date is after entry date, treat as end date
    // Otherwise treat as start date
    if (entryDate && singleDate > entryDate) {
      result.end = singleDate;
    } else {
      result.start = singleDate;
    }
    return result;
  }
  
  return result;
};

/**
 * Check if a date is within valid period
 * 检查日期是否在有效周期内
 * 
 * @param {Date} date - Date to check
 * @param {Object} validPeriod - Valid period object from parseValidPeriod
 * @returns {boolean} True if date is within period
 */
export const isDateInValidPeriod = (date, validPeriod) => {
  if (!validPeriod || !validPeriod.isValid || !date) {
    return false;
  }
  
  const { startDate, endDate } = validPeriod;
  
  if (startDate && date < startDate) {
    return false;
  }
  
  if (endDate && date > endDate) {
    return false;
  }
  
  return true;
};

/**
 * Get human-readable valid period description
 * 获取人类可读的有效周期描述
 * 
 * @param {Object} validPeriod - Valid period object
 * @returns {string} Description
 */
export const getValidPeriodDescription = (validPeriod) => {
  if (!validPeriod || !validPeriod.isValid) {
    return '未设定';
  }
  
  const { startDate, endDate, totalWeeks } = validPeriod;
  
  const formatDate = (date) => {
    if (!date) return '';
    return `${date.getFullYear()}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getDate().toString().padStart(2, '0')}`;
  };
  
  const startStr = formatDate(startDate);
  const endStr = formatDate(endDate);
  
  if (startStr && endStr) {
    return `${startStr} ~ ${endStr} (${totalWeeks}周)`;
  } else if (startStr) {
    return `${startStr}起 (约${totalWeeks}周)`;
  } else if (endStr) {
    return `至${endStr} (约${totalWeeks}周)`;
  }
  
  return `约${totalWeeks}周`;
};

