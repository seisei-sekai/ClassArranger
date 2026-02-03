/**
 * 学生冲突列表组件
 * Student Conflict List Component
 * 
 * 功能：
 * - 展示所有冲突学生
 * - 支持筛选（按严重程度、状态）
 * - 支持排序（按严重程度、姓名）
 * - 显示冲突类型标签和状态
 * - 显示修改标记
 * - 显示进度统计
 */

import React, { useState, useMemo } from 'react';
import { ConflictType, Severity, ConflictStatus } from '../../types/adjustmentTypes';
import {
  sortConflictsBySeverity,
  filterConflictsBySeverity,
  filterConflictsByStatus
} from '../../utils/conflictAnalyzer';
import './StudentConflictList.css';

const StudentConflictList = ({
  conflicts = [],
  selectedConflictId,
  onSelectConflict,
  filterSeverity = 'all',
  filterStatus = 'all',
  sortBy = 'severity'
}) => {
  // 筛选和排序
  const filteredAndSortedConflicts = useMemo(() => {
    let result = [...conflicts];
    
    // 按严重程度筛选
    if (filterSeverity && filterSeverity !== 'all') {
      result = filterConflictsBySeverity(result, filterSeverity);
    }
    
    // 按状态筛选
    if (filterStatus && filterStatus !== 'all') {
      result = filterConflictsByStatus(result, filterStatus);
    }
    
    // 排序
    if (sortBy === 'severity') {
      result = sortConflictsBySeverity(result, true);
    } else if (sortBy === 'name') {
      result = result.sort((a, b) => 
        (a.student.name || '').localeCompare(b.student.name || '')
      );
    }
    
    return result;
  }, [conflicts, filterSeverity, filterStatus, sortBy]);
  
  // 统计信息
  const stats = useMemo(() => {
    const total = conflicts.length;
    const resolved = conflicts.filter(c => c.status === ConflictStatus.RESOLVED).length;
    const pending = conflicts.filter(c => 
      c.status === ConflictStatus.PENDING || c.status === ConflictStatus.IN_PROGRESS
    ).length;
    const modified = conflicts.filter(c => c.isModified).length;
    
    return { total, resolved, pending, modified };
  }, [conflicts]);
  
  /**
   * 获取严重程度对应的样式类名
   */
  const getSeverityClass = (severity) => {
    switch (severity) {
      case Severity.HIGH:
        return 'severity-high';
      case Severity.MEDIUM:
        return 'severity-medium';
      case Severity.LOW:
        return 'severity-low';
      default:
        return '';
    }
  };
  
  /**
   * 获取严重程度标签文本
   */
  const getSeverityLabel = (severity) => {
    switch (severity) {
      case Severity.HIGH:
        return '高';
      case Severity.MEDIUM:
        return '中';
      case Severity.LOW:
        return '低';
      default:
        return '';
    }
  };
  
  /**
   * 获取冲突类型标签文本
   */
  const getConflictTypeLabel = (conflictType) => {
    switch (conflictType) {
      case ConflictType.NO_TEACHER:
        return '无教师';
      case ConflictType.NO_TIME:
        return '无时间';
      case ConflictType.NO_ROOM:
        return '无教室';
      case ConflictType.HOUR_LIMIT:
        return '课时限制';
      case ConflictType.NO_SUBJECT:
        return '科目不符';
      case ConflictType.OTHER:
      default:
        return '其他';
    }
  };
  
  /**
   * 获取状态标签
   */
  const getStatusBadge = (status) => {
    switch (status) {
      case ConflictStatus.PENDING:
        return <span className="status-badge status-pending">待处理</span>;
      case ConflictStatus.IN_PROGRESS:
        return <span className="status-badge status-in-progress">处理中</span>;
      case ConflictStatus.RESOLVED:
        return <span className="status-badge status-resolved">已解决</span>;
      case ConflictStatus.SKIPPED:
        return <span className="status-badge status-skipped">已跳过</span>;
      default:
        return null;
    }
  };
  
  return (
    <div className="student-conflict-list">
      {/* 头部：进度统计 */}
      <div className="list-header">
        <h3 className="list-title">冲突列表</h3>
        <div className="progress-stats">
          <div className="stat-item">
            <span className="stat-label">总计</span>
            <span className="stat-value">{stats.total}</span>
          </div>
          <div className="stat-divider">/</div>
          <div className="stat-item resolved">
            <span className="stat-label">已解决</span>
            <span className="stat-value">{stats.resolved}</span>
          </div>
          <div className="stat-divider">/</div>
          <div className="stat-item pending">
            <span className="stat-label">待处理</span>
            <span className="stat-value">{stats.pending}</span>
          </div>
        </div>
        {stats.modified > 0 && (
          <div className="modified-count">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span>{stats.modified} 项已修改</span>
          </div>
        )}
      </div>
      
      {/* 冲突卡片列表 */}
      <div className="conflict-cards">
        {filteredAndSortedConflicts.length === 0 ? (
          <div className="empty-state">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" style={{opacity: 0.3}}>
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
              <path d="M12 6v6M12 16h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            <p>没有匹配的冲突</p>
          </div>
        ) : (
          filteredAndSortedConflicts.map((conflict) => (
            <div
              key={conflict.id}
              className={`conflict-card ${getSeverityClass(conflict.severity)} ${
                selectedConflictId === conflict.id ? 'selected' : ''
              } ${conflict.isModified ? 'modified' : ''}`}
              onClick={() => {
                console.log('[ConflictList] Clicked conflict:', conflict.id, conflict.student.name);
                onSelectConflict(conflict.id);
              }}
            >
              {/* 卡片头部 */}
              <div className="card-header">
                <div className="student-info">
                  <h4 className="student-name">{conflict.student.name}</h4>
                  {conflict.isModified && (
                    <span className="modified-badge">已修改</span>
                  )}
                </div>
                {getStatusBadge(conflict.status)}
              </div>
              
              {/* 学生基本信息 */}
              <div className="card-body">
                <div className="info-row">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" stroke="currentColor" strokeWidth="2"/>
                    <circle cx="12" cy="10" r="3" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                  <span>{conflict.student.campus || '未知校区'}</span>
                </div>
                <div className="info-row">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <span>{conflict.student.subject || '未知科目'}</span>
                </div>
              </div>
              
              {/* 冲突信息 */}
              <div className="card-footer">
                <div className="conflict-tags">
                  <span className={`conflict-type-tag ${getSeverityClass(conflict.severity)}`}>
                    {getConflictTypeLabel(conflict.conflictType)}
                  </span>
                  <span className={`severity-tag ${getSeverityClass(conflict.severity)}`}>
                    {getSeverityLabel(conflict.severity)}
                  </span>
                </div>
                {conflict.suggestions.length > 0 && (
                  <div className="suggestions-count">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                      <path d="M12 16v-4M12 8h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                    <span>{conflict.suggestions.length} 建议</span>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default StudentConflictList;
