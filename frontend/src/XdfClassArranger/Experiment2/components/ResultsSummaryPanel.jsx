/**
 * Results Summary Panel - Experiment2
 * 结果统计面板
 */

import React from 'react';
import { calculateScheduleStats } from '../utils/validationRules.js';

const ResultsSummaryPanel = ({ results, students, teachers, classrooms }) => {
  const stats = calculateScheduleStats(results.courses, students, teachers, classrooms);

  return (
    <div className="results-summary-panel">
      <h3>排课结果统计</h3>
      
      {/* Main statistics */}
      <div className="summary-grid">
        <div className="summary-card primary">
          <div className="summary-icon">✓</div>
          <div className="summary-content">
            <div className="summary-value">{stats.scheduledStudents}</div>
            <div className="summary-label">成功排课学生</div>
          </div>
        </div>
        
        <div className="summary-card">
          <div className="summary-icon">✕</div>
          <div className="summary-content">
            <div className="summary-value">{stats.unscheduledStudents}</div>
            <div className="summary-label">未排课学生</div>
          </div>
        </div>
        
        <div className="summary-card">
          <div className="summary-icon">📊</div>
          <div className="summary-content">
            <div className="summary-value">{stats.successRate}%</div>
            <div className="summary-label">成功率</div>
          </div>
        </div>
        
        <div className="summary-card">
          <div className="summary-icon">⏱</div>
          <div className="summary-content">
            <div className="summary-value">{results.stats.executionTime}ms</div>
            <div className="summary-label">执行时间</div>
          </div>
        </div>
      </div>

      {/* Resource utilization */}
      <div className="utilization-section">
        <h4>资源利用率</h4>
        <div className="utilization-grid">
          <div className="util-card">
            <div className="util-label">教师利用率</div>
            <div className="util-bar">
              <div 
                className="util-fill teachers"
                style={{ width: `${stats.teacherUtilization}%` }}
              />
            </div>
            <div className="util-value">
              {stats.activeTeachers}/{stats.totalTeachers} ({stats.teacherUtilization}%)
            </div>
          </div>
          
          <div className="util-card">
            <div className="util-label">教室利用率</div>
            <div className="util-bar">
              <div 
                className="util-fill classrooms"
                style={{ width: `${stats.classroomUtilization}%` }}
              />
            </div>
            <div className="util-value">
              {stats.usedClassrooms}/{stats.totalClassrooms} ({stats.classroomUtilization}%)
            </div>
          </div>
        </div>
      </div>

      {/* Day distribution */}
      <div className="distribution-section">
        <h4>每日课程分布</h4>
        <div className="distribution-chart">
          {['一', '二', '三', '四', '五', '六', '日'].map((day, idx) => {
            const dayNum = idx === 6 ? 0 : idx + 1;
            const count = stats.dayDistribution[dayNum] || 0;
            const maxCount = Math.max(...stats.dayDistribution, 1);
            const percentage = (count / maxCount) * 100;
            
            return (
              <div key={dayNum} className="distribution-bar">
                <div 
                  className="bar-fill"
                  style={{ height: `${percentage}%` }}
                />
                <div className="bar-label">周{day}</div>
                <div className="bar-count">{count}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Conflicts list */}
      {results.conflicts && results.conflicts.length > 0 && (
        <div className="conflicts-section">
          <h4>排课冲突 ({results.conflicts.length})</h4>
          <div className="conflicts-list">
            {results.conflicts.slice(0, 5).map((conflict, idx) => (
              <div key={idx} className="conflict-item">
                <span className="conflict-student">{conflict.student.name}</span>
                <span className="conflict-reason">{conflict.reason}</span>
              </div>
            ))}
            {results.conflicts.length > 5 && (
              <div className="conflicts-more">
                还有 {results.conflicts.length - 5} 个冲突...
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ResultsSummaryPanel;
