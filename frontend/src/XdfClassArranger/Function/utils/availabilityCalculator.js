/**
 * Availability Calculator Module (Refactored)
 * 可用性计算模块（重构版）
 * 
 * Architecture:
 * 1. Pure functions for date parsing and validation
 * 2. Clear separation of concerns
 * 3. Comprehensive test coverage
 * 
 * Key principle: Students should ONLY appear on or after their entry date
 * 核心原则：学生只应在录入日期当天或之后显示
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
 * Parse entry date from rawData
 * 从原始数据解析录入日期
 * 
 * @param {string} rawData - Tab-separated student data
 * @returns {Date|null} Parsed date or null if invalid
 */
export const parseEntryDate = (rawData) => {
  if (!rawData) return null;
  
  let entryDateStr = '';
  
  // Handle both string (Excel paste) and object (test data) formats
  if (typeof rawData === 'string') {
    const values = rawData.split('\t');
    entryDateStr = values[4] ? values[4].trim() : ''; // Index 4 = 录入日期
  } else if (typeof rawData === 'object') {
    entryDateStr = rawData.录入日期 || rawData.entryDate || '';
  }
  
  if (!entryDateStr) return null;
  
  // Support formats: 12/1/25, 2025/12/1, 2025-12-01
  const parts = entryDateStr.split(/[\/\-\.]/);
  if (parts.length < 3) return null;
  
  let year, month, day;
  
  if (parts[0].length === 4) {
    // YYYY/MM/DD or YYYY-MM-DD format
    year = parseInt(parts[0]);
    month = parseInt(parts[1]);
    day = parseInt(parts[2]);
  } else if (parts[2].length === 2 || parts[2].length === 4) {
    // MM/DD/YY format (e.g., 12/1/25) or MM/DD/YYYY
    month = parseInt(parts[0]);
    day = parseInt(parts[1]);
    year = parseInt(parts[2]);
    if (year < 100) {
      year += 2000;
    }
  } else {
    return null;
  }
  
  // Validate
  if (isNaN(year) || isNaN(month) || isNaN(day)) return null;
  if (month < 1 || month > 12) return null;
  if (day < 1 || day > 31) return null;
  
  const date = new Date(year, month - 1, day);
  date.setHours(0, 0, 0, 0);
  return date;
};

/**
 * Check if a specific date is on or after the student's entry date
 * 检查指定日期是否在学生录入日期当天或之后
 * 
 * @param {Date} targetDate - The date to check
 * @param {Date|null} entryDate - Student's entry date
 * @returns {boolean} True if target date is valid for this student
 */
export const isDateAfterEntry = (targetDate, entryDate) => {
  if (!entryDate) return true; // No entry date means always available
  if (!targetDate) return false;
  
  // Normalize both dates to midnight for comparison
  const target = new Date(targetDate);
  target.setHours(0, 0, 0, 0);
  
  const entry = new Date(entryDate);
  entry.setHours(0, 0, 0, 0);
  
  return target >= entry;
};

/**
 * Get availability color with 256-level depth
 * 获取256级色深的可用性颜色
 */
const getAvailabilityColor = (ratio, overlapCount = 0, maxOverlap = 1) => {
  const depth = Math.round((overlapCount / maxOverlap) * 256);
  return interpolateJapaneseColor(depth);
};

/**
 * Interpolate Japanese traditional colors with 256 levels
 * 256级日系传统色彩插值
 */
const interpolateJapaneseColor = (depth) => {
  depth = Math.max(0, Math.min(256, depth));
  
  const colorStops = [
    { depth: 0, rgb: [132, 169, 169], alpha: 0.3, name: '浅葱色' },
    { depth: 51, rgb: [132, 169, 169], alpha: 0.5, name: '浅葱色' },
    { depth: 102, rgb: [104, 155, 137], alpha: 0.6, name: '若竹色' },
    { depth: 153, rgb: [136, 153, 99], alpha: 0.7, name: '若草色' },
    { depth: 204, rgb: [183, 143, 93], alpha: 0.8, name: '柑子色' },
    { depth: 256, rgb: [170, 109, 91], alpha: 0.9, name: '紅梅色' }
  ];
  
  let lowerStop = colorStops[0];
  let upperStop = colorStops[colorStops.length - 1];
  
  for (let i = 0; i < colorStops.length - 1; i++) {
    if (depth >= colorStops[i].depth && depth <= colorStops[i + 1].depth) {
      lowerStop = colorStops[i];
      upperStop = colorStops[i + 1];
      break;
    }
  }
  
  const range = upperStop.depth - lowerStop.depth;
  const factor = range > 0 ? (depth - lowerStop.depth) / range : 0;
  
  const r = Math.round(lowerStop.rgb[0] + (upperStop.rgb[0] - lowerStop.rgb[0]) * factor);
  const g = Math.round(lowerStop.rgb[1] + (upperStop.rgb[1] - lowerStop.rgb[1]) * factor);
  const b = Math.round(lowerStop.rgb[2] + (upperStop.rgb[2] - lowerStop.rgb[2]) * factor);
  const a = lowerStop.alpha + (upperStop.alpha - lowerStop.alpha) * factor;
  
  return `rgba(${r}, ${g}, ${b}, ${a.toFixed(2)})`;
};

/**
 * Get color depth value (0-256)
 */
const getColorDepth = (overlapCount, maxOverlap) => {
  if (maxOverlap === 0) return 0;
  return Math.round((overlapCount / maxOverlap) * 256);
};

/**
 * Parse student availability from NLP-parsed data (PRIORITY)
 * 从NLP解析的数据生成可用性矩阵（优先级最高）
 * 
 * @param {Object} parsedData - NLP parsed constraint data
 * @returns {Array<Array<boolean>>|null} 7x150 availability matrix or null
 */
export const parseStudentAvailabilityFromParsedData = (parsedData) => {
  if (!parsedData || !parsedData.success) return null;

  // Initialize: Default all UNAVAILABLE (conservative approach)
  // 初始化：默认全部不可用（保守策略）
  const availability = Array(7).fill(null).map(() => Array(SLOTS_PER_DAY).fill(false));

  const allowedDays = parsedData.allowedDays || [];
  const allowedRanges = parsedData.allowedTimeRanges || [];
  const excludedRanges = parsedData.excludedTimeRanges || [];

  // Logic: 
  // 1. If allowedTimeRanges is specified, ONLY those ranges are available
  // 2. If allowedTimeRanges is empty, use allowedDays (entire days available)
  // 3. Finally apply excludedTimeRanges to remove specific slots

  if (allowedRanges.length > 0) {
    // Step 1: Apply specific allowedTimeRanges
    // 步骤1：应用具体的允许时间段
    for (const range of allowedRanges) {
      const startSlot = range.start;
      const endSlot = range.end;
      
      if (startSlot !== undefined && endSlot !== undefined) {
        if (range.day === null) {
          // Apply to all allowed days
          const targetDays = allowedDays.length > 0 ? allowedDays : [0, 1, 2, 3, 4, 5, 6];
          for (const day of targetDays) {
            for (let s = startSlot; s < endSlot && s < SLOTS_PER_DAY; s++) {
              availability[day][s] = true;
            }
          }
        } else if (range.day >= 0 && range.day <= 6) {
          // Apply to specific day
          for (let s = startSlot; s < endSlot && s < SLOTS_PER_DAY; s++) {
            availability[range.day][s] = true;
          }
        }
      }
    }
  } else {
    // Step 2: No specific time ranges, use allowedDays (entire days available)
    // 步骤2：没有具体时间段，使用允许的天数（整天可用）
    for (const day of allowedDays) {
      if (day >= 0 && day <= 6) {
        availability[day] = Array(SLOTS_PER_DAY).fill(true);
      }
    }
  }

  // Step 3: Apply excludedTimeRanges - mark specific slots as unavailable
  // 步骤3：应用排除的时间段
  for (const range of excludedRanges) {
    const startSlot = range.start;
    const endSlot = range.end;
    
    if (startSlot !== undefined && endSlot !== undefined) {
      if (range.day === null) {
        // Apply to all days
        for (let d = 0; d < 7; d++) {
          for (let s = startSlot; s < endSlot && s < SLOTS_PER_DAY; s++) {
            availability[d][s] = false;
          }
        }
      } else if (range.day >= 0 && range.day <= 6) {
        // Apply to specific day
        for (let s = startSlot; s < endSlot && s < SLOTS_PER_DAY; s++) {
          availability[range.day][s] = false;
        }
      }
    }
  }

  return availability;
};

/**
 * Parse student time availability from rawData (FALLBACK)
 * 从原始数据解析学生的时间可用性（回退方案）
 * 
 * @param {string} rawData - Tab-separated student data
 * @returns {Array<Array<boolean>>|null} 7x150 availability matrix or null
 */
export const parseStudentAvailabilityFromRawData = (rawData) => {
  if (!rawData) return null;

  let frequency, duration, deadline, preferredDays, specificTime, weeklyFrequency;

  // Handle both string (Excel paste) and object (test data) formats
  if (typeof rawData === 'string') {
    const values = rawData.split('\t');
    frequency = values[5] || '';
    duration = values[6] || '';
    deadline = values[13] || '';
    preferredDays = values[14] || '';
    specificTime = values[15] || '';
    weeklyFrequency = values[16] || '';
  } else if (typeof rawData === 'object') {
    // Object format (from test data generator or parsed data)
    frequency = rawData.频次 || rawData.frequency || '';
    duration = rawData.时长 || rawData.duration || '';
    deadline = rawData.截止时间 || rawData.deadline || '';
    preferredDays = rawData.希望时间段 || rawData.preferredDays || '';
    specificTime = rawData.具体时间 || rawData.specificTime || '';
    weeklyFrequency = rawData.每周频次 || rawData.weeklyFrequency || '';
  } else {
    return null;
  }

  // Initialize: Default all available (maximum tolerance)
  const availability = Array(7).fill(null).map(() => Array(SLOTS_PER_DAY).fill(true));

  // Parse preferred days
  const dayText = preferredDays.toLowerCase();

  if (dayText.includes('周一') && dayText.includes('周五') && (dayText.includes('到') || dayText.includes('-'))) {
    // Weekdays only (Monday-Friday)
    availability[0] = Array(SLOTS_PER_DAY).fill(false); // Sunday
    availability[6] = Array(SLOTS_PER_DAY).fill(false); // Saturday
  } else if (dayText.includes('周末') && !dayText.includes('不') && !dayText.includes('除')) {
    // Weekends only
    for (let d = 1; d <= 5; d++) {
      availability[d] = Array(SLOTS_PER_DAY).fill(false);
    }
  }

  // Parse specific time constraints
  const timeText = specificTime;
  if (timeText) {
    const timeRangeMatch = timeText.match(/(\d{1,2})[:\uff1a]?(\d{2})?\s*[-~到]\s*(\d{1,2})[:\uff1a]?(\d{2})?/);

    if (timeRangeMatch) {
      const startHour = parseInt(timeRangeMatch[1]);
      const startMin = timeRangeMatch[2] ? parseInt(timeRangeMatch[2]) : 0;
      const endHour = parseInt(timeRangeMatch[3]);
      const endMin = timeRangeMatch[4] ? parseInt(timeRangeMatch[4]) : 0;

      const isExclusion = timeText.includes('除') || timeText.includes('不') || timeText.includes('之外');

      const startSlot = timeToSlotIndex(startHour, startMin);
      const endSlot = timeToSlotIndex(endHour, endMin);

      if (startSlot !== null && endSlot !== null) {
        for (let d = 0; d < 7; d++) {
          if (isExclusion) {
            // Mark these slots as unavailable
            for (let s = startSlot; s < endSlot; s++) {
              availability[d][s] = false;
            }
          } else {
            // Only these slots are available
            for (let s = 0; s < SLOTS_PER_DAY; s++) {
              availability[d][s] = (s >= startSlot && s < endSlot);
            }
          }
        }
      }
    }
  }

  return availability;
};

/**
 * Parse student availability (UNIFIED ENTRY POINT)
 * 解析学生可用性（统一入口）
 * 
 * Priority:
 * 1. Use parsedData (from NLP) if available and valid
 * 2. Fallback to rawData parsing
 * 
 * @param {Object} student - Full student object
 * @returns {Array<Array<boolean>>|null} 7x150 availability matrix or null
 */
export const parseStudentAvailability = (student) => {
  if (!student) return null;

  // Priority 1: Use NLP-parsed data if available
  if (student.parsedData && student.parsedData.success) {
    console.log(`[ParseAvailability] ${student.name}: Using NLP parsedData`);
    const availability = parseStudentAvailabilityFromParsedData(student.parsedData);
    if (availability) return availability;
  }

  // Priority 2: Use constraint data (alternative structure)
  if (student.constraint && student.constraint.success) {
    console.log(`[ParseAvailability] ${student.name}: Using constraint data`);
    const availability = parseStudentAvailabilityFromParsedData(student.constraint);
    if (availability) return availability;
  }

  // Fallback: Parse from rawData
  if (student.rawData) {
    console.log(`[ParseAvailability] ${student.name}: Fallback to rawData parsing`);
    return parseStudentAvailabilityFromRawData(student.rawData);
  }

  console.warn(`[ParseAvailability] ${student.name}: No valid data source found`);
  return null;
};

/**
 * Calculate overlapping availability for all students (REFACTORED)
 * 计算所有学生的重叠可用性（重构版）
 * 
 * Core Logic:
 * 1. Parse each student's entry date
 * 2. For each day in the week, check if day >= entry date
 * 3. Only count students who pass the date check
 * 
 * @param {Array} studentsWithData - Students with rawData
 * @param {Date} weekStart - Start of the week (Sunday at 00:00:00)
 * @returns {Object} Availability data structure
 */
export const calculateOverlappingAvailability = (studentsWithData, weekStart) => {
  // Initialize overlap matrix
  const overlap = Array(7).fill(null).map(() => Array(SLOTS_PER_DAY).fill(0));
  
  // Store student references for each slot
  const studentRefs = Array(7).fill(null).map(() => 
    Array(SLOTS_PER_DAY).fill(null).map(() => [])
  );

  let totalStudentsWithAvailability = 0;
  let maxOverlap = 0;

  // Pre-parse all student data for clarity
  const studentAvailabilityData = studentsWithData.map(student => {
    // Parse availability using UNIFIED function (prioritizes parsedData)
    const availability = parseStudentAvailability(student);
    if (!availability) {
      console.warn(`[AvailabilityCalc] ${student.name}: Failed to parse availability`);
      return null;
    }
    
    // Parse entry date from rawData
    const entryDate = student.rawData ? parseEntryDate(student.rawData) : null;
    
    return {
      student,
      availability,
      entryDate
    };
  }).filter(data => data !== null);

  console.log(`[AvailabilityCalc] Processing ${studentAvailabilityData.length} students`);
  if (weekStart) {
    console.log(`[AvailabilityCalc] Week starts: ${weekStart.toISOString().split('T')[0]}`);
  }

  // Process each student
  studentAvailabilityData.forEach(({ student, availability, entryDate }) => {
    let studentAddedToAnySlot = false;
    
    if (entryDate) {
      console.log(`[AvailabilityCalc] ${student.name}: entry date = ${entryDate.toISOString().split('T')[0]}`);
    } else {
      console.log(`[AvailabilityCalc] ${student.name}: no entry date (always available)`);
    }

    // Check each day of the week
    for (let d = 0; d < 7; d++) {
      // Calculate the actual date for this day
      let dayDate = null;
      if (weekStart) {
        dayDate = new Date(weekStart);
        dayDate.setDate(dayDate.getDate() + d);
        dayDate.setHours(0, 0, 0, 0);
      }

      // CRITICAL CHECK: Is this day on or after the entry date?
      if (dayDate && !isDateAfterEntry(dayDate, entryDate)) {
        console.log(`  [Skip] ${student.name} on ${dayDate.toISOString().split('T')[0]} (before entry ${entryDate.toISOString().split('T')[0]})`);
        continue; // Skip this entire day
      }

      // Process time slots for this day
      for (let s = 0; s < SLOTS_PER_DAY; s++) {
        if (availability[d][s]) {
          overlap[d][s]++;
          studentRefs[d][s].push({
            id: student.id,
            name: student.name,
            color: student.color
          });
          maxOverlap = Math.max(maxOverlap, overlap[d][s]);
          studentAddedToAnySlot = true;
        }
      }
    }

    if (studentAddedToAnySlot) {
      totalStudentsWithAvailability++;
    }
  });
  
  // Calculate depth matrix
  const depthMatrix = Array(7).fill(null).map(() => Array(SLOTS_PER_DAY).fill(0));
  
  for (let d = 0; d < 7; d++) {
    for (let s = 0; s < SLOTS_PER_DAY; s++) {
      if (maxOverlap > 0) {
        depthMatrix[d][s] = getColorDepth(overlap[d][s], maxOverlap);
      }
    }
  }

  console.log(`[AvailabilityCalc] Total students with availability: ${totalStudentsWithAvailability}`);
  console.log(`[AvailabilityCalc] Max overlap: ${maxOverlap}`);

  return {
    overlap,
    totalStudents: totalStudentsWithAvailability,
    maxOverlap: maxOverlap || 1,
    depthMatrix,
    studentRefs
  };
};

/**
 * Generate availability background events with 256-level color depth
 * 生成256级色深的可用性背景事件
 * 
 * @param {Array} students - Student array
 * @param {Object} calendarRef - FullCalendar ref
 * @returns {Array} FullCalendar event array
 */
export const generateAvailabilityEvents = (students, calendarRef) => {
  const studentsWithData = students.filter(s => s.rawData);
  if (studentsWithData.length === 0) return [];

  const events = [];

  // Get current week dates
  const calendarApi = calendarRef.current?.getApi();
  const currentDate = calendarApi ? calendarApi.getDate() : new Date();

  // Find Sunday of current week
  const weekStart = new Date(currentDate);
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());
  weekStart.setHours(0, 0, 0, 0);

  console.log(`[GenerateEvents] Current date: ${currentDate.toISOString().split('T')[0]}`);
  console.log(`[GenerateEvents] Week start (Sunday): ${weekStart.toISOString().split('T')[0]}`);

  // Calculate availability with entry date filtering
  const { overlap, totalStudents, maxOverlap, depthMatrix, studentRefs } = 
    calculateOverlappingAvailability(studentsWithData, weekStart);
  
  if (totalStudents === 0) return [];

  // Generate events for each day
  for (let d = 0; d < 7; d++) {
    const dayDate = new Date(weekStart);
    dayDate.setDate(dayDate.getDate() + d);
    const dateStr = dayDate.toISOString().split('T')[0];

    // Merge consecutive time slots
    let segmentStart = null;
    let segmentCount = 0;

    for (let s = 0; s <= SLOTS_PER_DAY; s++) {
      const count = s < SLOTS_PER_DAY ? overlap[d][s] : 0;

      if (count > 0 && segmentStart === null) {
        // Start new segment
        segmentStart = s;
        segmentCount = count;
      } else if ((count === 0 || count !== segmentCount) && segmentStart !== null) {
        // End current segment
        const startTime = slotIndexToTime(segmentStart);
        const endTime = slotIndexToTime(s);

        const ratio = segmentCount / totalStudents;
        const depth = getColorDepth(segmentCount, maxOverlap);
        const color = getAvailabilityColor(ratio, segmentCount, maxOverlap);

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
            depth: depth,
            students: segmentStudents,
            day: d
          }
        });

        // Start new segment if current slot has count
        if (count > 0) {
          segmentStart = s;
          segmentCount = count;
        } else {
          segmentStart = null;
        }
      }
    }
  }

  console.log(`[GenerateEvents] Generated ${events.length} availability events`);
  return events;
};

/**
 * Get students available for a specific time slot
 * 获取特定时间槽的可用学生
 * 
 * @param {Array} students - All students
 * @param {number} dayOfWeek - Day (0=Sun, 6=Sat)
 * @param {number} slotIndex - Time slot index
 * @returns {Array} Available students with constraints
 */
export const getStudentsForTimeSlot = (students, dayOfWeek, slotIndex) => {
  const availableStudents = [];

  students.forEach(student => {
    // Use unified parsing function
    const availability = parseStudentAvailability(student);
    if (!availability || !availability[dayOfWeek] || !availability[dayOfWeek][slotIndex]) {
      return;
    }

    // Extract constraints from parsedData or rawData
    let constraints;
    if (student.parsedData || student.constraint) {
      const data = student.parsedData || student.constraint;
      constraints = {
        allowedDays: data.allowedDays || [],
        allowedTimeRanges: data.allowedTimeRanges || [],
        excludedTimeRanges: data.excludedTimeRanges || [],
        strictness: data.strictness || '-',
        confidence: data.confidence || 0
      };
    } else if (student.rawData) {
      // Handle both string and object formats
      if (typeof student.rawData === 'string') {
        const values = student.rawData.split('\t');
        constraints = {
          frequency: values[5] || '-',
          duration: values[6] || '-',
          deadline: values[13] || '-',
          preferredDays: values[14] || '-',
          specificTime: values[15] || '-',
          weeklyFrequency: values[16] || '-'
        };
      } else if (typeof student.rawData === 'object') {
        constraints = {
          frequency: student.rawData.频次 || student.rawData.frequency || '-',
          duration: student.rawData.时长 || student.rawData.duration || '-',
          deadline: student.rawData.截止时间 || student.rawData.deadline || '-',
          preferredDays: student.rawData.希望时间段 || student.rawData.preferredDays || '-',
          specificTime: student.rawData.具体时间 || student.rawData.specificTime || '-',
          weeklyFrequency: student.rawData.每周频次 || student.rawData.weeklyFrequency || '-'
        };
      } else {
        constraints = {};
      }
    } else {
      constraints = {};
    }

    availableStudents.push({
      name: student.name,
      color: student.color,
      constraints: constraints
    });
  });

  return availableStudents;
};
