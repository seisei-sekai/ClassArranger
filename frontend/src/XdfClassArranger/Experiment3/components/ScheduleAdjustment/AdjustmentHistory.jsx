/**
 * 修改历史组件
 * Adjustment History Component
 * 
 * 功能：
 * - 侧边滑出面板
 * - 时间线样式展示修改记录
 * - 显示修改详情
 * - 支持按类型筛选
 */

import React, { useState, useMemo } from 'react';
import { TargetType } from '../../types/adjustmentTypes';
import './AdjustmentHistory.css';

const AdjustmentHistory = ({
  isOpen,
  onClose,
  modificationRecords = []
}) => {
  const [filterType, setFilterType] = useState('all');
  
  // 筛选记录
  const filteredRecords = useMemo(() => {
    if (filterType === 'all') {
      return modificationRecords;
    }
    return modificationRecords.filter(record => record.targetType === filterType);
  }, [modificationRecords, filterType]);
  
  // 按时间倒序排序
  const sortedRecords = useMemo(() => {
    return [...filteredRecords].sort((a, b) => {
      return new Date(b.timestamp) - new Date(a.timestamp);
    });
  }, [filteredRecords]);
  
  /**
   * 格式化时间戳
   */
  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    
    // 小于1分钟
    if (diff < 60000) {
      return '刚刚';
    }
    // 小于1小时
    if (diff < 3600000) {
      return `${Math.floor(diff / 60000)}分钟前`;
    }
    // 小于24小时
    if (diff < 86400000) {
      return `${Math.floor(diff / 3600000)}小时前`;
    }
    // 显示具体时间
    return date.toLocaleString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  /**
   * 获取目标类型标签
   */
  const getTargetTypeLabel = (targetType) => {
    switch (targetType) {
      case TargetType.STUDENT:
        return '学生';
      case TargetType.TEACHER:
        return '教师';
      case TargetType.CLASSROOM:
        return '教室';
      default:
        return '未知';
    }
  };
  
  /**
   * 获取目标类型图标
   */
  const getTargetTypeIcon = (targetType) => {
    switch (targetType) {
      case TargetType.STUDENT:
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="2"/>
            <path d="M5 20C5 16.134 8.13401 13 12 13C15.866 13 19 16.134 19 20" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        );
      case TargetType.TEACHER:
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M12 2a10 10 0 100 20 10 10 0 000-20z" stroke="currentColor" strokeWidth="2"/>
            <path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        );
      case TargetType.CLASSROOM:
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <rect x="3" y="4" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="2"/>
            <line x1="3" y1="10" x2="21" y2="10" stroke="currentColor" strokeWidth="2"/>
          </svg>
        );
      default:
        return null;
    }
  };
  
  /**
   * 格式化值显示
   */
  const formatValue = (value) => {
    if (value === null || value === undefined) {
      return '(空)';
    }
    if (typeof value === 'object') {
      return JSON.stringify(value, null, 2);
    }
    return String(value);
  };
  
  if (!isOpen) {
    return null;
  }
  
  return (
    <div className="adjustment-history-overlay" onClick={onClose}>
      <div className="adjustment-history-panel" onClick={(e) => e.stopPropagation()}>
        {/* 头部 */}
        <div className="history-header">
          <h3 className="history-title">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
              <path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            修改历史
          </h3>
          <button className="close-btn" onClick={onClose}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>
        
        {/* 筛选器 */}
        <div className="history-filters">
          <button
            className={`filter-btn ${filterType === 'all' ? 'active' : ''}`}
            onClick={() => setFilterType('all')}
          >
            全部 ({modificationRecords.length})
          </button>
          <button
            className={`filter-btn ${filterType === TargetType.STUDENT ? 'active' : ''}`}
            onClick={() => setFilterType(TargetType.STUDENT)}
          >
            学生 ({modificationRecords.filter(r => r.targetType === TargetType.STUDENT).length})
          </button>
          <button
            className={`filter-btn ${filterType === TargetType.TEACHER ? 'active' : ''}`}
            onClick={() => setFilterType(TargetType.TEACHER)}
          >
            教师 ({modificationRecords.filter(r => r.targetType === TargetType.TEACHER).length})
          </button>
          <button
            className={`filter-btn ${filterType === TargetType.CLASSROOM ? 'active' : ''}`}
            onClick={() => setFilterType(TargetType.CLASSROOM)}
          >
            教室 ({modificationRecords.filter(r => r.targetType === TargetType.CLASSROOM).length})
          </button>
        </div>
        
        {/* 时间线 */}
        <div className="history-timeline">
          {sortedRecords.length === 0 ? (
            <div className="empty-state">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" style={{opacity: 0.3}}>
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                <path d="M12 8v4M12 16h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              <p>暂无修改记录</p>
            </div>
          ) : (
            sortedRecords.map((record) => (
              <div key={record.id} className="timeline-item">
                {/* 时间线点 */}
                <div className="timeline-dot"></div>
                
                {/* 记录内容 */}
                <div className="timeline-content">
                  {/* 头部 */}
                  <div className="record-header">
                    <div className="record-type">
                      {getTargetTypeIcon(record.targetType)}
                      <span className="type-label">{getTargetTypeLabel(record.targetType)}</span>
                    </div>
                    <span className="record-time">{formatTimestamp(record.timestamp)}</span>
                  </div>
                  
                  {/* 目标信息 */}
                  <div className="record-target">
                    <strong>{record.targetName}</strong>
                  </div>
                  
                  {/* 修改详情 */}
                  <div className="record-details">
                    <div className="detail-row">
                      <span className="detail-label">字段：</span>
                      <span className="detail-value">{record.field}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">修改前：</span>
                      <span className="detail-value old-value">{formatValue(record.oldValue)}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">修改后：</span>
                      <span className="detail-value new-value">{formatValue(record.newValue)}</span>
                    </div>
                  </div>
                  
                  {/* 修改原因 */}
                  {record.reason && (
                    <div className="record-reason">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                        <path d="M12 16v-4M12 8h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                      </svg>
                      <span>{record.reason}</span>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default AdjustmentHistory;
