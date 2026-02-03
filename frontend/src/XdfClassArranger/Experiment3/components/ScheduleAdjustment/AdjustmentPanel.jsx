/**
 * 调整面板组件
 * Adjustment Panel Component
 * 
 * 功能：
 * - 显示选中学生的详细信息
 * - 展示智能建议
 * - 提供手动编辑功能
 * - 重新尝试排课
 * - 跳过/下一个学生
 */

import React, { useState } from 'react';
import SmartSuggestions from './SmartSuggestions';
import './AdjustmentPanel.css';

const AdjustmentPanel = ({
  conflict,
  onApplySuggestion,
  onManualModify,
  onRetrySchedule,
  onSkipConflict,
  onNextConflict,
  onShowHistory,
  loading = false
}) => {
  const [editingData, setEditingData] = useState('');
  const [modificationReason, setModificationReason] = useState('');
  const [activeEditTab, setActiveEditTab] = useState('student'); // 'student', 'teacher', 'classroom'
  
  console.log('[AdjustmentPanel] Rendering with conflict:', conflict);
  
  if (!conflict) {
    console.log('[AdjustmentPanel] No conflict - showing empty state');
    return (
      <div className="adjustment-panel-empty">
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" style={{opacity: 0.3}}>
          <path d="M12 2L2 7l10 5 10-5-10-5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <p>请从左侧选择一个冲突</p>
      </div>
    );
  }
  
  const student = conflict.student;
  
  if (!student) {
    console.error('[AdjustmentPanel] ERROR: Conflict exists but student is null!', conflict);
    return (
      <div className="adjustment-panel-empty">
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" style={{opacity: 0.3, color: 'red'}}>
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
          <path d="M12 8v4M12 16h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
        <p style={{color: 'red'}}>错误：冲突数据不完整（缺少学生信息）</p>
        <pre style={{fontSize: '10px', textAlign: 'left', maxWidth: '300px', overflow: 'auto'}}>
          {JSON.stringify(conflict, null, 2)}
        </pre>
      </div>
    );
  }
  
  console.log('[AdjustmentPanel] Rendering for student:', student?.name, 'Suggestions:', conflict.suggestions?.length);
  
  /**
   * 处理手动修改
   */
  const handleManualModify = () => {
    if (!modificationReason.trim()) {
      alert('请输入修改原因');
      return;
    }
    
    if (!editingData.trim() && activeEditTab === 'student') {
      alert('请输入要修改的数据');
      return;
    }
    
    onManualModify({
      targetType: activeEditTab,
      data: editingData,
      reason: modificationReason,
      conflictId: conflict.id
    });
    
    // 清空输入
    setEditingData('');
    setModificationReason('');
  };
  
  return (
    <div className="adjustment-panel">
      
      {/* 学生信息区 */}
      <div className="student-info-section">
        <div className="section-header">
          <h3 className="section-title">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="2"/>
              <path d="M5 20C5 16.134 8.13401 13 12 13C15.866 13 19 16.134 19 20" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            学生信息
          </h3>
          <button
            className="history-btn"
            onClick={onShowHistory}
            title="查看修改历史"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
              <path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            历史
          </button>
        </div>
        
        <div className="student-info-card">
          <div className="info-grid">
            <div className="info-item">
              <span className="info-label">姓名：</span>
              <span className="info-value">{student.name}</span>
            </div>
            <div className="info-item">
              <span className="info-label">校区：</span>
              <span className="info-value">{student.campus || '未知'}</span>
            </div>
            <div className="info-item">
              <span className="info-label">科目：</span>
              <span className="info-value">{student.subject || '未知'}</span>
            </div>
            <div className="info-item">
              <span className="info-label">课时：</span>
              <span className="info-value">{student.courseHours || '0'}课时</span>
            </div>
          </div>
          
          <div className="conflict-reason-box">
            <div className="reason-header">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                <path d="M12 8v4M12 16h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              <span>冲突原因</span>
            </div>
            <p className="reason-text">{conflict.reason}</p>
          </div>
        </div>
      </div>
      
      {/* 智能建议区 */}
      <div className="suggestions-section">
        <div className="section-header">
          <h3 className="section-title">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
              <path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3M12 17h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            智能建议
          </h3>
        </div>
        
        <SmartSuggestions
          suggestions={conflict.suggestions || []}
          onApplySuggestion={onApplySuggestion}
          loading={loading}
        />
      </div>
      
      {/* 手动编辑区 */}
      <div className="manual-edit-section">
        <div className="section-header">
          <h3 className="section-title">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            手动修改
          </h3>
        </div>
        
        {/* 编辑标签页 */}
        <div className="edit-tabs">
          <button
            className={`edit-tab ${activeEditTab === 'student' ? 'active' : ''}`}
            onClick={() => setActiveEditTab('student')}
          >
            学生数据
          </button>
          <button
            className={`edit-tab ${activeEditTab === 'teacher' ? 'active' : ''}`}
            onClick={() => setActiveEditTab('teacher')}
          >
            教师数据
          </button>
          <button
            className={`edit-tab ${activeEditTab === 'classroom' ? 'active' : ''}`}
            onClick={() => setActiveEditTab('classroom')}
          >
            教室数据
          </button>
        </div>
        
        {/* 编辑表单 */}
        <div className="edit-form">
          <div className="form-group">
            <label className="form-label">修改数据（支持粘贴Excel）</label>
            <textarea
              className="form-textarea"
              placeholder={`粘贴${activeEditTab === 'student' ? '学生' : activeEditTab === 'teacher' ? '教师' : '教室'}的Excel数据...`}
              value={editingData}
              onChange={(e) => setEditingData(e.target.value)}
              rows={4}
            />
          </div>
          
          <div className="form-group">
            <label className="form-label required">修改原因</label>
            <input
              type="text"
              className="form-input"
              placeholder="请输入修改原因..."
              value={modificationReason}
              onChange={(e) => setModificationReason(e.target.value)}
            />
          </div>
        </div>
      </div>
      
      {/* 操作按钮区 */}
      <div className="action-buttons">
        <button
          className="action-btn primary"
          onClick={handleManualModify}
          disabled={loading}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <polyline points="17 21 17 13 7 13 7 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <polyline points="7 3 7 8 15 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          保存修改
        </button>
        
        <button
          className="action-btn success"
          onClick={() => onRetrySchedule(conflict.id)}
          disabled={loading}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0118.8-4.3M22 12.5a10 10 0 01-18.8 4.2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          重新尝试
        </button>
        
        <button
          className="action-btn secondary"
          onClick={() => onSkipConflict(conflict.id)}
          disabled={loading}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          跳过
        </button>
        
        <button
          className="action-btn info"
          onClick={onNextConflict}
          disabled={loading}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          下一个
        </button>
      </div>
    </div>
  );
};

export default AdjustmentPanel;
