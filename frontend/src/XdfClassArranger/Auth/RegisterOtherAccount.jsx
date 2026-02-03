/**
 * Register Other Account Page
 * Admin-only page for registering new users
 */

import React, { useState } from 'react';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';
import './RegisterOtherAccount.css';

const RegisterOtherAccount = () => {
  const { user, isAdmin } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    password: '',
    role: 'student',
    description: ''
  });
  const [isLoading, setIsLoading] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.email || !formData.username || !formData.password) {
      toast.error('请填写所有必填项');
      return;
    }

    if (formData.password.length < 8) {
      toast.error('密码至少需要8个字符');
      return;
    }

    setIsLoading(true);

    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || '注册失败');
      }

      const result = await response.json();
      toast.success(`用户 ${result.user.username} 注册成功！`);
      
      // Reset form
      setFormData({
        email: '',
        username: '',
        password: '',
        role: 'student',
        description: ''
      });
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isAdmin()) {
    return (
      <div className="register-container">
        <div className="access-denied">
          <h2>访问被拒绝</h2>
          <p>只有管理员可以访问此页面</p>
        </div>
      </div>
    );
  }

  return (
    <div className="register-container">
      <div className="register-card">
        <div className="register-header">
          <h1>注册新用户</h1>
          <p>为教师、学管和学生创建账户</p>
        </div>

        <form className="register-form" onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="email">
                邮箱 <span className="required">*</span>
              </label>
              <input
                id="email"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="user@example.com"
                disabled={isLoading}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="username">
                用户名 <span className="required">*</span>
              </label>
              <input
                id="username"
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                placeholder="张三"
                disabled={isLoading}
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="password">
                密码 <span className="required">*</span>
              </label>
              <input
                id="password"
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="最少8个字符"
                disabled={isLoading}
                required
                minLength={8}
              />
            </div>

            <div className="form-group">
              <label htmlFor="role">
                角色 <span className="required">*</span>
              </label>
              <select
                id="role"
                name="role"
                value={formData.role}
                onChange={handleChange}
                disabled={isLoading}
                required
              >
                <option value="student">学生</option>
                <option value="teacher">教师</option>
                <option value="staff">学管</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="description">备注（可选）</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="关于此用户的额外信息..."
              disabled={isLoading}
              rows={4}
            />
          </div>

          <div className="form-actions">
            <button
              type="submit"
              className="submit-button"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <span className="spinner"></span>
                  创建账户中...
                </>
              ) : (
                '创建账户'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RegisterOtherAccount;
