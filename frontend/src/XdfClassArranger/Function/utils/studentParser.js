/**
 * 学生数据解析模块
 * Student Data Parser Module
 * 
 * 负责解析从Excel粘贴的学生数据
 * Responsible for parsing student data pasted from Excel
 */

/**
 * 解析多行学生数据
 * Parse multiple rows of student data
 * 
 * 处理单元格内换行符，合并被分割的行
 * Handles in-cell line breaks and merges split rows
 * 
 * @param {string} rawData - 从Excel粘贴的原始数据 (Raw data pasted from Excel)
 * @returns {Array} 解析后的学生数组，每个元素包含 {rawData, name, values, courseHours}
 */
export const parseStudentRows = (rawData) => {
  // Handle null/undefined input (处理null/undefined输入)
  if (!rawData || typeof rawData !== 'string' || rawData.trim() === '') {
    return [];
  }

  // 按行分割 (Split by lines)
  const rawLines = rawData.split('\n');
  
  // 合并被单元格内换行符分割的行
  // Merge rows split by in-cell line breaks
  // 判断标准：完整的学生数据应该有约19个字段（18个tab）
  // Criterion: Complete student data should have about 19 fields (18 tabs)
  // 如果某行tab数量少于10个，说明是上一行的延续
  // If a row has fewer than 10 tabs, it's a continuation of the previous row
  const MIN_TABS_FOR_NEW_STUDENT = 10;
  const mergedLines = [];
  
  rawLines.forEach(line => {
    if (line.trim() === '') return; // 跳过空行 (Skip empty lines)
    
    const tabCount = (line.match(/\t/g) || []).length;
    
    if (tabCount >= MIN_TABS_FOR_NEW_STUDENT) {
      // 这是一个新的学生记录 (This is a new student record)
      mergedLines.push(line);
    } else if (mergedLines.length > 0) {
      // 这是上一行的延续，合并到上一行 (This is a continuation, merge to previous line)
      // 用空格替换换行，避免数据混乱 (Replace line break with space to avoid data confusion)
      mergedLines[mergedLines.length - 1] += ' ' + line;
    } else {
      // 第一行但tab不够，可能是不完整数据，先保存 (First line but insufficient tabs, save anyway)
      mergedLines.push(line);
    }
  });
  
  return mergedLines.map(line => {
    const values = line.split('\t');
    let studentName = values[2] ? values[2].trim() : '';
    
    // 如果学生姓名为空，生成默认名称 (Generate default name if empty)
    if (!studentName) {
      const now = new Date();
      const timestamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`;
      studentName = `学生${timestamp}`;
    }
    
    // 提取字段 (Extract fields)
    const frequency = values[5] ? values[5].trim() : ''; // 上课频次 (Class frequency)
    const duration = values[6] ? values[6].trim() : ''; // 上课时长 (Class duration)
    const entryDate = values[4] ? values[4].trim() : ''; // 录入日期 (Entry date)
    const timeRange = values[13] ? values[13].trim() : ''; // 起止时间 (Start-end time)
    
    // 计算课时信息 (Calculate course hours based on frequency and duration)
    const courseHours = calculateWeeklyCourseHours(frequency, duration);
    
    return {
      rawData: line,
      name: studentName,
      values: values,
      courseHours: courseHours,
      // 提取常用字段 (Extract common fields for convenience)
      campus: values[0] ? values[0].trim() : '',
      manager: values[1] ? values[1].trim() : '',
      batch: values[3] ? values[3].trim() : '',
      entryDate: entryDate,
      frequency: frequency,
      duration: duration,
      mode: values[7] ? values[7].trim() : '',
      subject: values[8] ? values[8].trim() : '',
      level: values[9] ? values[9].trim() : '',
      hoursUsed: values[10] ? values[10].trim() : '', // 已用课时 (Hours used)
      targetUniversity: values[11] ? values[11].trim() : '', // 目标大学 (Target university)
      targetMajor: values[12] ? values[12].trim() : '', // 目标专业 (Target major)
      timeRange: timeRange, // 起止时间 (Start-end time range)
      preferredTime: values[14] ? values[14].trim() : '', // 偏好时间 (Preferred time)
      specificTime: values[15] ? values[15].trim() : '', // 具体时间 (Specific time)
      weeklyFrequency: values[16] ? values[16].trim() : '', // 每周频次 (Weekly frequency)
      content: values[17] ? values[17].trim() : '', // 课程内容 (Course content)
      notes: values[18] ? values[18].trim() : '' // 备注 (Notes)
    };
  });
};

/**
 * 根据上课频次和时长计算每周课时
 * Calculate weekly course hours based on frequency and duration
 * 
 * Logic:
 * - 频次 (frequency): 每周上课次数，"多次" defaults to 4
 * - 时长 (duration): 每次上课时长（小时）
 * - 每周课时 = 频次 × 时长
 * 
 * @param {string} frequencyText - Class frequency text (e.g., "2", "多次", "每周2次")
 * @param {string} durationText - Class duration text (e.g., "2h", "1.5小时", "90分钟")
 * @returns {Object} { weeklyHours, timesPerWeek, hoursPerClass, totalHours }
 */
export const calculateWeeklyCourseHours = (frequencyText, durationText) => {
  // Parse frequency (times per week)
  let timesPerWeek = 0;
  
  if (frequencyText) {
    const freqText = frequencyText.trim().toLowerCase();
    
    // Check for "多次" pattern
    if (freqText.includes('多次') || freqText.includes('多回')) {
      timesPerWeek = 4; // Default to 4 times
    } else {
      // Try to extract number
      const freqPatterns = [
        /(\d+(?:\.\d+)?)\s*次/,           // "2次"
        /每周\s*(\d+(?:\.\d+)?)/,         // "每周2"
        /week.*?(\d+(?:\.\d+)?)/i,        // "week 2"
        /(\d+(?:\.\d+)?)\s*times?/i,      // "2times"
        /^(\d+(?:\.\d+)?)$/                // "2"
      ];
      
      for (const pattern of freqPatterns) {
        const match = freqText.match(pattern);
        if (match) {
          timesPerWeek = parseFloat(match[1]);
          break;
        }
      }
    }
  }
  
  // Parse duration (hours per class)
  let hoursPerClass = 0;
  
  if (durationText) {
    const durText = durationText.trim().toLowerCase();
    
    const durPatterns = [
      /(\d+(?:\.\d+)?)\s*[小时時]/,      // "2小时", "1.5時"
      /(\d+(?:\.\d+)?)\s*h/i,             // "2h", "1.5H"
      /(\d+(?:\.\d+)?)\s*hours?/i,        // "2hours", "1.5hour"
      /(\d+(?:\.\d+)?)\s*分钟/,           // "90分钟" (will convert to hours)
      /(\d+(?:\.\d+)?)\s*min/i,           // "90min"
      /^(\d+(?:\.\d+)?)$/                  // "2"
    ];
    
    for (const pattern of durPatterns) {
      const match = durText.match(pattern);
      if (match) {
        let value = parseFloat(match[1]);
        
        // Convert minutes to hours if pattern matches minutes
        if (durText.includes('分钟') || durText.includes('min')) {
          value = value / 60;
        }
        
        hoursPerClass = value;
        break;
      }
    }
  }
  
  // Calculate weekly hours
  const weeklyHours = timesPerWeek * hoursPerClass;
  
  // Estimate total hours for a typical contract (e.g., 12 weeks = 3 months)
  // This is a placeholder; actual total should be calculated from time range
  const estimatedWeeks = 12;
  const totalHours = weeklyHours * estimatedWeeks;
  
  if (weeklyHours === 0) {
    console.warn(`[StudentParser] Could not calculate course hours. Frequency: "${frequencyText}", Duration: "${durationText}"`);
  }
  
  return {
    weeklyHours: weeklyHours,
    timesPerWeek: timesPerWeek,
    hoursPerClass: hoursPerClass,
    totalHours: totalHours,
    usedHours: 0,
    remainingHours: totalHours
  };
};

/**
 * 获取学生统计信息
 * Get student statistics
 * 
 * @param {Array<Object>} students - Array of student objects
 * @returns {Object} Statistics object
 */
export const getStudentStatistics = (students) => {
  if (!students || students.length === 0) {
    return {
      total: 0,
      totalHours: 0,
      averageHours: 0,
      studentsWithHours: 0,
      studentsWithoutHours: 0
    };
  }

  let totalHours = 0;
  let studentsWithHours = 0;
  let studentsWithoutHours = 0;

  students.forEach(student => {
    if (student.courseHours && student.courseHours.totalHours > 0) {
      totalHours += student.courseHours.totalHours;
      studentsWithHours++;
    } else {
      studentsWithoutHours++;
    }
  });

  return {
    total: students.length,
    totalHours: totalHours,
    averageHours: studentsWithHours > 0 ? totalHours / studentsWithHours : 0,
    studentsWithHours: studentsWithHours,
    studentsWithoutHours: studentsWithoutHours
  };
};

