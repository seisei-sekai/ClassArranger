/**
 * Constraint Input Panel Component
 * 约束输入面板组件
 * 
 * Interactive panel for adding and managing teachers and students
 */

import React, { useState } from 'react';
import { 
  createTeacher, 
  createStudent,
  validateTeacher,
  validateStudent,
  SUBJECTS,
  DAY_NAMES_FULL,
  TIME_GRANULARITY
} from '../utils/dataStructures.js';
import { validateConstraints } from '../utils/validationUtils.js';
import DataGenerator from './DataGenerator.jsx';

const ConstraintInputPanel = ({ 
  teachers = [],
  students = [],
  onTeachersChange,
  onStudentsChange,
  granularity = TIME_GRANULARITY.FIVE_MIN
}) => {
  const [activeTab, setActiveTab] = useState('teachers');
  const [showGenerator, setShowGenerator] = useState(false);
  
  // Teacher form state
  const [teacherForm, setTeacherForm] = useState({
    name: '',
    subjects: [],
    hourlyRate: 300,
    maxHoursPerWeek: 30
  });
  
  // Student form state
  const [studentForm, setStudentForm] = useState({
    name: '',
    subject: '',
    totalHours: 20,
    frequency: '2次/周',
    durationHours: 2,
    allowedDays: new Set([1, 2, 3, 4, 5])
  });

  /**
   * Handle teacher form submission
   * 处理教师表单提交
   */
  const handleAddTeacher = () => {
    if (!teacherForm.name || teacherForm.subjects.length === 0) {
      alert('请填写教师姓名并选择至少一个科目');
      return;
    }

    // Create default available time slots (weekdays, 9-17)
    const defaultTimeSlots = Array.from(teacherForm.subjects.length > 0 ? [1, 2, 3, 4, 5] : []).map(day => ({
      day,
      startSlot: 0,
      endSlot: 96 // 9:00-17:00 in 5-min slots
    }));

    const newTeacher = createTeacher({
      name: teacherForm.name,
      subjects: teacherForm.subjects,
      availableTimeSlots: defaultTimeSlots,
      hourlyRate: teacherForm.hourlyRate,
      maxHoursPerWeek: teacherForm.maxHoursPerWeek
    });

    const validation = validateTeacher(newTeacher);
    if (!validation.valid) {
      alert(`教师数据无效:\n${validation.errors.join('\n')}`);
      return;
    }

    onTeachersChange([...teachers, newTeacher]);
    
    // Reset form
    setTeacherForm({
      name: '',
      subjects: [],
      hourlyRate: 300,
      maxHoursPerWeek: 30
    });
  };

  /**
   * Handle student form submission
   * 处理学生表单提交
   */
  const handleAddStudent = () => {
    if (!studentForm.name || !studentForm.subject) {
      alert('请填写学生姓名和科目');
      return;
    }

    if (studentForm.allowedDays.size === 0) {
      alert('请至少选择一天可用时间');
      return;
    }

    // Create time ranges from allowed days (default: afternoons)
    const allowedTimeRanges = Array.from(studentForm.allowedDays).map(day => ({
      day,
      startSlot: 48, // 13:00
      endSlot: 108   // 18:00
    }));

    const duration = studentForm.durationHours * granularity.slotsPerHour;

    const newStudent = createStudent({
      name: studentForm.name,
      subject: studentForm.subject,
      totalHours: studentForm.totalHours,
      usedHours: 0,
      validPeriod: {
        start: new Date(),
        end: new Date(Date.now() + 6 * 30 * 24 * 60 * 60 * 1000) // 6 months
      },
      constraints: {
        allowedDays: studentForm.allowedDays,
        allowedTimeRanges,
        excludedTimeRanges: [],
        frequency: studentForm.frequency,
        duration
      }
    });

    const validation = validateStudent(newStudent);
    if (!validation.valid) {
      alert(`学生数据无效:\n${validation.errors.join('\n')}`);
      return;
    }

    const constraintValidation = validateConstraints(newStudent.constraints, granularity);
    if (!constraintValidation.valid) {
      alert(`约束条件无效:\n${constraintValidation.errors.join('\n')}`);
      return;
    }

    onStudentsChange([...students, newStudent]);
    
    // Reset form
    setStudentForm({
      name: '',
      subject: '',
      totalHours: 20,
      frequency: '2次/周',
      durationHours: 2,
      allowedDays: new Set([1, 2, 3, 4, 5])
    });
  };

  /**
   * Handle teacher deletion
   * 处理教师删除
   */
  const handleDeleteTeacher = (id) => {
    if (confirm('确定要删除这个教师吗？')) {
      onTeachersChange(teachers.filter(t => t.id !== id));
    }
  };

  /**
   * Handle student deletion
   * 处理学生删除
   */
  const handleDeleteStudent = (id) => {
    if (confirm('确定要删除这个学生吗？')) {
      onStudentsChange(students.filter(s => s.id !== id));
    }
  };

  /**
   * Handle subject toggle for teacher
   * 处理教师科目切换
   */
  const handleSubjectToggle = (subject) => {
    const subjects = teacherForm.subjects.includes(subject)
      ? teacherForm.subjects.filter(s => s !== subject)
      : [...teacherForm.subjects, subject];
    
    setTeacherForm({ ...teacherForm, subjects });
  };

  /**
   * Handle day toggle for student
   * 处理学生日期切换
   */
  const handleDayToggle = (day) => {
    const allowedDays = new Set(studentForm.allowedDays);
    if (allowedDays.has(day)) {
      allowedDays.delete(day);
    } else {
      allowedDays.add(day);
    }
    
    setStudentForm({ ...studentForm, allowedDays });
  };

  /**
   * Handle random data generation
   * 处理随机数据生成
   */
  const handleGenerate = ({ teachers: newTeachers, students: newStudents }) => {
    onTeachersChange(newTeachers);
    onStudentsChange(newStudents);
    setShowGenerator(false);
  };

  /**
   * Clear all data
   * 清空所有数据
   */
  const handleClearAll = () => {
    if (confirm('确定要清空所有教师和学生数据吗？此操作不可恢复。')) {
      onTeachersChange([]);
      onStudentsChange([]);
    }
  };

  return (
    <div className="constraint-input-panel">
      <div className="panel-header">
        <div className="panel-tabs">
          <button
            className={`panel-tab ${activeTab === 'teachers' ? 'active' : ''}`}
            onClick={() => setActiveTab('teachers')}
          >
            教师管理 ({teachers.length})
          </button>
          <button
            className={`panel-tab ${activeTab === 'students' ? 'active' : ''}`}
            onClick={() => setActiveTab('students')}
          >
            学生管理 ({students.length})
          </button>
        </div>
        <div className="panel-actions">
          <button
            className="btn-random"
            onClick={() => setShowGenerator(!showGenerator)}
          >
            {showGenerator ? '关闭' : '随机生成'}
          </button>
          <button
            className="btn-clear"
            onClick={handleClearAll}
            disabled={teachers.length === 0 && students.length === 0}
          >
            清空全部
          </button>
        </div>
      </div>

      {showGenerator && (
        <div className="generator-section">
          <DataGenerator
            onGenerate={handleGenerate}
            granularity={granularity}
          />
        </div>
      )}

      <div className="panel-content">
        {activeTab === 'teachers' ? (
          <div className="teachers-section">
            <div className="form-section">
              <h4>添加教师</h4>
              <div className="form-grid">
                <div className="form-group">
                  <label>姓名 *</label>
                  <input
                    type="text"
                    value={teacherForm.name}
                    onChange={(e) => setTeacherForm({ ...teacherForm, name: e.target.value })}
                    placeholder="例如：张老师"
                  />
                </div>
                
                <div className="form-group full-width">
                  <label>可教科目 * (至少选择一个)</label>
                  <div className="subject-chips">
                    {SUBJECTS.map(subject => (
                      <button
                        key={subject}
                        className={`chip ${teacherForm.subjects.includes(subject) ? 'selected' : ''}`}
                        onClick={() => handleSubjectToggle(subject)}
                      >
                        {subject}
                      </button>
                    ))}
                  </div>
                </div>
                
                <div className="form-group">
                  <label>时薪 (元/小时)</label>
                  <input
                    type="number"
                    min="0"
                    value={teacherForm.hourlyRate}
                    onChange={(e) => setTeacherForm({ ...teacherForm, hourlyRate: parseInt(e.target.value) || 0 })}
                  />
                </div>
                
                <div className="form-group">
                  <label>每周最大课时</label>
                  <input
                    type="number"
                    min="1"
                    max="60"
                    value={teacherForm.maxHoursPerWeek}
                    onChange={(e) => setTeacherForm({ ...teacherForm, maxHoursPerWeek: parseInt(e.target.value) || 30 })}
                  />
                </div>
              </div>
              
              <button className="btn-add" onClick={handleAddTeacher}>
                添加教师
              </button>
            </div>

            <div className="list-section">
              <h4>教师列表</h4>
              {teachers.length === 0 ? (
                <div className="empty-list">暂无教师，请添加或生成</div>
              ) : (
                <div className="item-list">
                  {teachers.map(teacher => (
                    <div key={teacher.id} className="list-item teacher-item">
                      <div className="item-header">
                        <h5>{teacher.name}</h5>
                        <button
                          className="btn-delete"
                          onClick={() => handleDeleteTeacher(teacher.id)}
                        >
                          删除
                        </button>
                      </div>
                      <div className="item-details">
                        <div className="detail-row">
                          <span className="detail-label">科目:</span>
                          <span className="detail-value">{teacher.subjects.join(', ')}</span>
                        </div>
                        <div className="detail-row">
                          <span className="detail-label">时薪:</span>
                          <span className="detail-value">¥{teacher.hourlyRate}/小时</span>
                        </div>
                        <div className="detail-row">
                          <span className="detail-label">可用时间:</span>
                          <span className="detail-value">{teacher.availableTimeSlots.length}个时间段</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="students-section">
            <div className="form-section">
              <h4>添加学生</h4>
              <div className="form-grid">
                <div className="form-group">
                  <label>姓名 *</label>
                  <input
                    type="text"
                    value={studentForm.name}
                    onChange={(e) => setStudentForm({ ...studentForm, name: e.target.value })}
                    placeholder="例如：李同学"
                  />
                </div>
                
                <div className="form-group">
                  <label>科目 *</label>
                  <select
                    value={studentForm.subject}
                    onChange={(e) => setStudentForm({ ...studentForm, subject: e.target.value })}
                  >
                    <option value="">选择科目</option>
                    {SUBJECTS.map(subject => (
                      <option key={subject} value={subject}>{subject}</option>
                    ))}
                  </select>
                </div>
                
                <div className="form-group">
                  <label>总课时</label>
                  <input
                    type="number"
                    min="1"
                    value={studentForm.totalHours}
                    onChange={(e) => setStudentForm({ ...studentForm, totalHours: parseInt(e.target.value) || 1 })}
                  />
                </div>
                
                <div className="form-group">
                  <label>频率</label>
                  <select
                    value={studentForm.frequency}
                    onChange={(e) => setStudentForm({ ...studentForm, frequency: e.target.value })}
                  >
                    <option value="1次/周">1次/周</option>
                    <option value="2次/周">2次/周</option>
                    <option value="3次/周">3次/周</option>
                  </select>
                </div>
                
                <div className="form-group">
                  <label>每次时长(小时)</label>
                  <select
                    value={studentForm.durationHours}
                    onChange={(e) => setStudentForm({ ...studentForm, durationHours: parseInt(e.target.value) })}
                  >
                    <option value={1}>1小时</option>
                    <option value={1.5}>1.5小时</option>
                    <option value={2}>2小时</option>
                    <option value={2.5}>2.5小时</option>
                    <option value={3}>3小时</option>
                  </select>
                </div>
                
                <div className="form-group full-width">
                  <label>可用星期 * (至少选择一天)</label>
                  <div className="day-chips">
                    {[1, 2, 3, 4, 5, 6, 0].map(day => (
                      <button
                        key={day}
                        className={`chip ${studentForm.allowedDays.has(day) ? 'selected' : ''}`}
                        onClick={() => handleDayToggle(day)}
                      >
                        {DAY_NAMES_FULL[day]}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              
              <button className="btn-add" onClick={handleAddStudent}>
                添加学生
              </button>
            </div>

            <div className="list-section">
              <h4>学生列表</h4>
              {students.length === 0 ? (
                <div className="empty-list">暂无学生，请添加或生成</div>
              ) : (
                <div className="item-list">
                  {students.map(student => (
                    <div key={student.id} className="list-item student-item">
                      <div className="item-header">
                        <h5>{student.name}</h5>
                        <button
                          className="btn-delete"
                          onClick={() => handleDeleteStudent(student.id)}
                        >
                          删除
                        </button>
                      </div>
                      <div className="item-details">
                        <div className="detail-row">
                          <span className="detail-label">科目:</span>
                          <span className="detail-value">{student.subject}</span>
                        </div>
                        <div className="detail-row">
                          <span className="detail-label">课时:</span>
                          <span className="detail-value">{student.remainingHours}/{student.totalHours}小时</span>
                        </div>
                        <div className="detail-row">
                          <span className="detail-label">频率:</span>
                          <span className="detail-value">{student.constraints.frequency}</span>
                        </div>
                        <div className="detail-row">
                          <span className="detail-label">可用天:</span>
                          <span className="detail-value">
                            {Array.from(student.constraints.allowedDays).map(d => DAY_NAMES_FULL[d]).join(', ')}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ConstraintInputPanel;
