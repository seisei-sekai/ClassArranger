import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { TestDataProvider, useTestData } from './TestDataContext';
import { ScheduleProvider } from './ScheduleContext';
import { ThemeProvider, useTheme } from './ThemeContext';
import './XdfLayout.css';

const XdfLayoutContent = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { showTestData, toggleTestData } = useTestData();
  const { theme, toggleTheme, isDark } = useTheme();

  const menuItems = [
    {
      id: 'dashboard',
      name: 'Dashboard',
      path: '/dashboard',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <rect x="3" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2"/>
          <rect x="14" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2"/>
          <rect x="3" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2"/>
          <rect x="14" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2"/>
        </svg>
      )
    },
    {
      id: 'function',
      name: '排课功能',
      path: '/function',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2"/>
          <line x1="3" y1="9" x2="21" y2="9" stroke="currentColor" strokeWidth="2"/>
          <line x1="8" y1="4" x2="8" y2="9" stroke="currentColor" strokeWidth="2"/>
          <line x1="16" y1="4" x2="16" y2="9" stroke="currentColor" strokeWidth="2"/>
        </svg>
      )
    },
    {
      id: 'finalschedule',
      name: '最终课表',
      path: '/finalschedule',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2"/>
          <line x1="3" y1="9" x2="21" y2="9" stroke="currentColor" strokeWidth="2"/>
          <path d="M7 13h3M7 17h3M14 13h3M14 17h3" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      )
    },
    {
      id: 'mypage',
      name: '我的主页',
      path: '/mypage',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="2"/>
          <path d="M5 20C5 16.134 8.13401 13 12 13C15.866 13 19 16.134 19 20" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      )
    }
  ];

  const isActive = (path) => {
    return location.pathname === path;
  };

  const handleNavigate = (path) => {
    navigate(path);
    setMobileMenuOpen(false);
  };

  return (
    <div className="xdf-erp-layout">
      {/* 移动端顶部栏 */}
      <div className="mobile-header">
        <button 
          className="mobile-menu-toggle"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M3 12h18M3 6h18M3 18h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </button>
        <div className="mobile-title">前途塾排课系统</div>
        <div className="mobile-avatar">
          <div className="avatar-circle">Admin</div>
        </div>
      </div>

      {/* 侧边栏 */}
      <aside className={`erp-sidebar ${sidebarOpen ? 'open' : 'collapsed'} ${mobileMenuOpen ? 'mobile-open' : ''}`}>
        {/* Logo区域 */}
        <div className="sidebar-header">
          <div className="logo-area">
            <div className="logo-icon">
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                <rect width="32" height="32" rx="6" fill="#3A4750"/>
                <path d="M16 9L20 13L16 17L12 13L16 9Z" fill="white"/>
                <path d="M16 15L20 19L16 23L12 19L16 15Z" fill="white" opacity="0.7"/>
              </svg>
            </div>
            {sidebarOpen && <span className="logo-text">前途塾ERP</span>}
          </div>
          
          {/* 桌面端折叠按钮 */}
          <button 
            className="sidebar-toggle desktop-only"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M10 4L6 8L10 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {/* 导航菜单 */}
        <nav className="sidebar-nav">
          {menuItems.map(item => (
            <button
              key={item.id}
              className={`nav-item ${isActive(item.path) ? 'active' : ''}`}
              onClick={() => handleNavigate(item.path)}
            >
              <span className="nav-icon">{item.icon}</span>
              {sidebarOpen && <span className="nav-text">{item.name}</span>}
              {isActive(item.path) && <div className="active-indicator"></div>}
            </button>
          ))}
        </nav>

        {/* 底部用户信息 */}
        <div className="sidebar-footer">
          {/* 主题切换按钮 */}
          <button 
            className={`theme-toggle ${isDark ? 'dark' : 'bright'}`}
            onClick={toggleTheme}
            title={isDark ? '切换到亮色模式' : '切换到暗色模式'}
          >
            <span className="toggle-icon">
              {isDark ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="5" stroke="currentColor" strokeWidth="2"/>
                  <path d="M12 1v6M12 17v6M23 12h-6M7 12H1" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  <path d="M18.36 5.64l-4.24 4.24M9.88 14.12l-4.24 4.24M18.36 18.36l-4.24-4.24M9.88 9.88L5.64 5.64" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </span>
            {sidebarOpen && (
              <span className="toggle-text">
                {isDark ? '暗色模式' : '亮色模式'}
              </span>
            )}
          </button>
          
          {/* 测试数据开关 */}
          <button 
            className={`test-data-toggle ${showTestData ? 'active' : ''}`}
            onClick={toggleTestData}
            title={showTestData ? '隐藏测试数据' : '展示测试数据'}
          >
            <span className="toggle-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2"/>
                <path d="M7 12h10M12 7v10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                {showTestData && (
                  <circle cx="12" cy="12" r="3" fill="currentColor"/>
                )}
              </svg>
            </span>
            {sidebarOpen && (
              <span className="toggle-text">
                {showTestData ? '测试数据: 开' : '测试数据: 关'}
              </span>
            )}
          </button>
          
          <div className="user-info">
            <div className="user-avatar">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" fill="#5A6C7D"/>
                <text x="50%" y="50%" textAnchor="middle" dy=".3em" fill="white" fontSize="10" fontWeight="500">管</text>
              </svg>
            </div>
            {sidebarOpen && (
              <div className="user-details">
                <div className="user-name">管理员</div>
                <div className="user-role">系统管理</div>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* 移动端遮罩 */}
      {mobileMenuOpen && (
        <div 
          className="mobile-overlay"
          onClick={() => setMobileMenuOpen(false)}
        ></div>
      )}

      {/* 主内容区域 */}
      <main className={`erp-main-content ${sidebarOpen ? '' : 'sidebar-collapsed'}`}>
        {children || <Outlet />}
      </main>
    </div>
  );
};

// 用 Provider 包裹 (Wrap with Providers)
const XdfLayout = ({ children }) => {
  return (
    <ThemeProvider>
      <TestDataProvider>
        <ScheduleProvider>
          <XdfLayoutContent>{children}</XdfLayoutContent>
        </ScheduleProvider>
      </TestDataProvider>
    </ThemeProvider>
  );
};

export default XdfLayout;

