/**
 * Mock AI Service for Frontend
 * 用于演示和开发环境
 */

import { authFetch } from './mockAuthService';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

/**
 * 生成AI洞察
 */
export const generateInsight = async (content) => {
  try {
    const response = await authFetch(`${API_URL}/ai/insight`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    });

    if (!response.ok) {
      throw new Error('生成洞察失败');
    }

    const data = await response.json();
    return data.insight;
  } catch (error) {
    console.error('Generate insight error:', error);
    throw error;
  }
};

/**
 * 获取排课建议
 */
export const getScheduleSuggestions = async (students, teachers) => {
  try {
    const response = await authFetch(`${API_URL}/ai/schedule-suggestions`, {
      method: 'POST',
      body: JSON.stringify({ students, teachers }),
    });

    if (!response.ok) {
      throw new Error('获取排课建议失败');
    }

    const data = await response.json();
    return data.suggestions;
  } catch (error) {
    console.error('Get schedule suggestions error:', error);
    throw error;
  }
};

/**
 * 生成课程摘要
 */
export const generateCourseSummary = async (content, subject = null) => {
  try {
    const response = await authFetch(`${API_URL}/ai/course-summary`, {
      method: 'POST',
      body: JSON.stringify({ content, subject }),
    });

    if (!response.ok) {
      throw new Error('生成课程摘要失败');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Generate course summary error:', error);
    throw error;
  }
};

/**
 * 分析学生表现
 */
export const analyzePerformance = async (studentId, records) => {
  try {
    const response = await authFetch(`${API_URL}/ai/analyze-performance`, {
      method: 'POST',
      body: JSON.stringify({ student_id: studentId, records }),
    });

    if (!response.ok) {
      throw new Error('分析学生表现失败');
    }

    const data = await response.json();
    return data.analysis;
  } catch (error) {
    console.error('Analyze performance error:', error);
    throw error;
  }
};

/**
 * 获取教学建议
 */
export const getTeachingTips = async (subject, studentLevel = '中级') => {
  try {
    const response = await authFetch(`${API_URL}/ai/teaching-tips`, {
      method: 'POST',
      body: JSON.stringify({ subject, student_level: studentLevel }),
    });

    if (!response.ok) {
      throw new Error('获取教学建议失败');
    }

    const data = await response.json();
    return data.tips;
  } catch (error) {
    console.error('Get teaching tips error:', error);
    throw error;
  }
};

/**
 * AI服务健康检查
 */
export const checkAIHealth = async () => {
  try {
    const response = await fetch(`${API_URL}/ai/health`);
    if (!response.ok) {
      return false;
    }
    const data = await response.json();
    return data.status === 'healthy';
  } catch (error) {
    console.error('AI health check error:', error);
    return false;
  }
};

export default {
  generateInsight,
  getScheduleSuggestions,
  generateCourseSummary,
  analyzePerformance,
  getTeachingTips,
  checkAIHealth,
};

