/**
 * 排课调整系统 - 类型定义
 * Schedule Adjustment System - Type Definitions
 */

/**
 * 冲突类型枚举
 */
export const ConflictType = {
  NO_TEACHER: 'NO_TEACHER',       // 无可用教师
  NO_TIME: 'NO_TIME',             // 无共同时间段
  NO_ROOM: 'NO_ROOM',             // 无可用教室
  HOUR_LIMIT: 'HOUR_LIMIT',       // 课时上限
  NO_SUBJECT: 'NO_SUBJECT',       // 无对应科目教师
  OTHER: 'OTHER'                  // 其他原因
};

/**
 * 严重程度枚举
 */
export const Severity = {
  HIGH: 'high',       // 高严重度（如无教师、无科目）
  MEDIUM: 'medium',   // 中严重度（如无共同时间）
  LOW: 'low'          // 低严重度（如教室不足）
};

/**
 * 冲突状态枚举
 */
export const ConflictStatus = {
  PENDING: 'pending',           // 待处理
  IN_PROGRESS: 'in_progress',   // 处理中
  RESOLVED: 'resolved',         // 已解决
  SKIPPED: 'skipped'            // 已跳过
};

/**
 * 建议类型枚举
 */
export const SuggestionType = {
  TIME: 'TIME',               // 时间槽建议
  TEACHER: 'TEACHER',         // 教师建议
  ROOM: 'ROOM',               // 教室建议
  CONSTRAINT: 'CONSTRAINT'    // 约束调整建议
};

/**
 * 目标类型枚举
 */
export const TargetType = {
  STUDENT: 'student',
  TEACHER: 'teacher',
  CLASSROOM: 'classroom'
};

/**
 * 增强的冲突对象
 * @typedef {Object} EnhancedConflict
 * @property {string} id - 冲突唯一标识
 * @property {Object} student - 学生对象
 * @property {string} reason - 原始冲突原因描述
 * @property {string} conflictType - 冲突类型 (ConflictType)
 * @property {string} severity - 严重程度 (Severity)
 * @property {Array<Suggestion>} suggestions - 智能建议列表
 * @property {boolean} isModified - 是否已修改相关数据
 * @property {Array<ModificationRecord>} modificationHistory - 修改历史记录
 * @property {string} status - 处理状态 (ConflictStatus)
 * @property {Date} createdAt - 创建时间
 * @property {Date} updatedAt - 更新时间
 */

/**
 * 智能建议对象
 * @typedef {Object} Suggestion
 * @property {string} id - 建议唯一标识
 * @property {string} type - 建议类型 (SuggestionType)
 * @property {string} title - 建议标题
 * @property {string} description - 建议描述
 * @property {number} confidence - 置信度 (0-1)
 * @property {Object} data - 建议的具体数据
 * @property {Function} applyAction - 应用建议的回调函数
 * @property {string} icon - 图标（可选）
 * @property {Object} metadata - 额外元数据（可选）
 */

/**
 * 修改记录对象
 * @typedef {Object} ModificationRecord
 * @property {string} id - 记录唯一标识
 * @property {Date} timestamp - 修改时间
 * @property {string} targetType - 修改目标类型 (TargetType)
 * @property {string} targetId - 目标对象ID
 * @property {string} targetName - 目标对象名称（用于显示）
 * @property {string} field - 修改的字段名
 * @property {*} oldValue - 修改前的值
 * @property {*} newValue - 修改后的值
 * @property {string} reason - 修改原因
 * @property {string} conflictId - 关联的冲突ID（可选）
 */

/**
 * 排课重试结果
 * @typedef {Object} RetryResult
 * @property {boolean} success - 是否成功
 * @property {Object|null} course - 成功时的课程对象
 * @property {string|null} reason - 失败时的原因
 * @property {string} conflictType - 冲突类型
 * @property {number} attemptCount - 尝试次数
 */

/**
 * 批量重试结果
 * @typedef {Object} BatchRetryResult
 * @property {number} totalAttempts - 总尝试数
 * @property {number} successCount - 成功数
 * @property {number} failureCount - 失败数
 * @property {Array<Object>} newCourses - 新排的课程列表
 * @property {Array<EnhancedConflict>} remainingConflicts - 剩余冲突列表
 * @property {number} executionTime - 执行时间（毫秒）
 */

/**
 * 调整服务配置
 * @typedef {Object} AdjustmentServiceConfig
 * @property {Array} conflicts - 原始冲突列表
 * @property {Array} students - 学生列表
 * @property {Array} teachers - 教师列表
 * @property {Array} classrooms - 教室列表
 * @property {Array} scheduledCourses - 已排课程列表
 * @property {string} algorithm - 使用的排课算法
 */

/**
 * 创建增强冲突对象的工厂函数
 * @param {Object} conflict - 原始冲突对象
 * @param {string} conflictType - 冲突类型
 * @param {string} severity - 严重程度
 * @returns {EnhancedConflict}
 */
export function createEnhancedConflict(conflict, conflictType, severity) {
  return {
    id: generateConflictId(conflict),
    student: conflict.student,
    reason: conflict.reason,
    conflictType,
    severity,
    suggestions: [],
    isModified: false,
    modificationHistory: [],
    status: ConflictStatus.PENDING,
    createdAt: new Date(),
    updatedAt: new Date()
  };
}

/**
 * 创建建议对象的工厂函数
 * @param {string} type - 建议类型
 * @param {string} title - 标题
 * @param {string} description - 描述
 * @param {number} confidence - 置信度
 * @param {Object} data - 数据
 * @param {Function} applyAction - 应用回调
 * @returns {Suggestion}
 */
export function createSuggestion(type, title, description, confidence, data, applyAction) {
  return {
    id: `suggestion-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    type,
    title,
    description,
    confidence,
    data,
    applyAction,
    icon: getSuggestionIcon(type),
    metadata: {}
  };
}

/**
 * 创建修改记录对象的工厂函数
 * @param {string} targetType - 目标类型
 * @param {string} targetId - 目标ID
 * @param {string} targetName - 目标名称
 * @param {string} field - 字段名
 * @param {*} oldValue - 旧值
 * @param {*} newValue - 新值
 * @param {string} reason - 原因
 * @param {string} conflictId - 冲突ID
 * @returns {ModificationRecord}
 */
export function createModificationRecord(targetType, targetId, targetName, field, oldValue, newValue, reason, conflictId = null) {
  return {
    id: `modification-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    timestamp: new Date(),
    targetType,
    targetId,
    targetName,
    field,
    oldValue,
    newValue,
    reason,
    conflictId
  };
}

/**
 * 生成冲突唯一ID
 * @param {Object} conflict - 冲突对象
 * @returns {string}
 */
function generateConflictId(conflict) {
  const studentId = conflict.student?.id || 'unknown';
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 9);
  return `conflict-${studentId}-${timestamp}-${random}`;
}

/**
 * 获取建议类型对应的图标
 * @param {string} type - 建议类型
 * @returns {string}
 */
function getSuggestionIcon(type) {
  const iconMap = {
    [SuggestionType.TIME]: '🕐',
    [SuggestionType.TEACHER]: '👨‍🏫',
    [SuggestionType.ROOM]: '🏫',
    [SuggestionType.CONSTRAINT]: '⚙️'
  };
  return iconMap[type] || '💡';
}
