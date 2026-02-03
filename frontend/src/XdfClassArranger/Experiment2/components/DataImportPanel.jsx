/**
 * Data Import Panel - Experiment2
 * 数据导入面板
 * 
 * Supports both Excel paste and manual form input
 */

import React, { useState } from 'react';
import {
  parseStudentExcel,
  parseTeacherExcel,
  parseClassroomExcel,
  validateExcelFormat
} from '../parsers/excelParser.js';
import {
  createStudent,
  createTeacher,
  createClassroom,
  CAMPUSES,
  SUBJECTS,
  FREQUENCIES,
  FORMATS
} from '../utils/realBusinessDataStructures.js';
import { validateStudent, validateTeacher, validateClassroom } from '../utils/validationRules.js';

const DataImportPanel = ({ 
  onImportStudents, 
  onImportTeachers,
  onImportClassrooms,
  granularity 
}) => {
  const [importMode, setImportMode] = useState('excel'); // 'excel' or 'manual'
  const [dataType, setDataType] = useState('student'); // 'student', 'teacher', or 'classroom'
  const [pastedText, setPastedText] = useState('');
  const [parseResult, setParseResult] = useState(null);
  
  // Manual form state
  const [studentForm, setStudentForm] = useState({
    name: '',
    campus: '高马',
    manager: '',
    batch: '2602',
    subject: '',
    frequency: '2次',
    duration: 2,
    format: '线下',
    allowedDays: new Set([1, 2, 3, 4, 5])
  });

  const [teacherForm, setTeacherForm] = useState({
    name: '',
    subjects: [],
    campus: ['高马', '本校'],
    hourlyRate: 300
  });

  const [classroomForm, setClassroomForm] = useState({
    name: '',
    campus: '高马',
    capacity: 2,
    type: '1v1教室'
  });

  /**
   * Handle Excel paste parsing
   */
  const handleParse = () => {
    if (!pastedText.trim()) {
      alert('请先粘贴数据');
      return;
    }
    
    // Validate format
    const validation = validateExcelFormat(pastedText, dataType);
    if (!validation.valid) {
      alert(validation.message);
      return;
    }
    
    // Parse based on data type
    let result;
    switch (dataType) {
      case 'student':
        result = parseStudentExcel(pastedText, granularity);
        break;
      case 'teacher':
        result = parseTeacherExcel(pastedText, granularity);
        break;
      case 'classroom':
        result = parseClassroomExcel(pastedText, granularity);
        break;
      default:
        return;
    }
    
    setParseResult(result);
    
    // Show result
    if (result.errors.length > 0) {
      alert(`解析完成：成功${result.parsed}个，失败${result.failed}个\n\n失败原因见控制台`);
      console.error('Parse errors:', result.errors);
    } else {
      alert(`解析成功：${result.parsed}个${dataType === 'student' ? '学生' : dataType === 'teacher' ? '教师' : '教室'}`);
    }
  };

  /**
   * Handle import parsed data
   */
  const handleImport = () => {
    if (!parseResult || parseResult.parsed === 0) {
      alert('没有可导入的数据');
      return;
    }
    
    switch (dataType) {
      case 'student':
        onImportStudents(parseResult.students);
        break;
      case 'teacher':
        onImportTeachers(parseResult.teachers);
        break;
      case 'classroom':
        onImportClassrooms(parseResult.classrooms);
        break;
    }
    
    // Clear after import
    setPastedText('');
    setParseResult(null);
    alert('导入成功！');
  };

  /**
   * Handle manual student form submission
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
    
    // Create time ranges for afternoon by default
    const allowedTimeRanges = Array.from(studentForm.allowedDays).map(day => ({
      day,
      startSlot: 48,  // 13:00
      endSlot: 108    // 18:00
    }));
    
    const student = createStudent({
      ...studentForm,
      totalHours: studentForm.frequency === '多次' ? 60 : parseInt(studentForm.frequency) * studentForm.duration * 20,
      hoursUsed: 0,
      constraints: {
        allowedDays: studentForm.allowedDays,
        allowedTimeRanges,
        excludedTimeRanges: [],
        duration: studentForm.duration * granularity.slotsPerHour,
        frequency: studentForm.frequency
      }
    });
    
    const validation = validateStudent(student);
    if (!validation.valid) {
      alert(`学生数据无效:\n${validation.errors.join('\n')}`);
      return;
    }
    
    onImportStudents([student]);
    
    // Reset form
    setStudentForm({
      name: '',
      campus: '高马',
      manager: '',
      batch: '2602',
      subject: '',
      frequency: '2次',
      duration: 2,
      format: '线下',
      allowedDays: new Set([1, 2, 3, 4, 5])
    });
    
    alert('学生添加成功！');
  };

  /**
   * Handle manual teacher form submission
   */
  const handleAddTeacher = () => {
    if (!teacherForm.name || teacherForm.subjects.length === 0) {
      alert('请填写教师姓名并选择至少一个科目');
      return;
    }
    
    // Create default availability (weekdays 9-17)
    const availableTimeSlots = [];
    for (let day = 1; day <= 5; day++) {
      availableTimeSlots.push({
        day,
        startSlot: 0,
        endSlot: 96
      });
    }
    
    const teacher = createTeacher({
      ...teacherForm,
      availableTimeSlots
    });
    
    const validation = validateTeacher(teacher);
    if (!validation.valid) {
      alert(`教师数据无效:\n${validation.errors.join('\n')}`);
      return;
    }
    
    onImportTeachers([teacher]);
    
    // Reset form
    setTeacherForm({
      name: '',
      subjects: [],
      campus: ['高马', '本校'],
      hourlyRate: 300
    });
    
    alert('教师添加成功！');
  };

  /**
   * Handle manual classroom form submission
   */
  const handleAddClassroom = () => {
    if (!classroomForm.name || !classroomForm.campus) {
      alert('请填写教室名称和校区');
      return;
    }
    
    // Create default availability (all week, all day)
    const availableTimeSlots = [];
    for (let day = 0; day <= 6; day++) {
      availableTimeSlots.push({
        day,
        startSlot: 0,
        endSlot: granularity.slotsPerDay
      });
    }
    
    const classroom = createClassroom({
      ...classroomForm,
      availableTimeSlots
    });
    
    const validation = validateClassroom(classroom);
    if (!validation.valid) {
      alert(`教室数据无效:\n${validation.errors.join('\n')}`);
      return;
    }
    
    onImportClassrooms([classroom]);
    
    // Reset form
    setClassroomForm({
      name: '',
      campus: '高马',
      capacity: 2,
      type: '1v1教室'
    });
    
    alert('教室添加成功！');
  };

  /**
   * Render Excel import mode
   */
  const renderExcelMode = () => (
    <div className="excel-import-section">
      <div className="import-instructions">
        <h4>Excel粘贴导入说明</h4>
        <ol>
          <li>从Excel文件中选择并复制数据行（支持多行）</li>
          <li>粘贴到下方文本框（保持Tab分隔格式）</li>
          <li>点击"解析数据"检查数据</li>
          <li>确认无误后点击"导入"</li>
        </ol>
      </div>

      <div className="data-type-selector">
        <label>数据类型：</label>
        <div className="radio-group-horizontal">
          <label className="radio-label">
            <input
              type="radio"
              checked={dataType === 'student'}
              onChange={() => setDataType('student')}
            />
            <span>学生</span>
          </label>
          <label className="radio-label">
            <input
              type="radio"
              checked={dataType === 'teacher'}
              onChange={() => setDataType('teacher')}
            />
            <span>教师</span>
          </label>
          <label className="radio-label">
            <input
              type="radio"
              checked={dataType === 'classroom'}
              onChange={() => setDataType('classroom')}
            />
            <span>教室</span>
          </label>
        </div>
      </div>

      <div className="paste-area">
        <textarea
          className="excel-textarea"
          value={pastedText}
          onChange={(e) => setPastedText(e.target.value)}
          placeholder={`从Excel复制${dataType === 'student' ? '学生' : dataType === 'teacher' ? '教师' : '教室'}数据粘贴到这里...\n\n格式要求：\n${
            dataType === 'student' 
              ? '- 至少3列：校区、学管、学生姓名\n- 建议包含：批次、科目、频次、时长等'
              : dataType === 'teacher'
              ? '- 至少2列：姓名、科目\n- 可选：可用时间、时薪、校区'
              : '- 至少2列：校区、教室名\n- 可选：容量、类型'
          }`}
          rows={12}
        />
      </div>

      <div className="parse-actions">
        <button className="btn-parse" onClick={handleParse}>
          解析数据
        </button>
        <button className="btn-clear" onClick={() => {
          setPastedText('');
          setParseResult(null);
        }}>
          清空
        </button>
      </div>

      {parseResult && (
        <div className="parse-result">
          <div className={`result-summary ${parseResult.failed > 0 ? 'warning' : 'success'}`}>
            <span>✓ 成功解析 {parseResult.parsed} 个</span>
            {parseResult.failed > 0 && (
              <span>✗ 失败 {parseResult.failed} 个</span>
            )}
          </div>
          <button className="btn-import-parsed" onClick={handleImport}>
            确认导入
          </button>
        </div>
      )}
    </div>
  );

  /**
   * Render manual input mode
   */
  const renderManualMode = () => {
    switch (dataType) {
      case 'student':
        return renderStudentForm();
      case 'teacher':
        return renderTeacherForm();
      case 'classroom':
        return renderClassroomForm();
      default:
        return null;
    }
  };

  /**
   * Render student form
   */
  const renderStudentForm = () => (
    <div className="manual-form student-form">
      <h4>添加学生</h4>
      <div className="form-grid">
        <div className="form-group">
          <label>学生姓名 *</label>
          <input
            type="text"
            value={studentForm.name}
            onChange={(e) => setStudentForm({ ...studentForm, name: e.target.value })}
            placeholder="例如：张三"
          />
        </div>
        
        <div className="form-group">
          <label>校区 *</label>
          <select
            value={studentForm.campus}
            onChange={(e) => setStudentForm({ ...studentForm, campus: e.target.value })}
          >
            {CAMPUSES.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
        
        <div className="form-group">
          <label>学管</label>
          <input
            type="text"
            value={studentForm.manager}
            onChange={(e) => setStudentForm({ ...studentForm, manager: e.target.value })}
            placeholder="负责学管姓名"
          />
        </div>
        
        <div className="form-group">
          <label>批次</label>
          <input
            type="text"
            value={studentForm.batch}
            onChange={(e) => setStudentForm({ ...studentForm, batch: e.target.value })}
            placeholder="例如：2602"
          />
        </div>
        
        <div className="form-group">
          <label>科目 *</label>
          <select
            value={studentForm.subject}
            onChange={(e) => setStudentForm({ ...studentForm, subject: e.target.value })}
          >
            <option value="">选择科目</option>
            {SUBJECTS.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
        
        <div className="form-group">
          <label>频次</label>
          <select
            value={studentForm.frequency}
            onChange={(e) => setStudentForm({ ...studentForm, frequency: e.target.value })}
          >
            {FREQUENCIES.map(f => (
              <option key={f} value={f}>{f}</option>
            ))}
          </select>
        </div>
        
        <div className="form-group">
          <label>每次时长(小时)</label>
          <input
            type="number"
            min="0.5"
            max="4"
            step="0.5"
            value={studentForm.duration}
            onChange={(e) => setStudentForm({ ...studentForm, duration: parseFloat(e.target.value) })}
          />
        </div>
        
        <div className="form-group">
          <label>形式</label>
          <select
            value={studentForm.format}
            onChange={(e) => setStudentForm({ ...studentForm, format: e.target.value })}
          >
            {FORMATS.map(f => (
              <option key={f} value={f}>{f}</option>
            ))}
          </select>
        </div>
        
        <div className="form-group full-width">
          <label>可用星期 *</label>
          <div className="day-chips">
            {['一', '二', '三', '四', '五', '六', '日'].map((day, idx) => {
              const dayNum = idx === 6 ? 0 : idx + 1;
              return (
                <button
                  key={dayNum}
                  className={`chip ${studentForm.allowedDays.has(dayNum) ? 'selected' : ''}`}
                  onClick={() => {
                    const days = new Set(studentForm.allowedDays);
                    if (days.has(dayNum)) {
                      days.delete(dayNum);
                    } else {
                      days.add(dayNum);
                    }
                    setStudentForm({ ...studentForm, allowedDays: days });
                  }}
                >
                  周{day}
                </button>
              );
            })}
          </div>
        </div>
      </div>
      
      <div className="form-actions">
        <button className="btn-submit" onClick={handleAddStudent}>
          添加学生
        </button>
        <button className="btn-reset" onClick={() => setStudentForm({
          name: '',
          campus: '高马',
          manager: '',
          batch: '2602',
          subject: '',
          frequency: '2次',
          duration: 2,
          format: '线下',
          allowedDays: new Set([1, 2, 3, 4, 5])
        })}>
          重置
        </button>
      </div>
    </div>
  );

  /**
   * Render teacher form
   */
  const renderTeacherForm = () => (
    <div className="manual-form teacher-form">
      <h4>添加教师</h4>
      <div className="form-grid">
        <div className="form-group">
          <label>教师姓名 *</label>
          <input
            type="text"
            value={teacherForm.name}
            onChange={(e) => setTeacherForm({ ...teacherForm, name: e.target.value })}
            placeholder="例如：王老师"
          />
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
        
        <div className="form-group full-width">
          <label>可教科目 *</label>
          <div className="subject-chips">
            {SUBJECTS.map(subject => (
              <button
                key={subject}
                className={`chip ${teacherForm.subjects.includes(subject) ? 'selected' : ''}`}
                onClick={() => {
                  const subjects = teacherForm.subjects.includes(subject)
                    ? teacherForm.subjects.filter(s => s !== subject)
                    : [...teacherForm.subjects, subject];
                  setTeacherForm({ ...teacherForm, subjects });
                }}
              >
                {subject}
              </button>
            ))}
          </div>
        </div>
        
        <div className="form-group full-width">
          <label>可上课校区 *</label>
          <div className="campus-chips">
            {CAMPUSES.map(campus => (
              <button
                key={campus}
                className={`chip ${teacherForm.campus.includes(campus) ? 'selected' : ''}`}
                onClick={() => {
                  const campuses = teacherForm.campus.includes(campus)
                    ? teacherForm.campus.filter(c => c !== campus)
                    : [...teacherForm.campus, campus];
                  setTeacherForm({ ...teacherForm, campus: campuses });
                }}
              >
                {campus}
              </button>
            ))}
          </div>
        </div>
      </div>
      
      <div className="form-actions">
        <button className="btn-submit" onClick={handleAddTeacher}>
          添加教师
        </button>
        <button className="btn-reset" onClick={() => setTeacherForm({
          name: '',
          subjects: [],
          campus: ['高马', '本校'],
          hourlyRate: 300
        })}>
          重置
        </button>
      </div>
    </div>
  );

  /**
   * Render classroom form
   */
  const renderClassroomForm = () => (
    <div className="manual-form classroom-form">
      <h4>添加教室</h4>
      <div className="form-grid">
        <div className="form-group">
          <label>教室名称 *</label>
          <input
            type="text"
            value={classroomForm.name}
            onChange={(e) => setClassroomForm({ ...classroomForm, name: e.target.value })}
            placeholder="例如：A101"
          />
        </div>
        
        <div className="form-group">
          <label>校区 *</label>
          <select
            value={classroomForm.campus}
            onChange={(e) => setClassroomForm({ ...classroomForm, campus: e.target.value })}
          >
            {CAMPUSES.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
        
        <div className="form-group">
          <label>容量</label>
          <input
            type="number"
            min="1"
            max="50"
            value={classroomForm.capacity}
            onChange={(e) => setClassroomForm({ ...classroomForm, capacity: parseInt(e.target.value) || 2 })}
          />
        </div>
        
        <div className="form-group">
          <label>类型</label>
          <select
            value={classroomForm.type}
            onChange={(e) => setClassroomForm({ ...classroomForm, type: e.target.value })}
          >
            <option value="1v1教室">1v1教室</option>
            <option value="班课教室">班课教室</option>
            <option value="自习室">自习室</option>
          </select>
        </div>
      </div>
      
      <div className="form-actions">
        <button className="btn-submit" onClick={handleAddClassroom}>
          添加教室
        </button>
        <button className="btn-reset" onClick={() => setClassroomForm({
          name: '',
          campus: '高马',
          capacity: 2,
          type: '1v1教室'
        })}>
          重置
        </button>
      </div>
    </div>
  );

  return (
    <div className="data-import-panel">
      <div className="panel-header">
        <h2>数据导入</h2>
        <p className="panel-subtitle">
          支持Excel批量导入或手动单个添加
        </p>
      </div>

      {/* Import mode selector */}
      <div className="import-mode-selector">
        <button
          className={`mode-btn ${importMode === 'excel' ? 'active' : ''}`}
          onClick={() => setImportMode('excel')}
        >
          Excel粘贴导入
        </button>
        <button
          className={`mode-btn ${importMode === 'manual' ? 'active' : ''}`}
          onClick={() => setImportMode('manual')}
        >
          手动表单输入
        </button>
      </div>

      {/* Content based on import mode */}
      <div className="import-content">
        {importMode === 'excel' ? renderExcelMode() : renderManualMode()}
      </div>
    </div>
  );
};

export default DataImportPanel;
