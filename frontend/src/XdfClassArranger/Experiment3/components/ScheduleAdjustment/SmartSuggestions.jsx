/**
 * 智能建议组件
 * Smart Suggestions Component
 * 
 * 功能：
 * - 标签页切换（时间/教师/教室/约束）
 * - 显示建议列表
 * - 显示置信度
 * - 应用建议功能
 */

import React, { useState, useMemo } from 'react';
import { SuggestionType } from '../../types/adjustmentTypes';
import './SmartSuggestions.css';

const SmartSuggestions = ({
  suggestions = [],
  onApplySuggestion,
  loading = false
}) => {
  const [activeTab, setActiveTab] = useState('all');
  
  // 按类型分组建议
  const groupedSuggestions = useMemo(() => {
    const groups = {
      all: suggestions,
      [SuggestionType.TIME]: [],
      [SuggestionType.TEACHER]: [],
      [SuggestionType.ROOM]: [],
      [SuggestionType.CONSTRAINT]: []
    };
    
    suggestions.forEach(suggestion => {
      if (groups[suggestion.type]) {
        groups[suggestion.type].push(suggestion);
      }
    });
    
    return groups;
  }, [suggestions]);
  
  // 当前标签页的建议
  const currentSuggestions = groupedSuggestions[activeTab] || [];
  
  // 标签页配置
  const tabs = [
    {
      id: 'all',
      label: '全部',
      icon: '💡',
      count: suggestions.length
    },
    {
      id: SuggestionType.TIME,
      label: '时间槽',
      icon: '🕐',
      count: groupedSuggestions[SuggestionType.TIME].length
    },
    {
      id: SuggestionType.TEACHER,
      label: '教师',
      icon: '👨‍🏫',
      count: groupedSuggestions[SuggestionType.TEACHER].length
    },
    {
      id: SuggestionType.ROOM,
      label: '教室',
      icon: '🏫',
      count: groupedSuggestions[SuggestionType.ROOM].length
    },
    {
      id: SuggestionType.CONSTRAINT,
      label: '约束',
      icon: '⚙️',
      count: groupedSuggestions[SuggestionType.CONSTRAINT].length
    }
  ];
  
  /**
   * 处理应用建议
   */
  const handleApplySuggestion = (suggestion) => {
    if (window.confirm(`确定要应用建议"${suggestion.title}"吗？`)) {
      onApplySuggestion(suggestion);
    }
  };
  
  /**
   * 渲染置信度条
   */
  const renderConfidenceBar = (confidence) => {
    const percentage = Math.round(confidence * 100);
    let colorClass = 'confidence-low';
    
    if (confidence >= 0.8) {
      colorClass = 'confidence-high';
    } else if (confidence >= 0.6) {
      colorClass = 'confidence-medium';
    }
    
    return (
      <div className="confidence-container">
        <div className="confidence-label">
          <span>置信度</span>
          <span className="confidence-value">{percentage}%</span>
        </div>
        <div className="confidence-bar">
          <div
            className={`confidence-fill ${colorClass}`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    );
  };
  
  return (
    <div className="smart-suggestions">
      {/* 标签页导航 */}
      <div className="suggestions-tabs">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
            disabled={tab.count === 0 && tab.id !== 'all'}
          >
            <span className="tab-icon">{tab.icon}</span>
            <span className="tab-label">{tab.label}</span>
            {tab.count > 0 && (
              <span className="tab-count">{tab.count}</span>
            )}
          </button>
        ))}
      </div>
      
      {/* 建议列表 */}
      <div className="suggestions-content">
        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>正在生成建议...</p>
          </div>
        ) : currentSuggestions.length === 0 ? (
          <div className="empty-state">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" style={{opacity: 0.3}}>
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
              <path d="M12 8v4M12 16h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            <p>暂无建议</p>
            <small>系统未找到可行的解决方案</small>
          </div>
        ) : (
          <div className="suggestions-list">
            {currentSuggestions.map((suggestion, index) => (
              <div key={suggestion.id} className="suggestion-card">
                {/* 卡片头部 */}
                <div className="suggestion-header">
                  <div className="suggestion-icon">{suggestion.icon}</div>
                  <div className="suggestion-title-group">
                    <h4 className="suggestion-title">{suggestion.title}</h4>
                    <p className="suggestion-description">{suggestion.description}</p>
                  </div>
                </div>
                
                {/* 置信度 */}
                {renderConfidenceBar(suggestion.confidence)}
                
                {/* 操作按钮 */}
                <div className="suggestion-actions">
                  <button
                    className="apply-btn"
                    onClick={() => handleApplySuggestion(suggestion)}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    应用建议
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* 底部提示 */}
      {currentSuggestions.length > 0 && !loading && (
        <div className="suggestions-footer">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
            <path d="M12 16v-4M12 8h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          <span>应用建议后，建议修改相关数据并手动确认</span>
        </div>
      )}
    </div>
  );
};

export default SmartSuggestions;
