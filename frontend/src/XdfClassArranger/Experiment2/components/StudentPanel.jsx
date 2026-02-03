/**
 * Student Panel - Experiment2
 * 学生管理面板
 */

import React, { useState } from 'react';
import { DAY_NAMES_FULL } from '../utils/realBusinessDataStructures.js';

const StudentPanel = ({ students, onStudentsChange, granularity }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCampus, setFilterCampus] = useState('');
  const [filterSubject, setFilterSubject] = useState('');
  const [editingStudent, setEditingStudent] = useState(null);

  /**
   * Filter students
   */
  const filteredStudents = students.filter(student => {
    if (searchTerm && !student.name.includes(searchTerm)) return false;
    if (filterCampus && student.campus !== filterCampus) return false;
    if (filterSubject && student.subject !== filterSubject) return false;
    return true;
  });

  /**
   * Handle student deletion
   */
  const handleDelete = (id) => {
    if (confirm('确定要删除这个学生吗？')) {
      onStudentsChange(students.filter(s => s.id !== id));
    }
  };

  /**
   * Handle student edit
   */
  const handleEdit = (student) => {
    setEditingStudent(student);
    // TODO: Open edit dialog
    alert('编辑功能开发中');
  };

  /**
   * Get unique values for filters
   */
  const uniqueCampuses = [...new Set(students.map(s => s.campus).filter(Boolean))];
  const uniqueSubjects = [...new Set(students.map(s => s.subject).filter(Boolean))];

  return (
    <div className="student-panel">
      <div className="panel-header">
        <h2>学生管理</h2>
        <div className="panel-summary">
          共 {students.length} 名学生
        </div>
      </div>

      {/* Filters */}
      <div className="panel-filters">
        <input
          type="text"
          className="search-input"
          placeholder="搜索学生姓名..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        
        <select
          className="filter-select"
          value={filterCampus}
          onChange={(e) => setFilterCampus(e.target.value)}
        >
          <option value="">所有校区</option>
          {uniqueCampuses.map(c => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        
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

      {/* Student list */}
      <div className="panel-content">
        {filteredStudents.length === 0 ? (
          <div className="empty-state">
            <p>没有找到学生数据</p>
            <p className="empty-hint">请前往"数据导入"添加学生</p>
          </div>
        ) : (
          <div className="student-grid">
            {filteredStudents.map(student => (
              <div key={student.id} className="student-card">
                <div className="card-header">
                  <h3>{student.name}</h3>
                  <div className="card-actions">
                    <button
                      className="btn-icon edit"
                      onClick={() => handleEdit(student)}
                      title="编辑"
                    >
                      ✎
                    </button>
                    <button
                      className="btn-icon delete"
                      onClick={() => handleDelete(student.id)}
                      title="删除"
                    >
                      ✕
                    </button>
                  </div>
                </div>
                
                <div className="card-body">
                  <div className="detail-row">
                    <span className="detail-label">校区:</span>
                    <span className="detail-value">{student.campus || '-'}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">科目:</span>
                    <span className="detail-value">{student.subject}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">频次:</span>
                    <span className="detail-value">{student.frequency}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">时长:</span>
                    <span className="detail-value">{student.duration}小时</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">课时:</span>
                    <span className="detail-value hours">
                      {student.remainingHours}/{student.totalHours}小时
                    </span>
                  </div>
                  {student.constraints && student.constraints.allowedDays && (
                    <div className="detail-row">
                      <span className="detail-label">可用天:</span>
                      <span className="detail-value">
                        {Array.from(student.constraints.allowedDays)
                          .sort()
                          .map(d => DAY_NAMES_FULL[d])
                          .join(', ')}
                      </span>
                    </div>
                  )}
                  {student.manager && (
                    <div className="detail-row">
                      <span className="detail-label">学管:</span>
                      <span className="detail-value">{student.manager}</span>
                    </div>
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

export default StudentPanel;
