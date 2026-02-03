/**
 * NLP Service for Experiment2
 * NLP约束解析服务（可选功能）
 * 
 * Wraps the OpenAI constraint parsing from the main system
 */

/**
 * Parse natural language constraints
 * 解析自然语言约束
 * 
 * Note: This is a simplified wrapper. For production, integrate with backend API.
 */
export async function parseNLPConstraints(naturalLanguage) {
  try {
    // TODO: Integrate with backend OpenAI API
    // For now, return a mock result
    console.log('[NLP] Parsing:', naturalLanguage);
    
    // Mock parsing result
    return {
      success: true,
      constraints: {
        excludedTimeRanges: [],
        requiredTimeRanges: [],
        preferredTeacher: null
      },
      confidence: 0.8,
      message: 'NLP解析功能需要后端API支持，当前返回模拟结果'
    };
  } catch (error) {
    console.error('[NLP] Parse error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Check if NLP service is available
 */
export function isNLPAvailable() {
  // TODO: Check if backend API is accessible
  return false; // Disabled by default
}
