/**
 * Student Data Cleaner Service - AI-powered data parsing and formatting
 * 学生数据清洗服务 - AI驱动的数据解析和格式化
 * 
 * Purpose: Intelligently parse ambiguous student data fields using LLM
 * 目的：使用LLM智能解析模糊的学生数据字段
 */

const BACKEND_PROXY_URL = 'http://localhost:8000/ai/openai/parse-constraint';

/**
 * System prompt for student data cleaning
 * 学生数据清洗的系统提示词
 */
const DATA_CLEANER_SYSTEM_PROMPT = `
你是一个专业的教育数据清洗助手。你的任务是将模糊、不规范的学生数据字段转换为标准格式。

## 核心任务

### 1. 上课频次解析 (frequency)
输入可能是：
- "2次"、"3次" → 标准化为数字
- "多次"、"很多次"、"频繁" → 默认为 4
- "每周2-3次"、"2到3次" → 取中间值或下限
- "看情况"、"待定"、"不固定" → 默认为 2
- "一周一次"、"每周一次" → 1
- 空值 → 默认为 2

输出格式：纯数字，如 2、3、4

### 2. 上课时长解析 (duration)
输入可能是：
- "2小时"、"2h"、"2小时/次" → 2
- "90分钟"、"90min" → 1.5
- "1-2小时"、"1到2小时" → 取下限 1.5
- "一个半小时" → 1.5
- "待定"、"看情况" → 默认为 1.5
- 空值 → 默认为 1.5

输出格式：小数（小时为单位），如 1.5、2、2.5

### 3. 总课时解析 (totalHours)
输入可能是：
- "20课时"、"20h"、"20小时" → 20
- "20" → 20
- 空值、"待定" → 使用频次×时长×12周计算

输出格式：整数，如 20、48、72

### 4. 起止时间解析 (validPeriod)
输入可能是：
- "2024-01-01 至 2024-06-30" → {startDate: "2024-01-01", endDate: "2024-06-30"}
- "春季"、"2024春" → {startDate: "2024-03-01", endDate: "2024-08-31"}
- "3个月"、"三个月" → 从录入日期起算3个月
- 空值 → 从录入日期起算12周

输出格式：{startDate: "YYYY-MM-DD", endDate: "YYYY-MM-DD"}

## 输出格式

返回JSON对象：
{
  "frequency": 数字,
  "duration": 小数,
  "totalHours": 整数,
  "validPeriod": {
    "startDate": "YYYY-MM-DD",
    "endDate": "YYYY-MM-DD"
  },
  "confidence": 0-100,
  "notes": "解析说明"
}

## 示例

输入：
{
  "frequency": "多次",
  "duration": "1-2小时",
  "totalHours": "",
  "timeRange": "春季",
  "entryDate": "2024-02-15"
}

输出：
{
  "frequency": 4,
  "duration": 1.5,
  "totalHours": 72,
  "validPeriod": {
    "startDate": "2024-03-01",
    "endDate": "2024-08-31"
  },
  "confidence": 85,
  "notes": "频次'多次'默认为4次/周，时长'1-2小时'取下限1.5小时，总课时根据4×1.5×12=72计算，春季对应3-8月"
}

## 重要规则

1. **容错性**：即使输入非常模糊，也要给出合理的默认值
2. **中文理解**：支持各种中文表达方式
3. **计算优先**：如果totalHours为空，优先用frequency×duration×12周计算
4. **保守估计**：范围值取下限（如"2-3次"取2）
5. **置信度**：明确数据confidence高，模糊数据confidence低
`;

/**
 * Call backend AI proxy to clean student data
 * 调用后端AI代理清洗学生数据
 */
async function callAIDataCleaner(studentRawData) {
  const userPrompt = JSON.stringify({
    frequency: studentRawData.frequency || '',
    duration: studentRawData.duration || '',
    totalHours: studentRawData.courseHours?.totalHours || studentRawData.hoursUsed || '',
    timeRange: studentRawData.timeRange || '',
    entryDate: studentRawData.entryDate || ''
  }, null, 2);

  try {
    const response = await fetch(BACKEND_PROXY_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        system_prompt: DATA_CLEANER_SYSTEM_PROMPT,
        user_prompt: userPrompt,
        model: 'gpt-4o-mini',
        temperature: 0.1, // Low temperature for consistent parsing
        response_format: { type: 'json_object' }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[DataCleaner] Backend error:', errorText);
      throw new Error(`Backend returned ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('[DataCleaner] Error calling AI:', error);
    throw error;
  }
}

/**
 * Clean a single student's data using AI
 * 使用AI清洗单个学生的数据
 * 
 * @param {Object} studentData - Raw student data from Excel
 * @returns {Object} Cleaned student data with standardized fields
 */
export async function cleanStudentData(studentData) {
  console.log('[DataCleaner] 🧹 开始AI清洗学生数据:', studentData.name);
  
  try {
    const cleaned = await callAIDataCleaner(studentData);
    
    console.log('[DataCleaner] ✅ AI清洗完成:', {
      name: studentData.name,
      cleaned: cleaned
    });

    // Merge cleaned data back into student object
    const result = {
      ...studentData,
      frequency: `${cleaned.frequency}次`,
      duration: `${cleaned.duration}小时`,
      courseHours: {
        totalHours: cleaned.totalHours,
        usedHours: 0,
        remainingHours: cleaned.totalHours,
        weeklyHours: cleaned.frequency * cleaned.duration,
        source: 'ai_cleaned'
      },
      effectivePeriod: cleaned.validPeriod,
      aiCleaned: true,
      cleaningConfidence: cleaned.confidence,
      cleaningNotes: cleaned.notes
    };

    return result;
  } catch (error) {
    console.error('[DataCleaner] ❌ AI清洗失败:', error);
    
    // Fallback to basic defaults
    return {
      ...studentData,
      frequency: studentData.frequency || '2次',
      duration: studentData.duration || '1.5小时',
      courseHours: {
        totalHours: 36, // 2 * 1.5 * 12 = 36
        usedHours: 0,
        remainingHours: 36,
        weeklyHours: 3,
        source: 'fallback_default'
      },
      aiCleaned: false,
      cleaningError: error.message
    };
  }
}

/**
 * Batch clean multiple students' data
 * 批量清洗多个学生的数据
 * 
 * @param {Array} studentsData - Array of raw student data
 * @param {Function} onProgress - Progress callback (current, total, studentName)
 * @returns {Array} Array of cleaned student data
 */
export async function batchCleanStudentData(studentsData, onProgress = null) {
  console.log(`[DataCleaner] 🚀 开始批量清洗 ${studentsData.length} 名学生数据`);
  
  const results = [];
  
  for (let i = 0; i < studentsData.length; i++) {
    const student = studentsData[i];
    
    if (onProgress) {
      onProgress(i + 1, studentsData.length, student.name);
    }
    
    try {
      const cleaned = await cleanStudentData(student);
      results.push(cleaned);
      
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      console.error(`[DataCleaner] 清洗失败 - ${student.name}:`, error);
      // Still add the original data with error flag
      results.push({
        ...student,
        aiCleaned: false,
        cleaningError: error.message
      });
    }
  }
  
  console.log('[DataCleaner] ✅ 批量清洗完成');
  return results;
}

/**
 * Check if student data needs AI cleaning
 * 检查学生数据是否需要AI清洗
 * 
 * @param {Object} studentData - Student data object
 * @returns {Boolean} True if data needs cleaning
 */
export function needsCleaning(studentData) {
  // Check if critical fields are missing or ambiguous
  const hasValidFrequency = studentData.frequency && /^\d+次$/.test(studentData.frequency);
  const hasValidDuration = studentData.duration && /^\d+(\.\d+)?小时$/.test(studentData.duration);
  const hasValidTotalHours = studentData.courseHours?.totalHours > 0;
  
  // If any critical field is invalid, needs cleaning
  return !hasValidFrequency || !hasValidDuration || !hasValidTotalHours;
}

export default {
  cleanStudentData,
  batchCleanStudentData,
  needsCleaning
};

