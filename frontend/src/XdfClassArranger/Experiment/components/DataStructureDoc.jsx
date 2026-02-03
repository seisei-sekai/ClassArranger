/**
 * Data Structure Documentation Component
 * 数据结构文档组件
 * 
 * Explains the core data structures used in the scheduling system
 */

import React, { useState } from 'react';
import { 
  createTeacher, 
  createStudent, 
  createCourse,
  createTimeSlot,
  TIME_GRANULARITY,
  SUBJECTS,
  DAY_NAMES_FULL
} from '../utils/dataStructures.js';

const DataStructureDoc = ({ granularity = TIME_GRANULARITY.FIVE_MIN }) => {
  const [activeTab, setActiveTab] = useState('teacher');
  
  // Example data
  const exampleTeacher = createTeacher({
    name: '张老师',
    subjects: ['数学', '物理'],
    availableTimeSlots: [
      { day: 1, startSlot: 0, endSlot: 48 },   // Monday 9:00-13:00
      { day: 3, startSlot: 48, endSlot: 96 }   // Wednesday 13:00-17:00
    ],
    hourlyRate: 300,
    maxHoursPerWeek: 30
  });
  
  const exampleStudent = createStudent({
    name: '李同学',
    subject: '数学',
    totalHours: 20,
    usedHours: 5,
    validPeriod: {
      start: new Date('2026-02-01'),
      end: new Date('2026-06-30')
    },
    constraints: {
      allowedDays: new Set([1, 3, 5]), // Mon, Wed, Fri
      allowedTimeRanges: [
        { day: 1, startSlot: 48, endSlot: 96 },  // Monday 13:00-17:00
        { day: 3, startSlot: 48, endSlot: 96 },  // Wednesday 13:00-17:00
        { day: 5, startSlot: 24, endSlot: 72 }   // Friday 11:00-15:00
      ],
      frequency: '2次/周',
      duration: 24  // 2 hours
    }
  });
  
  const exampleCourse = createCourse({
    student: exampleStudent,
    teacher: exampleTeacher,
    subject: '数学',
    timeSlot: createTimeSlot({
      day: 1,
      startSlot: 48,
      endSlot: 72,
      granularity
    }),
    isRecurring: true,
    recurrencePattern: 'weekly'
  });

  const structures = {
    teacher: {
      title: '教师 (Teacher)',
      description: '教师是提供教学服务的资源，有特定的可教科目和可用时间。',
      fields: [
        { name: 'id', type: 'string', desc: '唯一标识符，自动生成' },
        { name: 'name', type: 'string', desc: '教师姓名' },
        { name: 'subjects', type: 'string[]', desc: '可教科目列表，如 ["数学", "物理"]' },
        { name: 'availableTimeSlots', type: 'TimeSlot[]', desc: '可用时间段数组' },
        { name: 'hourlyRate', type: 'number', desc: '时薪（元/小时）' },
        { name: 'maxHoursPerWeek', type: 'number', desc: '每周最大授课小时数' }
      ],
      example: exampleTeacher,
      color: '#4CAF50'
    },
    student: {
      title: '学生 (Student)',
      description: '学生是需要课程的对象，有课时限制和时间约束。',
      fields: [
        { name: 'id', type: 'string', desc: '唯一标识符，自动生成' },
        { name: 'name', type: 'string', desc: '学生姓名' },
        { name: 'subject', type: 'string', desc: '需要学习的科目' },
        { name: 'totalHours', type: 'number', desc: '购买的总课时数' },
        { name: 'usedHours', type: 'number', desc: '已使用的课时数' },
        { name: 'remainingHours', type: 'number', desc: '剩余课时数（自动计算）' },
        { name: 'validPeriod', type: 'object', desc: '课时有效期 {start: Date, end: Date}' },
        { name: 'constraints', type: 'Constraints', desc: '排课约束条件' }
      ],
      example: exampleStudent,
      color: '#2196F3'
    },
    course: {
      title: '课程 (Course)',
      description: '课程是排课结果，表示一次已安排的上课时间。',
      fields: [
        { name: 'id', type: 'string', desc: '唯一标识符，自动生成' },
        { name: 'student', type: 'Student', desc: '上课学生对象' },
        { name: 'teacher', type: 'Teacher', desc: '授课教师对象' },
        { name: 'subject', type: 'string', desc: '课程科目' },
        { name: 'timeSlot', type: 'TimeSlot', desc: '上课时间段' },
        { name: 'isRecurring', type: 'boolean', desc: '是否为循环课程' },
        { name: 'recurrencePattern', type: 'string', desc: '循环模式："weekly" 或 "biweekly"' }
      ],
      example: exampleCourse,
      color: '#FF9800'
    },
    timeSlot: {
      title: '时间槽 (TimeSlot)',
      description: `时间槽表示一段时间，使用${granularity.label}为单位。`,
      fields: [
        { name: 'day', type: 'number', desc: '星期几 (0=周日, 1=周一, ..., 6=周六)' },
        { name: 'startSlot', type: 'number', desc: `开始槽位索引 (0 = 9:00, 每格${granularity.label})` },
        { name: 'endSlot', type: 'number', desc: `结束槽位索引` },
        { name: 'duration', type: 'number', desc: '持续时长（槽位数）' },
        { name: 'start', type: 'string', desc: '开始时间字符串，如 "09:00"' },
        { name: 'end', type: 'string', desc: '结束时间字符串，如 "11:00"' }
      ],
      example: createTimeSlot({ day: 1, startSlot: 24, endSlot: 48, granularity }),
      color: '#9C27B0'
    },
    constraints: {
      title: '约束 (Constraints)',
      description: '约束定义了学生的排课限制条件。',
      fields: [
        { name: 'allowedDays', type: 'Set<number>', desc: '可上课的星期集合' },
        { name: 'allowedTimeRanges', type: 'TimeSlot[]', desc: '允许的时间段数组' },
        { name: 'excludedTimeRanges', type: 'TimeSlot[]', desc: '排除的时间段数组' },
        { name: 'frequency', type: 'string', desc: '上课频率，如 "2次/周"' },
        { name: 'duration', type: 'number', desc: '每次课程时长（槽位数）' },
        { name: 'preferredTeacher', type: 'string', desc: '指定教师ID（可选）' }
      ],
      example: exampleStudent.constraints,
      color: '#F44336'
    }
  };

  const currentStructure = structures[activeTab];

  return (
    <div className="data-structure-doc">
      <div className="doc-header">
        <h2>数据结构说明</h2>
        <p className="doc-subtitle">
          1v1排课系统使用以下核心数据结构来表示教师、学生、课程和时间信息
        </p>
      </div>

      <div className="doc-tabs">
        {Object.keys(structures).map(key => (
          <button
            key={key}
            className={`doc-tab ${activeTab === key ? 'active' : ''}`}
            onClick={() => setActiveTab(key)}
            style={{
              borderBottomColor: activeTab === key ? structures[key].color : 'transparent'
            }}
          >
            {structures[key].title}
          </button>
        ))}
      </div>

      <div className="doc-content">
        <div className="structure-header" style={{ borderLeftColor: currentStructure.color }}>
          <h3>{currentStructure.title}</h3>
          <p className="structure-desc">{currentStructure.description}</p>
        </div>

        <div className="structure-fields">
          <h4>字段说明</h4>
          <table className="fields-table">
            <thead>
              <tr>
                <th>字段名</th>
                <th>类型</th>
                <th>说明</th>
              </tr>
            </thead>
            <tbody>
              {currentStructure.fields.map((field, idx) => (
                <tr key={idx}>
                  <td className="field-name">
                    <code>{field.name}</code>
                  </td>
                  <td className="field-type">
                    <code>{field.type}</code>
                  </td>
                  <td className="field-desc">{field.desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="structure-example">
          <h4>示例数据</h4>
          <div className="example-box">
            <pre>{JSON.stringify(currentStructure.example, (key, value) => {
              // Convert Set to Array for display
              if (value instanceof Set) {
                return Array.from(value);
              }
              // Format dates
              if (value instanceof Date) {
                return value.toISOString().split('T')[0];
              }
              return value;
            }, 2)}</pre>
          </div>
        </div>

        {activeTab === 'timeSlot' && (
          <div className="structure-notes">
            <h4>时间槽计算说明</h4>
            <div className="note-box">
              <p><strong>时间粒度：</strong>{granularity.label}</p>
              <p><strong>每小时槽位数：</strong>{granularity.slotsPerHour}个</p>
              <p><strong>每天槽位数：</strong>{granularity.slotsPerDay}个 (9:00-21:30)</p>
              <p><strong>示例计算：</strong></p>
              <ul>
                <li>槽位 0 = 9:00</li>
                <li>槽位 {granularity.slotsPerHour} = 10:00</li>
                <li>槽位 {granularity.slotsPerHour * 2} = 11:00</li>
                <li>槽位 {granularity.slotsPerDay} = 21:30</li>
              </ul>
            </div>
          </div>
        )}

        {activeTab === 'constraints' && (
          <div className="structure-notes">
            <h4>约束使用说明</h4>
            <div className="note-box">
              <p><strong>allowedDays：</strong>使用 Set 存储，快速查找某天是否可用</p>
              <p><strong>allowedTimeRanges：</strong>定义所有可上课的时间段</p>
              <p><strong>excludedTimeRanges：</strong>从允许时间中排除的时间段（如午休）</p>
              <p><strong>frequency：</strong>建议格式 "N次/周" 或 "N次/月"</p>
              <p><strong>duration：</strong>以槽位为单位，如 24 = 2小时（5分钟粒度）</p>
            </div>
          </div>
        )}
      </div>

      <div className="doc-footer">
        <div className="complexity-info">
          <h4>数据结构选择理由</h4>
          <div className="reason-grid">
            <div className="reason-card">
              <h5>时间槽使用整数索引</h5>
              <p>
                使用整数槽位而非时间字符串，可以快速进行时间比较和重叠检测。
                时间复杂度从 O(n) 字符串解析降低到 O(1) 整数比较。
              </p>
            </div>
            <div className="reason-card">
              <h5>Set存储可用天数</h5>
              <p>
                使用 Set 而非数组存储星期，查找操作从 O(n) 优化到 O(1)，
                在排课算法中频繁检查某天是否可用时性能更好。
              </p>
            </div>
            <div className="reason-card">
              <h5>嵌套对象引用</h5>
              <p>
                Course 直接引用完整的 Student 和 Teacher 对象，避免了多次查找，
                便于访问相关信息，但需注意深拷贝以防止意外修改。
              </p>
            </div>
            <div className="reason-card">
              <h5>可配置时间粒度</h5>
              <p>
                支持5分钟或15分钟粒度，小粒度提供更精确的时间控制，
                大粒度减少计算量。用户可根据需求权衡精度与性能。
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataStructureDoc;
