/**
 * Test Data Generator Component
 * 测试数据生成器组件
 * 
 * UI for generating random test data
 */

import React, { useState } from 'react';
import { generateTestDataset, generateFromPreset, PRESETS } from '../utils/testDataGenerator';
import './TestDataGenerator.css';

const TestDataGenerator = ({ onGenerate, onClose, hasExistingData }) => {
  const [config, setConfig] = useState({
    students: 10,
    teachers: 5,
    classrooms: 5,
    includeConstraints: true,
    includeAvailability: true
  });

  const handlePresetClick = (presetName) => {
    const preset = PRESETS[presetName];
    setConfig({
      ...config,
      students: preset.students,
      teachers: preset.teachers,
      classrooms: preset.classrooms
    });
  };

  const handleGenerate = () => {
    if (hasExistingData) {
      if (!window.confirm('⚠️ 生成测试数据将清空现有数据，是否继续？\n\n此操作不可撤销。')) {
        return;
      }
    }

    const testData = generateTestDataset(config);
    onGenerate(testData);
    onClose();
  };

  const handleQuickGenerate = (presetName) => {
    if (hasExistingData) {
      if (!window.confirm('⚠️ 生成测试数据将清空现有数据，是否继续？')) {
        return;
      }
    }

    const testData = generateFromPreset(
      presetName,
      config.includeConstraints,
      config.includeAvailability
    );
    onGenerate(testData);
    onClose();
  };

  return (
    <div className="test-data-generator-modal">
      <div className="generator-overlay" onClick={onClose} />
      
      <div className="generator-content">
        <div className="generator-header">
          <div className="header-info">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <h3>生成测试数据</h3>
          </div>
          <button className="btn-close" onClick={onClose}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        <div className="generator-body">
          {hasExistingData && (
            <div className="warning-banner">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" stroke="currentColor" strokeWidth="2"/>
                <line x1="12" y1="9" x2="12" y2="13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                <line x1="12" y1="17" x2="12.01" y2="17" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              <span>生成测试数据将清空现有的所有学生、教师和教室数据</span>
            </div>
          )}

          {/* Quick Presets */}
          <div className="preset-section">
            <h4>快速生成</h4>
            <div className="preset-buttons">
              {Object.entries(PRESETS).map(([key, preset]) => (
                <button
                  key={key}
                  className="preset-card"
                  onClick={() => handleQuickGenerate(key)}
                >
                  <div className="preset-name">{preset.name}</div>
                  <div className="preset-desc">{preset.description}</div>
                  <div className="preset-icon">⚡</div>
                </button>
              ))}
            </div>
          </div>

          <div className="divider">
            <span>或自定义配置</span>
          </div>

          {/* Custom Configuration */}
          <div className="config-section">
            <h4>自定义配置</h4>
            
            <div className="config-grid">
              <div className="config-item">
                <label className="config-label">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" stroke="currentColor" strokeWidth="2"/>
                    <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                  学生数量
                </label>
                <input
                  type="number"
                  className="config-input"
                  value={config.students}
                  onChange={(e) => setConfig({ ...config, students: parseInt(e.target.value) || 0 })}
                  min="1"
                  max="200"
                />
              </div>

              <div className="config-item">
                <label className="config-label">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" stroke="currentColor" strokeWidth="2"/>
                    <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                  教师数量
                </label>
                <input
                  type="number"
                  className="config-input"
                  value={config.teachers}
                  onChange={(e) => setConfig({ ...config, teachers: parseInt(e.target.value) || 0 })}
                  min="1"
                  max="100"
                />
              </div>

              <div className="config-item">
                <label className="config-label">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                  教室数量
                </label>
                <input
                  type="number"
                  className="config-input"
                  value={config.classrooms}
                  onChange={(e) => setConfig({ ...config, classrooms: parseInt(e.target.value) || 0 })}
                  min="1"
                  max="50"
                />
              </div>
            </div>

            <div className="options-section">
              <label className="option-checkbox">
                <input
                  type="checkbox"
                  checked={config.includeConstraints}
                  onChange={(e) => setConfig({ ...config, includeConstraints: e.target.checked })}
                />
                <span>包含学生约束（time_window、blackout等）</span>
              </label>

              <label className="option-checkbox">
                <input
                  type="checkbox"
                  checked={config.includeAvailability}
                  onChange={(e) => setConfig({ ...config, includeAvailability: e.target.checked })}
                />
                <span>包含教师可用性</span>
              </label>
            </div>
          </div>
        </div>

        <div className="generator-footer">
          <button className="btn-cancel" onClick={onClose}>
            取消
          </button>
          <button className="btn-generate" onClick={handleGenerate}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            生成测试数据
          </button>
        </div>
      </div>
    </div>
  );
};

export default TestDataGenerator;
