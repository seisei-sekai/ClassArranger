/**
 * Data Generator Component
 * 数据生成器组件
 * 
 * Generate random teachers and students for testing
 */

import React, { useState } from 'react';
import { 
  createTeacher, 
  createStudent,
  SUBJECTS,
  TIME_GRANULARITY 
} from '../utils/dataStructures.js';

const DataGenerator = ({ onGenerate, granularity = TIME_GRANULARITY.FIVE_MIN }) => {
  const [teacherCount, setTeacherCount] = useState(10);
  const [studentCount, setStudentCount] = useState(20);
  const [loading, setLoading] = useState(false);

  const firstNames = ['王', '李', '张', '刘', '陈', '杨', '赵', '黄', '周', '吴'];
  const teacherSuffixes = ['老师', '教授', '讲师'];
  const studentSuffixes = ['同学'];

  /**
   * Generate random teachers
   * 生成随机教师
   */
  const generateTeachers = (count) => {
    const teachers = [];
    const usedNames = new Set();

    for (let i = 0; i < count; i++) {
      let name;
      do {
        const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
        const number = Math.floor(Math.random() * 100);
        const suffix = teacherSuffixes[Math.floor(Math.random() * teacherSuffixes.length)];
        name = `${firstName}${number}${suffix}`;
      } while (usedNames.has(name));
      usedNames.add(name);

      // Random subjects (1-3 subjects per teacher)
      const numSubjects = 1 + Math.floor(Math.random() * 3);
      const shuffledSubjects = [...SUBJECTS].sort(() => Math.random() - 0.5);
      const subjects = shuffledSubjects.slice(0, numSubjects);

      // Random available time slots (2-5 slots per teacher)
      const numSlots = 2 + Math.floor(Math.random() * 4);
      const availableTimeSlots = [];
      
      for (let j = 0; j < numSlots; j++) {
        const day = Math.floor(Math.random() * 7);
        const startHour = 9 + Math.floor(Math.random() * 8); // 9-16
        const duration = 2 + Math.floor(Math.random() * 4); // 2-5 hours
        
        const startSlot = (startHour - 9) * granularity.slotsPerHour;
        const endSlot = Math.min(
          startSlot + duration * granularity.slotsPerHour,
          granularity.slotsPerDay
        );

        availableTimeSlots.push({
          day,
          startSlot,
          endSlot
        });
      }

      teachers.push(createTeacher({
        name,
        subjects,
        availableTimeSlots,
        hourlyRate: 200 + Math.floor(Math.random() * 300), // 200-500
        maxHoursPerWeek: 20 + Math.floor(Math.random() * 20) // 20-40
      }));
    }

    return teachers;
  };

  /**
   * Generate random students
   * 生成随机学生
   */
  const generateStudents = (count) => {
    const students = [];
    const usedNames = new Set();

    for (let i = 0; i < count; i++) {
      let name;
      do {
        const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
        const number = Math.floor(Math.random() * 100);
        const suffix = studentSuffixes[Math.floor(Math.random() * studentSuffixes.length)];
        name = `${firstName}${number}${suffix}`;
      } while (usedNames.has(name));
      usedNames.add(name);

      // Random subject
      const subject = SUBJECTS[Math.floor(Math.random() * SUBJECTS.length)];

      // Random course hours
      const totalHours = 10 + Math.floor(Math.random() * 30); // 10-40 hours
      const usedHours = Math.floor(Math.random() * (totalHours * 0.3)); // 0-30% used

      // Random valid period (1-6 months from now)
      const startDate = new Date();
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + 1 + Math.floor(Math.random() * 5));

      // Random constraints
      // Allowed days (2-5 days)
      const numDays = 2 + Math.floor(Math.random() * 4);
      const allDays = [1, 2, 3, 4, 5, 6]; // Mon-Sat (skip Sunday for realism)
      const shuffledDays = [...allDays].sort(() => Math.random() - 0.5);
      const allowedDays = new Set(shuffledDays.slice(0, numDays));

      // Allowed time ranges (1-3 ranges)
      const numRanges = 1 + Math.floor(Math.random() * 3);
      const allowedTimeRanges = [];
      
      Array.from(allowedDays).slice(0, numRanges).forEach(day => {
        const startHour = 9 + Math.floor(Math.random() * 6); // 9-14
        const duration = 3 + Math.floor(Math.random() * 5); // 3-7 hours
        
        const startSlot = (startHour - 9) * granularity.slotsPerHour;
        const endSlot = Math.min(
          startSlot + duration * granularity.slotsPerHour,
          granularity.slotsPerDay
        );

        allowedTimeRanges.push({
          day,
          startSlot,
          endSlot
        });
      });

      // Random frequency (1-3 times per week)
      const timesPerWeek = 1 + Math.floor(Math.random() * 3);
      const frequency = `${timesPerWeek}次/周`;

      // Random duration (1-3 hours)
      const durationHours = 1 + Math.floor(Math.random() * 3);
      const duration = durationHours * granularity.slotsPerHour;

      students.push(createStudent({
        name,
        subject,
        totalHours,
        usedHours,
        validPeriod: {
          start: startDate,
          end: endDate
        },
        constraints: {
          allowedDays,
          allowedTimeRanges,
          excludedTimeRanges: [], // Could add lunch breaks here
          frequency,
          duration
        }
      }));
    }

    return students;
  };

  /**
   * Handle generate button click
   * 处理生成按钮点击
   */
  const handleGenerate = () => {
    setLoading(true);
    
    // Simulate a small delay for better UX
    setTimeout(() => {
      const teachers = generateTeachers(teacherCount);
      const students = generateStudents(studentCount);
      
      onGenerate({ teachers, students });
      setLoading(false);
    }, 300);
  };

  /**
   * Generate preset scenarios
   * 生成预设场景
   */
  const handlePreset = (preset) => {
    setLoading(true);
    
    setTimeout(() => {
      let teachers, students;
      
      switch (preset) {
        case 'small':
          teachers = generateTeachers(5);
          students = generateStudents(10);
          break;
        case 'medium':
          teachers = generateTeachers(10);
          students = generateStudents(25);
          break;
        case 'large':
          teachers = generateTeachers(20);
          students = generateStudents(50);
          break;
        case 'stress':
          teachers = generateTeachers(50);
          students = generateStudents(100);
          break;
        default:
          teachers = generateTeachers(10);
          students = generateStudents(20);
      }
      
      onGenerate({ teachers, students });
      setLoading(false);
    }, 300);
  };

  return (
    <div className="data-generator">
      <div className="generator-section">
        <h4>自定义生成</h4>
        <div className="generator-controls">
          <div className="control-group">
            <label>教师数量</label>
            <input
              type="number"
              min="1"
              max="100"
              value={teacherCount}
              onChange={(e) => setTeacherCount(parseInt(e.target.value) || 1)}
              disabled={loading}
            />
          </div>
          <div className="control-group">
            <label>学生数量</label>
            <input
              type="number"
              min="1"
              max="200"
              value={studentCount}
              onChange={(e) => setStudentCount(parseInt(e.target.value) || 1)}
              disabled={loading}
            />
          </div>
          <button
            className="btn-generate"
            onClick={handleGenerate}
            disabled={loading}
          >
            {loading ? '生成中...' : '生成数据'}
          </button>
        </div>
      </div>

      <div className="generator-section">
        <h4>预设场景</h4>
        <div className="preset-buttons">
          <button
            className="btn-preset small"
            onClick={() => handlePreset('small')}
            disabled={loading}
          >
            <div className="preset-label">小规模</div>
            <div className="preset-desc">5教师 / 10学生</div>
          </button>
          <button
            className="btn-preset medium"
            onClick={() => handlePreset('medium')}
            disabled={loading}
          >
            <div className="preset-label">中规模</div>
            <div className="preset-desc">10教师 / 25学生</div>
          </button>
          <button
            className="btn-preset large"
            onClick={() => handlePreset('large')}
            disabled={loading}
          >
            <div className="preset-label">大规模</div>
            <div className="preset-desc">20教师 / 50学生</div>
          </button>
          <button
            className="btn-preset stress"
            onClick={() => handlePreset('stress')}
            disabled={loading}
          >
            <div className="preset-label">压力测试</div>
            <div className="preset-desc">50教师 / 100学生</div>
          </button>
        </div>
      </div>

      <div className="generator-info">
        <h4>生成说明</h4>
        <ul>
          <li>每个教师随机分配 1-3 个可教科目</li>
          <li>每个教师有 2-5 个可用时间段</li>
          <li>每个学生随机分配一个科目和课时</li>
          <li>学生可用时间为 2-5 天，每天 3-7 小时</li>
          <li>学生每周上课 1-3 次，每次 1-3 小时</li>
          <li>所有数据完全随机，可能存在无解情况</li>
        </ul>
      </div>
    </div>
  );
};

export default DataGenerator;
