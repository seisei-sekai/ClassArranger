/**
 * Scheduling Control Panel - Experiment2
 * 排课控制面板
 */

import React from 'react';
import { canScheduleCourse } from '../utils/validationRules.js';

const SchedulingControlPanel = ({
  students,
  teachers,
  classrooms,
  settings,
  isScheduling,
  progress,
  onStartScheduling
}) => {
  /**
   * Validate before scheduling
   */
  const validateBeforeScheduling = () => {
    const errors = [];
    const warnings = [];

    if (students.length === 0) {
      errors.push('没有学生数据');
    }

    if (teachers.length === 0) {
      errors.push('没有教师数据');
    }

    if (classrooms.length === 0) {
      warnings.push('没有教室数据（将使用虚拟教室）');
    }

    // Check each student's schedulability
    let unschedulableCount = 0;
    students.forEach(student => {
      const check = canScheduleCourse(student, teachers, classrooms);
      if (!check.possible) {
        unschedulableCount++;
      }
    });

    if (unschedulableCount > 0) {
      warnings.push(`${unschedulableCount}个学生可能无法排课（约束不匹配）`);
    }

    return { errors, warnings };
  };

  /**
   * Handle start scheduling
   */
  const handleStart = () => {
    const validation = validateBeforeScheduling();

    if (validation.errors.length > 0) {
      alert(`无法开始排课：\n\n${validation.errors.join('\n')}`);
      return;
    }

    if (validation.warnings.length > 0) {
      const proceed = confirm(
        `警告：\n\n${validation.warnings.join('\n')}\n\n是否继续排课？`
      );
      if (!proceed) return;
    }

    onStartScheduling(settings);
  };

  /**
   * Get pre-check statistics
   */
  const preCheckStats = {
    totalStudents: students.length,
    totalTeachers: teachers.length,
    totalClassrooms: classrooms.length,
    
    // Count students by subject
    subjectDistribution: students.reduce((acc, s) => {
      acc[s.subject] = (acc[s.subject] || 0) + 1;
      return acc;
    }, {}),
    
    // Count teachers by subject
    teacherCoverage: teachers.reduce((acc, t) => {
      t.subjects.forEach(subject => {
        acc[subject] = (acc[subject] || 0) + 1;
      });
      return acc;
    }, {}),
    
    // Total remaining hours
    totalHours: students.reduce((sum, s) => sum + s.remainingHours, 0)
  };

  /**
   * Check if ready to schedule
   */
  const isReady = students.length > 0 && teachers.length > 0;

  return (
    <div className="scheduling-control-panel">
      <div className="panel-header">
        <h2>开始排课</h2>
        <p className="panel-subtitle">
          系统将自动为学生匹配教师和教室
        </p>
      </div>

      {/* Pre-check information */}
      <div className="pre-check-section">
        <h3>数据概览</h3>
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">👨‍🎓</div>
            <div className="stat-content">
              <div className="stat-value">{preCheckStats.totalStudents}</div>
              <div className="stat-label">待排课学生</div>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon">👨‍🏫</div>
            <div className="stat-content">
              <div className="stat-value">{preCheckStats.totalTeachers}</div>
              <div className="stat-label">可用教师</div>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon">🏫</div>
            <div className="stat-content">
              <div className="stat-value">{preCheckStats.totalClassrooms}</div>
              <div className="stat-label">可用教室</div>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon">⏰</div>
            <div className="stat-content">
              <div className="stat-value">{preCheckStats.totalHours}</div>
              <div className="stat-label">总剩余课时</div>
            </div>
          </div>
        </div>

        {/* Subject matching analysis */}
        <div className="subject-analysis">
          <h4>科目匹配分析</h4>
          <div className="subject-table">
            <table>
              <thead>
                <tr>
                  <th>科目</th>
                  <th>学生数</th>
                  <th>教师数</th>
                  <th>状态</th>
                </tr>
              </thead>
              <tbody>
                {Object.keys(preCheckStats.subjectDistribution).map(subject => {
                  const studentCount = preCheckStats.subjectDistribution[subject];
                  const teacherCount = preCheckStats.teacherCoverage[subject] || 0;
                  const ratio = teacherCount > 0 ? (studentCount / teacherCount).toFixed(1) : '∞';
                  const status = teacherCount === 0 ? 'error' : ratio > 5 ? 'warning' : 'ok';
                  
                  return (
                    <tr key={subject} className={status}>
                      <td>{subject}</td>
                      <td>{studentCount}</td>
                      <td>{teacherCount}</td>
                      <td>
                        {status === 'error' && '❌ 无教师'}
                        {status === 'warning' && '⚠️ 教师不足'}
                        {status === 'ok' && '✓ 充足'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Control buttons */}
      <div className="control-section">
        <button
          className="btn-start-scheduling"
          onClick={handleStart}
          disabled={!isReady || isScheduling}
        >
          {isScheduling ? '排课中...' : '开始排课'}
        </button>

        {!isReady && (
          <div className="not-ready-hint">
            {students.length === 0 && <p>⚠️ 请先添加学生数据</p>}
            {teachers.length === 0 && <p>⚠️ 请先添加教师数据</p>}
          </div>
        )}
      </div>

      {/* Progress display */}
      {progress && (
        <div className="progress-section">
          <div className="progress-info">
            <span>{progress.message}</span>
            <span>{progress.current} / {progress.total}</span>
          </div>
          <div className="progress-bar">
            <div 
              className="progress-fill"
              style={{ width: `${(progress.current / progress.total) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="instructions-section">
        <h4>使用说明</h4>
        <ul>
          <li>系统将按学生剩余课时从少到多的顺序进行排课</li>
          <li>为每个学生寻找合适的教师和教室</li>
          <li>自动避免时间冲突</li>
          <li>排课完成后可在"排课结果"标签页查看</li>
          <li>支持手动拖拽调整课程时间</li>
        </ul>
      </div>
    </div>
  );
};

export default SchedulingControlPanel;
