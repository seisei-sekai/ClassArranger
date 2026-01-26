/**
 * Constraint Templates
 * 约束模板
 * 
 * Pre-defined constraint templates for common scheduling patterns
 * 常见排课模式的预定义约束模板
 */

import { timeToSlotIndex } from './constants';

/**
 * Standard constraint templates
 * 标准约束模板
 */
export const CONSTRAINT_TEMPLATES = {
  ALL_AVAILABLE: {
    id: 'all_available',
    name: '完全可用',
    nameEn: 'All Available',
    description: '所有时间都可以',
    allowedDays: [0, 1, 2, 3, 4, 5, 6],
    allowedTimeRanges: [{
      day: null,
      start: 0, // 9:00
      end: 150  // 21:30
    }],
    excludedTimeRanges: [],
    strictness: 'flexible'
  },

  WEEKDAY_ONLY: {
    id: 'weekday_only',
    name: '仅工作日',
    nameEn: 'Weekdays Only',
    description: '周一到周五可用',
    allowedDays: [1, 2, 3, 4, 5],
    allowedTimeRanges: [],
    excludedTimeRanges: [],
    strictness: 'strict'
  },

  WEEKEND_ONLY: {
    id: 'weekend_only',
    name: '仅周末',
    nameEn: 'Weekends Only',
    description: '周六周日可用',
    allowedDays: [0, 6],
    allowedTimeRanges: [],
    excludedTimeRanges: [],
    strictness: 'strict'
  },

  MORNING_ONLY: {
    id: 'morning_only',
    name: '仅上午',
    nameEn: 'Morning Only',
    description: '仅上午9:00-12:00',
    allowedDays: [0, 1, 2, 3, 4, 5, 6],
    allowedTimeRanges: [{
      day: null,
      start: timeToSlotIndex(9, 0),  // 9:00
      end: timeToSlotIndex(12, 0)    // 12:00
    }],
    excludedTimeRanges: [],
    strictness: 'flexible'
  },

  AFTERNOON_ONLY: {
    id: 'afternoon_only',
    name: '仅下午',
    nameEn: 'Afternoon Only',
    description: '仅下午14:00-18:00',
    allowedDays: [0, 1, 2, 3, 4, 5, 6],
    allowedTimeRanges: [{
      day: null,
      start: timeToSlotIndex(14, 0), // 14:00
      end: timeToSlotIndex(18, 0)    // 18:00
    }],
    excludedTimeRanges: [],
    strictness: 'flexible'
  },

  EVENING_ONLY: {
    id: 'evening_only',
    name: '仅晚上',
    nameEn: 'Evening Only',
    description: '仅晚上18:00-21:30',
    allowedDays: [0, 1, 2, 3, 4, 5, 6],
    allowedTimeRanges: [{
      day: null,
      start: timeToSlotIndex(18, 0), // 18:00
      end: timeToSlotIndex(21, 30)   // 21:30
    }],
    excludedTimeRanges: [],
    strictness: 'flexible'
  },

  WEEKDAY_MORNING_EVENING: {
    id: 'weekday_morning_evening',
    name: '工作日上午+晚上',
    nameEn: 'Weekday Morning & Evening',
    description: '工作日上午和晚上（排除下午）',
    allowedDays: [1, 2, 3, 4, 5],
    allowedTimeRanges: [
      {
        day: null,
        start: timeToSlotIndex(9, 0),
        end: timeToSlotIndex(12, 0)
      },
      {
        day: null,
        start: timeToSlotIndex(18, 0),
        end: timeToSlotIndex(21, 30)
      }
    ],
    excludedTimeRanges: [],
    strictness: 'strict'
  },

  EXCLUDE_WEEKDAY_AFTERNOON: {
    id: 'exclude_weekday_afternoon',
    name: '排除工作日下午',
    nameEn: 'Exclude Weekday Afternoon',
    description: '除了工作日下午，其他都可以',
    allowedDays: [0, 1, 2, 3, 4, 5, 6],
    allowedTimeRanges: [],
    excludedTimeRanges: [
      { day: 1, start: timeToSlotIndex(14, 0), end: timeToSlotIndex(18, 0) },
      { day: 2, start: timeToSlotIndex(14, 0), end: timeToSlotIndex(18, 0) },
      { day: 3, start: timeToSlotIndex(14, 0), end: timeToSlotIndex(18, 0) },
      { day: 4, start: timeToSlotIndex(14, 0), end: timeToSlotIndex(18, 0) },
      { day: 5, start: timeToSlotIndex(14, 0), end: timeToSlotIndex(18, 0) }
    ],
    strictness: 'flexible'
  },

  WEEKEND_PREFERRED: {
    id: 'weekend_preferred',
    name: '优先周末',
    nameEn: 'Weekend Preferred',
    description: '周末全天，工作日上午晚上',
    allowedDays: [0, 1, 2, 3, 4, 5, 6],
    allowedTimeRanges: [],
    excludedTimeRanges: [],
    strictness: 'preferred'
  },

  EXCLUDE_LUNCH: {
    id: 'exclude_lunch',
    name: '排除午餐时间',
    nameEn: 'Exclude Lunch Time',
    description: '排除12:00-13:00午餐时间',
    allowedDays: [0, 1, 2, 3, 4, 5, 6],
    allowedTimeRanges: [],
    excludedTimeRanges: [{
      day: null,
      start: timeToSlotIndex(12, 0),
      end: timeToSlotIndex(13, 0)
    }],
    strictness: 'flexible'
  }
};

/**
 * Get all templates as array
 * 获取所有模板数组
 * 
 * @returns {Array} Array of template objects
 */
export function getAllTemplates() {
  return Object.values(CONSTRAINT_TEMPLATES);
}

/**
 * Get template by ID
 * 根据ID获取模板
 * 
 * @param {string} templateId - Template ID
 * @returns {Object|null} Template object or null
 */
export function getTemplateById(templateId) {
  return Object.values(CONSTRAINT_TEMPLATES).find(t => t.id === templateId) || null;
}

/**
 * Match parsed constraint to closest template
 * 将解析的约束匹配到最接近的模板
 * 
 * @param {Object} constraint - Parsed constraint object
 * @returns {Object|null} Best matching template or null
 */
export function matchConstraintToTemplate(constraint) {
  if (!constraint || !constraint.allowedDays) return null;

  const templates = getAllTemplates();
  let bestMatch = null;
  let highestScore = 0;

  templates.forEach(template => {
    const score = calculateTemplateMatchScore(constraint, template);
    if (score > highestScore) {
      highestScore = score;
      bestMatch = template;
    }
  });

  // Only return if match score is reasonably high
  return highestScore > 0.6 ? bestMatch : null;
}

/**
 * Calculate match score between constraint and template
 * 计算约束与模板之间的匹配分数
 * 
 * @param {Object} constraint - Parsed constraint
 * @param {Object} template - Template to compare
 * @returns {number} Match score 0-1
 */
function calculateTemplateMatchScore(constraint, template) {
  let score = 0;
  let totalChecks = 0;

  // Check allowed days match (权重: 0.4)
  totalChecks++;
  const daysMatch = arraysEqual(
    constraint.allowedDays.sort(),
    template.allowedDays.sort()
  );
  if (daysMatch) score += 0.4;

  // Check time ranges similarity (权重: 0.4)
  totalChecks++;
  const timeRangesSimilarity = compareTimeRanges(
    constraint.allowedTimeRanges || [],
    template.allowedTimeRanges || []
  );
  score += timeRangesSimilarity * 0.4;

  // Check excluded ranges similarity (权重: 0.2)
  totalChecks++;
  const excludedSimilarity = compareTimeRanges(
    constraint.excludedTimeRanges || [],
    template.excludedTimeRanges || []
  );
  score += excludedSimilarity * 0.2;

  return score;
}

/**
 * Compare two arrays for equality
 * 比较两个数组是否相等
 */
function arraysEqual(arr1, arr2) {
  if (arr1.length !== arr2.length) return false;
  for (let i = 0; i < arr1.length; i++) {
    if (arr1[i] !== arr2[i]) return false;
  }
  return true;
}

/**
 * Compare time ranges for similarity
 * 比较时间范围的相似度
 * 
 * @returns {number} Similarity score 0-1
 */
function compareTimeRanges(ranges1, ranges2) {
  if (ranges1.length === 0 && ranges2.length === 0) return 1;
  if (ranges1.length === 0 || ranges2.length === 0) return 0;

  let matchCount = 0;
  const maxLength = Math.max(ranges1.length, ranges2.length);

  ranges1.forEach(r1 => {
    const hasMatch = ranges2.some(r2 =>
      r1.day === r2.day &&
      Math.abs(r1.start - r2.start) <= 6 && // Allow 30 min difference
      Math.abs(r1.end - r2.end) <= 6
    );
    if (hasMatch) matchCount++;
  });

  return matchCount / maxLength;
}

/**
 * Apply template to constraint
 * 将模板应用到约束
 * 
 * @param {string} templateId - Template ID
 * @returns {Object} Constraint object based on template
 */
export function applyTemplate(templateId) {
  const template = getTemplateById(templateId);
  if (!template) return null;

  return {
    allowedDays: [...template.allowedDays],
    allowedTimeRanges: JSON.parse(JSON.stringify(template.allowedTimeRanges)),
    excludedTimeRanges: JSON.parse(JSON.stringify(template.excludedTimeRanges)),
    strictness: template.strictness,
    confidence: 1.0,
    reasoning: `应用模板: ${template.name}`
  };
}

/**
 * Suggest templates based on natural language keywords
 * 根据自然语言关键词建议模板
 * 
 * @param {string} nlText - Natural language text
 * @returns {Array} Array of suggested template IDs
 */
export function suggestTemplates(nlText) {
  if (!nlText) return [];

  const text = nlText.toLowerCase();
  const suggestions = [];

  // Check for specific keywords
  if (text.includes('都可以') || text.includes('任何时间')) {
    suggestions.push('all_available');
  }
  
  if (text.includes('平日') && !text.includes('不')) {
    suggestions.push('weekday_only');
  }
  
  if (text.includes('周末')) {
    suggestions.push('weekend_only');
    if (text.includes('尽量') || text.includes('优先')) {
      suggestions.push('weekend_preferred');
    }
  }
  
  if (text.includes('上午') && !text.includes('下午') && !text.includes('晚上')) {
    suggestions.push('morning_only');
  }
  
  if (text.includes('下午') && !text.includes('不') && !text.includes('除了')) {
    suggestions.push('afternoon_only');
  }
  
  if (text.includes('晚上')) {
    suggestions.push('evening_only');
  }
  
  if ((text.includes('除了') || text.includes('不')) && text.includes('下午')) {
    suggestions.push('exclude_weekday_afternoon');
  }
  
  if (text.includes('午餐') || text.includes('午休') || text.includes('12:00')) {
    suggestions.push('exclude_lunch');
  }

  return suggestions;
}

export default {
  CONSTRAINT_TEMPLATES,
  getAllTemplates,
  getTemplateById,
  matchConstraintToTemplate,
  applyTemplate,
  suggestTemplates
};

