/**
 * Experiment2 - 前途塾1v1排课系统
 * 
 * 结合Experiment的简洁架构和Function的实用功能
 * 专为非技术管理员设计的排课系统
 */

import React, { useState, useEffect } from 'react';
import './Experiment2.css';
import StorageManager from './utils/storageManager.js';
import { TIME_GRANULARITY } from './utils/realBusinessDataStructures.js';

// 导入组件（将在后续创建）
import DataImportPanel from './components/DataImportPanel.jsx';
import StudentPanel from './components/StudentPanel.jsx';
import TeacherPanel from './components/TeacherPanel.jsx';
import ClassroomPanel from './components/ClassroomPanel.jsx';
import SchedulingControlPanel from './components/SchedulingControlPanel.jsx';
import EnhancedCalendarView from './components/EnhancedCalendarView.jsx';
import ResultsSummaryPanel from './components/ResultsSummaryPanel.jsx';

const Experiment2 = () => {
  // Active tab state
  const [activeTab, setActiveTab] = useState('import');
  
  // Data state (load from localStorage on mount)
  const [students, setStudents] = useState(() => StorageManager.load('STUDENTS', []));
  const [teachers, setTeachers] = useState(() => StorageManager.load('TEACHERS', []));
  const [classrooms, setClassrooms] = useState(() => StorageManager.load('CLASSROOMS', []));
  const [courses, setCourses] = useState(() => StorageManager.load('COURSES', []));
  
  // Settings state
  const [settings, setSettings] = useState(() => StorageManager.load('SETTINGS', {
    granularity: TIME_GRANULARITY.FIVE_MIN,
    algorithm: 'triple-match', // 'triple-match' or 'genetic'
    autoSave: true
  }));
  
  // UI state
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isScheduling, setIsScheduling] = useState(false);
  const [schedulingProgress, setSchedulingProgress] = useState(null);
  const [scheduleResults, setScheduleResults] = useState(null);
  
  // Filter state for calendar
  const [calendarFilter, setCalendarFilter] = useState({
    student: null,
    teacher: null,
    campus: null,
    subject: null
  });

  /**
   * Auto-save to localStorage when data changes
   */
  useEffect(() => {
    if (settings.autoSave) {
      StorageManager.save('STUDENTS', students);
    }
  }, [students, settings.autoSave]);

  useEffect(() => {
    if (settings.autoSave) {
      StorageManager.save('TEACHERS', teachers);
    }
  }, [teachers, settings.autoSave]);

  useEffect(() => {
    if (settings.autoSave) {
      StorageManager.save('CLASSROOMS', classrooms);
    }
  }, [classrooms, settings.autoSave]);

  useEffect(() => {
    if (settings.autoSave) {
      StorageManager.save('COURSES', courses);
    }
  }, [courses, settings.autoSave]);

  useEffect(() => {
    StorageManager.save('SETTINGS', settings);
  }, [settings]);

  /**
   * Handle data import
   */
  const handleImportStudents = (importedStudents) => {
    setStudents(prev => [...prev, ...importedStudents]);
  };

  const handleImportTeachers = (importedTeachers) => {
    setTeachers(prev => [...prev, ...importedTeachers]);
  };

  const handleImportClassrooms = (importedClassrooms) => {
    setClassrooms(prev => [...prev, ...importedClassrooms]);
  };

  /**
   * Handle scheduling
   */
  const handleStartScheduling = async (config) => {
    setIsScheduling(true);
    setSchedulingProgress({ current: 0, total: students.length, message: '准备中...' });
    
    try {
      // Import scheduler dynamically
      const { TripleMatchScheduler } = await import('./algorithms/tripleMatchScheduler.js');
      
      const scheduler = new TripleMatchScheduler({
        students,
        teachers,
        classrooms,
        granularity: settings.granularity,
        onProgress: setSchedulingProgress
      });
      
      const results = scheduler.schedule();
      
      setCourses(results.courses);
      setScheduleResults(results);
      setActiveTab('calendar');
      
    } catch (error) {
      console.error('Scheduling error:', error);
      alert(`排课出错: ${error.message}`);
    } finally {
      setIsScheduling(false);
      setSchedulingProgress(null);
    }
  };

  /**
   * Handle course update (from drag-drop or edit)
   */
  const handleCourseUpdate = (courseId, updates) => {
    setCourses(prev => prev.map(c => 
      c.id === courseId ? { ...c, ...updates } : c
    ));
  };

  /**
   * Handle course delete
   */
  const handleCourseDelete = (courseId) => {
    if (confirm('确定要删除这节课吗？')) {
      setCourses(prev => prev.filter(c => c.id !== courseId));
    }
  };

  /**
   * Clear all data
   */
  const handleClearAll = () => {
    if (confirm('确定要清空所有数据吗？此操作不可恢复。')) {
      setStudents([]);
      setTeachers([]);
      setClassrooms([]);
      setCourses([]);
      setScheduleResults(null);
      StorageManager.clearAll();
    }
  };

  /**
   * Export data
   */
  const handleExport = () => {
    const data = StorageManager.exportAll();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `experiment2-data-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  /**
   * Load example data
   */
  const handleLoadExample = async () => {
    if (confirm('加载示例数据将清空当前数据，确定继续吗？')) {
      const { generateExampleData } = await import('./utils/exampleDataGenerator.js');
      const exampleData = generateExampleData();
      
      setStudents(exampleData.students);
      setTeachers(exampleData.teachers);
      setClassrooms(exampleData.classrooms);
      setCourses([]);
      setScheduleResults(null);
    }
  };

  /**
   * Calculate data stats for sidebar
   */
  const dataStats = {
    students: students.length,
    teachers: teachers.length,
    classrooms: classrooms.length,
    courses: courses.length,
    scheduledStudents: new Set(courses.filter(c => c.student).map(c => c.student.id)).size,
    conflicts: scheduleResults?.conflicts?.length || 0
  };

  /**
   * Render content based on active tab
   */
  const renderContent = () => {
    switch (activeTab) {
      case 'import':
        return (
          <DataImportPanel
            onImportStudents={handleImportStudents}
            onImportTeachers={handleImportTeachers}
            onImportClassrooms={handleImportClassrooms}
            granularity={settings.granularity}
          />
        );
      
      case 'students':
        return (
          <StudentPanel
            students={students}
            onStudentsChange={setStudents}
            granularity={settings.granularity}
          />
        );
      
      case 'teachers':
        return (
          <TeacherPanel
            teachers={teachers}
            onTeachersChange={setTeachers}
            granularity={settings.granularity}
          />
        );
      
      case 'classrooms':
        return (
          <ClassroomPanel
            classrooms={classrooms}
            onClassroomsChange={setClassrooms}
            granularity={settings.granularity}
          />
        );
      
      case 'schedule':
        return (
          <SchedulingControlPanel
            students={students}
            teachers={teachers}
            classrooms={classrooms}
            settings={settings}
            isScheduling={isScheduling}
            progress={schedulingProgress}
            onStartScheduling={handleStartScheduling}
          />
        );
      
      case 'calendar':
        return (
          <div className="calendar-results-view">
            {scheduleResults && (
              <ResultsSummaryPanel
                results={scheduleResults}
                students={students}
                teachers={teachers}
                classrooms={classrooms}
              />
            )}
            <EnhancedCalendarView
              courses={courses}
              students={students}
              teachers={teachers}
              classrooms={classrooms}
              granularity={settings.granularity}
              filter={calendarFilter}
              onFilterChange={setCalendarFilter}
              onCourseUpdate={handleCourseUpdate}
              onCourseDelete={handleCourseDelete}
            />
          </div>
        );
      
      default:
        return <div>未知标签页</div>;
    }
  };

  return (
    <div className="experiment2-container">
      {/* Header */}
      <div className="experiment2-header">
        <div className="header-left">
          <h1 className="page-title">前途塾1v1排课系统</h1>
          <p className="page-subtitle">Experiment2 - 简洁实用版</p>
        </div>
        <div className="header-right">
          <button className="btn-help" onClick={() => alert('帮助文档开发中')}>
            帮助
          </button>
          <button className="btn-settings" onClick={() => alert('设置功能开发中')}>
            设置
          </button>
        </div>
      </div>

      {/* Main layout */}
      <div className="experiment2-layout">
        {/* Sidebar */}
        <div className={`experiment2-sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
          <button 
            className="sidebar-toggle"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          >
            {sidebarCollapsed ? '»' : '«'}
          </button>
          
          {!sidebarCollapsed && (
            <>
              <div className="sidebar-section">
                <h3>数据统计</h3>
                <div className="stat-list">
                  <div className="stat-item">
                    <span className="stat-label">学生</span>
                    <span className="stat-value">{dataStats.students}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">教师</span>
                    <span className="stat-value">{dataStats.teachers}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">教室</span>
                    <span className="stat-value">{dataStats.classrooms}</span>
                  </div>
                  <div className="stat-item success">
                    <span className="stat-label">已排课</span>
                    <span className="stat-value">{dataStats.courses}</span>
                  </div>
                  {dataStats.conflicts > 0 && (
                    <div className="stat-item warning">
                      <span className="stat-label">冲突</span>
                      <span className="stat-value">{dataStats.conflicts}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="sidebar-section">
                <h3>快速操作</h3>
                <div className="action-list">
                  <button className="action-btn" onClick={handleLoadExample}>
                    导入示例
                  </button>
                  <button 
                    className="action-btn" 
                    onClick={handleExport}
                    disabled={students.length === 0 && teachers.length === 0 && classrooms.length === 0}
                  >
                    导出数据
                  </button>
                  <button 
                    className="action-btn danger" 
                    onClick={handleClearAll}
                    disabled={students.length === 0 && teachers.length === 0 && classrooms.length === 0}
                  >
                    清空数据
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Main content */}
        <div className="experiment2-main">
          {/* Navigation tabs */}
          <div className="experiment2-tabs">
            <button
              className={`exp2-tab ${activeTab === 'import' ? 'active' : ''}`}
              onClick={() => setActiveTab('import')}
            >
              数据导入
            </button>
            <button
              className={`exp2-tab ${activeTab === 'students' ? 'active' : ''}`}
              onClick={() => setActiveTab('students')}
            >
              学生管理 ({students.length})
            </button>
            <button
              className={`exp2-tab ${activeTab === 'teachers' ? 'active' : ''}`}
              onClick={() => setActiveTab('teachers')}
            >
              教师管理 ({teachers.length})
            </button>
            <button
              className={`exp2-tab ${activeTab === 'classrooms' ? 'active' : ''}`}
              onClick={() => setActiveTab('classrooms')}
            >
              教室管理 ({classrooms.length})
            </button>
            <button
              className={`exp2-tab ${activeTab === 'schedule' ? 'active' : ''}`}
              onClick={() => setActiveTab('schedule')}
              disabled={students.length === 0 || teachers.length === 0}
            >
              开始排课
            </button>
            <button
              className={`exp2-tab ${activeTab === 'calendar' ? 'active' : ''}`}
              onClick={() => setActiveTab('calendar')}
              disabled={courses.length === 0}
            >
              排课结果 ({courses.length})
            </button>
          </div>

          {/* Content area */}
          <div className="experiment2-content">
            {renderContent()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Experiment2;
