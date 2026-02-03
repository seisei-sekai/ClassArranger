/**
 * Constraint Panel Component
 * 约束面板组件
 * 
 * Display and manage active constraints during scheduling
 * 在排课期间显示和管理活动约束
 */

import React, { useState } from 'react';
import './ConstraintPanel.css';

const ConstraintPanel = ({ constraintEngine, onOpenManager }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  if (!constraintEngine) {
    return null;
  }
  
  // Get enabled constraints (获取启用的约束)
  const enabledConstraints = constraintEngine.getEnabledConstraints();
  
  // Group by type (按类型分组)
  const hardConstraints = enabledConstraints.filter(c => c.type === 'hard');
  const softConstraints = enabledConstraints.filter(c => c.type === 'soft');
  const customConstraints = enabledConstraints.filter(c => c.isCustom);
  
  return (
    <div className={`constraint-panel ${isCollapsed ? 'collapsed' : ''}`}>
      <div className="panel-header">
        <div className="header-content">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="header-icon">
            <path d="M12 15a3 3 0 100-6 3 3 0 000 6z" stroke="currentColor" strokeWidth="2"/>
            <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" stroke="currentColor" strokeWidth="2"/>
          </svg>
          <span className="header-title">排课约束</span>
          <span className="constraint-count">{enabledConstraints.length}</span>
        </div>
        <div className="header-actions">
          <button
            className="manage-btn"
            onClick={onOpenManager}
            title="管理约束"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <button
            className="collapse-btn"
            onClick={() => setIsCollapsed(!isCollapsed)}
            title={isCollapsed ? '展开' : '收起'}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path 
                d={isCollapsed ? "M5 12h14M12 5l7 7-7 7" : "M19 12H5M12 19l-7-7 7-7"} 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
      </div>
      
      {!isCollapsed && (
        <div className="panel-content">
          {/* Hard Constraints (硬约束) */}
          {hardConstraints.length > 0 && (
            <div className="constraint-group">
              <div className="group-header">
                <span className="group-badge hard">必须满足</span>
                <span className="group-name">硬约束</span>
              </div>
              <div className="constraint-items">
                {hardConstraints.map(constraint => (
                  <ConstraintItem key={constraint.id} constraint={constraint} />
                ))}
              </div>
            </div>
          )}
          
          {/* Soft Constraints (软约束) */}
          {softConstraints.length > 0 && (
            <div className="constraint-group">
              <div className="group-header">
                <span className="group-badge soft">建议满足</span>
                <span className="group-name">软约束</span>
              </div>
              <div className="constraint-items">
                {softConstraints.map(constraint => (
                  <ConstraintItem key={constraint.id} constraint={constraint} />
                ))}
              </div>
            </div>
          )}
          
          {/* Custom Constraints (自定义约束) */}
          {customConstraints.length > 0 && (
            <div className="constraint-group">
              <div className="group-header">
                <span className="group-badge custom">自定义</span>
                <span className="group-name">自定义约束</span>
              </div>
              <div className="constraint-items">
                {customConstraints.map(constraint => (
                  <ConstraintItem key={constraint.id} constraint={constraint} />
                ))}
              </div>
            </div>
          )}
          
          {enabledConstraints.length === 0 && (
            <div className="empty-state">
              <p>未启用约束</p>
              <button onClick={onOpenManager} className="empty-action">
                添加约束
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Constraint Item Component (约束项组件)
const ConstraintItem = ({ constraint }) => {
  const metadata = constraint.metadata || {};
  
  return (
    <div className="constraint-item-compact">
      <div className="item-info">
        <span className="item-name">{metadata.name || constraint.name || constraint.id}</span>
        <span className="item-weight">权重: {constraint.weight}</span>
      </div>
      <div className="item-indicator">
        <div 
          className="weight-bar" 
          style={{ width: `${Math.min(100, (constraint.weight / 50) * 100)}%` }}
        />
      </div>
    </div>
  );
};

export default ConstraintPanel;

