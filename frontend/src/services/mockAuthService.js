/**
 * Mock Authentication Service for Frontend
 * 用于演示和开发环境
 */

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const USE_MOCK_AUTH = import.meta.env.VITE_USE_MOCK_AUTH === 'true';

// 本地存储Key
const TOKEN_KEY = 'auth_token';
const USER_KEY = 'auth_user';

/**
 * 登录
 */
export const login = async (email, password) => {
  try {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || '登录失败');
    }

    const data = await response.json();
    
    // 保存token和用户信息
    localStorage.setItem(TOKEN_KEY, data.access_token);
    localStorage.setItem(USER_KEY, JSON.stringify(data.user));
    
    return data.user;
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};

/**
 * 注册
 */
export const register = async (email, password, username) => {
  try {
    const response = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password, username }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || '注册失败');
    }

    const data = await response.json();
    
    // 保存token和用户信息
    localStorage.setItem(TOKEN_KEY, data.access_token);
    localStorage.setItem(USER_KEY, JSON.stringify(data.user));
    
    return data.user;
  } catch (error) {
    console.error('Register error:', error);
    throw error;
  }
};

/**
 * 登出
 */
export const logout = async () => {
  try {
    const token = getToken();
    if (token) {
      await fetch(`${API_URL}/auth/logout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
    }
  } catch (error) {
    console.error('Logout error:', error);
  } finally {
    // 清除本地存储
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }
};

/**
 * 获取当前用户信息
 */
export const getCurrentUser = async () => {
  try {
    const token = getToken();
    if (!token) {
      return null;
    }

    const response = await fetch(`${API_URL}/auth/me`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      // Token无效，清除本地存储
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      return null;
    }

    const user = await response.json();
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    return user;
  } catch (error) {
    console.error('Get current user error:', error);
    return null;
  }
};

/**
 * 获取Token
 */
export const getToken = () => {
  return localStorage.getItem(TOKEN_KEY);
};

/**
 * 获取存储的用户信息
 */
export const getStoredUser = () => {
  const userStr = localStorage.getItem(USER_KEY);
  if (!userStr) return null;
  
  try {
    return JSON.parse(userStr);
  } catch {
    return null;
  }
};

/**
 * 检查是否已登录
 */
export const isAuthenticated = () => {
  return !!getToken();
};

/**
 * 获取测试账号（仅开发模式）
 */
export const getTestAccounts = async () => {
  if (!USE_MOCK_AUTH) {
    return [];
  }

  try {
    const response = await fetch(`${API_URL}/auth/test-accounts`);
    if (!response.ok) {
      return [];
    }
    const data = await response.json();
    return data.accounts || [];
  } catch (error) {
    console.error('Get test accounts error:', error);
    return [];
  }
};

/**
 * HTTP请求拦截器（添加认证头）
 */
export const authFetch = async (url, options = {}) => {
  const token = getToken();
  const headers = {
    ...options.headers,
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  // Token过期，自动登出
  if (response.status === 401) {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    window.location.href = '/login';
  }

  return response;
};

export default {
  login,
  register,
  logout,
  getCurrentUser,
  getToken,
  getStoredUser,
  isAuthenticated,
  getTestAccounts,
  authFetch,
};

