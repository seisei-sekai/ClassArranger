/**
 * Schedule Results Panel - Experiment3
 * 排课结果统计面板
 * 
 * Based on Experiment2's ResultsSummaryPanel
 */

import React from 'react';

const ScheduleResultsPanel = ({ results, students, teachers, classrooms }) => {
  // Use stats from results directly
  const stats = results.stats || {};
  
  // Calculate additional stats if needed
  const scheduledStudentIds = new Set((results.courses || []).map(c => c.student?.id).filter(Boolean));
  const activeTeacherIds = new Set((results.courses || []).map(c => c.teacher?.id).filter(Boolean));
  const usedClassroomIds = new Set((results.courses || []).map(c => c.classroom?.id).filter(Boolean));
  
  const enhancedStats = {
    totalCourses: (results.courses || []).length,
    totalStudents: students.length,
    scheduledStudents: scheduledStudentIds.size,
    unscheduledStudents: students.length - scheduledStudentIds.size,
    successRate: stats.successRate || (scheduledStudentIds.size / students.length * 100).toFixed(1),
    
    totalTeachers: teachers.length,
    activeTeachers: activeTeacherIds.size,
    teacherUtilization: (activeTeacherIds.size / teachers.length * 100).toFixed(1),
    
    totalClassrooms: classrooms.length,
    usedClassrooms: usedClassroomIds.size,
    classroomUtilization: (usedClassroomIds.size / classrooms.length * 100).toFixed(1),
    
    executionTime: stats.executionTime || 0
  };
  
  // Calculate day distribution
  const dayDistribution = [0, 0, 0, 0, 0, 0, 0];
  (results.courses || []).forEach(course => {
    if (course.timeSlot?.day !== undefined) {
      dayDistribution[course.timeSlot.day]++;
    }
  });

  return (
    <div className="results-summary-panel">
      <h3>排课结果统计</h3>
      
      {/* Main statistics */}
      <div className="summary-grid">
        <div className="summary-card primary">
          <div className="summary-icon">✓</div>
          <div className="summary-content">
            <div className="summary-value">{enhancedStats.scheduledStudents}</div>
            <div className="summary-label">成功排课学生</div>
          </div>
        </div>
        
        <div className="summary-card">
          <div className="summary-icon">✕</div>
          <div className="summary-content">
            <div className="summary-value">{enhancedStats.unscheduledStudents}</div>
            <div className="summary-label">未排课学生</div>
          </div>
        </div>
        
        <div className="summary-card">
          <div className="summary-icon">📊</div>
          <div className="summary-content">
            <div className="summary-value">{enhancedStats.successRate}%</div>
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
              {enhancedStats.activeTeachers}/{enhancedStats.totalTeachers} ({enhancedStats.teacherUtilization}%)
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
            const count = dayDistribution[dayNum] || 0;
            const maxCount = Math.max(...dayDistribution, 1);
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

export default ScheduleResultsPanel;
