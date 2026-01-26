/**
 * OpenAI Service for Constraint Parsing
 * OpenAI约束解析服务
 * 
 * Converts natural language time preferences to structured constraints
 * 将自然语言时间偏好转换为结构化约束
 */

import { SYSTEM_PROMPT, USER_PROMPT_TEMPLATE } from '../prompts/constraintParsingPrompt';

class OpenAIConstraintParser {
  constructor(apiKey) {
    // ⚠️ Note: API key is now managed by backend proxy
    // apiKey parameter is kept for backwards compatibility but not used
    this.apiKey = 'managed-by-backend-proxy';
    
    // Use backend proxy instead of direct OpenAI API call
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
    this.baseURL = `${apiUrl}/ai/openai/parse-constraint`;  // Corrected path
    
    this.model = 'gpt-4o-mini'; // Cost-effective for batch processing
    this.temperature = 0; // Consistency is important
    this.maxRetries = 3;
    this.retryDelay = 1000; // 1 second base delay
    
    console.log('✅ OpenAI service initialized (using backend proxy)');
    console.log(`📡 Backend proxy: ${this.baseURL}`);
  }

  /**
   * Parse a single student's constraint from natural language
   * 从自然语言解析单个学生的约束
   * 
   * @param {Object} studentData - Student data with NL text
   * @param {string} studentData.studentName - Student name (学生姓名)
   * @param {string} studentData.campus - Campus (校区)
   * @param {string} studentData.combinedText - Combined NL constraint text (组合的自然语言约束文本)
   * @returns {Promise<Object>} Parsed constraint object
   */
  async parseStudentConstraints(studentData) {
    const userPrompt = USER_PROMPT_TEMPLATE
      .replace('{studentName}', studentData.studentName || '未知学生')
      .replace('{campus}', studentData.campus || '未知校区')
      .replace('{nlText}', studentData.combinedText || '无约束');

    try {
      const response = await this.callOpenAI(userPrompt);
      const parsed = this.extractJSON(response);
      
      return {
        ...parsed,
        studentName: studentData.studentName,
        campus: studentData.campus,
        originalText: studentData.combinedText,
        success: true,
        error: null
      };
    } catch (error) {
      console.error(`Error parsing constraints for ${studentData.studentName}:`, error);
      return {
        studentName: studentData.studentName,
        campus: studentData.campus,
        originalText: studentData.combinedText,
        success: false,
        error: error.message,
        confidence: 0,
        allowedDays: [0, 1, 2, 3, 4, 5, 6], // Default: all days
        allowedTimeRanges: [],
        excludedTimeRanges: [],
        strictness: 'flexible'
      };
    }
  }

  /**
   * Batch parse multiple students
   * 批量解析多个学生
   * 
   * @param {Array<Object>} students - Array of student data
   * @param {Function} onProgress - Progress callback (current, total)
   * @returns {Promise<Array<Object>>} Array of parsed constraints
   */
  async batchParse(students, onProgress = null) {
    const results = [];
    const batchSize = 5; // Process 5 at a time to avoid rate limits
    
    for (let i = 0; i < students.length; i += batchSize) {
      const batch = students.slice(i, i + batchSize);
      
      // Process batch in parallel
      const batchPromises = batch.map(student => 
        this.parseStudentConstraints(student)
      );
      
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
      
      // Report progress
      if (onProgress) {
        onProgress(Math.min(i + batchSize, students.length), students.length);
      }
      
      // Delay between batches to avoid rate limiting
      if (i + batchSize < students.length) {
        await this.delay(1000);
      }
    }
    
    return results;
  }

  /**
   * Call OpenAI API via backend proxy with retry logic
   * 通过后端代理调用OpenAI API（带重试逻辑）
   * 
   * @param {string} userPrompt - User prompt
   * @param {number} retryCount - Current retry attempt
   * @returns {Promise<string>} API response content
   */
  async callOpenAI(userPrompt, retryCount = 0) {
    try {
      // Call backend proxy instead of OpenAI directly
      const response = await fetch(this.baseURL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
          // No Authorization header needed - backend handles OpenAI API key
        },
        body: JSON.stringify({
          system_prompt: SYSTEM_PROMPT,
          user_prompt: userPrompt,
          model: this.model,
          temperature: this.temperature
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        
        // Special handling for different error codes
        if (response.status === 503) {
          // Backend OpenAI not configured
          throw new Error(
            '❌ 后端OpenAI API未配置！\n\n' +
            '请联系管理员在服务器端配置 OPENAI_API_KEY 环境变量。\n\n' +
            '技术细节：\n' +
            (errorData.detail?.instructions || []).join('\n')
          );
        }
        
        if (response.status === 500) {
          // OpenAI API call failed on backend
          throw new Error(
            `❌ OpenAI API调用失败：${errorData.detail?.message || '未知错误'}\n\n` +
            `错误类型：${errorData.detail?.type || 'Unknown'}`
          );
        }
        
        throw new Error(
          `Backend API error: ${response.status} - ${errorData.message || response.statusText}`
        );
      }

      const data = await response.json();
      
      if (!data.content) {
        throw new Error('No content in backend response');
      }

      // Log usage for cost tracking
      if (data.usage) {
        console.log(`OpenAI API usage: ${data.usage.total_tokens} tokens (${data.model})`);
      }

      return data.content;
    } catch (error) {
      // Retry logic with exponential backoff
      if (retryCount < this.maxRetries && !error.message.includes('未配置')) {
        const delay = this.retryDelay * Math.pow(2, retryCount);
        console.warn(`Retrying OpenAI call (${retryCount + 1}/${this.maxRetries}) after ${delay}ms...`);
        await this.delay(delay);
        return this.callOpenAI(userPrompt, retryCount + 1);
      }
      
      throw error;
    }
  }

  /**
   * Extract and validate JSON from API response
   * 从API响应中提取并验证JSON
   * 
   * @param {string} responseText - Raw response text
   * @returns {Object} Parsed and validated constraint object
   */
  extractJSON(responseText) {
    try {
      const parsed = JSON.parse(responseText);
      
      // Validate required fields
      const validated = {
        allowedDays: Array.isArray(parsed.allowedDays) ? parsed.allowedDays : [0, 1, 2, 3, 4, 5, 6],
        allowedTimeRanges: Array.isArray(parsed.allowedTimeRanges) ? parsed.allowedTimeRanges : [],
        excludedTimeRanges: Array.isArray(parsed.excludedTimeRanges) ? parsed.excludedTimeRanges : [],
        strictness: ['strict', 'flexible', 'preferred'].includes(parsed.strictness) 
          ? parsed.strictness 
          : 'flexible',
        confidence: typeof parsed.confidence === 'number' 
          ? Math.max(0, Math.min(1, parsed.confidence)) 
          : 0.5,
        reasoning: parsed.reasoning || '无推理说明'
      };

      return validated;
    } catch (error) {
      console.error('Failed to parse JSON from OpenAI response:', error);
      throw new Error('Invalid JSON response from OpenAI');
    }
  }

  /**
   * Utility: Delay for specified milliseconds
   * 工具：延迟指定毫秒数
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Test API connection
   * 测试API连接
   * 
   * @returns {Promise<boolean>} True if API is accessible
   */
  async testConnection() {
    try {
      const testPrompt = '测试连接：请返回 {"status": "ok", "confidence": 1.0}';
      const response = await this.callOpenAI(testPrompt);
      const parsed = JSON.parse(response);
      return parsed.status === 'ok';
    } catch (error) {
      console.error('API connection test failed:', error);
      return false;
    }
  }

  /**
   * Get usage statistics from last response
   * 获取上次响应的使用统计
   * 
   * @returns {Object} Usage stats (tokens, cost estimate)
   */
  getUsageStats() {
    // This would need to be tracked in callOpenAI
    // For now, return placeholder
    return {
      totalTokens: 0,
      estimatedCost: 0
    };
  }
}

/**
 * Create singleton instance
 * 创建单例实例
 */
let instance = null;

export function getOpenAIParser(apiKey = null) {
  if (!instance || apiKey) {
    instance = new OpenAIConstraintParser(apiKey);
  }
  return instance;
}

export default OpenAIConstraintParser;

