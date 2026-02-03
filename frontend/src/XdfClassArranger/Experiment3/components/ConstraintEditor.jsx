/**
 * Constraint Editor Component
 * 约束编辑器组件
 * 
 * Dynamic form editor for different constraint types
 */

import React, { useState, useEffect } from 'react';
import { validateConstraint, ALL_CONSTRAINT_TYPES } from '../constraints/newConstraintTypes';
import './ConstraintEditor.css';

const ConstraintEditor = ({ constraint, onSave, onCancel }) => {
  const [formData, setFormData] = useState(constraint);
  const [validation, setValidation] = useState({ valid: true, errors: [] });

  useEffect(() => {
    const v = validateConstraint(formData);
    setValidation(v);
  }, [formData]);

  const handleSave = () => {
    if (!validation.valid) {
      alert(`约束配置有误：\n${validation.errors.join('\n')}`);
      return;
    }
    onSave(formData);
  };

  const updateField = (field, value) => {
    setFormData({ ...formData, [field]: value });
  };

  const metadata = ALL_CONSTRAINT_TYPES[constraint.kind];

  return (
    <div className="constraint-editor-modal">
      <div className="editor-overlay" onClick={onCancel} />
      
      <div className="editor-content">
        <div className="editor-header">
          <div className="header-info">
            <span className="constraint-icon">{metadata?.icon}</span>
            <h3>编辑{metadata?.name}</h3>
          </div>
          <button className="btn-close" onClick={onCancel}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        <div className="editor-body">
          {/* Render form based on constraint type */}
          {formData.kind === 'time_window' && (
            <TimeWindowForm formData={formData} updateField={updateField} />
          )}
          {formData.kind === 'blackout' && (
            <BlackoutForm formData={formData} updateField={updateField} />
          )}
          {formData.kind === 'fixed_slot' && (
            <FixedSlotForm formData={formData} updateField={updateField} />
          )}
          {formData.kind === 'horizon' && (
            <HorizonForm formData={formData} updateField={updateField} />
          )}
          {formData.kind === 'session_plan' && (
            <SessionPlanForm formData={formData} updateField={updateField} />
          )}
          {formData.kind === 'resource_preference' && (
            <ResourcePreferenceForm formData={formData} updateField={updateField} />
          )}

          {/* Common fields */}
          <div className="form-group">
            <label className="form-label">约束强度</label>
            <select
              className="form-select"
              value={formData.strength}
              onChange={(e) => updateField('strength', e.target.value)}
            >
              <option value="soft">建议满足</option>
              <option value="hard">必须满足</option>
              <option value="info">仅记录</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">备注</label>
            <textarea
              className="form-textarea"
              value={formData.note || ''}
              onChange={(e) => updateField('note', e.target.value)}
              placeholder="添加备注说明..."
              rows={2}
            />
          </div>

          {/* Validation errors */}
          {!validation.valid && (
            <div className="validation-alert">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                <path d="M12 8v4m0 4h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              <div>
                <strong>配置有误：</strong>
                <ul>
                  {validation.errors.map((err, i) => (
                    <li key={i}>{err}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>

        <div className="editor-footer">
          <button className="btn-cancel" onClick={onCancel}>
            取消
          </button>
          <button 
            className="btn-save-editor"
            onClick={handleSave}
            disabled={!validation.valid}
          >
            保存
          </button>
        </div>
      </div>
    </div>
  );
};

// ==================== Form Components ====================

const TimeWindowForm = ({ formData, updateField }) => {
  const weekdayOptions = [
    { value: 1, label: '周一' },
    { value: 2, label: '周二' },
    { value: 3, label: '周三' },
    { value: 4, label: '周四' },
    { value: 5, label: '周五' },
    { value: 6, label: '周六' },
    { value: 7, label: '周日' }
  ];

  const toggleWeekday = (day) => {
    const weekdays = formData.weekdays || [];
    if (weekdays.includes(day)) {
      updateField('weekdays', weekdays.filter(d => d !== day));
    } else {
      updateField('weekdays', [...weekdays, day].sort());
    }
  };

  const addTimeRange = () => {
    const timeRanges = formData.timeRanges || [];
    updateField('timeRanges', [...timeRanges, { start: '09:00', end: '21:00' }]);
  };

  const updateTimeRange = (index, field, value) => {
    const timeRanges = [...(formData.timeRanges || [])];
    timeRanges[index] = { ...timeRanges[index], [field]: value };
    updateField('timeRanges', timeRanges);
  };

  const deleteTimeRange = (index) => {
    const timeRanges = formData.timeRanges || [];
    updateField('timeRanges', timeRanges.filter((_, i) => i !== index));
  };

  // Preset templates
  const applyPreset = (preset) => {
    switch (preset) {
      case 'workday-evening':
        updateField('weekdays', [1, 2, 3, 4, 5]);
        updateField('timeRanges', [{ start: '18:00', end: '21:00' }]);
        break;
      case 'weekend-all':
        updateField('weekdays', [6, 7]);
        updateField('timeRanges', [{ start: '09:00', end: '21:00' }]);
        break;
      case 'workday-daytime':
        updateField('weekdays', [1, 2, 3, 4, 5]);
        updateField('timeRanges', [{ start: '09:00', end: '17:00' }]);
        break;
      case 'all-week':
        updateField('weekdays', [1, 2, 3, 4, 5, 6, 7]);
        updateField('timeRanges', [{ start: '09:00', end: '21:00' }]);
        break;
    }
  };

  return (
    <>
      <div className="form-group">
        <label className="form-label">操作类型</label>
        <div className="radio-group">
          <label className="radio-option">
            <input
              type="radio"
              checked={formData.operator === 'allow'}
              onChange={() => updateField('operator', 'allow')}
            />
            <span>可以上课</span>
          </label>
          <label className="radio-option">
            <input
              type="radio"
              checked={formData.operator === 'prefer'}
              onChange={() => updateField('operator', 'prefer')}
            />
            <span>偏好上课</span>
          </label>
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">快捷模板</label>
        <div className="preset-buttons">
          <button className="preset-btn" onClick={() => applyPreset('workday-evening')}>
            工作日晚上
          </button>
          <button className="preset-btn" onClick={() => applyPreset('weekend-all')}>
            周末全天
          </button>
          <button className="preset-btn" onClick={() => applyPreset('workday-daytime')}>
            平日白天
          </button>
          <button className="preset-btn" onClick={() => applyPreset('all-week')}>
            全周可用
          </button>
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">选择星期</label>
        <div className="weekday-selector">
          {weekdayOptions.map(({ value, label }) => (
            <button
              key={value}
              className={`weekday-btn ${formData.weekdays?.includes(value) ? 'selected' : ''}`}
              onClick={() => toggleWeekday(value)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">时间段</label>
        {(formData.timeRanges || []).map((range, index) => (
          <div key={index} className="time-range-row">
            <input
              type="time"
              className="time-input"
              value={range.start}
              onChange={(e) => updateTimeRange(index, 'start', e.target.value)}
            />
            <span className="time-separator">至</span>
            <input
              type="time"
              className="time-input"
              value={range.end}
              onChange={(e) => updateTimeRange(index, 'end', e.target.value)}
            />
            <button
              className="btn-delete-time"
              onClick={() => deleteTimeRange(index)}
              disabled={(formData.timeRanges || []).length <= 1}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" stroke="currentColor" strokeWidth="2"/>
              </svg>
            </button>
          </div>
        ))}
        <button className="btn-add-time" onClick={addTimeRange}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          添加时间段
        </button>
      </div>
    </>
  );
};

const BlackoutForm = ({ formData, updateField }) => {
  const weekdayOptions = [
    { value: 1, label: '周一' },
    { value: 2, label: '周二' },
    { value: 3, label: '周三' },
    { value: 4, label: '周四' },
    { value: 5, label: '周五' },
    { value: 6, label: '周六' },
    { value: 7, label: '周日' }
  ];

  const toggleWeekday = (day) => {
    const weekdays = formData.weekdays || [];
    if (weekdays.includes(day)) {
      updateField('weekdays', weekdays.filter(d => d !== day));
    } else {
      updateField('weekdays', [...weekdays, day].sort());
    }
  };

  const addTimeRange = () => {
    const timeRanges = formData.timeRanges || [];
    updateField('timeRanges', [...timeRanges, { start: '09:00', end: '17:00' }]);
  };

  const updateTimeRange = (index, field, value) => {
    const timeRanges = [...(formData.timeRanges || [])];
    timeRanges[index] = { ...timeRanges[index], [field]: value };
    updateField('timeRanges', timeRanges);
  };

  const deleteTimeRange = (index) => {
    const timeRanges = formData.timeRanges || [];
    updateField('timeRanges', timeRanges.filter((_, i) => i !== index));
  };

  return (
    <>
      <div className="form-group">
        <label className="form-label">原因</label>
        <select
          className="form-select"
          value={formData.reason || 'other'}
          onChange={(e) => updateField('reason', e.target.value)}
        >
          <option value="language_school">语言学校上课</option>
          <option value="travel">旅行/回国</option>
          <option value="fixed_event">固定活动</option>
          <option value="other">其他</option>
        </select>
      </div>

      <div className="form-group">
        <label className="form-label">禁排星期</label>
        <div className="weekday-selector">
          {weekdayOptions.map(({ value, label }) => (
            <button
              key={value}
              className={`weekday-btn blackout ${formData.weekdays?.includes(value) ? 'selected' : ''}`}
              onClick={() => toggleWeekday(value)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">禁排时间段</label>
        {(formData.timeRanges || []).map((range, index) => (
          <div key={index} className="time-range-row">
            <input
              type="time"
              className="time-input"
              value={range.start}
              onChange={(e) => updateTimeRange(index, 'start', e.target.value)}
            />
            <span className="time-separator">至</span>
            <input
              type="time"
              className="time-input"
              value={range.end}
              onChange={(e) => updateTimeRange(index, 'end', e.target.value)}
            />
            <button
              className="btn-delete-time"
              onClick={() => deleteTimeRange(index)}
              disabled={(formData.timeRanges || []).length <= 1}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" stroke="currentColor" strokeWidth="2"/>
              </svg>
            </button>
          </div>
        ))}
        <button className="btn-add-time" onClick={addTimeRange}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          添加时间段
        </button>
      </div>
    </>
  );
};

const FixedSlotForm = ({ formData, updateField }) => {
  const addSlot = () => {
    const slots = formData.slots || [];
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    updateField('slots', [...slots, { start: `${dateStr}T19:00`, end: `${dateStr}T21:00` }]);
  };

  const updateSlot = (index, field, value) => {
    const slots = [...(formData.slots || [])];
    slots[index] = { ...slots[index], [field]: value };
    updateField('slots', slots);
  };

  const deleteSlot = (index) => {
    const slots = formData.slots || [];
    updateField('slots', slots.filter((_, i) => i !== index));
  };

  return (
    <div className="form-group">
      <label className="form-label">固定课时</label>
      {(formData.slots || []).map((slot, index) => (
        <div key={index} className="fixed-slot-row">
          <input
            type="datetime-local"
            className="datetime-input"
            value={slot.start}
            onChange={(e) => updateSlot(index, 'start', e.target.value)}
          />
          <span className="time-separator">至</span>
          <input
            type="datetime-local"
            className="datetime-input"
            value={slot.end}
            onChange={(e) => updateSlot(index, 'end', e.target.value)}
          />
          <button
            className="btn-delete-time"
            onClick={() => deleteSlot(index)}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" stroke="currentColor" strokeWidth="2"/>
            </svg>
          </button>
        </div>
      ))}
      <button className="btn-add-time" onClick={addSlot}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
          <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
        添加固定课时
      </button>
    </div>
  );
};

const HorizonForm = ({ formData, updateField }) => {
  return (
    <>
      <div className="form-group">
        <label className="form-label">最早开始日期</label>
        <input
          type="date"
          className="form-input"
          value={formData.earliest || ''}
          onChange={(e) => updateField('earliest', e.target.value)}
        />
      </div>

      <div className="form-group">
        <label className="form-label">最晚结束日期</label>
        <input
          type="date"
          className="form-input"
          value={formData.latest || ''}
          onChange={(e) => updateField('latest', e.target.value)}
        />
      </div>

      <div className="form-group">
        <label className="form-label">必须完成截止日期</label>
        <input
          type="date"
          className="form-input"
          value={formData.mustFinishBy || ''}
          onChange={(e) => updateField('mustFinishBy', e.target.value)}
        />
      </div>
    </>
  );
};

const SessionPlanForm = ({ formData, updateField }) => {
  return (
    <>
      <div className="form-row">
        <div className="form-group">
          <label className="form-label">总次数</label>
          <input
            type="number"
            className="form-input"
            value={formData.totalSessions || ''}
            onChange={(e) => updateField('totalSessions', parseInt(e.target.value) || null)}
            placeholder="如：8"
            min="1"
          />
        </div>

        <div className="form-group">
          <label className="form-label">每周频次</label>
          <input
            type="number"
            className="form-input"
            value={formData.sessionsPerWeek || ''}
            onChange={(e) => updateField('sessionsPerWeek', parseInt(e.target.value) || null)}
            placeholder="如：2"
            min="1"
            max="7"
          />
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label className="form-label">每次时长（分钟）</label>
          <input
            type="number"
            className="form-input"
            value={formData.sessionDurationMin || ''}
            onChange={(e) => updateField('sessionDurationMin', parseInt(e.target.value) || null)}
            placeholder="如：120"
            min="30"
            step="30"
          />
        </div>

        <div className="form-group">
          <label className="form-label">总课时（小时）</label>
          <input
            type="number"
            className="form-input"
            value={formData.totalHours || ''}
            onChange={(e) => updateField('totalHours', parseInt(e.target.value) || null)}
            placeholder="如：16"
            min="1"
          />
        </div>
      </div>
    </>
  );
};

const ResourcePreferenceForm = ({ formData, updateField }) => {
  const [inputValue, setInputValue] = useState('');

  const addResource = (field) => {
    if (!inputValue.trim()) return;
    const current = formData[field] || [];
    updateField(field, [...current, inputValue.trim()]);
    setInputValue('');
  };

  const removeResource = (field, value) => {
    const current = formData[field] || [];
    updateField(field, current.filter(v => v !== value));
  };

  return (
    <>
      <div className="form-group">
        <label className="form-label">资源类型</label>
        <select
          className="form-select"
          value={formData.resourceType}
          onChange={(e) => updateField('resourceType', e.target.value)}
        >
          <option value="teacher">教师</option>
          <option value="campus">校区</option>
          <option value="room">教室</option>
          <option value="delivery_mode">上课方式</option>
        </select>
      </div>

      {/* Include */}
      <div className="form-group">
        <label className="form-label">必须使用（硬约束）</label>
        <div className="tag-list">
          {(formData.include || []).map((item, i) => (
            <span key={i} className="resource-tag include">
              {item}
              <button onClick={() => removeResource('include', item)}>×</button>
            </span>
          ))}
        </div>
        <div className="add-resource-row">
          <input
            type="text"
            className="form-input"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="输入资源名称..."
            onKeyPress={(e) => e.key === 'Enter' && addResource('include')}
          />
          <button className="btn-add" onClick={() => addResource('include')}>
            添加
          </button>
        </div>
      </div>

      {/* Prefer */}
      <div className="form-group">
        <label className="form-label">偏好使用（软约束）</label>
        <div className="tag-list">
          {(formData.prefer || []).map((item, i) => (
            <span key={i} className="resource-tag prefer">
              {item}
              <button onClick={() => removeResource('prefer', item)}>×</button>
            </span>
          ))}
        </div>
        <div className="add-resource-row">
          <input
            type="text"
            className="form-input"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="输入资源名称..."
            onKeyPress={(e) => e.key === 'Enter' && addResource('prefer')}
          />
          <button className="btn-add" onClick={() => addResource('prefer')}>
            添加
          </button>
        </div>
      </div>

      {/* Exclude */}
      <div className="form-group">
        <label className="form-label">排除使用（硬约束）</label>
        <div className="tag-list">
          {(formData.exclude || []).map((item, i) => (
            <span key={i} className="resource-tag exclude">
              {item}
              <button onClick={() => removeResource('exclude', item)}>×</button>
            </span>
          ))}
        </div>
        <div className="add-resource-row">
          <input
            type="text"
            className="form-input"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="输入资源名称..."
            onKeyPress={(e) => e.key === 'Enter' && addResource('exclude')}
          />
          <button className="btn-add" onClick={() => addResource('exclude')}>
            添加
          </button>
        </div>
      </div>
    </>
  );
};

export default ConstraintEditor;
