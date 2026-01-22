import React from 'react';
import { useTestData } from '../TestDataContext';
import './Dashboard.css';

const Dashboard = () => {
  const { showTestData } = useTestData();
  
  const statsCards = showTestData ? [
    {
      title: '今日课程',
      value: '12',
      change: '+3',
      trend: 'up',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2"/>
          <line x1="3" y1="9" x2="21" y2="9" stroke="currentColor" strokeWidth="2"/>
        </svg>
      ),
      color: '#5A6C7D'
    },
    {
      title: '本周排课',
      value: '48',
      change: '+12',
      trend: 'up',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M9 11l3 3L22 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" stroke="currentColor" strokeWidth="2"/>
        </svg>
      ),
      color: '#6B7C6E'
    },
    {
      title: '活跃学生',
      value: '86',
      change: '+5',
      trend: 'up',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2"/>
          <circle cx="17" cy="9" r="3" stroke="currentColor" strokeWidth="2"/>
          <path d="M2 20c0-3.866 3.134-7 7-7s7 3.134 7 7M15 20c0-2.21 1.79-4 4-4s4 1.79 4 4" stroke="currentColor" strokeWidth="2"/>
        </svg>
      ),
      color: '#A08B7A'
    },
    {
      title: '教室使用率',
      value: '78%',
      change: '+8%',
      trend: 'up',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M3 12a9 9 0 1018 0 9 9 0 00-18 0z" stroke="currentColor" strokeWidth="2"/>
          <path d="M12 8v4l3 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      ),
      color: '#7A8C9E'
    }
  ] : [];

  const recentClasses = showTestData ? [
    { id: 1, student: '张三', course: '1v1大学面试练习', teacher: '李老师', time: '10:00-12:00', status: 'ongoing' },
    { id: 2, student: '王五', course: '1v1志望理由书指导', teacher: '赵老师', time: '14:00-16:00', status: 'scheduled' },
    { id: 3, student: '李四', course: '1v1EJU日语', teacher: '孙老师', time: '16:00-18:00', status: 'scheduled' },
    { id: 4, student: '赵六', course: '1v1小论文辅导', teacher: '钱老师', time: '19:00-21:00', status: 'scheduled' },
  ] : [];

  const getStatusBadge = (status) => {
    const statusMap = {
      ongoing: { text: '进行中', class: 'status-ongoing' },
      scheduled: { text: '已安排', class: 'status-scheduled' },
      completed: { text: '已完成', class: 'status-completed' }
    };
    return statusMap[status] || statusMap.scheduled;
  };

  return (
    <div className="dashboard-container">
      {/* 页面标题 */}
      <div className="page-header">
        <div className="header-left">
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">欢迎回来，这是您的课程概览</p>
        </div>
        <div className="header-right">
          <button className="refresh-btn">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M21 10c0-4.97-4.03-9-9-9s-9 4.03-9 9h2c0-3.87 3.13-7 7-7s7 3.13 7 7h-3l4 4 4-4h-3z" fill="currentColor"/>
              <path d="M3 14c0 4.97 4.03 9 9 9s9-4.03 9-9h-2c0 3.87-3.13 7-7 7s-7-3.13-7-7h3l-4-4-4 4h3z" fill="currentColor"/>
            </svg>
            刷新数据
          </button>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="stats-grid">
        {statsCards.map((card, index) => (
          <div key={index} className="stat-card">
            <div className="stat-icon" style={{ background: `${card.color}15`, color: card.color }}>
              {card.icon}
            </div>
            <div className="stat-content">
              <div className="stat-label">{card.title}</div>
              <div className="stat-value">{card.value}</div>
              <div className={`stat-change ${card.trend}`}>
                <span className="change-icon">{card.trend === 'up' ? '↑' : '↓'}</span>
                <span className="change-text">{card.change} vs 上周</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 主要内容区 */}
      <div className="dashboard-content">
        {/* 今日课程列表 */}
        <div className="content-section">
          <div className="section-header">
            <h2 className="section-title">今日课程安排</h2>
            <button className="view-all-btn">查看全部 →</button>
          </div>
          <div className="classes-list">
            {recentClasses.length === 0 ? (
              <div className="empty-state">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" style={{opacity: 0.3}}>
                  <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2"/>
                  <line x1="3" y1="9" x2="21" y2="9" stroke="currentColor" strokeWidth="2"/>
                  <line x1="8" y1="4" x2="8" y2="9" stroke="currentColor" strokeWidth="2"/>
                  <line x1="16" y1="4" x2="16" y2="9" stroke="currentColor" strokeWidth="2"/>
                </svg>
                <p className="empty-text">暂无课程数据</p>
                <p className="empty-hint">请点击左下角"测试数据"按钮查看示例</p>
              </div>
            ) : recentClasses.map(cls => (
              <div key={cls.id} className="class-item">
                <div className="class-time">
                  <div className="time-badge">{cls.time}</div>
                </div>
                <div className="class-info">
                  <div className="class-main">
                    <h3 className="class-title">{cls.course}</h3>
                    <div className="class-meta">
                      <span className="meta-item">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                          <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="2"/>
                          <path d="M5 20c0-3.866 3.134-7 7-7s7 3.134 7 7" stroke="currentColor" strokeWidth="2"/>
                        </svg>
                        {cls.student}
                      </span>
                      <span className="meta-item">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                          <path d="M12 2a10 10 0 100 20 10 10 0 000-20z" stroke="currentColor" strokeWidth="2"/>
                          <path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                        </svg>
                        {cls.teacher}
                      </span>
                    </div>
                  </div>
                  <div className={`class-status ${getStatusBadge(cls.status).class}`}>
                    {getStatusBadge(cls.status).text}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 快速操作 */}
        <div className="content-section quick-actions">
          <div className="section-header">
            <h2 className="section-title">快速操作</h2>
          </div>
          <div className="actions-grid">
            <button className="action-card">
              <div className="action-icon" style={{ background: '#E8EDF2', color: '#5A6C7D' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </div>
              <div className="action-text">新建课程</div>
            </button>
            <button className="action-card">
              <div className="action-icon" style={{ background: '#E8F0E9', color: '#6B7C6E' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2"/>
                  <line x1="3" y1="9" x2="21" y2="9" stroke="currentColor" strokeWidth="2"/>
                </svg>
              </div>
              <div className="action-text">查看日历</div>
            </button>
            <button className="action-card">
              <div className="action-icon" style={{ background: '#F0EBE6', color: '#A08B7A' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2"/>
                  <path d="M2 20c0-3.866 3.134-7 7-7s7 3.134 7 7" stroke="currentColor" strokeWidth="2"/>
                </svg>
              </div>
              <div className="action-text">学生管理</div>
            </button>
            <button className="action-card">
              <div className="action-icon" style={{ background: '#EDF1F5', color: '#7A8C9E' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" stroke="currentColor" strokeWidth="2"/>
                  <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" stroke="currentColor" strokeWidth="2"/>
                </svg>
              </div>
              <div className="action-text">报表导出</div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

