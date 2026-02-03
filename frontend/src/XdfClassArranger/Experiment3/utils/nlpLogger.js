/**
 * NLP Logger
 * NLP日志记录器
 * 
 * Logs all NLP parsing activities for analysis and improvement
 * 记录所有NLP解析活动以供分析和改进
 */

/**
 * Log entry structure
 * 日志条目结构
 */
class LogEntry {
  constructor(type, data) {
    this.timestamp = new Date().toISOString();
    this.type = type; // 'parse', 'edit', 'error', 'approval'
    this.data = data;
    this.sessionId = LogEntry.getSessionId();
  }

  static getSessionId() {
    if (!window.__nlpSessionId) {
      window.__nlpSessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    return window.__nlpSessionId;
  }
}

/**
 * NLP Logger Class
 * NLP日志记录器类
 */
class NLPLogger {
  constructor() {
    this.logs = [];
    this.maxLogs = 1000; // Maximum logs to keep in memory
    this.storageKey = 'xdf_nlp_logs';
    this.loadFromStorage();
  }

  /**
   * Log a parsing attempt
   * 记录解析尝试
   * 
   * @param {Object} input - Input data
   * @param {Object} output - Parsed output
   * @param {boolean} success - Whether parsing succeeded
   */
  logParse(input, output, success) {
    const entry = new LogEntry('parse', {
      input: {
        studentName: input.studentName,
        campus: input.campus,
        originalText: input.combinedText
      },
      output: output,
      success: success,
      confidence: output?.confidence || 0
    });

    this.addLog(entry);
  }

  /**
   * Log a human edit
   * 记录人工编辑
   * 
   * @param {string} studentName - Student name
   * @param {Object} original - Original parsed constraint
   * @param {Object} edited - Edited constraint
   */
  logEdit(studentName, original, edited) {
    const entry = new LogEntry('edit', {
      studentName,
      original,
      edited,
      changes: this.detectChanges(original, edited)
    });

    this.addLog(entry);
  }

  /**
   * Log an error
   * 记录错误
   * 
   * @param {Error} error - Error object
   * @param {Object} context - Context information
   */
  logError(error, context = {}) {
    const entry = new LogEntry('error', {
      message: error.message,
      stack: error.stack,
      context: context
    });

    this.addLog(entry);
    console.error('[NLP Logger] Error logged:', error, context);
  }

  /**
   * Log approval/rejection
   * 记录批准/拒绝
   * 
   * @param {string} studentName - Student name
   * @param {string} action - 'approve' or 'reject'
   * @param {Object} constraint - Constraint object
   */
  logApproval(studentName, action, constraint) {
    const entry = new LogEntry('approval', {
      studentName,
      action,
      constraint,
      confidence: constraint?.confidence || 0
    });

    this.addLog(entry);
  }

  /**
   * Log API call
   * 记录API调用
   * 
   * @param {Object} request - Request data
   * @param {Object} response - Response data
   * @param {number} duration - Duration in ms
   */
  logAPICall(request, response, duration) {
    const entry = new LogEntry('api_call', {
      request: {
        model: request.model,
        promptLength: request.userPrompt?.length || 0
      },
      response: {
        success: response.success,
        tokensUsed: response.tokensUsed || 0
      },
      duration
    });

    this.addLog(entry);
  }

  /**
   * Add log entry
   * 添加日志条目
   */
  addLog(entry) {
    this.logs.push(entry);

    // Limit log size
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // Save to storage periodically
    if (this.logs.length % 10 === 0) {
      this.saveToStorage();
    }
  }

  /**
   * Detect changes between original and edited constraints
   * 检测原始约束和编辑约束之间的变化
   */
  detectChanges(original, edited) {
    const changes = [];

    if (!original || !edited) return changes;

    // Check allowed days
    if (JSON.stringify(original.allowedDays) !== JSON.stringify(edited.allowedDays)) {
      changes.push({
        field: 'allowedDays',
        from: original.allowedDays,
        to: edited.allowedDays
      });
    }

    // Check time ranges
    if (JSON.stringify(original.allowedTimeRanges) !== JSON.stringify(edited.allowedTimeRanges)) {
      changes.push({
        field: 'allowedTimeRanges',
        from: original.allowedTimeRanges?.length || 0,
        to: edited.allowedTimeRanges?.length || 0
      });
    }

    // Check excluded ranges
    if (JSON.stringify(original.excludedTimeRanges) !== JSON.stringify(edited.excludedTimeRanges)) {
      changes.push({
        field: 'excludedTimeRanges',
        from: original.excludedTimeRanges?.length || 0,
        to: edited.excludedTimeRanges?.length || 0
      });
    }

    // Check strictness
    if (original.strictness !== edited.strictness) {
      changes.push({
        field: 'strictness',
        from: original.strictness,
        to: edited.strictness
      });
    }

    return changes;
  }

  /**
   * Get statistics
   * 获取统计信息
   * 
   * @returns {Object} Statistics object
   */
  getStatistics() {
    const stats = {
      total: this.logs.length,
      byType: {},
      parseSuccess: 0,
      parseFail: 0,
      avgConfidence: 0,
      humanEdits: 0,
      approvals: 0,
      rejections: 0,
      errors: 0
    };

    let confidenceSum = 0;
    let confidenceCount = 0;

    this.logs.forEach(log => {
      // Count by type
      stats.byType[log.type] = (stats.byType[log.type] || 0) + 1;

      // Parse statistics
      if (log.type === 'parse') {
        if (log.data.success) {
          stats.parseSuccess++;
          confidenceSum += log.data.confidence;
          confidenceCount++;
        } else {
          stats.parseFail++;
        }
      }

      // Edit statistics
      if (log.type === 'edit') {
        stats.humanEdits++;
      }

      // Approval statistics
      if (log.type === 'approval') {
        if (log.data.action === 'approve') {
          stats.approvals++;
        } else {
          stats.rejections++;
        }
      }

      // Error statistics
      if (log.type === 'error') {
        stats.errors++;
      }
    });

    stats.avgConfidence = confidenceCount > 0 
      ? (confidenceSum / confidenceCount).toFixed(3) 
      : 0;

    stats.parseSuccessRate = stats.parseSuccess + stats.parseFail > 0
      ? ((stats.parseSuccess / (stats.parseSuccess + stats.parseFail)) * 100).toFixed(1) + '%'
      : 'N/A';

    stats.approvalRate = stats.approvals + stats.rejections > 0
      ? ((stats.approvals / (stats.approvals + stats.rejections)) * 100).toFixed(1) + '%'
      : 'N/A';

    return stats;
  }

  /**
   * Get logs by type
   * 按类型获取日志
   * 
   * @param {string} type - Log type
   * @param {number} limit - Maximum number of logs to return
   * @returns {Array} Array of log entries
   */
  getLogsByType(type, limit = 50) {
    return this.logs
      .filter(log => log.type === type)
      .slice(-limit)
      .reverse();
  }

  /**
   * Export logs as JSON
   * 将日志导出为JSON
   * 
   * @returns {string} JSON string of logs
   */
  exportLogs() {
    const exportData = {
      exportDate: new Date().toISOString(),
      sessionId: LogEntry.getSessionId(),
      statistics: this.getStatistics(),
      logs: this.logs
    };

    return JSON.stringify(exportData, null, 2);
  }

  /**
   * Download logs as file
   * 下载日志文件
   */
  downloadLogs() {
    const jsonData = this.exportLogs();
    const blob = new Blob([jsonData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nlp_logs_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /**
   * Clear logs
   * 清除日志
   */
  clearLogs() {
    this.logs = [];
    this.saveToStorage();
  }

  /**
   * Save logs to localStorage
   * 保存日志到localStorage
   */
  saveToStorage() {
    try {
      const data = JSON.stringify({
        logs: this.logs.slice(-500), // Save only last 500 logs
        timestamp: new Date().toISOString()
      });
      localStorage.setItem(this.storageKey, data);
    } catch (error) {
      console.error('Failed to save logs to storage:', error);
    }
  }

  /**
   * Load logs from localStorage
   * 从localStorage加载日志
   */
  loadFromStorage() {
    try {
      const data = localStorage.getItem(this.storageKey);
      if (data) {
        const parsed = JSON.parse(data);
        this.logs = parsed.logs || [];
      }
    } catch (error) {
      console.error('Failed to load logs from storage:', error);
      this.logs = [];
    }
  }

  /**
   * Get recent errors for debugging
   * 获取最近的错误以供调试
   * 
   * @param {number} limit - Maximum number of errors to return
   * @returns {Array} Array of error logs
   */
  getRecentErrors(limit = 10) {
    return this.getLogsByType('error', limit);
  }

  /**
   * Analyze edit patterns for prompt improvement
   * 分析编辑模式以改进提示词
   * 
   * @returns {Object} Analysis results
   */
  analyzeEditPatterns() {
    const edits = this.getLogsByType('edit', 1000);
    const fieldChanges = {};

    edits.forEach(edit => {
      edit.data.changes?.forEach(change => {
        const field = change.field;
        if (!fieldChanges[field]) {
          fieldChanges[field] = { count: 0, patterns: [] };
        }
        fieldChanges[field].count++;
        fieldChanges[field].patterns.push({
          from: change.from,
          to: change.to
        });
      });
    });

    return {
      totalEdits: edits.length,
      mostEditedFields: Object.entries(fieldChanges)
        .sort((a, b) => b[1].count - a[1].count)
        .map(([field, data]) => ({
          field,
          editCount: data.count,
          editRate: ((data.count / edits.length) * 100).toFixed(1) + '%'
        })),
      suggestions: this.generatePromptImprovements(fieldChanges)
    };
  }

  /**
   * Generate suggestions for prompt improvement
   * 生成改进提示词的建议
   */
  generatePromptImprovements(fieldChanges) {
    const suggestions = [];

    Object.entries(fieldChanges).forEach(([field, data]) => {
      if (data.count > 5) {
        suggestions.push(
          `字段 "${field}" 经常被修改 (${data.count}次)，建议在提示词中加强对该字段的解析规则`
        );
      }
    });

    return suggestions;
  }
}

// Create singleton instance
let loggerInstance = null;

export function getNLPLogger() {
  if (!loggerInstance) {
    loggerInstance = new NLPLogger();
  }
  return loggerInstance;
}

export default NLPLogger;

