/**
 * Time Slot Detail Panel Component
 * 时间槽详情面板组件
 * 
 * Display detailed information about a specific time slot
 * 显示特定时间槽的详细信息
 */

import React from 'react';
import './TimeSlotDetailPanel.css';

const TimeSlotDetailPanel = ({ slotInfo, onClose, onSchedule }) => {
  if (!slotInfo) return null;
  
  const { time, day, count, depth, students, maxOverlap, totalStudents } = slotInfo;
  
  // Day names (星期名称)
  const dayNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  
  // Calculate utilization rate (计算利用率)
  const utilizationRate = totalStudents > 0 
    ? ((count / totalStudents) * 100).toFixed(1)
    : 0;
  
  // Get color depth percentage (获取色深百分比)
  const depthPercentage = ((depth / 256) * 100).toFixed(1);
  
  return (
    <div className="timeslot-detail-overlay" onClick={onClose}>
      <div className="timeslot-detail-panel" onClick={(e) => e.stopPropagation()}>
        {/* Header (头部) */}
        <div className="detail-header">
          <div className="header-info">
            <div className="time-display">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                <path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              <span>{dayNames[day]} {time}</span>
            </div>
            <div className="depth-indicator">
              <span className="depth-label">色深</span>
              <span className="depth-value">{depth}/256</span>
            </div>
          </div>
          <button className="close-btn" onClick={onClose}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>
        
        {/* Statistics (统计) */}
        <div className="detail-stats">
          <div className="stat-item">
            <div className="stat-icon student">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="2"/>
              </svg>
            </div>
            <div className="stat-info">
              <div className="stat-label">可用学生</div>
              <div className="stat-value">{count}/{totalStudents}</div>
              <div className="stat-bar">
                <div 
                  className="stat-fill student"
                  style={{ width: `${utilizationRate}%` }}
                />
              </div>
            </div>
          </div>
          
          <div className="stat-item">
            <div className="stat-icon depth">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div className="stat-info">
              <div className="stat-label">颜色深度</div>
              <div className="stat-value">{depthPercentage}%</div>
              <div className="stat-bar">
                <div 
                  className="stat-fill depth"
                  style={{ width: `${depthPercentage}%` }}
                />
              </div>
            </div>
          </div>
          
          <div className="stat-item">
            <div className="stat-icon overlap">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <circle cx="9" cy="9" r="7" stroke="currentColor" strokeWidth="2"/>
                <circle cx="15" cy="15" r="7" stroke="currentColor" strokeWidth="2"/>
              </svg>
            </div>
            <div className="stat-info">
              <div className="stat-label">重叠度</div>
              <div className="stat-value">{count}/{maxOverlap}</div>
              <div className="stat-bar">
                <div 
                  className="stat-fill overlap"
                  style={{ width: `${(count / maxOverlap * 100).toFixed(1)}%` }}
                />
              </div>
            </div>
          </div>
        </div>
        
        {/* Student List (学生列表) */}
        <div className="detail-section">
          <div className="section-header">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2"/>
              <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span>可用学生 ({students?.length || 0})</span>
          </div>
          
          <div className="student-list">
            {students && students.length > 0 ? (
              students.map((student, index) => (
                <div key={student.id || index} className="student-item">
                  <div 
                    className="student-avatar"
                    style={{ backgroundColor: student.color || '#667EEA' }}
                  >
                    {student.name?.[0] || '学'}
                  </div>
                  <div className="student-info">
                    <div className="student-name">{student.name || '未知学生'}</div>
                    <div className="student-id">ID: {student.id || 'N/A'}</div>
                  </div>
                </div>
              ))
            ) : (
              <div className="empty-list">
                <p>该时间段暂无可用学生</p>
              </div>
            )}
          </div>
        </div>
        
        {/* Actions (操作) */}
        {students && students.length > 0 && (
          <div className="detail-actions">
            <button 
              className="action-btn primary"
              onClick={() => onSchedule && onSchedule(slotInfo)}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              在此时间排课
            </button>
            <button className="action-btn secondary" onClick={onClose}>
              关闭
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default TimeSlotDetailPanel;

