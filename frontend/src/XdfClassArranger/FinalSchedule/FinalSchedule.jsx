import React, { useState, useMemo } from 'react';
import { useTestData } from '../TestDataContext';
import { useSchedule } from '../ScheduleContext';
import './FinalSchedule.css';

const FinalSchedule = () => {
  const { showTestData } = useTestData();
  const scheduleContext = useSchedule();
  const [viewMode, setViewMode] = useState('student'); // 'student', 'teacher', 'classroom'
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [selectedItem, setSelectedItem] = useState(null);

  // Get real scheduled courses from context, or fall back to test data
  // 从上下文获取真实排课数据，或回退到测试数据
  const realScheduledCourses = useMemo(() => {
    return scheduleContext.scheduledCourses.map(course => {
      // Transform course data to match expected format
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
        weekday: course.timeSlot?.day === 0 ? 7 : course.timeSlot?.day, // Convert Sunday from 0 to 7
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
      id: 1,
      studentId: 'S001',
      studentName: '张三',
      teacherId: 'T001',
      teacherName: '李老师',
      classroomId: 'R001',
      classroomName: '个别指导室1',
      campus: '旗舰校',
      course: '1v1大学面试练习',
      dayOfWeek: '周一',
      weekday: 1,
      startTime: '10:00',
      endTime: '12:00',
      duration: '2小时',
      color: '#FF3B30'
    },
    {
      id: 2,
      studentId: 'S002',
      studentName: '王五',
      teacherId: 'T002',
      teacherName: '赵老师',
      classroomId: 'R002',
      classroomName: '板二101',
      campus: '东京本校',
      course: '1v1志望理由书指导',
      dayOfWeek: '周三',
      weekday: 3,
      startTime: '14:00',
      endTime: '16:00',
      duration: '2小时',
      color: '#007AFF'
    },
    {
      id: 3,
      studentId: 'S003',
      studentName: '李四',
      teacherId: 'T003',
      teacherName: '孙老师',
      classroomId: 'R001',
      classroomName: '个别指导室1',
      campus: '旗舰校',
      course: '1v1EJU日语',
      dayOfWeek: '周二',
      weekday: 2,
      startTime: '09:00',
      endTime: '11:00',
      duration: '2小时',
      color: '#34C759'
    },
    {
      id: 4,
      studentId: 'S004',
      studentName: '赵六',
      teacherId: 'T001',
      teacherName: '李老师',
      classroomId: 'R003',
      classroomName: '个别指导室2',
      campus: '旗舰校',
      course: '1v1小论文辅导',
      dayOfWeek: '周五',
      weekday: 5,
      startTime: '15:00',
      endTime: '17:00',
      duration: '2小时',
      color: '#FF9500'
    },
    {
      id: 5,
      studentId: 'S001',
      studentName: '张三',
      teacherId: 'T002',
      teacherName: '赵老师',
      classroomId: 'R002',
      classroomName: '板二101',
      campus: '东京本校',
      course: '1v1志望理由书指导',
      dayOfWeek: '周四',
      weekday: 4,
      startTime: '16:00',
      endTime: '18:00',
      duration: '2小时',
      color: '#5856D6'
    },
    {
      id: 6,
      studentId: 'S003',
      studentName: '李四',
      teacherId: 'T001',
      teacherName: '李老师',
      classroomId: 'R003',
      classroomName: '个别指导室2',
      campus: '旗舰校',
      course: '1v1校内考准备',
      dayOfWeek: '周三',
      weekday: 3,
      startTime: '10:00',
      endTime: '12:00',
      duration: '2小时',
      color: '#AF52DE'
    }
  ];

  // Get unique students, teachers, and classrooms (获取唯一的学生、老师和教室列表)
  const students = useMemo(() => {
    // Only show students with scheduled courses
    const uniqueMap = new Map();
    scheduledCourses.forEach(course => {
      const id = course.studentId;
      const name = course.studentName;
      if (id && !uniqueMap.has(id)) {
        uniqueMap.set(id, { id, name });
      }
    });
    return Array.from(uniqueMap.values());
  }, [scheduledCourses]);

  // Get all teachers from context (including those without courses)
  const teachers = useMemo(() => {
    const allTeachers = scheduleContext.allTeachers.map(t => ({
      id: t.id,
      name: t.name
    }));
    
    // If no teachers in context, get from scheduled courses
    if (allTeachers.length === 0) {
      const uniqueMap = new Map();
      scheduledCourses.forEach(course => {
        const id = course.teacherId;
        const name = course.teacherName;
        if (id && !uniqueMap.has(id)) {
          uniqueMap.set(id, { id, name });
        }
      });
      return Array.from(uniqueMap.values());
    }
    
    return allTeachers;
  }, [scheduleContext.allTeachers, scheduledCourses]);

  // Get all classrooms from context (including those without courses)
  const classrooms = useMemo(() => {
    const allClassrooms = scheduleContext.allClassrooms.map(c => ({
      id: c.id,
      name: c.name,
      campus: c.campus
    }));
    
    // If no classrooms in context, get from scheduled courses
    if (allClassrooms.length === 0) {
      const uniqueMap = new Map();
      scheduledCourses.forEach(course => {
        const id = course.classroomId;
        const name = course.classroomName;
        if (id && !uniqueMap.has(id)) {
          uniqueMap.set(id, { id, name, campus: course.campus });
        }
      });
      return Array.from(uniqueMap.values());
    }
    
    return allClassrooms;
  }, [scheduleContext.allClassrooms, scheduledCourses]);

  // Filter courses based on view mode and selected filter (根据视图模式和选择的筛选器过滤课程)
  const getFilteredCourses = () => {
    if (selectedFilter === 'all') {
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
  };

  const filteredCourses = getFilteredCourses();

  // Group courses by weekday (按星期分组课程)
  const groupCoursesByWeekday = (courses) => {
    const grouped = {
      1: [], // Monday
      2: [], // Tuesday
      3: [], // Wednesday
      4: [], // Thursday
      5: [], // Friday
      6: [], // Saturday
      7: []  // Sunday
    };

    courses.forEach(course => {
      grouped[course.weekday].push(course);
    });

    // Sort by start time within each day (每天内按开始时间排序)
    Object.keys(grouped).forEach(day => {
      grouped[day].sort((a, b) => a.startTime.localeCompare(b.startTime));
    });

    return grouped;
  };

  const groupedCourses = groupCoursesByWeekday(filteredCourses);
  const weekDays = [
    { id: 1, name: '周一', engName: 'MON' },
    { id: 2, name: '周二', engName: 'TUE' },
    { id: 3, name: '周三', engName: 'WED' },
    { id: 4, name: '周四', engName: 'THU' },
    { id: 5, name: '周五', engName: 'FRI' },
    { id: 6, name: '周六', engName: 'SAT' },
    { id: 7, name: '周日', engName: 'SUN' }
  ];

  // Export schedule function (导出课表功能)
  const handleExport = () => {
    let exportData = '';
    const title = selectedFilter === 'all' 
      ? `全部${viewMode === 'student' ? '学生' : viewMode === 'teacher' ? '老师' : '教室'}课表`
      : `${selectedItem?.name || ''} 的课表`;

    exportData += `${title}\n\n`;
    
    weekDays.forEach(day => {
      if (groupedCourses[day.id].length > 0) {
        exportData += `${day.name}:\n`;
        groupedCourses[day.id].forEach(course => {
          exportData += `  ${course.startTime}-${course.endTime} | ${course.course}\n`;
          if (viewMode !== 'student') exportData += `    学生: ${course.studentName}\n`;
          if (viewMode !== 'teacher') exportData += `    老师: ${course.teacherName}\n`;
          if (viewMode !== 'classroom') exportData += `    教室: ${course.classroomName}\n`;
          exportData += `    校区: ${course.campus}\n`;
        });
        exportData += '\n';
      }
    });

    // Create and download file (创建并下载文件)
    const blob = new Blob([exportData], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${title}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // View mode configurations (视图模式配置)
  const viewModes = [
    {
      id: 'student',
      name: '学生模式',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="2"/>
          <path d="M5 20C5 16.134 8.13401 13 12 13C15.866 13 19 16.134 19 20" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      ),
      list: students,
      description: '查看每个学生匹配好的老师和教室的课表'
    },
    {
      id: 'teacher',
      name: '老师模式',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path d="M12 2a10 10 0 100 20 10 10 0 000-20z" stroke="currentColor" strokeWidth="2"/>
          <path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      ),
      list: teachers,
      description: '查看每个老师匹配好的学生和教室的课表'
    },
    {
      id: 'classroom',
      name: '教室模式',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <rect x="3" y="4" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="2"/>
          <line x1="3" y1="10" x2="21" y2="10" stroke="currentColor" strokeWidth="2"/>
          <rect x="8" y="13" width="8" height="3" stroke="currentColor" strokeWidth="2"/>
        </svg>
      ),
      list: classrooms,
      description: '查看每个教室匹配好的老师和学生的课表'
    }
  ];

  const currentViewMode = viewModes.find(mode => mode.id === viewMode);

  return (
    <div className="final-schedule-container">
      {/* Page Header (页面头部) */}
      <div className="page-header">
        <div className="header-left">
          <h1 className="page-title">最终课表</h1>
          <p className="page-subtitle">查看所有已排课程的课表，支持多种视角导出</p>
        </div>
        <div className="header-right">
          <button 
            className="export-btn"
            onClick={handleExport}
            disabled={filteredCourses.length === 0}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            导出课表
          </button>
        </div>
      </div>

      {/* View Mode Selector (视图模式选择器) */}
      <div className="view-mode-selector">
        {viewModes.map(mode => (
          <button
            key={mode.id}
            className={`mode-card ${viewMode === mode.id ? 'active' : ''}`}
            onClick={() => {
              setViewMode(mode.id);
              setSelectedFilter('all');
              setSelectedItem(null);
            }}
          >
            <div className="mode-icon">{mode.icon}</div>
            <div className="mode-content">
              <div className="mode-name">{mode.name}</div>
              <div className="mode-description">{mode.description}</div>
            </div>
            {viewMode === mode.id && (
              <div className="mode-indicator">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            )}
          </button>
        ))}
      </div>

      {/* Main Content (主要内容) */}
      <div className="schedule-content">
        {/* Filter Sidebar (筛选侧边栏) */}
        <div className="filter-sidebar">
          <div className="filter-header">
            <h3 className="filter-title">筛选</h3>
            <span className="filter-count">{currentViewMode?.list.length || 0}</span>
          </div>
          
          <div className="filter-list">
            <button
              className={`filter-item ${selectedFilter === 'all' ? 'active' : ''}`}
              onClick={() => {
                setSelectedFilter('all');
                setSelectedItem(null);
              }}
            >
              <span className="filter-name">全部</span>
              <span className="filter-badge">{scheduledCourses.length}</span>
            </button>
            
            {currentViewMode?.list.map(item => {
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
                  className={`filter-item ${selectedFilter === item.id ? 'active' : ''}`}
                  onClick={() => {
                    setSelectedFilter(item.id);
                    setSelectedItem(item);
                  }}
                >
                  <span className="filter-name">{item.name}</span>
                  <span className="filter-badge">{courseCount}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Weekly Schedule View (周视图课表) */}
        <div className="schedule-main">
          {scheduledCourses.length === 0 ? (
            <div className="empty-state">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" style={{opacity: 0.3}}>
                <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2"/>
                <line x1="3" y1="9" x2="21" y2="9" stroke="currentColor" strokeWidth="2"/>
                <line x1="8" y1="4" x2="8" y2="9" stroke="currentColor" strokeWidth="2"/>
                <line x1="16" y1="4" x2="16" y2="9" stroke="currentColor" strokeWidth="2"/>
              </svg>
              <p className="empty-text">暂无课表数据</p>
              <p className="empty-hint">请点击左下角"测试数据"按钮查看示例</p>
            </div>
          ) : filteredCourses.length === 0 ? (
            <div className="empty-state">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" style={{opacity: 0.3}}>
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                <path d="M12 8v4M12 16h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              <p className="empty-text">未找到相关课程</p>
              <p className="empty-hint">请尝试切换其他筛选条件</p>
            </div>
          ) : (
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
                        >
                          <div className="course-time">
                            {course.startTime} - {course.endTime}
                          </div>
                          <div className="course-title">{course.course}</div>
                          <div className="course-details">
                            {viewMode !== 'student' && (
                              <div className="detail-item">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                                  <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="2"/>
                                  <path d="M5 20C5 16.134 8.13401 13 12 13C15.866 13 19 16.134 19 20" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                                </svg>
                                <span>{course.studentName}</span>
                              </div>
                            )}
                            {viewMode !== 'teacher' && (
                              <div className="detail-item">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                                  <path d="M12 2a10 10 0 100 20 10 10 0 000-20z" stroke="currentColor" strokeWidth="2"/>
                                  <path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                                </svg>
                                <span>{course.teacherName}</span>
                              </div>
                            )}
                            {viewMode !== 'classroom' && (
                              <div className="detail-item">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                                  <rect x="3" y="4" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="2"/>
                                  <line x1="3" y1="10" x2="21" y2="10" stroke="currentColor" strokeWidth="2"/>
                                </svg>
                                <span>{course.classroomName}</span>
                              </div>
                            )}
                            <div className="detail-item campus">
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
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
    </div>
  );
};

export default FinalSchedule;

