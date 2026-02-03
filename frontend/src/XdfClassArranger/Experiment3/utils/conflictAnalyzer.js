/**
 * 冲突分析工具
 * Conflict Analyzer Utility
 * 
 * 功能：
 * - 解析算法返回的冲突对象
 * - 识别冲突类型
 * - 计算严重程度
 * - 生成增强的冲突对象
 */

import {
  ConflictType,
  Severity,
  ConflictStatus,
  createEnhancedConflict
} from '../types/adjustmentTypes';

/**
 * 分析单个冲突对象
 * @param {Object} conflict - 原始冲突对象 { student, reason }
 * @param {Array} allStudents - 所有学生列表
 * @param {Array} allTeachers - 所有教师列表
 * @param {Array} allClassrooms - 所有教室列表
 * @returns {EnhancedConflict} 增强的冲突对象
 */
export function analyzeConflict(conflict, allStudents = [], allTeachers = [], allClassrooms = []) {
  // 识别冲突类型
  const conflictType = detectConflictType(conflict.reason);
  
  // 计算严重程度
  const severity = calculateSeverity(conflict, conflictType, allTeachers, allClassrooms);
  
  // 创建增强的冲突对象
  const enhancedConflict = createEnhancedConflict(conflict, conflictType, severity);
  
  // 添加额外的分析信息
  enhancedConflict.metadata = extractMetadata(conflict, conflictType);
  
  return enhancedConflict;
}

/**
 * 批量分析冲突列表
 * @param {Array<Object>} conflicts - 原始冲突列表
 * @param {Array} allStudents - 所有学生列表
 * @param {Array} allTeachers - 所有教师列表
 * @param {Array} allClassrooms - 所有教室列表
 * @returns {Array<EnhancedConflict>} 增强的冲突列表
 */
export function analyzeConflicts(conflicts, allStudents, allTeachers, allClassrooms) {
  return conflicts.map(conflict => 
    analyzeConflict(conflict, allStudents, allTeachers, allClassrooms)
  );
}

/**
 * 识别冲突类型
 * @param {string} reason - 冲突原因描述
 * @returns {string} 冲突类型
 */
export function detectConflictType(reason) {
  if (!reason || typeof reason !== 'string') {
    return ConflictType.OTHER;
  }
  
  const reasonLower = reason.toLowerCase();
  
  // 优先级顺序检测（从具体到一般）
  
  // 检测无教师类型
  if (reasonLower.includes('没有教师') || 
      reasonLower.includes('无教师') ||
      reasonLower.includes('无可用教师') ||
      reasonLower.includes('no teacher')) {
    return ConflictType.NO_TEACHER;
  }
  
  // 检测科目不匹配
  if (reasonLower.includes('科目') || 
      reasonLower.includes('教授') ||
      reasonLower.includes('subject')) {
    return ConflictType.NO_SUBJECT;
  }
  
  // 检测时间冲突
  if (reasonLower.includes('没有共同时间') || 
      reasonLower.includes('无共同时间') ||
      reasonLower.includes('时间段') ||
      reasonLower.includes('时间槽') ||
      reasonLower.includes('no common time')) {
    return ConflictType.NO_TIME;
  }
  
  // 检测教室不足
  if (reasonLower.includes('无可用教室') || 
      reasonLower.includes('教室') ||
      reasonLower.includes('no room') ||
      reasonLower.includes('classroom')) {
    return ConflictType.NO_ROOM;
  }
  
  // 检测课时上限
  if (reasonLower.includes('课时上限') || 
      reasonLower.includes('周课时') ||
      reasonLower.includes('课时已满') ||
      reasonLower.includes('hour limit')) {
    return ConflictType.HOUR_LIMIT;
  }
  
  // 默认为其他类型
  return ConflictType.OTHER;
}

/**
 * 计算冲突严重程度
 * @param {Object} conflict - 冲突对象
 * @param {string} conflictType - 冲突类型
 * @param {Array} allTeachers - 所有教师列表
 * @param {Array} allClassrooms - 所有教室列表
 * @returns {string} 严重程度
 */
export function calculateSeverity(conflict, conflictType, allTeachers = [], allClassrooms = []) {
  const student = conflict.student;
  
  // 根据冲突类型判断基础严重程度
  switch (conflictType) {
    case ConflictType.NO_TEACHER:
    case ConflictType.NO_SUBJECT:
      // 无教师或科目不匹配：高严重度（根本性问题）
      return Severity.HIGH;
      
    case ConflictType.HOUR_LIMIT:
      // 课时上限：高严重度（需要修改约束）
      return Severity.HIGH;
      
    case ConflictType.NO_TIME:
      // 无共同时间：中严重度（可能需要调整时间约束）
      // 但如果教师数量很少，提升为高严重度
      if (allTeachers.length <= 2) {
        return Severity.HIGH;
      }
      return Severity.MEDIUM;
      
    case ConflictType.NO_ROOM:
      // 无可用教室：低严重度（通常可以找到替代方案）
      // 但如果教室数量很少，提升为中严重度
      if (allClassrooms.length <= 2) {
        return Severity.MEDIUM;
      }
      return Severity.LOW;
      
    case ConflictType.OTHER:
    default:
      // 其他类型：根据学生剩余课时判断
      return estimateSeverityFromStudent(student);
  }
}

/**
 * 根据学生信息估算严重程度
 * @param {Object} student - 学生对象
 * @returns {string} 严重程度
 */
function estimateSeverityFromStudent(student) {
  // 如果学生有剩余课时信息
  if (student.courseHours) {
    const hours = parseInt(student.courseHours);
    if (hours >= 20) {
      return Severity.HIGH; // 课时多，优先级高
    } else if (hours >= 10) {
      return Severity.MEDIUM;
    }
  }
  
  // 如果是新录入的学生（有录入日期）
  if (student.entryDate || student.parsedData?.entryDate) {
    return Severity.MEDIUM;
  }
  
  // 默认为低严重度
  return Severity.LOW;
}

/**
 * 从冲突中提取元数据
 * @param {Object} conflict - 冲突对象
 * @param {string} conflictType - 冲突类型
 * @returns {Object} 元数据对象
 */
function extractMetadata(conflict, conflictType) {
  const metadata = {
    originalReason: conflict.reason,
    studentId: conflict.student?.id,
    studentName: conflict.student?.name,
    campus: conflict.student?.campus,
    subject: conflict.student?.subject,
    courseHours: conflict.student?.courseHours,
    conflictType,
    extractedInfo: {}
  };
  
  // 从原因字符串中提取关键信息
  const reason = conflict.reason || '';
  
  // 提取教师名称
  const teacherMatch = reason.match(/教师[：:]([\u4e00-\u9fa5]+)|教师([\u4e00-\u9fa5]+)/);
  if (teacherMatch) {
    metadata.extractedInfo.teacherName = teacherMatch[1] || teacherMatch[2];
  }
  
  // 提取校区信息
  const campusMatch = reason.match(/(旗舰校|东京本校|高马本校|VIP中心|板桥第二校舍)/);
  if (campusMatch) {
    metadata.extractedInfo.campusName = campusMatch[1];
  }
  
  // 提取科目信息
  const subjectMatch = reason.match(/"([^"]+)"/);
  if (subjectMatch) {
    metadata.extractedInfo.subjectName = subjectMatch[1];
  }
  
  return metadata;
}

/**
 * 按严重程度排序冲突列表
 * @param {Array<EnhancedConflict>} conflicts - 冲突列表
 * @param {boolean} descending - 是否降序（默认true，高严重度在前）
 * @returns {Array<EnhancedConflict>} 排序后的冲突列表
 */
export function sortConflictsBySeverity(conflicts, descending = true) {
  const severityOrder = {
    [Severity.HIGH]: 3,
    [Severity.MEDIUM]: 2,
    [Severity.LOW]: 1
  };
  
  return [...conflicts].sort((a, b) => {
    const orderA = severityOrder[a.severity] || 0;
    const orderB = severityOrder[b.severity] || 0;
    return descending ? orderB - orderA : orderA - orderB;
  });
}

/**
 * 按冲突类型筛选
 * @param {Array<EnhancedConflict>} conflicts - 冲突列表
 * @param {string} conflictType - 冲突类型
 * @returns {Array<EnhancedConflict>} 筛选后的冲突列表
 */
export function filterConflictsByType(conflicts, conflictType) {
  if (!conflictType || conflictType === 'all') {
    return conflicts;
  }
  return conflicts.filter(c => c.conflictType === conflictType);
}

/**
 * 按严重程度筛选
 * @param {Array<EnhancedConflict>} conflicts - 冲突列表
 * @param {string} severity - 严重程度
 * @returns {Array<EnhancedConflict>} 筛选后的冲突列表
 */
export function filterConflictsBySeverity(conflicts, severity) {
  if (!severity || severity === 'all') {
    return conflicts;
  }
  return conflicts.filter(c => c.severity === severity);
}

/**
 * 按状态筛选
 * @param {Array<EnhancedConflict>} conflicts - 冲突列表
 * @param {string} status - 状态
 * @returns {Array<EnhancedConflict>} 筛选后的冲突列表
 */
export function filterConflictsByStatus(conflicts, status) {
  if (!status || status === 'all') {
    return conflicts;
  }
  return conflicts.filter(c => c.status === status);
}

/**
 * 获取冲突统计信息
 * @param {Array<EnhancedConflict>} conflicts - 冲突列表
 * @returns {Object} 统计信息
 */
export function getConflictStatistics(conflicts) {
  const stats = {
    total: conflicts.length,
    byType: {},
    bySeverity: {},
    byStatus: {},
    pending: 0,
    resolved: 0,
    modified: 0
  };
  
  // 统计各类型数量
  Object.values(ConflictType).forEach(type => {
    stats.byType[type] = conflicts.filter(c => c.conflictType === type).length;
  });
  
  // 统计各严重程度数量
  Object.values(Severity).forEach(severity => {
    stats.bySeverity[severity] = conflicts.filter(c => c.severity === severity).length;
  });
  
  // 统计各状态数量
  Object.values(ConflictStatus).forEach(status => {
    stats.byStatus[status] = conflicts.filter(c => c.status === status).length;
  });
  
  // 快捷统计
  stats.pending = stats.byStatus[ConflictStatus.PENDING] || 0;
  stats.resolved = stats.byStatus[ConflictStatus.RESOLVED] || 0;
  stats.modified = conflicts.filter(c => c.isModified).length;
  
  return stats;
}

/**
 * 更新冲突状态
 * @param {EnhancedConflict} conflict - 冲突对象
 * @param {string} newStatus - 新状态
 * @returns {EnhancedConflict} 更新后的冲突对象
 */
export function updateConflictStatus(conflict, newStatus) {
  return {
    ...conflict,
    status: newStatus,
    updatedAt: new Date()
  };
}

/**
 * 标记冲突为已修改
 * @param {EnhancedConflict} conflict - 冲突对象
 * @param {ModificationRecord} modificationRecord - 修改记录
 * @returns {EnhancedConflict} 更新后的冲突对象
 */
export function markConflictAsModified(conflict, modificationRecord) {
  return {
    ...conflict,
    isModified: true,
    modificationHistory: [...conflict.modificationHistory, modificationRecord],
    status: ConflictStatus.IN_PROGRESS,
    updatedAt: new Date()
  };
}
