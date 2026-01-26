/**
 * Natural Language Processing Time Parser
 * 自然语言时间解析器
 * 
 * Handles various natural language time expressions
 * 处理各种自然语言时间表达
 */

import { timeToSlotIndex, SLOTS_PER_DAY } from '../utils/constants';

class NLPTimeParser {
  constructor() {
    this.patterns = this.initializePatterns();
  }
  
  /**
   * Initialize parsing patterns
   * 初始化解析模式
   */
  initializePatterns() {
    return [
      // Time range pattern (时间段模式)
      {
        pattern: /(\d{1,2})[:\uff1a]?(\d{2})?\s*[-~到至]\s*(\d{1,2})[:\uff1a]?(\d{2})?/g,
        handler: this.parseTimeRange.bind(this),
        priority: 10
      },
      // Exclusion pattern (排除模式)
      {
        pattern: /(除了|除|不能|不要|排除).*?(\d{1,2})[:\uff1a]?(\d{2})?\s*[-~到至]\s*(\d{1,2})[:\uff1a]?(\d{2})?/g,
        handler: this.parseExclusionTime.bind(this),
        priority: 9
      },
      // Relative time (相对时间)
      {
        pattern: /(\d{1,2})[:\uff1a]?(\d{2})?\s*(之后|以后|之前|以前)/g,
        handler: this.parseRelativeTime.bind(this),
        priority: 8
      },
      // Time period keywords (时段关键词)
      {
        pattern: /(上午|下午|晚上|早上|中午|傍晚|深夜)/g,
        handler: this.parseTimeKeyword.bind(this),
        priority: 7
      },
      // Week range pattern (星期模式)
      {
        pattern: /(周|星期)(一|二|三|四|五|六|日|天)?(\s*到\s*|-|~)(周|星期)?(一|二|三|四|五|六|日|天)/g,
        handler: this.parseWeekRange.bind(this),
        priority: 6
      },
      // Single weekday (单个星期几)
      {
        pattern: /(周|星期)(一|二|三|四|五|六|日|天)/g,
        handler: this.parseSingleWeekday.bind(this),
        priority: 5
      },
      // "Only" keyword (只有/仅)
      {
        pattern: /(只有|仅|只能)/,
        handler: this.parseOnlyKeyword.bind(this),
        priority: 4
      }
    ];
  }
  
  /**
   * Main parsing function
   * 主解析函数
   * 
   * @param {string} rawText - Raw text to parse (要解析的原始文本)
   * @returns {Object} Structured time constraints (结构化的时间约束)
   */
  parse(rawText) {
    if (!rawText || typeof rawText !== 'string') {
      return this.createDefaultConstraints();
    }
    
    const constraints = {
      allowedDays: new Set([0, 1, 2, 3, 4, 5, 6]), // Default all days (默认全部日期)
      allowedTimeRanges: [], // [{day, start: slotIndex, end: slotIndex}]
      excludedTimeRanges: [], // [{day, start: slotIndex, end: slotIndex}]
      preferredTimes: [], // [{day, start: slotIndex, end: slotIndex, weight}]
      strictness: 'flexible', // 'strict' | 'flexible' | 'preferred'
      hasOnlyKeyword: false,
      rawText: rawText
    };
    
    // Sort patterns by priority (按优先级排序模式)
    const sortedPatterns = [...this.patterns].sort((a, b) => b.priority - a.priority);
    
    // Apply all patterns (应用所有模式)
    sortedPatterns.forEach(({ pattern, handler }) => {
      const text = rawText;
      let matches;
      
      // Reset lastIndex for global regexes (为全局正则重置lastIndex)
      if (pattern.global) pattern.lastIndex = 0;
      
      while ((matches = pattern.exec(text)) !== null) {
        handler(matches, constraints, text);
      }
    });
    
    // Post-process: Merge and optimize constraints (后处理：合并和优化约束)
    this.postProcess(constraints);
    
    return constraints;
  }
  
  /**
   * Parse time range (解析时间范围)
   * Format: "10:00-12:00", "14:30到16:00"
   */
  parseTimeRange(matches, constraints, fullText) {
    const startHour = parseInt(matches[1]);
    const startMin = matches[2] ? parseInt(matches[2]) : 0;
    const endHour = parseInt(matches[3]);
    const endMin = matches[4] ? parseInt(matches[4]) : 0;
    
    const startSlot = timeToSlotIndex(startHour, startMin);
    const endSlot = timeToSlotIndex(endHour, endMin);
    
    if (startSlot < 0 || endSlot > SLOTS_PER_DAY || startSlot >= endSlot) {
      return; // Invalid range (无效范围)
    }
    
    // Check context for exclusion (检查上下文是否排除)
    const matchIndex = matches.index;
    const contextBefore = fullText.substring(Math.max(0, matchIndex - 20), matchIndex);
    const isExclusion = /除|不|排除/.test(contextBefore);
    
    // Apply to all days or specific days based on context
    // 根据上下文应用到所有日期或特定日期
    const days = this.extractDaysFromContext(fullText, matchIndex);
    
    if (days.length === 0) {
      // Apply to all days (应用到所有日期)
      for (let day = 0; day < 7; day++) {
        this.addTimeRange(constraints, day, startSlot, endSlot, isExclusion);
      }
    } else {
      // Apply to specific days (应用到特定日期)
      days.forEach(day => {
        this.addTimeRange(constraints, day, startSlot, endSlot, isExclusion);
      });
    }
  }
  
  /**
   * Parse exclusion time (解析排除时间)
   * Format: "除了14:00-16:00", "不能12:00-13:00"
   */
  parseExclusionTime(matches, constraints, fullText) {
    const startHour = parseInt(matches[2]);
    const startMin = matches[3] ? parseInt(matches[3]) : 0;
    const endHour = parseInt(matches[4]);
    const endMin = matches[5] ? parseInt(matches[5]) : 0;
    
    const startSlot = timeToSlotIndex(startHour, startMin);
    const endSlot = timeToSlotIndex(endHour, endMin);
    
    if (startSlot >= 0 && endSlot <= SLOTS_PER_DAY && startSlot < endSlot) {
      for (let day = 0; day < 7; day++) {
        constraints.excludedTimeRanges.push({ day, start: startSlot, end: endSlot });
      }
    }
  }
  
  /**
   * Parse relative time (解析相对时间)
   * Format: "14:00之后", "12:00以前"
   */
  parseRelativeTime(matches, constraints, fullText) {
    const hour = parseInt(matches[1]);
    const minute = matches[2] ? parseInt(matches[2]) : 0;
    const relation = matches[3]; // "之后", "以后", "之前", "以前"
    
    const slot = timeToSlotIndex(hour, minute);
    
    if (slot < 0 || slot > SLOTS_PER_DAY) return;
    
    const isAfter = relation.includes('后');
    
    for (let day = 0; day < 7; day++) {
      if (isAfter) {
        // After specified time (指定时间之后)
        constraints.allowedTimeRanges.push({ day, start: slot, end: SLOTS_PER_DAY });
      } else {
        // Before specified time (指定时间之前)
        constraints.allowedTimeRanges.push({ day, start: 0, end: slot });
      }
    }
  }
  
  /**
   * Parse time keywords (解析时间关键词)
   * Format: "上午", "下午", "晚上", "中午"
   */
  parseTimeKeyword(matches, constraints, fullText) {
    const keyword = matches[1];
    
    // Check if it's an exclusion (检查是否排除)
    const matchIndex = matches.index;
    const contextBefore = fullText.substring(Math.max(0, matchIndex - 10), matchIndex);
    const isExclusion = /除|不|排除/.test(contextBefore);
    
    let startSlot, endSlot;
    
    switch (keyword) {
      case '上午':
      case '早上':
        startSlot = timeToSlotIndex(9, 0);
        endSlot = timeToSlotIndex(12, 0);
        break;
      case '中午':
        startSlot = timeToSlotIndex(11, 0);
        endSlot = timeToSlotIndex(14, 0);
        break;
      case '下午':
        startSlot = timeToSlotIndex(14, 0);
        endSlot = timeToSlotIndex(18, 0);
        break;
      case '晚上':
        startSlot = timeToSlotIndex(18, 0);
        endSlot = timeToSlotIndex(21, 30);
        break;
      case '傍晚':
        startSlot = timeToSlotIndex(17, 0);
        endSlot = timeToSlotIndex(19, 0);
        break;
      case '深夜':
        startSlot = timeToSlotIndex(21, 0);
        endSlot = timeToSlotIndex(23, 59);
        break;
      default:
        return;
    }
    
    for (let day = 0; day < 7; day++) {
      this.addTimeRange(constraints, day, startSlot, endSlot, isExclusion);
    }
  }
  
  /**
   * Parse week range (解析星期范围)
   * Format: "周一到周五", "星期二-星期四"
   */
  parseWeekRange(matches, constraints, fullText) {
    const startDay = this.chineseDayToNumber(matches[2]);
    const endDay = this.chineseDayToNumber(matches[5]);
    
    if (startDay === null || endDay === null) return;
    
    // Clear allowed days and set new range (清除允许的日期并设置新范围)
    constraints.allowedDays.clear();
    
    if (startDay <= endDay) {
      for (let d = startDay; d <= endDay; d++) {
        constraints.allowedDays.add(d);
      }
    } else {
      // Wrap around (例如：周五到周一)
      for (let d = startDay; d < 7; d++) {
        constraints.allowedDays.add(d);
      }
      for (let d = 0; d <= endDay; d++) {
        constraints.allowedDays.add(d);
      }
    }
  }
  
  /**
   * Parse single weekday (解析单个星期几)
   * Format: "周一", "星期三"
   */
  parseSingleWeekday(matches, constraints, fullText) {
    const day = this.chineseDayToNumber(matches[2]);
    if (day === null) return;
    
    // Check if it's within a larger context (检查是否在更大的上下文中)
    const matchIndex = matches.index;
    const contextAfter = fullText.substring(matchIndex, matchIndex + 20);
    
    // If followed by range indicator, skip (let parseWeekRange handle it)
    // 如果后面跟着范围指示符，跳过（让parseWeekRange处理）
    if (/[-~到至]/.test(contextAfter)) {
      return;
    }
    
    // Single day specification (单日指定)
    constraints.allowedDays.clear();
    constraints.allowedDays.add(day);
  }
  
  /**
   * Parse "only" keyword (解析"只有"关键词)
   */
  parseOnlyKeyword(matches, constraints, fullText) {
    constraints.hasOnlyKeyword = true;
    constraints.strictness = 'strict';
  }
  
  /**
   * Add time range to constraints
   * 添加时间范围到约束
   */
  addTimeRange(constraints, day, startSlot, endSlot, isExclusion) {
    if (isExclusion) {
      constraints.excludedTimeRanges.push({ day, start: startSlot, end: endSlot });
    } else {
      constraints.allowedTimeRanges.push({ day, start: startSlot, end: endSlot });
    }
  }
  
  /**
   * Extract days from context
   * 从上下文提取日期
   */
  extractDaysFromContext(text, matchIndex) {
    const contextBefore = text.substring(Math.max(0, matchIndex - 30), matchIndex);
    const days = [];
    
    const dayPattern = /(周|星期)(一|二|三|四|五|六|日|天)/g;
    let match;
    
    while ((match = dayPattern.exec(contextBefore)) !== null) {
      const day = this.chineseDayToNumber(match[2]);
      if (day !== null) days.push(day);
    }
    
    return days;
  }
  
  /**
   * Convert Chinese day to number
   * 将中文星期转换为数字
   * 
   * @param {string} chineseDay - Chinese day string (中文星期字符串)
   * @returns {number|null} Day number 0-6 (日期数字0-6) or null
   */
  chineseDayToNumber(chineseDay) {
    const mapping = {
      '日': 0, '天': 0,
      '一': 1,
      '二': 2,
      '三': 3,
      '四': 4,
      '五': 5,
      '六': 6
    };
    return mapping[chineseDay] !== undefined ? mapping[chineseDay] : null;
  }
  
  /**
   * Post-process constraints
   * 后处理约束
   */
  postProcess(constraints) {
    // Merge overlapping ranges (合并重叠范围)
    constraints.allowedTimeRanges = this.mergeRanges(constraints.allowedTimeRanges);
    constraints.excludedTimeRanges = this.mergeRanges(constraints.excludedTimeRanges);
    
    // Apply exclusions (应用排除)
    this.applyExclusions(constraints);
    
    // Determine strictness (确定严格程度)
    if (constraints.allowedTimeRanges.length > 0 || constraints.hasOnlyKeyword) {
      constraints.strictness = 'strict';
    }
  }
  
  /**
   * Merge overlapping ranges
   * 合并重叠范围
   */
  mergeRanges(ranges) {
    if (ranges.length === 0) return ranges;
    
    // Group by day (按日期分组)
    const byDay = {};
    ranges.forEach(range => {
      if (!byDay[range.day]) byDay[range.day] = [];
      byDay[range.day].push(range);
    });
    
    // Merge each day (合并每一天)
    const merged = [];
    Object.keys(byDay).forEach(day => {
      const dayRanges = byDay[day].sort((a, b) => a.start - b.start);
      let current = dayRanges[0];
      
      for (let i = 1; i < dayRanges.length; i++) {
        if (dayRanges[i].start <= current.end) {
          current.end = Math.max(current.end, dayRanges[i].end);
        } else {
          merged.push(current);
          current = dayRanges[i];
        }
      }
      merged.push(current);
    });
    
    return merged;
  }
  
  /**
   * Apply exclusions to allowed ranges
   * 将排除应用到允许范围
   */
  applyExclusions(constraints) {
    // TODO: Implement exclusion logic
    // For now, keep both lists separate
    // 待办：实现排除逻辑
    // 目前保持两个列表分离
  }
  
  /**
   * Create default constraints (all times allowed)
   * 创建默认约束（所有时间允许）
   */
  createDefaultConstraints() {
    return {
      allowedDays: new Set([0, 1, 2, 3, 4, 5, 6]),
      allowedTimeRanges: [],
      excludedTimeRanges: [],
      preferredTimes: [],
      strictness: 'flexible',
      hasOnlyKeyword: false,
      rawText: ''
    };
  }
}

export default NLPTimeParser;

