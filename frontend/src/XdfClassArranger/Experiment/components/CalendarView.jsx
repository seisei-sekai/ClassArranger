/**
 * Calendar View Component
 * 日历视图组件
 * 
 * Visual weekly calendar with color-coded time blocks
 */

import React, { useMemo } from 'react';
import { 
  slotToTime, 
  formatTime, 
  DAY_NAMES,
  TIME_GRANULARITY 
} from '../utils/dataStructures.js';

const CalendarView = ({ 
  courses = [], 
  students = [],
  teachers = [],
  granularity = TIME_GRANULARITY.FIVE_MIN,
  showHeatmap = false 
}) => {
  const daysOfWeek = ['一', '二', '三', '四', '五', '六', '日'];
  const startHour = 9;
  const endHour = 22;
  const hoursToShow = endHour - startHour;

  /**
   * Calculate availability heatmap
   * 计算可用性热图
   */
  const availabilityHeatmap = useMemo(() => {
    if (!showHeatmap || students.length === 0) return {};
    
    const heatmap = {};
    
    students.forEach(student => {
      if (!student.constraints || !student.constraints.allowedTimeRanges) return;
      
      student.constraints.allowedTimeRanges.forEach(range => {
        const key = `${range.day}-${range.startSlot}`;
        heatmap[key] = (heatmap[key] || 0) + 1;
      });
    });
    
    // Normalize to 0-1 range
    const maxCount = Math.max(...Object.values(heatmap), 1);
    Object.keys(heatmap).forEach(key => {
      heatmap[key] = heatmap[key] / maxCount;
    });
    
    return heatmap;
  }, [students, showHeatmap]);

  /**
   * Get courses for a specific day and time slot
   * 获取特定日期和时间槽的课程
   */
  const getCoursesAtSlot = (day, slotIndex) => {
    return courses.filter(course => {
      if (!course.timeSlot) return false;
      
      return (
        course.timeSlot.day === day &&
        course.timeSlot.startSlot <= slotIndex &&
        course.timeSlot.endSlot > slotIndex
      );
    });
  };

  /**
   * Get color for a course
   * 为课程分配颜色
   */
  const getCourseColor = (course, index) => {
    const colors = [
      '#4CAF50', '#2196F3', '#FF9800', '#9C27B0',
      '#F44336', '#00BCD4', '#FFC107', '#E91E63',
      '#3F51B5', '#009688', '#FF5722', '#673AB7'
    ];
    
    // Use student ID hash for consistent colors
    const studentId = course.student?.id || '';
    let hash = 0;
    for (let i = 0; i < studentId.length; i++) {
      hash = studentId.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    return colors[Math.abs(hash) % colors.length];
  };

  /**
   * Get heatmap color intensity
   * 获取热图颜色强度
   */
  const getHeatmapColor = (day, slotIndex) => {
    const key = `${day}-${slotIndex}`;
    const intensity = availabilityHeatmap[key] || 0;
    
    if (intensity === 0) return 'transparent';
    
    // Blue heatmap (lighter for less overlap, darker for more)
    const alpha = 0.1 + intensity * 0.4;
    return `rgba(33, 150, 243, ${alpha})`;
  };

  /**
   * Render time labels
   * 渲染时间标签
   */
  const renderTimeLabels = () => {
    const labels = [];
    for (let hour = startHour; hour <= endHour; hour++) {
      labels.push(
        <div key={hour} className="time-label">
          {formatTime(hour, 0)}
        </div>
      );
    }
    return labels;
  };

  /**
   * Render a single day column
   * 渲染单日列
   */
  const renderDayColumn = (dayIndex) => {
    const cells = [];
    const slotsPerHour = granularity.slotsPerHour;
    
    for (let hour = startHour; hour < endHour; hour++) {
      for (let slotInHour = 0; slotInHour < slotsPerHour; slotInHour++) {
        const slotIndex = (hour - startHour) * slotsPerHour + slotInHour;
        const coursesHere = getCoursesAtSlot(dayIndex, slotIndex);
        
        // Check if this slot is the start of a course
        const startingCourses = coursesHere.filter(
          c => c.timeSlot.startSlot === slotIndex
        );

        if (startingCourses.length > 0) {
          // Render course block
          startingCourses.forEach((course, idx) => {
            const duration = course.timeSlot.endSlot - course.timeSlot.startSlot;
            const heightInCells = duration;
            const color = getCourseColor(course, idx);
            
            cells.push(
              <div
                key={`${dayIndex}-${slotIndex}-${idx}`}
                className="course-block"
                style={{
                  backgroundColor: color,
                  height: `calc(${heightInCells} * var(--cell-height))`,
                  gridRow: `${slotIndex + 1} / span ${heightInCells}`
                }}
                title={`${course.student?.name} - ${course.teacher?.name}\n${course.subject}`}
              >
                <div className="course-content">
                  <div className="course-student">{course.student?.name}</div>
                  <div className="course-teacher">{course.teacher?.name}</div>
                  <div className="course-subject">{course.subject}</div>
                  <div className="course-time">
                    {course.timeSlot.start} - {course.timeSlot.end}
                  </div>
                </div>
              </div>
            );
          });
        } else if (coursesHere.length === 0) {
          // Empty cell with optional heatmap
          const heatmapColor = showHeatmap ? getHeatmapColor(dayIndex, slotIndex) : 'transparent';
          
          cells.push(
            <div
              key={`${dayIndex}-${slotIndex}-empty`}
              className="calendar-cell empty"
              style={{
                backgroundColor: heatmapColor,
                gridRow: slotIndex + 1
              }}
            />
          );
        }
      }
    }
    
    return cells;
  };

  /**
   * Render statistics
   * 渲染统计信息
   */
  const renderStats = () => {
    const totalCourses = courses.length;
    const uniqueStudents = new Set(courses.map(c => c.student?.id)).size;
    const uniqueTeachers = new Set(courses.map(c => c.teacher?.id)).size;
    
    // Calculate time distribution
    const dayDistribution = [0, 0, 0, 0, 0, 0, 0];
    courses.forEach(course => {
      if (course.timeSlot) {
        dayDistribution[course.timeSlot.day]++;
      }
    });

    return (
      <div className="calendar-stats">
        <div className="stat-item">
          <span className="stat-label">总课程数</span>
          <span className="stat-value">{totalCourses}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">排课学生</span>
          <span className="stat-value">{uniqueStudents} / {students.length}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">授课教师</span>
          <span className="stat-value">{uniqueTeachers} / {teachers.length}</span>
        </div>
        <div className="stat-distribution">
          <span className="stat-label">周分布</span>
          <div className="distribution-bars">
            {dayDistribution.map((count, idx) => (
              <div key={idx} className="distribution-bar">
                <div 
                  className="bar-fill" 
                  style={{ 
                    height: `${(count / Math.max(...dayDistribution, 1)) * 100}%` 
                  }}
                />
                <span className="bar-label">{daysOfWeek[idx]}</span>
                <span className="bar-count">{count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="calendar-view">
      {renderStats()}
      
      <div className="calendar-container">
        <div className="calendar-grid">
          {/* Time labels column */}
          <div className="time-column">
            <div className="day-header time-header"></div>
            {renderTimeLabels()}
          </div>
          
          {/* Day columns */}
          {[1, 2, 3, 4, 5, 6, 0].map((dayIndex, colIndex) => (
            <div key={dayIndex} className="day-column">
              <div className="day-header">
                {daysOfWeek[colIndex]}
              </div>
              <div 
                className="day-cells"
                style={{
                  '--cell-height': '20px',
                  gridTemplateRows: `repeat(${(endHour - startHour) * granularity.slotsPerHour}, var(--cell-height))`
                }}
              >
                {renderDayColumn(dayIndex)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {showHeatmap && (
        <div className="heatmap-legend">
          <span className="legend-label">学生可用性热图：</span>
          <div className="legend-gradient">
            <span>低</span>
            <div className="gradient-bar"></div>
            <span>高</span>
          </div>
        </div>
      )}

      {courses.length === 0 && (
        <div className="calendar-empty">
          <p>暂无排课结果</p>
          <p className="empty-hint">请先生成数据并运行排课算法</p>
        </div>
      )}
    </div>
  );
};

export default CalendarView;
