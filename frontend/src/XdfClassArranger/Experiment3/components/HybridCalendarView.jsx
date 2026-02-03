/**
 * Hybrid Calendar View - Experiment3
 * 混合日历视图
 * 
 * Based on Experiment2's EnhancedCalendarView
 * Features: drag-drop, click-edit, filters, tooltips
 */

import React, { useState, useCallback } from 'react';
import { slotIndexToTime } from '../utils/constants.js';

const DAY_NAMES_FULL = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

// Helper function for overlap check
function timeSlotsOverlap(slot1, slot2) {
  if (slot1.day !== slot2.day) return false;
  return !(slot1.endSlot <= slot2.startSlot || slot2.endSlot <= slot1.startSlot);
}

const HybridCalendarView = ({
  courses,
  students,
  teachers,
  classrooms,
  granularity,
  filter,
  onFilterChange,
  onCourseUpdate,
  onCourseDelete
}) => {
  const [draggedCourse, setDraggedCourse] = useState(null);
  const [hoveredSlot, setHoveredSlot] = useState(null);
  const [selectedCourse, setSelectedCourse] = useState(null);

  const daysOfWeek = [1, 2, 3, 4, 5, 6, 0]; // Mon-Sun
  const startHour = 9;
  const endHour = 22;

  /**
   * Filter courses based on current filter
   */
  const filteredCourses = courses.filter(course => {
    if (filter.student && course.student.id !== filter.student) return false;
    if (filter.teacher && course.teacher.id !== filter.teacher) return false;
    if (filter.campus && course.student.campus !== filter.campus) return false;
    if (filter.subject && course.subject !== filter.subject) return false;
    return true;
  });

  /**
   * Get courses at a specific time slot
   */
  const getCoursesAtSlot = useCallback((day, slotIndex) => {
    return filteredCourses.filter(course => {
      if (!course.timeSlot) return false;
      
      return (
        course.timeSlot.day === day &&
        course.timeSlot.startSlot <= slotIndex &&
        course.timeSlot.endSlot > slotIndex
      );
    });
  }, [filteredCourses]);

  /**
   * Get color for a course
   */
  const getCourseColor = (course) => {
    const colors = [
      '#4CAF50', '#2196F3', '#FF9800', '#9C27B0',
      '#F44336', '#00BCD4', '#FFC107', '#E91E63',
      '#3F51B5', '#009688', '#FF5722', '#673AB7'
    ];
    
    // Consistent color per student
    const studentId = course.student?.id || '';
    let hash = 0;
    for (let i = 0; i < studentId.length; i++) {
      hash = studentId.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    return colors[Math.abs(hash) % colors.length];
  };

  /**
   * Handle drag start
   */
  const handleDragStart = (course, e) => {
    setDraggedCourse(course);
    e.dataTransfer.effectAllowed = 'move';
  };

  /**
   * Handle drag over (allow drop)
   */
  const handleDragOver = (day, slotIndex, e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setHoveredSlot({ day, slotIndex });
  };

  /**
   * Handle drop
   */
  const handleDrop = (day, slotIndex, e) => {
    e.preventDefault();
    
    if (!draggedCourse) return;

    const newTimeSlot = {
      ...draggedCourse.timeSlot,
      day: day,
      startSlot: slotIndex,
      endSlot: slotIndex + draggedCourse.timeSlot.duration
    };

    // Validate the new time slot
    const conflicts = validateMove(draggedCourse, newTimeSlot);
    
    if (conflicts.length > 0) {
      alert(`无法移动：\n${conflicts.map(c => c.message).join('\n')}`);
    } else {
      onCourseUpdate(draggedCourse.id, { timeSlot: newTimeSlot });
    }

    setDraggedCourse(null);
    setHoveredSlot(null);
  };

  /**
   * Validate if a course can be moved to a new time slot
   */
  const validateMove = (course, newTimeSlot) => {
    const conflicts = [];

    // Check if new time slot is valid
    if (newTimeSlot.endSlot > granularity.slotsPerDay) {
      conflicts.push({ message: '时间超出范围' });
      return conflicts;
    }

    // Check conflicts with other courses
    courses.forEach(otherCourse => {
      if (otherCourse.id === course.id) return;

      if (timeSlotsOverlap(newTimeSlot, otherCourse.timeSlot)) {
        // Teacher conflict
        if (otherCourse.teacher.id === course.teacher.id) {
          conflicts.push({
            message: `教师${course.teacher.name}时间冲突`
          });
        }
        
        // Student conflict
        if (otherCourse.student.id === course.student.id) {
          conflicts.push({
            message: `学生${course.student.name}时间冲突`
          });
        }
        
        // Classroom conflict
        if (otherCourse.classroom.id === course.classroom.id) {
          conflicts.push({
            message: `教室${course.classroom.name}时间冲突`
          });
        }
      }
    });

    return conflicts;
  };

  /**
   * Handle course click
   */
  const handleCourseClick = (course) => {
    setSelectedCourse(course);
  };

  /**
   * Close course dialog
   */
  const handleCloseDialog = () => {
    setSelectedCourse(null);
  };

  /**
   * Handle course delete from dialog
   */
  const handleDeleteCourse = () => {
    if (selectedCourse && confirm('确定要删除这节课吗？')) {
      onCourseDelete(selectedCourse.id);
      setSelectedCourse(null);
    }
  };

  /**
   * Render time labels
   */
  const renderTimeLabels = () => {
    const labels = [];
    for (let hour = startHour; hour <= endHour; hour++) {
      labels.push(
        <div key={hour} className="time-label">
          {String(hour).padStart(2, '0')}:00
        </div>
      );
    }
    return labels;
  };

  /**
   * Render a day column
   */
  const renderDayColumn = (dayIndex) => {
    const cells = [];
    const slotsPerHour = granularity.slotsPerHour;
    
    for (let hour = startHour; hour < endHour; hour++) {
      for (let slotInHour = 0; slotInHour < slotsPerHour; slotInHour++) {
        const slotIndex = (hour - startHour) * slotsPerHour + slotInHour;
        const coursesHere = getCoursesAtSlot(dayIndex, slotIndex);
        
        // Check if this is the start of a course
        const startingCourses = coursesHere.filter(
          c => c.timeSlot.startSlot === slotIndex
        );

        if (startingCourses.length > 0) {
          // Render course blocks
          startingCourses.forEach((course, idx) => {
            const color = getCourseColor(course);
            const heightInCells = course.timeSlot.duration;
            
            cells.push(
              <div
                key={`${dayIndex}-${slotIndex}-${idx}`}
                className="course-block"
                draggable={true}
                onDragStart={(e) => handleDragStart(course, e)}
                onClick={() => handleCourseClick(course)}
                style={{
                  backgroundColor: color,
                  height: `calc(${heightInCells} * var(--cell-height))`,
                  gridRow: `${slotIndex + 1} / span ${heightInCells}`
                }}
                title={`${course.student.name} - ${course.teacher.name}\n${course.subject}\n${course.timeSlot.start} - ${course.timeSlot.end}`}
              >
                <div className="course-content">
                  <div className="course-student">{course.student.name}</div>
                  <div className="course-teacher">{course.teacher.name}</div>
                  <div className="course-info">
                    <span>{course.subject}</span>
                    <span>{course.classroom.name}</span>
                  </div>
                </div>
              </div>
            );
          });
        } else if (coursesHere.length === 0) {
          // Empty cell (droppable)
          const isHovered = hoveredSlot && hoveredSlot.day === dayIndex && hoveredSlot.slotIndex === slotIndex;
          
          cells.push(
            <div
              key={`${dayIndex}-${slotIndex}-empty`}
              className={`calendar-cell empty ${isHovered ? 'hovered' : ''}`}
              onDragOver={(e) => handleDragOver(dayIndex, slotIndex, e)}
              onDrop={(e) => handleDrop(dayIndex, slotIndex, e)}
              style={{ gridRow: slotIndex + 1 }}
            />
          );
        }
      }
    }
    
    return cells;
  };

  return (
    <div className="enhanced-calendar-view">
      {/* Filters */}
      <div className="calendar-filters">
        <select
          className="filter-select"
          value={filter.campus || ''}
          onChange={(e) => onFilterChange({ ...filter, campus: e.target.value || null })}
        >
          <option value="">所有校区</option>
          {[...new Set(students.map(s => s.campus))].filter(Boolean).map(c => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        
        <select
          className="filter-select"
          value={filter.subject || ''}
          onChange={(e) => onFilterChange({ ...filter, subject: e.target.value || null })}
        >
          <option value="">所有科目</option>
          {[...new Set(students.map(s => s.subject))].filter(Boolean).map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        
        <select
          className="filter-select"
          value={filter.student || ''}
          onChange={(e) => onFilterChange({ ...filter, student: e.target.value || null })}
        >
          <option value="">所有学生</option>
          {students.map(s => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
        
        <select
          className="filter-select"
          value={filter.teacher || ''}
          onChange={(e) => onFilterChange({ ...filter, teacher: e.target.value || null })}
        >
          <option value="">所有教师</option>
          {teachers.map(t => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </select>
        
        {(filter.campus || filter.subject || filter.student || filter.teacher) && (
          <button
            className="btn-clear-filter"
            onClick={() => onFilterChange({ student: null, teacher: null, campus: null, subject: null })}
          >
            清除筛选
          </button>
        )}
      </div>

      {/* Calendar grid */}
      <div className="calendar-container">
        <div className="calendar-grid">
          {/* Time labels column */}
          <div className="time-column">
            <div className="day-header time-header"></div>
            {renderTimeLabels()}
          </div>
          
          {/* Day columns */}
          {daysOfWeek.map((dayIndex) => (
            <div key={dayIndex} className="day-column">
              <div className="day-header">
                {DAY_NAMES_FULL[dayIndex]}
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

      {/* Course detail dialog */}
      {selectedCourse && (
        <div className="course-dialog-overlay" onClick={handleCloseDialog}>
          <div className="course-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="dialog-header">
              <h3>课程详情</h3>
              <button className="btn-close" onClick={handleCloseDialog}>✕</button>
            </div>
            
            <div className="dialog-body">
              <div className="detail-section">
                <h4>学生信息</h4>
                <div className="detail-grid">
                  <div className="detail-item">
                    <span className="label">姓名:</span>
                    <span className="value">{selectedCourse.student.name}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">校区:</span>
                    <span className="value">{selectedCourse.student.campus}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">科目:</span>
                    <span className="value">{selectedCourse.subject}</span>
                  </div>
                  {selectedCourse.student.manager && (
                    <div className="detail-item">
                      <span className="label">学管:</span>
                      <span className="value">{selectedCourse.student.manager}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="detail-section">
                <h4>教师信息</h4>
                <div className="detail-grid">
                  <div className="detail-item">
                    <span className="label">姓名:</span>
                    <span className="value">{selectedCourse.teacher.name}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">时薪:</span>
                    <span className="value">¥{selectedCourse.teacher.hourlyRate}/小时</span>
                  </div>
                </div>
              </div>

              <div className="detail-section">
                <h4>教室信息</h4>
                <div className="detail-grid">
                  <div className="detail-item">
                    <span className="label">教室:</span>
                    <span className="value">{selectedCourse.classroom.name}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">校区:</span>
                    <span className="value">{selectedCourse.classroom.campus}</span>
                  </div>
                </div>
              </div>

              <div className="detail-section">
                <h4>时间信息</h4>
                <div className="detail-grid">
                  <div className="detail-item">
                    <span className="label">星期:</span>
                    <span className="value">{DAY_NAMES_FULL[selectedCourse.timeSlot.day]}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">时间:</span>
                    <span className="value">
                      {selectedCourse.timeSlot.start} - {selectedCourse.timeSlot.end}
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="label">循环:</span>
                    <span className="value">
                      {selectedCourse.isRecurring ? '是（每周重复）' : '否（单次）'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="dialog-footer">
              <button className="btn-delete-course" onClick={handleDeleteCourse}>
                删除课程
              </button>
              <button className="btn-cancel" onClick={handleCloseDialog}>
                关闭
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Empty state */}
      {filteredCourses.length === 0 && (
        <div className="calendar-empty">
          <p>暂无排课结果</p>
          <p className="empty-hint">
            {courses.length === 0 
              ? '请先进行排课'
              : '当前筛选条件下没有课程'}
          </p>
        </div>
      )}

      {/* Usage hints */}
      <div className="calendar-hints">
        <p><strong>提示：</strong></p>
        <ul>
          <li>拖拽课程块可以调整时间</li>
          <li>点击课程块查看详细信息</li>
          <li>使用上方筛选器过滤课程</li>
        </ul>
      </div>
    </div>
  );
};

export default HybridCalendarView;
