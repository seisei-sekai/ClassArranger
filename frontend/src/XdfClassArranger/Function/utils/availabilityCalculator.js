/**
 * 可用性计算模块
 * 负责计算学生的时间可用性并生成可视化事件
 */

import { STANDARD_START, STANDARD_END, SLOTS_PER_DAY } from './constants';

/**
 * 根据学生可用比例返回渐变色
 * 使用日系传统色彩，从冷色调（少学生）到暖色调（多学生）
 * @param {number} ratio - 可用学生比例 (0-1)
 * @returns {string} RGBA颜色字符串
 */
const getAvailabilityColor = (ratio) => {
  // 日系传统渐变色：浅葱色 → 若竹色 → 若草色 → 柑子色 → 紅梅色
  
  if (ratio <= 0.2) {
    // 0-20%: 浅葱色 (淡青蓝) - 很少学生
    const intensity = ratio / 0.2;
    return `rgba(132, 169, 169, ${0.3 + intensity * 0.3})`;
  } else if (ratio <= 0.4) {
    // 20-40%: 若竹色 (青绿)
    const intensity = (ratio - 0.2) / 0.2;
    return `rgba(104, 155, 137, ${0.4 + intensity * 0.2})`;
  } else if (ratio <= 0.6) {
    // 40-60%: 若草色 (黄绿)
    const intensity = (ratio - 0.4) / 0.2;
    return `rgba(136, 153, 99, ${0.5 + intensity * 0.2})`;
  } else if (ratio <= 0.8) {
    // 60-80%: 柑子色 (橙黄)
    const intensity = (ratio - 0.6) / 0.2;
    return `rgba(183, 143, 93, ${0.6 + intensity * 0.15})`;
  } else {
    // 80-100%: 紅梅色 (橙红) - 很多学生
    const intensity = (ratio - 0.8) / 0.2;
    return `rgba(170, 109, 91, ${0.7 + intensity * 0.2})`;
  }
};

/**
 * 解析时间字符串为小时数（如 "13:30" -> 13.5）
 * @param {string} timeStr - 时间字符串
 * @returns {number|null} 小时数（含小数）
 */
const parseTimeToHours = (timeStr) => {
  if (!timeStr) return null;
  const match = timeStr.match(/(\d{1,2})[:\uff1a]?(\d{2})?/);
  if (match) {
    const hours = parseInt(match[1]);
    const minutes = match[2] ? parseInt(match[2]) : 0;
    return hours + minutes / 60;
  }
  return null;
};

/**
 * 解析学生的时间约束，返回可用性矩阵
 * 最大 tolerance：默认所有时间都可用，除非明确禁止
 * @param {string} rawData - 学生的原始Excel数据
 * @returns {Array|null} 7x25的二维数组，availability[day][slot] = true/false
 */
export const parseStudentAvailability = (rawData) => {
  if (!rawData) return null;
  
  const values = rawData.split('\t');
  // 索引: 5=上课频次, 6=上课时长, 13=起止时间, 14=学生希望时间段, 15=希望具体时间, 16=每周频次
  const frequency = values[5] || '';
  const duration = values[6] || '';
  const deadline = values[13] || '';
  const preferredDays = values[14] || '';
  const specificTime = values[15] || '';
  const weeklyFrequency = values[16] || '';
  
  // 初始化：默认全部可用（最大 tolerance）
  // availability[day][slot] = true/false
  // day: 0=周日, 1=周一, ..., 6=周六
  // slot: 每30分钟一个slot，从9:00开始，共25个slot (9:00-21:30)
  const availability = Array(7).fill(null).map(() => Array(SLOTS_PER_DAY).fill(true));
  
  // 解析希望时间段（如：周一到周五、都可以、周末等）
  const dayText = preferredDays.toLowerCase();
  
  // 如果明确指定了某些天
  if (dayText.includes('周一') && dayText.includes('周五') && (dayText.includes('到') || dayText.includes('-'))) {
    // 周一到周五
    availability[0] = Array(SLOTS_PER_DAY).fill(false); // 周日不可用
    availability[6] = Array(SLOTS_PER_DAY).fill(false); // 周六不可用
  } else if (dayText.includes('周末') && !dayText.includes('不') && !dayText.includes('除')) {
    // 只有周末
    for (let d = 1; d <= 5; d++) {
      availability[d] = Array(SLOTS_PER_DAY).fill(false);
    }
  }
  
  // 解析具体时间约束（如：除了下午语校之外都可以（13:30-16:45））
  const timeText = specificTime;
  if (timeText) {
    // 查找时间范围
    const timeRangeMatch = timeText.match(/(\d{1,2})[:\uff1a]?(\d{2})?\s*[-~到]\s*(\d{1,2})[:\uff1a]?(\d{2})?/);
    
    if (timeRangeMatch) {
      const startHour = parseInt(timeRangeMatch[1]) + (timeRangeMatch[2] ? parseInt(timeRangeMatch[2]) / 60 : 0);
      const endHour = parseInt(timeRangeMatch[3]) + (timeRangeMatch[4] ? parseInt(timeRangeMatch[4]) / 60 : 0);
      
      // 判断是排除还是指定
      const isExclusion = timeText.includes('除') || timeText.includes('不') || timeText.includes('之外');
      
      const startSlot = Math.floor((startHour - STANDARD_START) / 0.5);
      const endSlot = Math.ceil((endHour - STANDARD_START) / 0.5);
      
      if (isExclusion) {
        // 排除这个时间段
        for (let d = 0; d < 7; d++) {
          for (let s = Math.max(0, startSlot); s < Math.min(SLOTS_PER_DAY, endSlot); s++) {
            availability[d][s] = false;
          }
        }
      } else {
        // 只有这个时间段可用
        for (let d = 0; d < 7; d++) {
          for (let s = 0; s < SLOTS_PER_DAY; s++) {
            if (s < startSlot || s >= endSlot) {
              availability[d][s] = false;
            }
          }
        }
      }
    }
    
    // 处理"上午"、"下午"、"晚上"等关键词
    if (timeText.includes('上午') && !timeText.includes('除') && !timeText.includes('不')) {
      // 只有上午可用 (9:00-12:00)
      for (let d = 0; d < 7; d++) {
        for (let s = 6; s < SLOTS_PER_DAY; s++) { // 12:00之后
          availability[d][s] = false;
        }
      }
    } else if (timeText.includes('下午') && !timeText.includes('除') && !timeText.includes('不')) {
      // 只有下午可用 (12:00-18:00)
      for (let d = 0; d < 7; d++) {
        for (let s = 0; s < 6; s++) { // 12:00之前
          availability[d][s] = false;
        }
        for (let s = 18; s < SLOTS_PER_DAY; s++) { // 18:00之后
          availability[d][s] = false;
        }
      }
    } else if (timeText.includes('晚上') && !timeText.includes('除') && !timeText.includes('不')) {
      // 只有晚上可用 (18:00-21:30)
      for (let d = 0; d < 7; d++) {
        for (let s = 0; s < 18; s++) { // 18:00之前
          availability[d][s] = false;
        }
      }
    }
  }
  
  return availability;
};

/**
 * 计算所有学生的重叠可用性
 * @param {Array} studentsWithData - 有数据的学生数组
 * @returns {Object} {overlap: 二维数组, totalStudents: 总学生数}
 */
export const calculateOverlappingAvailability = (studentsWithData) => {
  // overlap[day][slot] = 可用学生数量
  const overlap = Array(7).fill(null).map(() => Array(SLOTS_PER_DAY).fill(0));
  
  let totalStudentsWithAvailability = 0;
  
  studentsWithData.forEach(student => {
    if (!student.rawData) return;
    const availability = parseStudentAvailability(student.rawData);
    if (!availability) return;
    
    totalStudentsWithAvailability++;
    
    for (let d = 0; d < 7; d++) {
      for (let s = 0; s < SLOTS_PER_DAY; s++) {
        if (availability[d][s]) {
          overlap[d][s]++;
        }
      }
    }
  });
  
  return { overlap, totalStudents: totalStudentsWithAvailability };
};

/**
 * 生成可用性背景事件（用于FullCalendar显示）
 * @param {Array} students - 学生数组
 * @param {Object} calendarRef - FullCalendar的ref
 * @returns {Array} FullCalendar事件数组
 */
export const generateAvailabilityEvents = (students, calendarRef) => {
  const studentsWithData = students.filter(s => s.rawData);
  if (studentsWithData.length === 0) return [];
  
  const { overlap, totalStudents } = calculateOverlappingAvailability(studentsWithData);
  if (totalStudents === 0) return [];
  
  const events = [];
  
  // 获取当前周的日期
  const calendarApi = calendarRef.current?.getApi();
  const currentDate = calendarApi ? calendarApi.getDate() : new Date();
  
  // 找到当前周的周日
  const weekStart = new Date(currentDate);
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());
  
  for (let d = 0; d < 7; d++) {
    const dayDate = new Date(weekStart);
    dayDate.setDate(dayDate.getDate() + d);
    const dateStr = dayDate.toISOString().split('T')[0];
    
    // 合并连续的时间段
    let segmentStart = null;
    let segmentCount = 0;
    
    for (let s = 0; s <= SLOTS_PER_DAY; s++) {
      const count = s < SLOTS_PER_DAY ? overlap[d][s] : 0;
      
      if (count > 0 && segmentStart === null) {
        // 开始新段
        segmentStart = s;
        segmentCount = count;
      } else if ((count === 0 || count !== segmentCount) && segmentStart !== null) {
        // 结束当前段
        const startHour = STANDARD_START + segmentStart * 0.5;
        const endHour = STANDARD_START + s * 0.5;
        
        // 计算学生比例并获取对应颜色
        const ratio = segmentCount / totalStudents;
        const color = getAvailabilityColor(ratio);
        
        events.push({
          id: `avail-${d}-${segmentStart}`,
          start: `${dateStr}T${String(Math.floor(startHour)).padStart(2, '0')}:${startHour % 1 === 0.5 ? '30' : '00'}:00`,
          end: `${dateStr}T${String(Math.floor(endHour)).padStart(2, '0')}:${endHour % 1 === 0.5 ? '30' : '00'}:00`,
          display: 'background',
          backgroundColor: color,
          extendedProps: {
            type: 'availability',
            studentCount: segmentCount,
            totalStudents: totalStudents,
            ratio: ratio
          }
        });
        
        // 如果当前格子有新的数量，开始新段
        if (count > 0) {
          segmentStart = s;
          segmentCount = count;
        } else {
          segmentStart = null;
        }
      }
    }
  }
  
  return events;
};

/**
 * 获取特定时间槽的可用学生列表
 * @param {Array} students - 学生数组
 * @param {number} dayOfWeek - 星期几 (0=周日, 1=周一, ...)
 * @param {number} slotIndex - 时间槽索引
 * @returns {Array} 可用学生数组，每个元素包含 {name, color, constraints}
 */
export const getStudentsForTimeSlot = (students, dayOfWeek, slotIndex) => {
  const availableStudents = [];
  
  students.filter(s => s.rawData).forEach(student => {
    const availability = parseStudentAvailability(student.rawData);
    if (availability && availability[dayOfWeek] && availability[dayOfWeek][slotIndex]) {
      const values = student.rawData.split('\t');
      const constraints = {
        frequency: values[5] || '-',
        duration: values[6] || '-',
        deadline: values[13] || '-',
        preferredDays: values[14] || '-',
        specificTime: values[15] || '-',
        weeklyFrequency: values[16] || '-'
      };
      
      availableStudents.push({
        name: student.name,
        color: student.color,
        constraints: constraints
      });
    }
  });
  
  return availableStudents;
};

