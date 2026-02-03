/**
 * New Constraint Type System (10 Types)
 * 新约束类型系统（10类）
 * 
 * Based on: business/前途塾1v1_约束抽象.md
 * 
 * 10 Constraint Types:
 * 1. time_window - 可上/偏好时间集合
 * 2. blackout - 禁排时间集合
 * 3. fixed_slot - 固定课/已约定时间
 * 4. horizon - 最早/最晚/截止
 * 5. session_plan - 次数/频次/时长/总课时
 * 6. resource_preference - 资源偏好（教师/校区/教室/线上线下）
 * 7. no_overlap - 不可重叠/避免冲突
 * 8. strategy - 排布策略/阶段目标
 * 9. entitlement - 课时资格/订单编码
 * 10. workflow_gate - 流程状态机门禁
 */

// ==================== Type Definitions ====================

/**
 * @typedef {'time_window' | 'blackout' | 'fixed_slot' | 'horizon' | 'session_plan' | 'resource_preference' | 'no_overlap' | 'strategy' | 'entitlement' | 'workflow_gate'} ConstraintKind
 */

/**
 * @typedef {'hard' | 'soft' | 'info'} ConstraintStrength
 */

/**
 * @typedef {Object} DateRange
 * @property {string} start - YYYY-MM-DD
 * @property {string} end - YYYY-MM-DD
 */

/**
 * @typedef {Object} TimeRange
 * @property {string} start - HH:MM
 * @property {string} end - HH:MM
 */

/**
 * @typedef {Object} ConstraintScope
 * @property {string} [orderId]
 * @property {string} [studentId]
 * @property {string} [courseId]
 */

/**
 * Base Constraint - Common fields for all constraints
 * @typedef {Object} BaseConstraint
 * @property {string} id - Unique constraint ID
 * @property {ConstraintKind} kind - Constraint type
 * @property {ConstraintStrength} strength - hard, soft, or info
 * @property {number} priority - Higher = more important (for soft constraints)
 * @property {ConstraintScope} scope - Which entities this applies to
 * @property {string} note - User notes or original text
 * @property {string[]} source - Source column names from Excel
 * @property {number} confidence - AI confidence score (0-1)
 */

// ==================== 1. TIME_WINDOW ====================

/**
 * Time Window Constraint - 可上/偏好时间集合
 * @typedef {Object} TimeWindowConstraint
 * @property {'time_window'} kind
 * @property {'allow' | 'prefer'} operator - allow=可以上课, prefer=偏好上课
 * @property {DateRange} [dateRange] - Optional date range
 * @property {number[]} weekdays - [1-7] 周一到周日
 * @property {TimeRange[]} timeRanges - Multiple time ranges per day
 * @property {string} [timezone] - Default: 'Asia/Tokyo'
 */

export const TIME_WINDOW_METADATA = {
  name: '可用时间窗口',
  description: '学生可以上课或偏好上课的时间段',
  icon: '🕐',
  examples: [
    '工作日晚上可上课',
    '周末全天偏好',
    '周一、周三、周五 18:00-21:00'
  ],
  defaultValue: {
    kind: 'time_window',
    strength: 'soft',
    operator: 'allow',
    weekdays: [1, 2, 3, 4, 5, 6, 7], // All days
    timeRanges: [{ start: '09:00', end: '21:00' }],
    priority: 5,
    confidence: 1.0
  }
};

// ==================== 2. BLACKOUT ====================

/**
 * Blackout Constraint - 禁排时间集合
 * @typedef {Object} BlackoutConstraint
 * @property {'blackout'} kind
 * @property {DateRange} [dateRange]
 * @property {number[]} weekdays - [1-7]
 * @property {TimeRange[]} timeRanges
 * @property {'language_school' | 'travel' | 'fixed_event' | 'other'} reason
 */

export const BLACKOUT_METADATA = {
  name: '禁排时间',
  description: '学生绝对不能上课的时间段（硬约束）',
  icon: '🚫',
  examples: [
    '语校时段不可排课（周一至周五 09:00-16:00）',
    '回国期间不上课（2024-12-20 至 2025-01-05）',
    '每周三下午有固定活动'
  ],
  defaultValue: {
    kind: 'blackout',
    strength: 'hard',
    weekdays: [],
    timeRanges: [],
    reason: 'other',
    priority: 10,
    confidence: 1.0
  }
};

// ==================== 3. FIXED_SLOT ====================

/**
 * Fixed Slot Constraint - 固定课/已约定时间
 * @typedef {Object} FixedSlotConstraint
 * @property {'fixed_slot'} kind
 * @property {Array<{start: string, end: string}>} slots - ISO datetime strings
 * @property {boolean} locked - If true, cannot be moved
 */

export const FIXED_SLOT_METADATA = {
  name: '固定课时',
  description: '已经与教师约定好的固定上课时间',
  icon: '📌',
  examples: [
    '每周一 19:00-21:00 固定课',
    '已约定：2024-02-05 14:00-16:00'
  ],
  defaultValue: {
    kind: 'fixed_slot',
    strength: 'hard',
    slots: [],
    locked: true,
    priority: 10,
    confidence: 1.0
  }
};

// ==================== 4. HORIZON ====================

/**
 * Horizon Constraint - 最早/最晚/截止
 * @typedef {Object} HorizonConstraint
 * @property {'horizon'} kind
 * @property {string} [earliest] - YYYY-MM-DD - 最早开始日期
 * @property {string} [latest] - YYYY-MM-DD - 最晚结束日期
 * @property {string} [mustFinishBy] - YYYY-MM-DD - 必须完成截止日期
 */

export const HORIZON_METADATA = {
  name: '时间范围',
  description: '课程必须在什么时间段内完成',
  icon: '📅',
  examples: [
    '2月5日之前上完',
    '1月15日到2月28日之间都可以',
    '必须在面试前（2月10日）完成'
  ],
  defaultValue: {
    kind: 'horizon',
    strength: 'hard',
    earliest: null,
    latest: null,
    mustFinishBy: null,
    priority: 9,
    confidence: 1.0
  }
};

// ==================== 5. SESSION_PLAN ====================

/**
 * Session Plan Constraint - 次数/频次/时长/总课时
 * @typedef {Object} SessionPlanConstraint
 * @property {'session_plan'} kind
 * @property {number} [totalSessions] - 总共多少次课
 * @property {number} [sessionDurationMin] - 每次课多长（分钟）
 * @property {number} [sessionsPerWeek] - 每周几次课
 * @property {number} [totalHours] - 总共多少小时
 * @property {Array<{count: number, durationMin: number, within: DateRange}>} [specialSessions]
 * @property {boolean} [allowCancelLastIfReady] - 如果提前准备好，可否取消最后一次
 */

export const SESSION_PLAN_METADATA = {
  name: '课程计划',
  description: '课程的次数、频率、时长等安排',
  icon: '📊',
  examples: [
    '一周2次课，每次2小时',
    '总共8次课，每次120分钟',
    '40小时课时，一周上3次'
  ],
  defaultValue: {
    kind: 'session_plan',
    strength: 'soft',
    totalSessions: null,
    sessionDurationMin: 120, // Default 2 hours
    sessionsPerWeek: 2,
    totalHours: null,
    specialSessions: [],
    allowCancelLastIfReady: false,
    priority: 7,
    confidence: 1.0
  }
};

// ==================== 6. RESOURCE_PREFERENCE ====================

/**
 * Resource Preference Constraint - 资源偏好
 * @typedef {Object} ResourcePreferenceConstraint
 * @property {'resource_preference'} kind
 * @property {'teacher' | 'campus' | 'room' | 'delivery_mode'} resourceType
 * @property {string[]} [include] - Must use these resources
 * @property {string[]} [exclude] - Must NOT use these resources
 * @property {string[]} [prefer] - Prefer these resources
 * @property {boolean} [mustBeSameResource] - All sessions must use same resource
 */

export const RESOURCE_PREFERENCE_METADATA = {
  name: '资源偏好',
  description: '对教师、校区、教室、上课方式的偏好或限制',
  icon: '👨‍🏫',
  examples: [
    '指定林老师',
    '不要田中老师',
    '尽量板桥校区',
    '只能线上'
  ],
  defaultValue: {
    kind: 'resource_preference',
    strength: 'soft',
    resourceType: 'teacher',
    include: [],
    exclude: [],
    prefer: [],
    mustBeSameResource: false,
    priority: 6,
    confidence: 1.0
  }
};

// ==================== 7. NO_OVERLAP ====================

/**
 * No Overlap Constraint - 不可重叠/避免冲突
 * @typedef {Object} NoOverlapConstraint
 * @property {'no_overlap'} kind
 * @property {Array<{type: string, id?: string, title?: string, time?: {start: string, end: string}}>} with
 * @property {number} [bufferMin] - Buffer time in minutes
 */

export const NO_OVERLAP_METADATA = {
  name: '避免冲突',
  description: '不要与其他课程或事件冲突',
  icon: '⚠️',
  examples: [
    '不要与其他课程重叠',
    '面试课前后留30分钟缓冲',
    '避免与EJU课程冲突'
  ],
  defaultValue: {
    kind: 'no_overlap',
    strength: 'hard',
    with: [],
    bufferMin: 0,
    priority: 9,
    confidence: 1.0
  }
};

// ==================== 8. STRATEGY ====================

/**
 * Strategy Constraint - 排布策略/阶段目标
 * @typedef {Object} StrategyConstraint
 * @property {'strategy'} kind
 * @property {Array<{type: string, granularity?: string, count?: number, by?: string, sequence?: string[]}>} rules
 */

export const STRATEGY_METADATA = {
  name: '排课策略',
  description: '课程分布、阶段目标等高级策略',
  icon: '🎯',
  examples: [
    '平均分布到各周',
    '两周内至少上4次课',
    '先写稿后练面试'
  ],
  defaultValue: {
    kind: 'strategy',
    strength: 'soft',
    rules: [],
    priority: 5,
    confidence: 1.0
  }
};

// ==================== 9. ENTITLEMENT ====================

/**
 * Entitlement Constraint - 课时资格/订单编码
 * @typedef {Object} EntitlementConstraint
 * @property {'entitlement'} kind
 * @property {'local' | 'erp' | 'mixed'} sourceType
 * @property {string[]} orderCodes
 * @property {'paid' | 'pending' | 'unknown'} paymentStatus
 * @property {string} [paidAt] - YYYY-MM-DD
 */

export const ENTITLEMENT_METADATA = {
  name: '课时资格',
  description: '课时是否到账、订单编码等信息',
  icon: '💳',
  examples: [
    '课时编码：20252413',
    'ERP编码：ERP1023',
    '已到账（2024-01-15）'
  ],
  defaultValue: {
    kind: 'entitlement',
    strength: 'hard',
    sourceType: 'local',
    orderCodes: [],
    paymentStatus: 'unknown',
    paidAt: null,
    priority: 10,
    confidence: 1.0
  }
};

// ==================== 10. WORKFLOW_GATE ====================

/**
 * Workflow Gate Constraint - 流程状态机门禁
 * @typedef {Object} WorkflowGateConstraint
 * @property {'workflow_gate'} kind
 * @property {string} state
 * @property {Array<{from: string, requires: string[]}>} guards
 */

export const WORKFLOW_GATE_METADATA = {
  name: '流程门禁',
  description: '教务流程的状态和门禁条件',
  icon: '🚦',
  examples: [
    '学生课时已确认',
    '讲师时间已确认',
    '教室已确定'
  ],
  defaultValue: {
    kind: 'workflow_gate',
    strength: 'info',
    state: 'draft',
    guards: [],
    priority: 0,
    confidence: 1.0
  }
};

// ==================== All Constraint Types ====================

export const ALL_CONSTRAINT_TYPES = {
  time_window: TIME_WINDOW_METADATA,
  blackout: BLACKOUT_METADATA,
  fixed_slot: FIXED_SLOT_METADATA,
  horizon: HORIZON_METADATA,
  session_plan: SESSION_PLAN_METADATA,
  resource_preference: RESOURCE_PREFERENCE_METADATA,
  no_overlap: NO_OVERLAP_METADATA,
  strategy: STRATEGY_METADATA,
  entitlement: ENTITLEMENT_METADATA,
  workflow_gate: WORKFLOW_GATE_METADATA
};

// ==================== Validation Functions ====================

/**
 * Validate a constraint based on its type
 * @param {Object} constraint
 * @returns {{valid: boolean, errors: string[]}}
 */
export function validateConstraint(constraint) {
  const errors = [];
  
  if (!constraint || typeof constraint !== 'object') {
    return { valid: false, errors: ['约束必须是一个对象'] };
  }
  
  if (!constraint.kind || !ALL_CONSTRAINT_TYPES[constraint.kind]) {
    return { valid: false, errors: ['无效的约束类型'] };
  }
  
  // Type-specific validation
  switch (constraint.kind) {
    case 'time_window':
      if (!Array.isArray(constraint.weekdays) || constraint.weekdays.length === 0) {
        errors.push('请选择至少一个星期');
      }
      if (!Array.isArray(constraint.timeRanges) || constraint.timeRanges.length === 0) {
        errors.push('请添加至少一个时间段');
      }
      break;
      
    case 'blackout':
      if (!Array.isArray(constraint.weekdays) || constraint.weekdays.length === 0) {
        errors.push('请选择禁排的星期');
      }
      if (!Array.isArray(constraint.timeRanges) || constraint.timeRanges.length === 0) {
        errors.push('请添加禁排的时间段');
      }
      break;
      
    case 'fixed_slot':
      if (!Array.isArray(constraint.slots) || constraint.slots.length === 0) {
        errors.push('请添加至少一个固定课时');
      }
      break;
      
    case 'horizon':
      if (!constraint.earliest && !constraint.latest && !constraint.mustFinishBy) {
        errors.push('请至少设置一个时间限制');
      }
      break;
      
    case 'session_plan':
      if (!constraint.totalSessions && !constraint.totalHours) {
        errors.push('请设置总次数或总课时');
      }
      break;
      
    case 'resource_preference':
      if (!constraint.resourceType) {
        errors.push('请选择资源类型');
      }
      if (constraint.include?.length === 0 && constraint.exclude?.length === 0 && constraint.prefer?.length === 0) {
        errors.push('请至少添加一个资源');
      }
      break;
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Create a default constraint of a given type
 * @param {ConstraintKind} kind
 * @param {Object} overrides
 * @returns {Object}
 */
export function createDefaultConstraint(kind, overrides = {}) {
  const metadata = ALL_CONSTRAINT_TYPES[kind];
  if (!metadata) {
    throw new Error(`Unknown constraint kind: ${kind}`);
  }
  
  return {
    id: `constraint_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    ...metadata.defaultValue,
    ...overrides,
    source: overrides.source || [],
    note: overrides.note || ''
  };
}

/**
 * Serialize constraint for storage
 * @param {Object} constraint
 * @returns {Object}
 */
export function serializeConstraint(constraint) {
  return JSON.parse(JSON.stringify(constraint));
}

/**
 * Deserialize constraint from storage
 * @param {Object} data
 * @returns {Object}
 */
export function deserializeConstraint(data) {
  return data;
}

// ==================== Helper Functions ====================

/**
 * Get natural language description of a constraint
 * @param {Object} constraint
 * @returns {string}
 */
export function getConstraintDescription(constraint) {
  if (!constraint) return '';
  
  switch (constraint.kind) {
    case 'time_window': {
      const days = constraint.weekdays.map(d => ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][d]).join('、');
      const times = constraint.timeRanges.map(t => `${t.start}-${t.end}`).join('、');
      const op = constraint.operator === 'prefer' ? '偏好' : '可以';
      return `${days} ${times} ${op}上课`;
    }
    
    case 'blackout': {
      const days = constraint.weekdays.map(d => ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][d]).join('、');
      const times = constraint.timeRanges.map(t => `${t.start}-${t.end}`).join('、');
      return `${days} ${times} 禁止排课`;
    }
    
    case 'fixed_slot':
      return `已固定 ${constraint.slots.length} 个课时`;
    
    case 'horizon':
      if (constraint.mustFinishBy) return `必须在 ${constraint.mustFinishBy} 前完成`;
      if (constraint.earliest && constraint.latest) return `${constraint.earliest} 至 ${constraint.latest} 之间`;
      if (constraint.earliest) return `最早 ${constraint.earliest} 开始`;
      if (constraint.latest) return `最晚 ${constraint.latest} 结束`;
      return '时间范围约束';
    
    case 'session_plan':
      const parts = [];
      if (constraint.totalSessions) parts.push(`${constraint.totalSessions}次课`);
      if (constraint.sessionsPerWeek) parts.push(`每周${constraint.sessionsPerWeek}次`);
      if (constraint.sessionDurationMin) parts.push(`每次${constraint.sessionDurationMin}分钟`);
      return parts.join('，');
    
    case 'resource_preference': {
      const type = {teacher: '教师', campus: '校区', room: '教室', delivery_mode: '上课方式'}[constraint.resourceType] || constraint.resourceType;
      if (constraint.include?.length > 0) return `指定${type}：${constraint.include.join('、')}`;
      if (constraint.exclude?.length > 0) return `排除${type}：${constraint.exclude.join('、')}`;
      if (constraint.prefer?.length > 0) return `偏好${type}：${constraint.prefer.join('、')}`;
      return `${type}偏好`;
    }
    
    case 'no_overlap':
      return `避免与 ${constraint.with.length} 个事件冲突`;
    
    case 'strategy':
      return `${constraint.rules.length} 个策略规则`;
    
    case 'entitlement':
      return `订单编码：${constraint.orderCodes.join('、')}`;
    
    case 'workflow_gate':
      return `流程状态：${constraint.state}`;
    
    default:
      return constraint.kind;
  }
}
