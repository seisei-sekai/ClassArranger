/**
 * Teacher Panel - Experiment2
 * 教师管理面板
 */

import React, { useState } from 'react';
import { DAY_NAMES_FULL } from '../utils/realBusinessDataStructures.js';

const TeacherPanel = ({ teachers, onTeachersChange, granularity }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSubject, setFilterSubject] = useState('');
  const [editingTeacher, setEditingTeacher] = useState(null);

  /**
   * Filter teachers
   */
  const filteredTeachers = teachers.filter(teacher => {
    if (searchTerm && !teacher.name.includes(searchTerm)) return false;
    if (filterSubject && !teacher.subjects.includes(filterSubject)) return false;
    return true;
  });

  /**
   * Handle teacher deletion
   */
  const handleDelete = (id) => {
    if (confirm('确定要删除这个教师吗？')) {
      onTeachersChange(teachers.filter(t => t.id !== id));
    }
  };

  /**
   * Handle teacher edit
   */
  const handleEdit = (teacher) => {
    setEditingTeacher(teacher);
    alert('编辑功能开发中');
  };

  /**
   * Get unique subjects for filter
   */
  const uniqueSubjects = [...new Set(teachers.flatMap(t => t.subjects))];

  /**
   * Get availability summary
   */
  const getAvailabilitySummary = (teacher) => {
    if (!teacher.availableTimeSlots || teacher.availableTimeSlots.length === 0) {
      return '未设置';
    }
    
    const days = [...new Set(teacher.availableTimeSlots.map(slot => slot.day))];
    return `${days.length}天 (${teacher.availableTimeSlots.length}个时间段)`;
  };

  return (
    <div className="teacher-panel">
      <div className="panel-header">
        <h2>教师管理</h2>
        <div className="panel-summary">
          共 {teachers.length} 位教师
        </div>
      </div>

      {/* Filters */}
      <div className="panel-filters">
        <input
          type="text"
          className="search-input"
          placeholder="搜索教师姓名..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        
        <select
          className="filter-select"
          value={filterSubject}
          onChange={(e) => setFilterSubject(e.target.value)}
        >
          <option value="">所有科目</option>
          {uniqueSubjects.map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      {/* Teacher list */}
      <div className="panel-content">
        {filteredTeachers.length === 0 ? (
          <div className="empty-state">
            <p>没有找到教师数据</p>
            <p className="empty-hint">请前往"数据导入"添加教师</p>
          </div>
        ) : (
          <div className="teacher-grid">
            {filteredTeachers.map(teacher => (
              <div key={teacher.id} className="teacher-card">
                <div className="card-header">
                  <h3>{teacher.name}</h3>
                  <div className="card-actions">
                    <button
                      className="btn-icon edit"
                      onClick={() => handleEdit(teacher)}
                      title="编辑"
                    >
                      ✎
                    </button>
                    <button
                      className="btn-icon delete"
                      onClick={() => handleDelete(teacher.id)}
                      title="删除"
                    >
                      ✕
                    </button>
                  </div>
                </div>
                
                <div className="card-body">
                  <div className="detail-row">
                    <span className="detail-label">科目:</span>
                    <span className="detail-value">{teacher.subjects.join(', ')}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">校区:</span>
                    <span className="detail-value">
                      {Array.isArray(teacher.campus) ? teacher.campus.join(', ') : teacher.campus || '未指定'}
                    </span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">时薪:</span>
                    <span className="detail-value">¥{teacher.hourlyRate}/小时</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">每周最大:</span>
                    <span className="detail-value">{teacher.maxHoursPerWeek}小时</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">可用时间:</span>
                    <span className="detail-value">{getAvailabilitySummary(teacher)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TeacherPanel;
