import React, { useState } from 'react';
import { useTestData } from '../TestDataContext';
import './MyPage.css';

const MyPage = () => {
  const [activeTab, setActiveTab] = useState('profile');
  const { showTestData } = useTestData();

  const userInfo = showTestData ? {
    name: '管理员',
    role: '系统管理员',
    email: 'admin@sci-tokyo.com',
    phone: '+81 90-1234-5678',
    department: '教务部',
    joinDate: '2024年1月'
  } : null;

  const stats = showTestData ? [
    { label: '排课总数', value: '248', color: '#667eea' },
    { label: '活跃学生', value: '86', color: '#34c759' },
    { label: '合作教师', value: '42', color: '#ff9500' },
    { label: '教室数量', value: '15', color: '#5ac8fa' }
  ] : [];

  const recentActivities = showTestData ? [
    { id: 1, action: '创建新课程', detail: '1v1大学面试练习 - 张三', time: '2小时前', type: 'create' },
    { id: 2, action: '修改课程时间', detail: 'EJU日语课程调整至下午2点', time: '5小时前', type: 'edit' },
    { id: 3, action: '删除课程', detail: '取消了12月20日的小论文辅导', time: '1天前', type: 'delete' },
    { id: 4, action: '添加学生', detail: '新增学生：赵六', time: '2天前', type: 'create' },
    { id: 5, action: '更新教室', detail: '个别指导室3状态更新', time: '3天前', type: 'edit' }
  ] : [];

  const getActivityIcon = (type) => {
    switch(type) {
      case 'create':
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2"/>
          </svg>
        );
      case 'edit':
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke="currentColor" strokeWidth="2"/>
            <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="2"/>
          </svg>
        );
      case 'delete':
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" stroke="currentColor" strokeWidth="2"/>
          </svg>
        );
      default:
        return null;
    }
  };

  const getActivityColor = (type) => {
    switch(type) {
      case 'create': return '#6B7C6E';
      case 'edit': return '#5A6C7D';
      case 'delete': return '#9E7676';
      default: return '#718096';
    }
  };

  return (
    <div className="mypage-container">
      {/* 页面标题 */}
      <div className="mypage-header">
        <h1 className="mypage-title">我的主页</h1>
        <p className="mypage-subtitle">个人信息与系统设置</p>
      </div>

      {/* 用户卡片 */}
      <div className="user-card">
        {!showTestData ? (
          <div className="empty-state">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" style={{opacity: 0.3}}>
              <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="2"/>
              <path d="M5 20c0-3.866 3.134-7 7-7s7 3.134 7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            <p className="empty-text">暂无用户数据</p>
            <p className="empty-hint">请点击左下角"测试数据"按钮查看示例</p>
          </div>
        ) : (
          <>
            <div className="user-card-header">
              <div className="user-avatar-large">
                <svg width="64" height="64" viewBox="0 0 64 64">
                  <circle cx="32" cy="32" r="32" fill="#5A6C7D"/>
                  <text x="50%" y="50%" textAnchor="middle" dy=".35em" fill="white" fontSize="24" fontWeight="500">
                    {userInfo.name.charAt(0)}
                  </text>
                </svg>
              </div>
              <div className="user-card-info">
                <h2 className="user-name">{userInfo.name}</h2>
                <p className="user-role">{userInfo.role}</p>
              </div>
          <button className="edit-profile-btn">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke="currentColor" strokeWidth="2"/>
              <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="2"/>
            </svg>
            编辑资料
          </button>
        </div>

        <div className="user-details-grid">
          <div className="detail-item">
            <div className="detail-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" stroke="currentColor" strokeWidth="2"/>
                <path d="M22 6l-10 7L2 6" stroke="currentColor" strokeWidth="2"/>
              </svg>
            </div>
            <div className="detail-content">
              <div className="detail-label">邮箱</div>
              <div className="detail-value">{userInfo.email}</div>
            </div>
          </div>

          <div className="detail-item">
            <div className="detail-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z" stroke="currentColor" strokeWidth="2"/>
              </svg>
            </div>
            <div className="detail-content">
              <div className="detail-label">电话</div>
              <div className="detail-value">{userInfo.phone}</div>
            </div>
          </div>

          <div className="detail-item">
            <div className="detail-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" stroke="currentColor" strokeWidth="2"/>
                <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2"/>
                <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" stroke="currentColor" strokeWidth="2"/>
              </svg>
            </div>
            <div className="detail-content">
              <div className="detail-label">部门</div>
              <div className="detail-value">{userInfo.department}</div>
            </div>
          </div>

          <div className="detail-item">
            <div className="detail-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2"/>
                <path d="M16 2v4M8 2v4M3 10h18" stroke="currentColor" strokeWidth="2"/>
              </svg>
            </div>
            <div className="detail-content">
              <div className="detail-label">加入时间</div>
              <div className="detail-value">{userInfo.joinDate}</div>
            </div>
          </div>
        </div>
          </>
        )}
      </div>

      {/* 统计数据 */}
      <div className="stats-section">
        <h3 className="section-title">我的数据统计</h3>
        <div className="stats-cards">
          {stats.map((stat, index) => (
            <div key={index} className="mini-stat-card">
              <div className="mini-stat-value" style={{ color: stat.color }}>
                {stat.value}
              </div>
              <div className="mini-stat-label">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* 最近活动 */}
      <div className="activity-section">
        <h3 className="section-title">最近活动</h3>
        <div className="activities-list">
          {recentActivities.length === 0 ? (
            <div className="empty-state">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" style={{opacity: 0.3}}>
                <path d="M12 8v4l3 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2"/>
              </svg>
              <p className="empty-text">暂无活动记录</p>
              <p className="empty-hint">请点击左下角"测试数据"按钮查看示例</p>
            </div>
          ) : recentActivities.map(activity => (
            <div key={activity.id} className="activity-item">
              <div 
                className="activity-icon" 
                style={{ 
                  background: `${getActivityColor(activity.type)}15`,
                  color: getActivityColor(activity.type)
                }}
              >
                {getActivityIcon(activity.type)}
              </div>
              <div className="activity-content">
                <div className="activity-action">{activity.action}</div>
                <div className="activity-detail">{activity.detail}</div>
              </div>
              <div className="activity-time">{activity.time}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MyPage;

