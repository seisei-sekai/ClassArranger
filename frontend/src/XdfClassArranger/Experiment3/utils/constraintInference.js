/**
 * Constraint Inference Utilities
 * 约束推断工具
 * 
 * Infer constraints from student data with maximum freedom principle
 */

import { createDefaultConstraint } from '../constraints/newConstraintTypes';

/**
 * Infer default constraints for a student (maximum freedom)
 * 为学生推断默认约束（最大自由度原则）
 * 
 * @param {Object} student - Student data
 * @returns {Array<Object>} Array of inferred constraints
 */
export function inferDefaultConstraints(student) {
  const constraints = [];

  // 1. time_window: Default to all week, 9-21
  constraints.push(createDefaultConstraint('time_window', {
    note: '推断：未指定时间窗口，假设全周可用',
    confidence: 0.5,
    weekdays: [1, 2, 3, 4, 5, 6, 7],
    timeRanges: [{ start: '09:00', end: '21:00' }],
    source: [],
    operator: 'allow'
  }));

  // 2. session_plan: Infer from frequency and duration
  if (student.frequency || student.duration || student.courseHours) {
    const sessionPlan = {};
    
    // Parse frequency (上课频次)
    if (student.frequency) {
      const freqMatch = student.frequency.match(/(\d+)/);
      if (freqMatch) {
        sessionPlan.sessionsPerWeek = parseInt(freqMatch[1]);
      }
    }
    
    // Parse duration (上课时长)
    if (student.duration) {
      const durationMatch = student.duration.match(/(\d+)/);
      if (durationMatch) {
        sessionPlan.sessionDurationMin = parseInt(durationMatch[1]) * 60; // Convert hours to minutes
      }
    }
    
    // Use courseHours if available
    if (student.courseHours?.totalHours) {
      sessionPlan.totalHours = student.courseHours.totalHours;
    }
    
    if (Object.keys(sessionPlan).length > 0) {
      constraints.push(createDefaultConstraint('session_plan', {
        ...sessionPlan,
        note: '推断：从课时信息推断',
        confidence: 0.7,
        source: ['上课频次', '上课时长']
      }));
    }
  }

  // 3. resource_preference: Campus if provided
  if (student.campus && student.campus !== '') {
    constraints.push(createDefaultConstraint('resource_preference', {
      resourceType: 'campus',
      prefer: [student.campus],
      note: `推断：偏好校区 ${student.campus}`,
      confidence: 0.6,
      source: ['校区']
    }));
  }

  // 4. resource_preference: Delivery mode if provided
  if (student.mode && student.mode !== '') {
    const deliveryMode = student.mode.includes('线上') ? 'online' : 'offline';
    constraints.push(createDefaultConstraint('resource_preference', {
      resourceType: 'delivery_mode',
      include: [deliveryMode],
      strength: 'hard',
      note: `推断：上课方式 ${student.mode}`,
      confidence: 0.8,
      source: ['上课形式']
    }));
  }

  return constraints;
}

/**
 * Combine constraint text from multiple Excel columns
 * 从多个Excel列组合约束文本
 * 
 * @param {Object} student - Parsed student data
 * @returns {string} Combined constraint text
 */
export function combineConstraintText(student) {
  const parts = [];

  if (student.timeRange) parts.push(`起止时间：${student.timeRange}`);
  if (student.preferredTime) parts.push(`希望时间段：${student.preferredTime}`);
  if (student.specificTime) parts.push(`具体时间：${student.specificTime}`);
  if (student.weeklyFrequency) parts.push(`每周频次：${student.weeklyFrequency}`);
  if (student.notes) parts.push(`备注：${student.notes}`);
  if (student.content) parts.push(`课程内容：${student.content}`);
  if (student.frequency) parts.push(`上课频次：${student.frequency}`);
  if (student.duration) parts.push(`上课时长：${student.duration}`);
  if (student.campus) parts.push(`校区：${student.campus}`);
  if (student.mode) parts.push(`上课形式：${student.mode}`);

  return parts.join('\n');
}

/**
 * Prepare student data for AI parsing
 * 准备学生数据供AI解析
 * 
 * @param {Array<Object>} students - Array of parsed students
 * @returns {Array<Object>} Array formatted for AI service
 */
export function prepareStudentsForAIParsing(students) {
  return students.map(student => ({
    studentName: student.name,
    campus: student.campus || '未知校区',
    combinedText: combineConstraintText(student),
    originalStudent: student // Keep reference
  }));
}

/**
 * Merge AI parsed constraints with student data
 * 合并AI解析的约束到学生数据
 * 
 * @param {Object} student - Original student data
 * @param {Object} aiResult - AI parsing result
 * @returns {Object} Student with constraints
 */
export function mergeAIConstraints(student, aiResult) {
  return {
    ...student,
    constraints: aiResult.constraints || [],
    inferredDefaults: aiResult.inferredDefaults || {},
    aiConfidence: aiResult.avgConfidence || 0,
    aiParsed: true,
    constraintsModified: false
  };
}

/**
 * Check if student needs AI parsing
 * 检查学生是否需要AI解析
 * 
 * @param {Object} student
 * @returns {boolean}
 */
export function needsAIParsing(student) {
  // Needs parsing if no constraints or constraints are empty
  return !student.constraints || student.constraints.length === 0;
}

/**
 * Create a confirmation dialog data for auto AI parsing
 * 创建自动AI解析的确认对话框数据
 * 
 * @param {number} studentCount
 * @returns {Object} Dialog configuration
 */
export function createAutoParseConfirmation(studentCount) {
  return {
    title: '检测到新的学生数据',
    message: `检测到 ${studentCount} 个学生数据。是否立即进行AI智能约束解析？\n\n使用AI解析可以自动识别时间窗口、禁排时间等约束，提高排课成功率。`,
    confirmText: '立即解析',
    cancelText: '稍后手动',
    type: 'info'
  };
}

export default {
  inferDefaultConstraints,
  combineConstraintText,
  prepareStudentsForAIParsing,
  mergeAIConstraints,
  needsAIParsing,
  createAutoParseConfirmation
};
