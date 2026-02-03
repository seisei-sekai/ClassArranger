/**
 * Traditional Schedule Table - 传统课程表
 * 类似Excel的传统课程表布局
 */

import React from 'react';
import './TraditionalScheduleTable.css';

const TraditionalScheduleTable = ({ courses = [], students = [], teachers = [] }) => {
  // 时间段配置（9:00-21:00，每30分钟一个时间段）
  const timeSlots = [];
  for (let hour = 9; hour <= 20; hour++) {
    timeSlots.push(`${hour}:00`);
    if (hour < 20) {
      timeSlots.push(`${hour}:30`);
    }
  }
  timeSlots.push('21:00');

  // 星期配置
  const weekDays = [
    { label: '周一', value: 1 },
    { label: '周二', value: 2 },
    { label: '周三', value: 3 },
    { label: '周四', value: 4 },
    { label: '周五', value: 5 },
    { label: '周六', value: 6 },
    { label: '周日', value: 0 }
  ];

  /**
   * 将时间字符串转换为分钟数
   */
  const timeToMinutes = (timeStr) => {
    if (!timeStr) return 0;
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  };

  /**
   * 计算课程在单元格中的位置和高度
   */
  const getCourseStyle = (course, startHour) => {
    const startMinutes = timeToMinutes(course.timeSlot.start || course.startTime);
    const endMinutes = timeToMinutes(course.timeSlot.end || course.endTime);
    const slotStartMinutes = startHour * 60;
    
    // 计算相对于当前时间槽的偏移
    const offsetMinutes = startMinutes - slotStartMinutes;
    const durationMinutes = endMinutes - startMinutes;
    
    // 每30分钟占100%高度
    const top = (offsetMinutes / 30) * 100;
    const height = (durationMinutes / 30) * 100;
    
    return {
      top: `${top}%`,
      height: `${height}%`
    };
  };

  /**
   * 获取指定星期和时间段的课程
   */
  const getCoursesForSlot = (day, timeSlot) => {
    const [hours, minutes] = timeSlot.split(':').map(Number);
    const slotMinutes = hours * 60 + minutes;
    const nextSlotMinutes = slotMinutes + 30;
    
    return courses.filter(course => {
      if (!course.timeSlot) return false;
      
      const courseDay = course.timeSlot.day;
      const courseStart = timeToMinutes(course.timeSlot.start || course.startTime);
      const courseEnd = timeToMinutes(course.timeSlot.end || course.endTime);
      
      // 课程在这个星期，并且时间段有重叠
      return courseDay === day && 
             courseStart < nextSlotMinutes && 
             courseEnd > slotMinutes;
    });
  };

  /**
   * 获取课程颜色
   */
  const getCourseColor = (course) => {
    const colors = [
      '#4CAF50', '#2196F3', '#FF9800', '#9C27B0',
      '#F44336', '#00BCD4', '#FFC107', '#E91E63',
      '#3F51B5', '#009688', '#FF5722', '#673AB7'
    ];
    
    const studentId = course.student?.id || '';
    let hash = 0;
    for (let i = 0; i < studentId.length; i++) {
      hash = studentId.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    return colors[Math.abs(hash) % colors.length];
  };

  /**
   * 检查课程是否从这个时间槽开始
   */
  const courseStartsInSlot = (course, timeSlot) => {
    const [hours, minutes] = timeSlot.split(':').map(Number);
    const slotMinutes = hours * 60 + minutes;
    const courseStart = timeToMinutes(course.timeSlot.start || course.startTime);
    
    return Math.abs(courseStart - slotMinutes) < 5; // 5分钟容差
  };

  return (
    <div className="traditional-schedule-container">
      <div className="schedule-header">
        <h3>📅 课程表</h3>
        {courses.length > 0 && (
          <span className="course-count">共 {courses.length} 节课</span>
        )}
      </div>

      <div className="schedule-table-wrapper">
        <table className="schedule-table">
          <thead>
            <tr>
              <th className="time-column-header">时间</th>
              {weekDays.map(day => (
                <th key={day.value} className="day-column-header">
                  {day.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {timeSlots.map((timeSlot, index) => {
              // 只显示整点和半点的开始时间
              if (index === timeSlots.length - 1) return null; // 跳过最后一个（21:00作为结束时间）
              
              return (
                <tr key={timeSlot} className="time-row">
                  <td className="time-cell">
                    <div className="time-label">{timeSlot}</div>
                  </td>
                  {weekDays.map(day => {
                    const coursesInSlot = getCoursesForSlot(day.value, timeSlot);
                    const startingCourses = coursesInSlot.filter(c => courseStartsInSlot(c, timeSlot));
                    
                    return (
                      <td key={day.value} className="schedule-cell">
                        <div className="cell-content">
                          {startingCourses.map(course => {
                            const color = getCourseColor(course);
                            const style = getCourseStyle(course, parseInt(timeSlot.split(':')[0]));
                            
                            return (
                              <div
                                key={course.id}
                                className="course-block"
                                style={{
                                  backgroundColor: color,
                                  borderLeft: `4px solid ${color}`,
                                  ...style
                                }}
                                title={`${course.student?.name} - ${course.teacher?.name}\n${course.subject || ''}\n${course.classroom?.name || ''}`}
                              >
                                <div className="course-student">{course.student?.name}</div>
                                <div className="course-teacher">{course.teacher?.name}</div>
                                <div className="course-time">
                                  {course.timeSlot?.start || course.startTime} - {course.timeSlot?.end || course.endTime}
                                </div>
                                {course.subject && (
                                  <div className="course-subject">{course.subject}</div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {courses.length === 0 && (
        <div className="empty-schedule">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" style={{ opacity: 0.3 }}>
            <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2"/>
            <line x1="3" y1="9" x2="21" y2="9" stroke="currentColor" strokeWidth="2"/>
            <line x1="9" y1="4" x2="9" y2="22" stroke="currentColor" strokeWidth="2"/>
          </svg>
          <p>暂无排课</p>
          <small>点击"一键排课"生成课程表</small>
        </div>
      )}
    </div>
  );
};

export default TraditionalScheduleTable;
