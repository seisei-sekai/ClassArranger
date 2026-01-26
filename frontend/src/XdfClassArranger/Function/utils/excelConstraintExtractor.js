/**
 * Excel Constraint Extractor
 * Excel约束提取器
 * 
 * Extracts and combines natural language constraint data from Excel rows
 * 从Excel行中提取和组合自然语言约束数据
 */

/**
 * Extract constraint data from Excel rows
 * 从Excel行提取约束数据
 * 
 * @param {Array<Object>} excelRows - Array of Excel row objects
 * @returns {Array<Object>} Array of student constraint data
 */
export function extractConstraintData(excelRows) {
  if (!Array.isArray(excelRows) || excelRows.length === 0) {
    return [];
  }

  return excelRows
    .filter(row => isValidRow(row))
    .map((row, index) => ({
      id: `student-${index}-${Date.now()}`,
      studentName: extractField(row, ['学生姓名', 'studentName']),
      campus: extractField(row, ['校区', 'campus']),
      batch: extractField(row, ['学生批次', 'batch']),
      courseContent: extractField(row, ['上课内容', 'courseContent']),
      
      // Time constraint fields (时间约束字段)
      timePreference: extractField(row, ['学生希望时间段', 'timePreference']),
      specificTime: extractField(row, ['希望具体时间', 'specificTime']),
      startEndTime: extractField(row, ['起止时间', 'startEndTime']),
      remarks: extractField(row, ['备注', 'remarks']),
      frequency: extractField(row, ['每周频次', 'frequency']),
      
      // Combined NL text for parsing (用于解析的组合自然语言文本)
      combinedText: combineNLFields(row),
      
      // Additional context (额外上下文)
      courseForm: extractField(row, ['上课形式', 'courseForm']),
      courseDuration: extractField(row, ['上课时长', 'courseDuration']),
      
      // Original row reference (原始行引用)
      originalRow: row
    }))
    .filter(student => student.combinedText && student.combinedText.trim().length > 0);
}

/**
 * Check if row is valid for extraction
 * 检查行是否有效可提取
 * 
 * @param {Object} row - Excel row object
 * @returns {boolean} True if row has required fields
 */
function isValidRow(row) {
  if (!row || typeof row !== 'object') return false;
  
  // Must have student name (必须有学生姓名)
  const hasStudentName = Boolean(
    extractField(row, ['学生姓名', 'studentName'])
  );
  
  // Must have at least one constraint field (必须至少有一个约束字段)
  const hasConstraint = Boolean(
    extractField(row, ['学生希望时间段', 'timePreference']) ||
    extractField(row, ['希望具体时间', 'specificTime']) ||
    extractField(row, ['起止时间', 'startEndTime']) ||
    extractField(row, ['备注', 'remarks'])
  );
  
  return hasStudentName && hasConstraint;
}

/**
 * Extract field from row with multiple possible field names
 * 从行中提取字段（支持多个可能的字段名）
 * 
 * @param {Object} row - Excel row object
 * @param {Array<string>} fieldNames - Array of possible field names
 * @returns {string|null} Field value or null
 */
function extractField(row, fieldNames) {
  if (!row) return null;
  
  for (const fieldName of fieldNames) {
    if (row[fieldName] !== undefined && row[fieldName] !== null) {
      const value = String(row[fieldName]).trim();
      if (value.length > 0) {
        return value;
      }
    }
  }
  
  return null;
}

/**
 * Combine natural language fields into single text for parsing
 * 将自然语言字段组合成单个文本用于解析
 * 
 * @param {Object} row - Excel row object
 * @returns {string} Combined text
 */
function combineNLFields(row) {
  const parts = [];
  
  // Priority order for combining fields (组合字段的优先级顺序)
  const fields = [
    { key: ['起止时间', 'startEndTime'], prefix: '起止时间: ' },
    { key: ['学生希望时间段', 'timePreference'], prefix: '希望时间段: ' },
    { key: ['希望具体时间', 'specificTime'], prefix: '具体时间: ' },
    { key: ['每周频次', 'frequency'], prefix: '每周频次: ' },
    { key: ['备注', 'remarks'], prefix: '备注: ' }
  ];
  
  fields.forEach(field => {
    const value = extractField(row, field.key);
    if (value && value.length > 0) {
      // Clean the value (清理值)
      const cleaned = cleanText(value);
      if (cleaned.length > 0) {
        parts.push(`${field.prefix}${cleaned}`);
      }
    }
  });
  
  // Combine with newlines and remove duplicates (用换行符组合并删除重复)
  const combined = parts.join('\n');
  return removeDuplicateLines(combined);
}

/**
 * Clean text by removing unnecessary characters
 * 通过删除不必要的字符来清理文本
 * 
 * @param {string} text - Input text
 * @returns {string} Cleaned text
 */
function cleanText(text) {
  if (!text) return '';
  
  return String(text)
    .trim()
    // Remove multiple spaces (删除多余空格)
    .replace(/\s+/g, ' ')
    // Remove excessive newlines (删除过多换行)
    .replace(/\n{3,}/g, '\n\n')
    // Remove leading/trailing punctuation (删除首尾标点)
    .replace(/^[，。、；：,.;:]+|[，。、；：,.;:]+$/g, '')
    .trim();
}

/**
 * Remove duplicate lines from text
 * 从文本中删除重复行
 * 
 * @param {string} text - Input text
 * @returns {string} Text without duplicates
 */
function removeDuplicateLines(text) {
  if (!text) return '';
  
  const lines = text.split('\n');
  const seen = new Set();
  const unique = [];
  
  lines.forEach(line => {
    const cleaned = line.trim().toLowerCase();
    if (cleaned.length > 0 && !seen.has(cleaned)) {
      seen.add(cleaned);
      unique.push(line.trim());
    }
  });
  
  return unique.join('\n');
}

/**
 * Validate extracted constraint data
 * 验证提取的约束数据
 * 
 * @param {Object} constraintData - Extracted constraint data
 * @returns {Object} Validation result {valid, errors}
 */
export function validateConstraintData(constraintData) {
  const errors = [];
  
  if (!constraintData.studentName) {
    errors.push('缺少学生姓名');
  }
  
  if (!constraintData.combinedText || constraintData.combinedText.length < 2) {
    errors.push('约束文本过短或为空');
  }
  
  if (constraintData.combinedText && constraintData.combinedText.length > 2000) {
    errors.push('约束文本过长（超过2000字符）');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Group students by campus for batch processing
 * 按校区分组学生以进行批处理
 * 
 * @param {Array<Object>} students - Array of student constraint data
 * @returns {Object} Object with campus as key and students as value
 */
export function groupByCampus(students) {
  const grouped = {};
  
  students.forEach(student => {
    const campus = student.campus || '未知校区';
    if (!grouped[campus]) {
      grouped[campus] = [];
    }
    grouped[campus].push(student);
  });
  
  return grouped;
}

/**
 * Get statistics about extracted data
 * 获取提取数据的统计信息
 * 
 * @param {Array<Object>} students - Array of student constraint data
 * @returns {Object} Statistics object
 */
export function getExtractionStatistics(students) {
  if (!Array.isArray(students) || students.length === 0) {
    return {
      total: 0,
      byCampus: {},
      avgTextLength: 0,
      withRemarks: 0,
      withSpecificTime: 0
    };
  }
  
  const byCampus = {};
  let totalTextLength = 0;
  let withRemarks = 0;
  let withSpecificTime = 0;
  
  students.forEach(student => {
    const campus = student.campus || '未知校区';
    byCampus[campus] = (byCampus[campus] || 0) + 1;
    
    totalTextLength += (student.combinedText || '').length;
    
    if (student.remarks) withRemarks++;
    if (student.specificTime) withSpecificTime++;
  });
  
  return {
    total: students.length,
    byCampus,
    avgTextLength: Math.round(totalTextLength / students.length),
    withRemarks,
    withSpecificTime,
    completeness: {
      remarks: ((withRemarks / students.length) * 100).toFixed(1) + '%',
      specificTime: ((withSpecificTime / students.length) * 100).toFixed(1) + '%'
    }
  };
}

export default {
  extractConstraintData,
  validateConstraintData,
  groupByCampus,
  getExtractionStatistics
};

