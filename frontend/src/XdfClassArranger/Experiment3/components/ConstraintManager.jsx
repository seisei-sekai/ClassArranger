/**
 * Constraint Manager Component
 * 约束管理器组件
 * 
 * UI for managing scheduling constraints
 * 用于管理排课约束的用户界面
 */

import React, { useState, useEffect } from 'react';
import { ALL_CONSTRAINTS, CONSTRAINT_METADATA } from '../constraints/constraintTypes';
import './ConstraintManager.css';

const ConstraintManager = ({ constraintEngine, onUpdate }) => {
  const [constraints, setConstraints] = useState([]);
  const [showAddCustom, setShowAddCustom] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customWeight, setCustomWeight] = useState(5);
  const [customType, setCustomType] = useState('soft');
  
  // Load constraints from engine (从引擎加载约束)
  useEffect(() => {
    if (constraintEngine) {
      const allConstraints = constraintEngine.getAllConstraints();
      setConstraints(allConstraints);
    }
  }, [constraintEngine]);
  
  // Handle constraint enable/disable (处理约束启用/禁用)
  const handleToggleConstraint = (constraintId) => {
    const constraint = constraints.find(c => c.id === constraintId);
    if (!constraint) return;
    
    const newEnabled = !constraintEngine.enabled.has(constraintId);
    constraintEngine.setConstraintEnabled(constraintId, newEnabled);
    
    // Update local state (更新本地状态)
    setConstraints(prev => prev.map(c => 
      c.id === constraintId ? { ...c, enabled: newEnabled } : c
    ));
    
    if (onUpdate) onUpdate();
  };
  
  // Handle weight change (处理权重变化)
  const handleWeightChange = (constraintId, newWeight) => {
    const weight = parseFloat(newWeight);
    if (isNaN(weight) || weight < 0) return;
    
    constraintEngine.setConstraintWeight(constraintId, weight);
    
    setConstraints(prev => prev.map(c => 
      c.id === constraintId ? { ...c, weight } : c
    ));
    
    if (onUpdate) onUpdate();
  };
  
  // Handle add custom constraint (处理添加自定义约束)
  const handleAddCustom = () => {
    if (!customName.trim()) {
      alert('请输入约束名称');
      return;
    }
    
    // Create a simple custom check function (创建简单的自定义检查函数)
    const checkFunction = (schedule) => {
      // This is a placeholder - in a real implementation,
      // the admin would define the logic through a visual editor
      // 这是一个占位符 - 在实际实现中，管理员会通过可视化编辑器定义逻辑
      return { violations: 0 };
    };
    
    const constraintId = constraintEngine.addCustomConstraint(
      customName,
      checkFunction,
      customWeight,
      customType
    );
    
    // Update state (更新状态)
    const newConstraint = constraintEngine.constraints.get(constraintId);
    setConstraints(prev => [...prev, newConstraint]);
    
    // Reset form (重置表单)
    setCustomName('');
    setCustomWeight(5);
    setCustomType('soft');
    setShowAddCustom(false);
    
    if (onUpdate) onUpdate();
  };
  
  // Handle remove custom constraint (处理移除自定义约束)
  const handleRemoveCustom = (constraintId) => {
    if (!window.confirm('确定要删除此自定义约束吗？')) return;
    
    constraintEngine.removeCustomConstraint(constraintId);
    setConstraints(prev => prev.filter(c => c.id !== constraintId));
    
    if (onUpdate) onUpdate();
  };
  
  // Group constraints by type (按类型分组约束)
  const hardConstraints = constraints.filter(c => c.type === 'hard');
  const softConstraints = constraints.filter(c => c.type === 'soft');
  const customConstraints = constraints.filter(c => c.isCustom);
  
  return (
    <div className="constraint-manager">
      <div className="constraint-manager-header">
        <h2 className="manager-title">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M12 15a3 3 0 100-6 3 3 0 000 6z" stroke="currentColor" strokeWidth="2"/>
            <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" stroke="currentColor" strokeWidth="2"/>
          </svg>
          约束管理
        </h2>
        <p className="manager-subtitle">
          管理排课约束条件和优先级
        </p>
      </div>
      
      {/* Hard Constraints Section (硬约束区域) */}
      <div className="constraint-section">
        <div className="section-header">
          <h3 className="section-title">
            <span className="title-badge hard">必须满足</span>
            硬约束
          </h3>
          <span className="section-count">{hardConstraints.length}</span>
        </div>
        
        <div className="constraint-list">
          {hardConstraints.map(constraint => (
            <ConstraintItem
              key={constraint.id}
              constraint={constraint}
              isEnabled={constraintEngine.enabled.has(constraint.id)}
              onToggle={handleToggleConstraint}
              onWeightChange={handleWeightChange}
            />
          ))}
        </div>
      </div>
      
      {/* Soft Constraints Section (软约束区域) */}
      <div className="constraint-section">
        <div className="section-header">
          <h3 className="section-title">
            <span className="title-badge soft">建议满足</span>
            软约束
          </h3>
          <span className="section-count">{softConstraints.length}</span>
        </div>
        
        <div className="constraint-list">
          {softConstraints.map(constraint => (
            <ConstraintItem
              key={constraint.id}
              constraint={constraint}
              isEnabled={constraintEngine.enabled.has(constraint.id)}
              onToggle={handleToggleConstraint}
              onWeightChange={handleWeightChange}
            />
          ))}
        </div>
      </div>
      
      {/* Custom Constraints Section (自定义约束区域) */}
      <div className="constraint-section">
        <div className="section-header">
          <h3 className="section-title">
            <span className="title-badge custom">自定义</span>
            自定义约束
          </h3>
          <button 
            className="add-custom-btn"
            onClick={() => setShowAddCustom(!showAddCustom)}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            添加
          </button>
        </div>
        
        {showAddCustom && (
          <div className="add-custom-form">
            <input
              type="text"
              placeholder="约束名称"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              className="custom-name-input"
            />
            <div className="form-row">
              <select 
                value={customType}
                onChange={(e) => setCustomType(e.target.value)}
                className="custom-type-select"
              >
                <option value="soft">软约束</option>
                <option value="hard">硬约束</option>
              </select>
              <input
                type="number"
                placeholder="权重"
                value={customWeight}
                onChange={(e) => setCustomWeight(parseFloat(e.target.value) || 5)}
                min="0"
                max="100"
                className="custom-weight-input"
              />
            </div>
            <div className="form-actions">
              <button onClick={handleAddCustom} className="btn-primary">
                确定添加
              </button>
              <button onClick={() => setShowAddCustom(false)} className="btn-secondary">
                取消
              </button>
            </div>
          </div>
        )}
        
        <div className="constraint-list">
          {customConstraints.length === 0 ? (
            <div className="empty-custom">
              <p>暂无自定义约束</p>
              <p className="empty-hint">点击"添加"按钮创建自定义约束</p>
            </div>
          ) : (
            customConstraints.map(constraint => (
              <ConstraintItem
                key={constraint.id}
                constraint={constraint}
                isEnabled={constraintEngine.enabled.has(constraint.id)}
                onToggle={handleToggleConstraint}
                onWeightChange={handleWeightChange}
                onRemove={handleRemoveCustom}
                isCustom
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
};

// Constraint Item Component (约束项组件)
const ConstraintItem = ({ constraint, isEnabled, onToggle, onWeightChange, onRemove, isCustom }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [weightValue, setWeightValue] = useState(constraint.weight);
  
  const metadata = constraint.metadata || {};
  
  const handleWeightSubmit = () => {
    onWeightChange(constraint.id, weightValue);
    setIsEditing(false);
  };
  
  return (
    <div className={`constraint-item ${isEnabled ? 'enabled' : 'disabled'}`}>
      <div className="constraint-toggle">
        <label className="toggle-switch">
          <input
            type="checkbox"
            checked={isEnabled}
            onChange={() => onToggle(constraint.id)}
          />
          <span className="toggle-slider"></span>
        </label>
      </div>
      
      <div className="constraint-info">
        <div className="constraint-name">
          {metadata.name || constraint.name || constraint.id}
          {constraint.type === 'hard' && (
            <span className="type-badge hard">必须</span>
          )}
          {constraint.type === 'soft' && (
            <span className="type-badge soft">建议</span>
          )}
        </div>
        <div className="constraint-description">
          {metadata.description || '无描述'}
        </div>
      </div>
      
      <div className="constraint-weight">
        {isEditing ? (
          <div className="weight-editor">
            <input
              type="number"
              value={weightValue}
              onChange={(e) => setWeightValue(parseFloat(e.target.value) || 0)}
              min="0"
              max="100"
              className="weight-input"
              onKeyPress={(e) => e.key === 'Enter' && handleWeightSubmit()}
            />
            <button onClick={handleWeightSubmit} className="weight-save">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
        ) : (
          <div className="weight-display" onClick={() => metadata.editable && setIsEditing(true)}>
            <span className="weight-value">{constraint.weight}</span>
            {metadata.editable && (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="edit-icon">
                <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            )}
          </div>
        )}
      </div>
      
      {isCustom && (
        <button 
          className="remove-custom-btn"
          onClick={() => onRemove(constraint.id)}
          title="删除自定义约束"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      )}
    </div>
  );
};

export default ConstraintManager;

