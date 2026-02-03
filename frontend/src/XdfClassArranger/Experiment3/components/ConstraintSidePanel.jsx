/**
 * Constraint Side Panel Component
 * 约束侧边面板组件
 * 
 * Right-side panel for viewing and editing student constraints
 */

import React, { useState, useEffect } from 'react';
import {
  ALL_CONSTRAINT_TYPES,
  validateConstraint,
  getConstraintDescription,
  createDefaultConstraint
} from '../constraints/newConstraintTypes';
import './ConstraintSidePanel.css';

const ConstraintSidePanel = ({ student, onClose, onSave, onReschedule }) => {
  const [constraints, setConstraints] = useState(student?.constraints || []);
  const [expandedTypes, setExpandedTypes] = useState(new Set(['time_window'])); // Default expand time_window
  const [editingConstraint, setEditingConstraint] = useState(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  useEffect(() => {
    setConstraints(student?.constraints || []);
    setHasUnsavedChanges(false);
  }, [student]);

  // Group constraints by kind
  const constraintsByKind = {};
  for (const constraint of constraints) {
    if (!constraintsByKind[constraint.kind]) {
      constraintsByKind[constraint.kind] = [];
    }
    constraintsByKind[constraint.kind].push(constraint);
  }

  const toggleTypeExpansion = (kind) => {
    const newExpanded = new Set(expandedTypes);
    if (newExpanded.has(kind)) {
      newExpanded.delete(kind);
    } else {
      newExpanded.add(kind);
    }
    setExpandedTypes(newExpanded);
  };

  const handleAddConstraint = (kind) => {
    const newConstraint = createDefaultConstraint(kind);
    setConstraints([...constraints, newConstraint]);
    setEditingConstraint(newConstraint);
    setHasUnsavedChanges(true);
    
    // Auto-expand this type
    setExpandedTypes(new Set([...expandedTypes, kind]));
  };

  const handleDeleteConstraint = (constraintId) => {
    if (window.confirm('确定要删除此约束吗？')) {
      setConstraints(constraints.filter(c => c.id !== constraintId));
      setHasUnsavedChanges(true);
    }
  };

  const handleSaveConstraints = () => {
    // Validate all constraints
    const validationResults = constraints.map(c => ({
      constraint: c,
      validation: validateConstraint(c)
    }));

    const invalid = validationResults.filter(r => !r.validation.valid);
    
    if (invalid.length > 0) {
      alert(`发现 ${invalid.length} 个无效约束，请修正后保存。\n\n${invalid.map(r => 
        `- ${getConstraintDescription(r.constraint)}: ${r.validation.errors.join(', ')}`
      ).join('\n')}`);
      return;
    }

    onSave({ ...student, constraints, constraintsModified: true });
    setHasUnsavedChanges(false);
  };

  const handleRescheduleClick = () => {
    if (hasUnsavedChanges) {
      if (window.confirm('有未保存的约束修改，是否先保存再重新排课？')) {
        handleSaveConstraints();
      }
    }
    onReschedule(student.id);
  };

  return (
    <>
      {/* Overlay */}
      <div className="constraint-panel-overlay" onClick={onClose} />
      
      {/* Side Panel */}
      <div className="constraint-side-panel">
        {/* Header */}
        <div className="panel-header">
          <div className="header-content">
            <h3 className="panel-title">学生约束配置</h3>
            <span className="student-name">{student?.name}</span>
          </div>
          <button className="panel-close-btn" onClick={onClose} title="关闭">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="panel-body">
          {/* Constraint Type Groups */}
          {Object.entries(ALL_CONSTRAINT_TYPES).map(([kind, metadata]) => (
            <ConstraintTypeGroup
              key={kind}
              kind={kind}
              metadata={metadata}
              constraints={constraintsByKind[kind] || []}
              expanded={expandedTypes.has(kind)}
              onToggleExpand={() => toggleTypeExpansion(kind)}
              onAdd={() => handleAddConstraint(kind)}
              onEdit={(c) => setEditingConstraint(c)}
              onDelete={handleDeleteConstraint}
            />
          ))}
        </div>

        {/* Footer */}
        <div className="panel-footer">
          {hasUnsavedChanges && (
            <div className="unsaved-indicator">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                <path d="M12 8v4m0 4h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              <span>有未保存的修改</span>
            </div>
          )}
          
          <div className="footer-actions">
            <button 
              className="btn-secondary"
              onClick={onClose}
            >
              取消
            </button>
            <button 
              className="btn-save"
              onClick={handleSaveConstraints}
              disabled={!hasUnsavedChanges}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" stroke="currentColor" strokeWidth="2"/>
                <path d="M17 21v-8H7v8M7 3v5h8" stroke="currentColor" strokeWidth="2"/>
              </svg>
              保存约束
            </button>
            <button 
              className="btn-reschedule"
              onClick={handleRescheduleClick}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M1 4v6h6M23 20v-6h-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M20.49 9A9 9 0 005.6 5.6L1 10m22 4l-4.6 4.6A9 9 0 013.51 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              重新排课
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

/**
 * Constraint Type Group Component
 * 约束类型分组组件
 */
const ConstraintTypeGroup = ({ kind, metadata, constraints, expanded, onToggleExpand, onAdd, onEdit, onDelete }) => {
  return (
    <div className={`constraint-type-group ${expanded ? 'expanded' : 'collapsed'}`}>
      <div className="group-header" onClick={onToggleExpand}>
        <div className="header-left">
          <span className="constraint-icon">{metadata.icon}</span>
          <span className="constraint-type-name">{metadata.name}</span>
          {constraints.length > 0 && (
            <span className="constraint-count">{constraints.length}</span>
          )}
        </div>
        <div className="header-right">
          <button 
            className="btn-add-constraint"
            onClick={(e) => {
              e.stopPropagation();
              onAdd();
            }}
            title={`添加${metadata.name}`}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
          <svg 
            className="expand-icon"
            width="16" 
            height="16" 
            viewBox="0 0 24 24" 
            fill="none"
          >
            <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      </div>

      {expanded && (
        <div className="group-body">
          {constraints.length === 0 ? (
            <div className="empty-state">
              <p>暂无{metadata.name}约束</p>
              <p className="hint">点击右上角 + 号添加</p>
            </div>
          ) : (
            constraints.map(constraint => (
              <ConstraintCard
                key={constraint.id}
                constraint={constraint}
                metadata={metadata}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))
          )}
          
          {/* Examples */}
          {constraints.length === 0 && metadata.examples && (
            <div className="examples">
              <p className="examples-title">示例：</p>
              <ul>
                {metadata.examples.slice(0, 2).map((example, i) => (
                  <li key={i}>{example}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

/**
 * Constraint Card Component
 * 约束卡片组件
 */
const ConstraintCard = ({ constraint, metadata, onEdit, onDelete }) => {
  const validation = validateConstraint(constraint);
  const description = getConstraintDescription(constraint);

  return (
    <div className={`constraint-card ${constraint.strength}`}>
      <div className="card-header">
        <div className="strength-badge">
          {constraint.strength === 'hard' && '必须'}
          {constraint.strength === 'soft' && '建议'}
          {constraint.strength === 'info' && '信息'}
        </div>
        {constraint.confidence !== undefined && (
          <div className="confidence-badge" title={`AI置信度: ${(constraint.confidence * 100).toFixed(0)}%`}>
            {(constraint.confidence * 100).toFixed(0)}%
          </div>
        )}
      </div>
      
      <div className="card-body">
        <p className="constraint-description">{description}</p>
        
        {constraint.note && (
          <p className="constraint-note">📝 {constraint.note}</p>
        )}
        
        {!validation.valid && (
          <div className="validation-errors">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
              <path d="M12 8v4m0 4h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            <span>{validation.errors.join(', ')}</span>
          </div>
        )}
      </div>
      
      <div className="card-actions">
        <button 
          className="btn-edit"
          onClick={() => onEdit(constraint)}
          title="编辑"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <button 
          className="btn-delete"
          onClick={() => onDelete(constraint.id)}
          title="删除"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>
    </div>
  );
};

export default ConstraintSidePanel;
