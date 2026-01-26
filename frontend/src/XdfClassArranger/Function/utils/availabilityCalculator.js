/**
 * Availability Calculator Module
 * 可用性计算模块
 * 
 * Calculate student time availability and generate visualization events
 * 负责计算学生的时间可用性并生成可视化事件
 * 
 * Updated to use 5-minute granularity (更新为5分钟粒度)
 */

import {
  STANDARD_START,
  STANDARD_END,
  SLOTS_PER_DAY,
  TIME_GRANULARITY,
  SLOTS_PER_HOUR,
  timeToSlotIndex,
  slotIndexToTime,
  parseTimeToSlotIndex
} from './constants';

/**
 * Get availability color with 256-level depth
 * 获取256级色深的可用性颜色
 * 
 * Based on PRD requirements:
 * 根据PRD要求：
 * - Color depth = normalize(overlap count) * 256
 * - 颜色深度 = 归一化(重叠学生数) * 256
 * - Uses Japanese traditional color gradient
 * - 使用日系传统色彩渐变
 * 
 * @param {number} ratio - Availability ratio (0-1) (可用学生比例 0-1)
 * @param {number} overlapCount - Number of overlapping students (重叠学生数)
 * @param {number} maxOverlap - Maximum overlap in current view (当前视图最大重叠数)
 * @returns {string} RGBA color string (RGBA颜色字符串)
 */
const getAvailabilityColor = (ratio, overlapCount = 0, maxOverlap = 1) => {
  // Calculate 256-level depth (计算256级深度)
  const depth = Math.round((overlapCount / maxOverlap) * 256);
  
  return interpolateJapaneseColor(depth);
};

/**
 * Interpolate Japanese traditional colors with 256 levels
 * 256级日系传统色彩插值
 * 
 * Color gradient (色彩渐变):
 * 浅葱色(#84A9A9) → 若竹色(#689B89) → 若草色(#889963) →
 * 柑子色(#B78F5D) → 紅梅色(#AA6D5B)
 * 
 * @param {number} depth - Color depth 0-256 (色深 0-256)
 * @returns {string} RGBA color string (RGBA颜色字符串)
 */
const interpolateJapaneseColor = (depth) => {
  // Clamp depth to 0-256 (限制深度在0-256之间)
  depth = Math.max(0, Math.min(256, depth));
  
  // Color stops with depth ranges (色彩停止点及深度范围)
  // Each range represents approximately 51-52 depth levels (每个范围约51-52个深度级别)
  const colorStops = [
    { depth: 0, rgb: [132, 169, 169], alpha: 0.3, name: '浅葱色' },   // Asagi (light blue-green)
    { depth: 51, rgb: [132, 169, 169], alpha: 0.5, name: '浅葱色' },  // Asagi transition
    { depth: 102, rgb: [104, 155, 137], alpha: 0.6, name: '若竹色' }, // Wakatake (young bamboo)
    { depth: 153, rgb: [136, 153, 99], alpha: 0.7, name: '若草色' },  // Wakakusa (young grass)
    { depth: 204, rgb: [183, 143, 93], alpha: 0.8, name: '柑子色' },  // Kouji (mandarin)
    { depth: 256, rgb: [170, 109, 91], alpha: 0.9, name: '紅梅色' }   // Koubai (red plum)
  ];
  
  // Find the two color stops to interpolate between
  // 找到需要插值的两个色彩停止点
  let lowerStop = colorStops[0];
  let upperStop = colorStops[colorStops.length - 1];
  
  for (let i = 0; i < colorStops.length - 1; i++) {
    if (depth >= colorStops[i].depth && depth <= colorStops[i + 1].depth) {
      lowerStop = colorStops[i];
      upperStop = colorStops[i + 1];
      break;
    }
  }
  
  // Calculate interpolation factor (计算插值因子)
  const range = upperStop.depth - lowerStop.depth;
  const factor = range > 0 ? (depth - lowerStop.depth) / range : 0;
  
  // Interpolate RGB and alpha (插值RGB和透明度)
  const r = Math.round(lowerStop.rgb[0] + (upperStop.rgb[0] - lowerStop.rgb[0]) * factor);
  const g = Math.round(lowerStop.rgb[1] + (upperStop.rgb[1] - lowerStop.rgb[1]) * factor);
  const b = Math.round(lowerStop.rgb[2] + (upperStop.rgb[2] - lowerStop.rgb[2]) * factor);
  const a = lowerStop.alpha + (upperStop.alpha - lowerStop.alpha) * factor;
  
  return `rgba(${r}, ${g}, ${b}, ${a.toFixed(2)})`;
};

/**
 * Get color depth value (0-256) for a given ratio
 * 获取给定比例的色深值(0-256)
 * 
 * @param {number} overlapCount - Number of overlapping students (重叠学生数)
 * @param {number} maxOverlap - Maximum overlap count (最大重叠数)
 * @returns {number} Depth value 0-256 (深度值 0-256)
 */
export const getColorDepth = (overlapCount, maxOverlap) => {
  if (maxOverlap === 0) return 0;
  return Math.round((overlapCount / maxOverlap) * 256);
};

/**
 * Parse time string to hours (for legacy compatibility)
 * 解析时间字符串为小时数（用于向后兼容）
 * 
 * @param {string} timeStr - Time string (时间字符串)
 * @returns {number|null} Hours with decimal (小时数含小数)
 * @deprecated Use parseTimeToSlotIndex instead for 5-minute granularity
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

  // Initialize: Default all available (maximum tolerance)
  // 初始化：默认全部可用（最大 tolerance）
  // availability[day][slot] = true/false
  // day: 0=Sunday, 1=Monday, ..., 6=Saturday (0=周日, 1=周一, ..., 6=周六)
  // slot: 5-minute slots from 9:00, total 150 slots (9:00-21:30)
  //       (每5分钟一个slot，从9:00开始，共150个slot (9:00-21:30))
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
    // Find time range (查找时间范围)
    const timeRangeMatch = timeText.match(/(\d{1,2})[:\uff1a]?(\d{2})?\s*[-~到]\s*(\d{1,2})[:\uff1a]?(\d{2})?/);

    if (timeRangeMatch) {
      const startHour = parseInt(timeRangeMatch[1]);
      const startMin = timeRangeMatch[2] ? parseInt(timeRangeMatch[2]) : 0;
      const endHour = parseInt(timeRangeMatch[3]);
      const endMin = timeRangeMatch[4] ? parseInt(timeRangeMatch[4]) : 0;

      // Determine if exclusion or specification (判断是排除还是指定)
      const isExclusion = timeText.includes('除') || timeText.includes('不') || timeText.includes('之外');

      const startSlot = timeToSlotIndex(startHour, startMin);
      const endSlot = timeToSlotIndex(endHour, endMin);

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

    // Process time keywords like "morning", "afternoon", "evening"
    // 处理"上午"、"下午"、"晚上"等关键词
    if (timeText.includes('上午') && !timeText.includes('除') && !timeText.includes('不')) {
      // Morning only (9:00-12:00) (只有上午可用 9:00-12:00)
      const noonSlot = timeToSlotIndex(12, 0);
      for (let d = 0; d < 7; d++) {
        for (let s = noonSlot; s < SLOTS_PER_DAY; s++) {
          availability[d][s] = false;
        }
      }
    } else if (timeText.includes('下午') && !timeText.includes('除') && !timeText.includes('不')) {
      // Afternoon only (12:00-18:00) (只有下午可用 12:00-18:00)
      const noonSlot = timeToSlotIndex(12, 0);
      const eveningSlot = timeToSlotIndex(18, 0);
      for (let d = 0; d < 7; d++) {
        for (let s = 0; s < noonSlot; s++) {
          availability[d][s] = false;
        }
        for (let s = eveningSlot; s < SLOTS_PER_DAY; s++) {
          availability[d][s] = false;
        }
      }
    } else if (timeText.includes('晚上') && !timeText.includes('除') && !timeText.includes('不')) {
      // Evening only (18:00-21:30) (只有晚上可用 18:00-21:30)
      const eveningSlot = timeToSlotIndex(18, 0);
      for (let d = 0; d < 7; d++) {
        for (let s = 0; s < eveningSlot; s++) {
          availability[d][s] = false;
        }
      }
    }
  }

  return availability;
};

/**
 * Calculate overlapping availability for all students with 256-level depth
 * 计算所有学生的重叠可用性（256级深度）
 * 
 * @param {Array} studentsWithData - Students with data (有数据的学生数组)
 * @returns {Object} { overlap, totalStudents, maxOverlap, depthMatrix }
 */
export const calculateOverlappingAvailability = (studentsWithData) => {
  // overlap[day][slot] = number of available students (可用学生数量)
  const overlap = Array(7).fill(null).map(() => Array(SLOTS_PER_DAY).fill(0));
  
  // Store student references for each slot (存储每个时间槽的学生引用)
  const studentRefs = Array(7).fill(null).map(() => 
    Array(SLOTS_PER_DAY).fill(null).map(() => [])
  );

  let totalStudentsWithAvailability = 0;
  let maxOverlap = 0;

  studentsWithData.forEach(student => {
    if (!student.rawData) return;
    const availability = parseStudentAvailability(student.rawData);
    if (!availability) return;

    totalStudentsWithAvailability++;

    for (let d = 0; d < 7; d++) {
      for (let s = 0; s < SLOTS_PER_DAY; s++) {
        if (availability[d][s]) {
          overlap[d][s]++;
          studentRefs[d][s].push({
            id: student.id,
            name: student.name,
            color: student.color
          });
          maxOverlap = Math.max(maxOverlap, overlap[d][s]);
        }
      }
    }
  });
  
  // Calculate depth matrix (计算深度矩阵)
  const depthMatrix = Array(7).fill(null).map(() => Array(SLOTS_PER_DAY).fill(0));
  
  for (let d = 0; d < 7; d++) {
    for (let s = 0; s < SLOTS_PER_DAY; s++) {
      if (maxOverlap > 0) {
        depthMatrix[d][s] = getColorDepth(overlap[d][s], maxOverlap);
      }
    }
  }

  return {
    overlap,
    totalStudents: totalStudentsWithAvailability,
    maxOverlap: maxOverlap || 1, // Avoid division by zero (避免除零)
    depthMatrix,
    studentRefs
  };
};

/**
 * Generate availability background events with 256-level color depth
 * 生成256级色深的可用性背景事件（用于FullCalendar显示）
 * 
 * @param {Array} students - Student array (学生数组)
 * @param {Object} calendarRef - FullCalendar ref
 * @returns {Array} FullCalendar event array (事件数组)
 */
export const generateAvailabilityEvents = (students, calendarRef) => {
  const studentsWithData = students.filter(s => s.rawData);
  if (studentsWithData.length === 0) return [];

  const { overlap, totalStudents, maxOverlap, depthMatrix, studentRefs } = 
    calculateOverlappingAvailability(studentsWithData);
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
        // Start new segment (开始新段)
        segmentStart = s;
        segmentCount = count;
      } else if ((count === 0 || count !== segmentCount) && segmentStart !== null) {
        // End current segment (结束当前段)
        const startTime = slotIndexToTime(segmentStart);
        const endTime = slotIndexToTime(s);

        // Calculate ratio and color depth (计算比例和色深)
        const ratio = segmentCount / totalStudents;
        const depth = getColorDepth(segmentCount, maxOverlap);
        const color = getAvailabilityColor(ratio, segmentCount, maxOverlap);

        // Get students for this segment (获取该时间段的学生)
        const segmentStudents = studentRefs[d][segmentStart] || [];

        events.push({
          id: `avail-${d}-${segmentStart}`,
          start: `${dateStr}T${startTime.string}:00`,
          end: `${dateStr}T${endTime.string}:00`,
          display: 'background',
          backgroundColor: color,
          extendedProps: {
            type: 'availability',
            studentCount: segmentCount,
            totalStudents: totalStudents,
            maxOverlap: maxOverlap,
            ratio: ratio,
            startSlot: segmentStart,
            endSlot: s,
            depth: depth, // 256-level color depth (256级色深)
            students: segmentStudents, // Students available in this slot (该时间槽可用的学生)
            day: d
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

