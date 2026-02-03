import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useTestData } from '../TestDataContext';
import { useSchedule } from '../ScheduleContext';
import './FinalSchedule.css';

const FinalSchedule = () => {
  const { showTestData } = useTestData();
  const scheduleContext = useSchedule();
  const [viewMode, setViewMode] = useState('all'); // 'all', 'student', 'teacher', 'classroom'
  const [selectedFilter, setSelectedFilter] = useState(null);
  const [scheduleViewMode, setScheduleViewMode] = useState('traditional'); // 'traditional' or 'card'
  const [showExportMenu, setShowExportMenu] = useState(false);
  const exportMenuRef = useRef(null);

  // Close export menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target)) {
        setShowExportMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Get real scheduled courses from context, or fall back to test data
  const realScheduledCourses = useMemo(() => {
    return scheduleContext.scheduledCourses.map(course => {
      const dayNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
      return {
        id: course.id,
        studentId: course.student?.id,
        studentName: course.student?.name,
        teacherId: course.teacher?.id,
        teacherName: course.teacher?.name,
        classroomId: course.room?.id,
        classroomName: course.room?.name,
        campus: course.room?.campus,
        course: course.subject || '一般课程',
        dayOfWeek: dayNames[course.timeSlot?.day] || '未知',
        weekday: course.timeSlot?.day === 0 ? 7 : course.timeSlot?.day,
        startTime: course.timeSlot?.start || '00:00',
        endTime: course.timeSlot?.end || '00:00',
        duration: `${(course.timeSlot?.duration || 0) / 12}小时`,
        color: course.student?.color || '#5A6C7D'
      };
    });
  }, [scheduleContext.scheduledCourses]);

  // Use real data if available, otherwise use test data
  const scheduledCourses = (realScheduledCourses.length > 0 || !showTestData) ? realScheduledCourses : [
    {
      id: 1, studentId: 'S001', studentName: '张三', teacherId: 'T001', teacherName: '李老师',
      classroomId: 'R001', classroomName: '个别指导室1', campus: '旗舰校',
      course: '1v1大学面试练习', dayOfWeek: '周一', weekday: 1,
      startTime: '10:00', endTime: '12:00', duration: '2小时', color: '#FF3B30'
    },
    {
      id: 2, studentId: 'S002', studentName: '王五', teacherId: 'T002', teacherName: '赵老师',
      classroomId: 'R002', classroomName: '板二101', campus: '东京本校',
      course: '1v1志望理由书指导', dayOfWeek: '周三', weekday: 3,
      startTime: '14:00', endTime: '16:00', duration: '2小时', color: '#007AFF'
    },
    {
      id: 3, studentId: 'S003', studentName: '李四', teacherId: 'T003', teacherName: '孙老师',
      classroomId: 'R001', classroomName: '个别指导室1', campus: '旗舰校',
      course: '1v1EJU日语', dayOfWeek: '周二', weekday: 2,
      startTime: '09:00', endTime: '11:00', duration: '2小时', color: '#34C759'
    },
    {
      id: 4, studentId: 'S004', studentName: '赵六', teacherId: 'T001', teacherName: '李老师',
      classroomId: 'R003', classroomName: '个别指导室2', campus: '旗舰校',
      course: '1v1小论文辅导', dayOfWeek: '周五', weekday: 5,
      startTime: '15:00', endTime: '17:00', duration: '2小时', color: '#FF9500'
    },
    {
      id: 5, studentId: 'S001', studentName: '张三', teacherId: 'T002', teacherName: '赵老师',
      classroomId: 'R002', classroomName: '板二101', campus: '东京本校',
      course: '1v1志望理由书指导', dayOfWeek: '周四', weekday: 4,
      startTime: '16:00', endTime: '18:00', duration: '2小时', color: '#5856D6'
    },
    {
      id: 6, studentId: 'S003', studentName: '李四', teacherId: 'T001', teacherName: '李老师',
      classroomId: 'R003', classroomName: '个别指导室2', campus: '旗舰校',
      course: '1v1校内考准备', dayOfWeek: '周三', weekday: 3,
      startTime: '10:00', endTime: '12:00', duration: '2小时', color: '#AF52DE'
    }
  ];

  // Get unique students, teachers, and classrooms
  const students = useMemo(() => {
    const uniqueMap = new Map();
    scheduledCourses.forEach(course => {
      if (course.studentId && !uniqueMap.has(course.studentId)) {
        uniqueMap.set(course.studentId, { id: course.studentId, name: course.studentName });
      }
    });
    return Array.from(uniqueMap.values());
  }, [scheduledCourses]);

  const teachers = useMemo(() => {
    const allTeachers = scheduleContext.allTeachers.map(t => ({ id: t.id, name: t.name }));
    if (allTeachers.length === 0) {
      const uniqueMap = new Map();
      scheduledCourses.forEach(course => {
        if (course.teacherId && !uniqueMap.has(course.teacherId)) {
          uniqueMap.set(course.teacherId, { id: course.teacherId, name: course.teacherName });
        }
      });
      return Array.from(uniqueMap.values());
    }
    return allTeachers;
  }, [scheduleContext.allTeachers, scheduledCourses]);

  const classrooms = useMemo(() => {
    const allClassrooms = scheduleContext.allClassrooms.map(c => ({ id: c.id, name: c.name, campus: c.campus }));
    if (allClassrooms.length === 0) {
      const uniqueMap = new Map();
      scheduledCourses.forEach(course => {
        if (course.classroomId && !uniqueMap.has(course.classroomId)) {
          uniqueMap.set(course.classroomId, { id: course.classroomId, name: course.classroomName, campus: course.campus });
        }
      });
      return Array.from(uniqueMap.values());
    }
    return allClassrooms;
  }, [scheduleContext.allClassrooms, scheduledCourses]);

  // Filter courses based on view mode and selected filter
  const filteredCourses = useMemo(() => {
    if (viewMode === 'all' || !selectedFilter) {
      return scheduledCourses;
    }

    return scheduledCourses.filter(course => {
      switch (viewMode) {
        case 'student':
          return course.studentId === selectedFilter;
        case 'teacher':
          return course.teacherId === selectedFilter;
        case 'classroom':
          return course.classroomId === selectedFilter;
        default:
          return true;
      }
    });
  }, [scheduledCourses, viewMode, selectedFilter]);

  // Group courses by weekday
  const groupedCourses = useMemo(() => {
    const grouped = { 1: [], 2: [], 3: [], 4: [], 5: [], 6: [], 7: [] };
    filteredCourses.forEach(course => {
      grouped[course.weekday].push(course);
    });
    Object.keys(grouped).forEach(day => {
      grouped[day].sort((a, b) => a.startTime.localeCompare(b.startTime));
    });
    return grouped;
  }, [filteredCourses]);

  // Week days configuration
  const weekDays = [
    { id: 1, name: '周一', engName: 'MON' },
    { id: 2, name: '周二', engName: 'TUE' },
    { id: 3, name: '周三', engName: 'WED' },
    { id: 4, name: '周四', engName: 'THU' },
    { id: 5, name: '周五', engName: 'FRI' },
    { id: 6, name: '周六', engName: 'SAT' },
    { id: 7, name: '周日', engName: 'SUN' }
  ];

  // Auto-calculate optimal time range
  const timeRange = useMemo(() => {
    if (filteredCourses.length === 0) return { start: 9, end: 21 };

    const timeToMinutes = (timeStr) => {
      const [hours, minutes] = timeStr.split(':').map(Number);
      return hours * 60 + minutes;
    };

    const times = filteredCourses.flatMap(c => [
      timeToMinutes(c.startTime),
      timeToMinutes(c.endTime)
    ]);

    const minTime = Math.min(...times);
    const maxTime = Math.max(...times);

    const startHour = Math.max(0, Math.floor(minTime / 60) - 1);
    const endHour = Math.min(24, Math.ceil(maxTime / 60) + 1);

    return { start: startHour, end: endHour };
  }, [filteredCourses]);

  // Generate time slots based on optimal range
  const timeSlots = useMemo(() => {
    const slots = [];
    for (let hour = timeRange.start; hour < timeRange.end; hour++) {
      slots.push(`${String(hour).padStart(2, '0')}:00`);
      if (hour < timeRange.end - 1) {
        slots.push(`${String(hour).padStart(2, '0')}:30`);
      }
    }
    slots.push(`${String(timeRange.end).padStart(2, '0')}:00`);
    return slots;
  }, [timeRange]);

  // Time utilities
  const timeToMinutes = (timeStr) => {
    if (!timeStr) return 0;
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  };

  const getCoursesForSlot = (dayId, timeSlot, nextTimeSlot) => {
    const slotMinutes = timeToMinutes(timeSlot);
    const nextSlotMinutes = timeToMinutes(nextTimeSlot);
    
    return filteredCourses.filter(course => {
      const courseStart = timeToMinutes(course.startTime);
      const courseEnd = timeToMinutes(course.endTime);
      return course.weekday === dayId && courseStart < nextSlotMinutes && courseEnd > slotMinutes;
    });
  };

  const courseStartsInSlot = (course, timeSlot) => {
    return Math.abs(timeToMinutes(course.startTime) - timeToMinutes(timeSlot)) < 5;
  };

  const getCourseRowSpan = (course) => {
    const durationMinutes = timeToMinutes(course.endTime) - timeToMinutes(course.startTime);
    return Math.ceil(durationMinutes / 30);
  };

  // Export functions
  const exportToMarkdown = () => {
    const title = viewMode === 'all' 
      ? '最终课表 - 全部'
      : `最终课表 - ${getSelectedItemName()}`;

    let md = `# ${title}\n\n`;
    md += `**生成时间**: ${new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Tokyo' })} (东京时间)\n\n`;
    md += `**视图模式**: ${viewMode === 'all' ? '全部' : viewMode === 'student' ? '学生' : viewMode === 'teacher' ? '老师' : '教室'}\n\n`;
    md += `**课程总数**: ${filteredCourses.length}节\n\n`;
    md += '---\n\n';

    weekDays.forEach(day => {
      if (groupedCourses[day.id].length > 0) {
        md += `## ${day.name} (${day.engName})\n\n`;
        groupedCourses[day.id].forEach(course => {
          md += `### ${course.startTime}-${course.endTime}\n\n`;
          md += `- **课程**: ${course.course}\n`;
          if (viewMode !== 'student') md += `- **学生**: ${course.studentName}\n`;
          if (viewMode !== 'teacher') md += `- **老师**: ${course.teacherName}\n`;
          if (viewMode !== 'classroom') md += `- **教室**: ${course.classroomName}\n`;
          md += `- **校区**: ${course.campus}\n`;
          md += `- **时长**: ${course.duration}\n\n`;
        });
      }
    });

    downloadFile(md, `${title}.md`, 'text/markdown');
  };

  const exportToCSV = () => {
    const title = viewMode === 'all' 
      ? '最终课表-全部'
      : `最终课表-${getSelectedItemName()}`;

    let csv = '星期,开始时间,结束时间,学生,老师,课程,教室,校区,时长\n';
    
    weekDays.forEach(day => {
      groupedCourses[day.id].forEach(course => {
        csv += `${day.name},${course.startTime},${course.endTime},${course.studentName},${course.teacherName},${course.course},${course.classroomName},${course.campus},${course.duration}\n`;
      });
    });

    downloadFile(csv, `${title}.csv`, 'text/csv');
  };

  const exportToText = () => {
    const title = viewMode === 'all' 
      ? '最终课表 - 全部'
      : `最终课表 - ${getSelectedItemName()}`;

    let text = `${title}\n`;
    text += `${'='.repeat(title.length)}\n\n`;
    
    weekDays.forEach(day => {
      if (groupedCourses[day.id].length > 0) {
        text += `${day.name} (${day.engName}):\n`;
        text += '-'.repeat(50) + '\n';
        groupedCourses[day.id].forEach(course => {
          text += `  ${course.startTime}-${course.endTime} | ${course.course}\n`;
          if (viewMode !== 'student') text += `    学生: ${course.studentName}\n`;
          if (viewMode !== 'teacher') text += `    老师: ${course.teacherName}\n`;
          if (viewMode !== 'classroom') text += `    教室: ${course.classroomName}\n`;
          text += `    校区: ${course.campus}\n`;
          text += '\n';
        });
        text += '\n';
      }
    });

    downloadFile(text, `${title}.txt`, 'text/plain');
  };

  const downloadFile = (content, filename, mimeType) => {
    const blob = new Blob([content], { type: `${mimeType};charset=utf-8` });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const getSelectedItemName = () => {
    if (!selectedFilter) return '';
    
    let list = [];
    switch (viewMode) {
      case 'student':
        list = students;
        break;
      case 'teacher':
        list = teachers;
        break;
      case 'classroom':
        list = classrooms;
        break;
      default:
        return '';
    }
    
    const item = list.find(i => i.id === selectedFilter);
    return item ? item.name : '';
  };

  // Get filter list based on current view mode
  const getFilterList = () => {
    switch (viewMode) {
      case 'student':
        return students;
      case 'teacher':
        return teachers;
      case 'classroom':
        return classrooms;
      default:
        return [];
    }
  };

  const filterList = getFilterList();

  return (
    <div className="final-schedule-container">
      {/* Compact Page Header */}
      <div className="page-header">
        <div className="header-left">
          <h1 className="page-title">最终课表</h1>
          <p className="page-subtitle">紧凑显示，一屏呈现所有课程</p>
        </div>
        <div className="header-right">
          <div className="view-toggle">
            <button
              className={`toggle-btn ${scheduleViewMode === 'traditional' ? 'active' : ''}`}
              onClick={() => setScheduleViewMode('traditional')}
            >
              表格
            </button>
            <button
              className={`toggle-btn ${scheduleViewMode === 'card' ? 'active' : ''}`}
              onClick={() => setScheduleViewMode('card')}
            >
              卡片
            </button>
          </div>
          <div className="export-btn-group" ref={exportMenuRef}>
            <button 
              className="export-btn"
              onClick={() => setShowExportMenu(!showExportMenu)}
              disabled={filteredCourses.length === 0}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" 
                  stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              导出
            </button>
            {showExportMenu && (
              <div className="export-menu">
                <button className="export-menu-item" onClick={() => { exportToMarkdown(); setShowExportMenu(false); }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" 
                      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Markdown
                </button>
                <button className="export-menu-item" onClick={() => { exportToCSV(); setShowExportMenu(false); }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" 
                      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  CSV
                </button>
                <button className="export-menu-item" onClick={() => { exportToText(); setShowExportMenu(false); }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" 
                      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  文本
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tab-style Filters */}
      <div className="filter-tabs-container">
        <div className="filter-tabs">
          <button
            className={`tab ${viewMode === 'all' ? 'active' : ''}`}
            onClick={() => {
              setViewMode('all');
              setSelectedFilter(null);
            }}
          >
            全部 ({scheduledCourses.length})
          </button>
          <button
            className={`tab ${viewMode === 'student' ? 'active' : ''}`}
            onClick={() => {
              setViewMode('student');
              setSelectedFilter(null);
            }}
          >
            学生 ({students.length})
          </button>
          <button
            className={`tab ${viewMode === 'teacher' ? 'active' : ''}`}
            onClick={() => {
              setViewMode('teacher');
              setSelectedFilter(null);
            }}
          >
            老师 ({teachers.length})
          </button>
          <button
            className={`tab ${viewMode === 'classroom' ? 'active' : ''}`}
            onClick={() => {
              setViewMode('classroom');
              setSelectedFilter(null);
            }}
          >
            教室 ({classrooms.length})
          </button>
        </div>
      </div>

      {/* Sub-filters (when not 'all' mode) */}
      {viewMode !== 'all' && filterList.length > 0 && (
        <div className="sub-filters-container">
          <div className="sub-filters">
            {filterList.map(item => {
              const courseCount = scheduledCourses.filter(course => {
                switch (viewMode) {
                  case 'student':
                    return course.studentId === item.id;
                  case 'teacher':
                    return course.teacherId === item.id;
                  case 'classroom':
                    return course.classroomId === item.id;
                  default:
                    return false;
                }
              }).length;

              return (
                <button
                  key={item.id}
                  className={`chip ${selectedFilter === item.id ? 'active' : ''}`}
                  onClick={() => setSelectedFilter(selectedFilter === item.id ? null : item.id)}
                >
                  <span>{item.name}</span>
                  <span className="count">{courseCount}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Schedule Display Area */}
      <div className="schedule-main">
        {scheduledCourses.length === 0 ? (
          <div className="empty-state">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
              <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2"/>
              <line x1="3" y1="9" x2="21" y2="9" stroke="currentColor" strokeWidth="2"/>
              <line x1="8" y1="4" x2="8" y2="9" stroke="currentColor" strokeWidth="2"/>
              <line x1="16" y1="4" x2="16" y2="9" stroke="currentColor" strokeWidth="2"/>
            </svg>
            <p className="empty-text">暂无课表数据</p>
            <p className="empty-hint">请前往排课页面安排课程</p>
          </div>
        ) : filteredCourses.length === 0 ? (
          <div className="empty-state">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
              <path d="M12 8v4M12 16h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            <p className="empty-text">未找到相关课程</p>
            <p className="empty-hint">请尝试切换其他筛选条件</p>
          </div>
        ) : scheduleViewMode === 'traditional' ? (
          /* Traditional Table View */
          <div className="traditional-table-wrapper">
            <table className="traditional-schedule-table">
              <thead>
                <tr>
                  <th className="time-col-header">时间</th>
                  {weekDays.map(day => (
                    <th key={day.id} className="day-col-header">
                      <div className="day-header-content">
                        <div className="day-name">{day.name}</div>
                        <div className="day-eng">{day.engName}</div>
                        <div className="day-count">{groupedCourses[day.id].length}</div>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {timeSlots.slice(0, -1).map((timeSlot, index) => {
                  const nextTimeSlot = timeSlots[index + 1];
                  return (
                    <tr key={timeSlot} className="time-row">
                      <td className="time-cell">
                        <div className="time-label">{timeSlot}</div>
                      </td>
                      {weekDays.map(day => {
                        const coursesInSlot = getCoursesForSlot(day.id, timeSlot, nextTimeSlot);
                        const startingCourses = coursesInSlot.filter(c => courseStartsInSlot(c, timeSlot));
                        
                        return (
                          <td key={day.id} className="schedule-cell">
                            <div className="cell-content">
                              {startingCourses.map(course => {
                                const rowSpan = getCourseRowSpan(course);
                                return (
                                  <div
                                    key={course.id}
                                    className="course-block"
                                    style={{
                                      backgroundColor: course.color,
                                      borderLeft: `2px solid ${course.color}`,
                                      height: `${rowSpan * 14}px`
                                    }}
                                    title={`${course.studentName} - ${course.teacherName}\n${course.course}\n${course.classroomName}\n${course.campus}`}
                                  >
                                    <div className="course-info">
                                      <div className="course-time-small">
                                        {course.startTime}-{course.endTime}
                                      </div>
                                      {viewMode !== 'student' && (
                                        <div className="course-student-name">{course.studentName}</div>
                                      )}
                                      {viewMode !== 'teacher' && (
                                        <div className="course-teacher-name">{course.teacherName}</div>
                                      )}
                                      <div className="course-subject">{course.course}</div>
                                      {viewMode !== 'classroom' && (
                                        <div className="course-room">{course.classroomName}</div>
                                      )}
                                    </div>
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
        ) : (
          /* Card View */
          <div className="weekly-schedule">
            {weekDays.map(day => (
              <div key={day.id} className="day-column">
                <div className="day-header">
                  <div className="day-name">{day.name}</div>
                  <div className="day-eng">{day.engName}</div>
                  <div className="day-count">{groupedCourses[day.id].length}</div>
                </div>
                <div className="day-courses">
                  {groupedCourses[day.id].length === 0 ? (
                    <div className="no-course">
                      <span>无课程</span>
                    </div>
                  ) : (
                    groupedCourses[day.id].map(course => (
                      <div 
                        key={course.id} 
                        className="course-card"
                        style={{ borderLeftColor: course.color }}
                        title={`${course.studentName} - ${course.teacherName}\n${course.course}\n${course.classroomName}\n${course.campus}`}
                      >
                        <div className="course-time">
                          {course.startTime}-{course.endTime}
                        </div>
                        <div className="course-title">{course.course}</div>
                        <div className="course-details">
                          {viewMode !== 'student' && (
                            <div className="detail-item">
                              <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
                                <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="2"/>
                                <path d="M5 20C5 16.134 8.13401 13 12 13C15.866 13 19 16.134 19 20" 
                                  stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                              </svg>
                              <span>{course.studentName}</span>
                            </div>
                          )}
                          {viewMode !== 'teacher' && (
                            <div className="detail-item">
                              <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
                                <path d="M12 2a10 10 0 100 20 10 10 0 000-20z" stroke="currentColor" strokeWidth="2"/>
                                <path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                              </svg>
                              <span>{course.teacherName}</span>
                            </div>
                          )}
                          {viewMode !== 'classroom' && (
                            <div className="detail-item">
                              <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
                                <rect x="3" y="4" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="2"/>
                                <line x1="3" y1="10" x2="21" y2="10" stroke="currentColor" strokeWidth="2"/>
                              </svg>
                              <span>{course.classroomName}</span>
                            </div>
                          )}
                          <div className="detail-item campus">
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
                              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" stroke="currentColor" strokeWidth="2"/>
                              <circle cx="12" cy="10" r="3" stroke="currentColor" strokeWidth="2"/>
                            </svg>
                            <span>{course.campus}</span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default FinalSchedule;
