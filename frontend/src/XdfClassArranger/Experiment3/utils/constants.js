// Excel 列标题（前途塾1v1约课.xlsx - 2512表）
export const EXCEL_COLUMNS = '校区\t学管姓名\t学生姓名\t学生批次\t录入日期\t上课频次\t上课时长\t上课形式\t上课内容\t学生水平\t所用课时\t出愿大学\t学部学科\t起止时间\t学生希望时间段\t希望具体时间\t每周频次\t课上具体内容\t备注';

// 教师数据列标题
export const TEACHER_COLUMNS = '教师级别\t老师姓名\t性别\t兼职/正社员\t出身校\t学科分类\t专业\t可带科目（可多选）\t可否修改志望理由书（10天修改）\t可带时间\t上课形式\t授课风格\t教龄\t时薪\t备注';

// 日系配色
export const JAPANESE_COLORS = [
  '#5A6C7D', '#6B7C6E', '#A08B7A', '#7A8C9E',
  '#8B7C6E', '#6E7C8B', '#9E7676', '#7A9E76'
];

// Time availability constants (时间可用性相关常量)
// Updated to 5-minute granularity (更新为5分钟粒度)
export const TIME_GRANULARITY = 5; // 5 minutes per slot (每个时间槽5分钟)
export const STANDARD_START = 9; // 9:00
export const STANDARD_END = 21.5; // 21:30
export const SLOTS_PER_HOUR = 60 / TIME_GRANULARITY; // 12 slots per hour (每小时12个时间槽)
export const SLOTS_PER_DAY = (STANDARD_END - STANDARD_START) * SLOTS_PER_HOUR; // 150 slots per day (每天150个时间槽)
export const TOTAL_WEEK_SLOTS = SLOTS_PER_DAY * 7; // 1050 slots per week (每周1050个时间槽)

// 星期映射
export const DAY_NAME_TO_NUMBER = {
  '周一': 1, '星期一': 1, '一': 1, 'mon': 1, 'monday': 1,
  '周二': 2, '星期二': 2, '二': 2, 'tue': 2, 'tuesday': 2,
  '周三': 3, '星期三': 3, '三': 3, 'wed': 3, 'wednesday': 3,
  '周四': 4, '星期四': 4, '四': 4, 'thu': 4, 'thursday': 4,
  '周五': 5, '星期五': 5, '五': 5, 'fri': 5, 'friday': 5,
  '周六': 6, '星期六': 6, '六': 6, 'sat': 6, 'saturday': 6,
  '周日': 0, '周天': 0, '星期日': 0, '星期天': 0, '日': 0, '天': 0, 'sun': 0, 'sunday': 0
};

// Utility functions (工具函数)

// Get random Japanese color (获取随机日系颜色)
export const getRandomJapaneseColor = () => {
  return JAPANESE_COLORS[Math.floor(Math.random() * JAPANESE_COLORS.length)];
};

/**
 * Convert time (hour, minute) to slot index
 * 将时间（小时，分钟）转换为时间槽索引
 * 
 * @param {number} hour - Hour (小时)
 * @param {number} minute - Minute (分钟), default 0
 * @returns {number} Slot index (时间槽索引)
 */
export const timeToSlotIndex = (hour, minute = 0) => {
  const totalHours = hour + minute / 60;
  return Math.floor((totalHours - STANDARD_START) * SLOTS_PER_HOUR);
};

/**
 * Convert slot index to time
 * 将时间槽索引转换为时间
 * 
 * @param {number} slotIndex - Slot index (时间槽索引)
 * @returns {Object} { hour, minute, string } Time object (时间对象)
 */
export const slotIndexToTime = (slotIndex) => {
  const totalMinutes = slotIndex * TIME_GRANULARITY + (STANDARD_START * 60);
  const hour = Math.floor(totalMinutes / 60);
  const minute = totalMinutes % 60;
  return {
    hour,
    minute,
    string: `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
  };
};

/**
 * Parse time string to slot index
 * 解析时间字符串为时间槽索引
 * 
 * @param {string} timeStr - Time string like "14:30" (时间字符串如"14:30")
 * @returns {number|null} Slot index or null if invalid (时间槽索引或null如果无效)
 */
export const parseTimeToSlotIndex = (timeStr) => {
  if (!timeStr) return null;
  const match = timeStr.match(/(\d{1,2})[:\uff1a]?(\d{2})?/);
  if (match) {
    const hours = parseInt(match[1]);
    const minutes = match[2] ? parseInt(match[2]) : 0;
    return timeToSlotIndex(hours, minutes);
  }
  return null;
};

/**
 * Check if a slot index is within valid range
 * 检查时间槽索引是否在有效范围内
 * 
 * @param {number} slotIndex - Slot index (时间槽索引)
 * @returns {boolean} True if valid (如果有效则返回true)
 */
export const isValidSlotIndex = (slotIndex) => {
  return slotIndex >= 0 && slotIndex < SLOTS_PER_DAY;
};


