import React, { useState, useRef, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';
import GeneticAlgorithm from './GeneticAlgorithm';
import { useTestData } from '../TestDataContext';
import {
  EXCEL_COLUMNS,
  TEACHER_COLUMNS,
  JAPANESE_COLORS,
  STANDARD_START,
  getRandomJapaneseColor
} from './utils/constants';
import { parseStudentRows } from './utils/studentParser';
import { parseTeacherRows } from './utils/teacherParser';
import {
  generateAvailabilityEvents,
  getStudentsForTimeSlot
} from './utils/availabilityCalculator';
import './Function.css';

const Function = () => {
  const calendarRef = useRef(null);
  const { showTestData } = useTestData();
  const [showEventModal, setShowEventModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [modalPosition, setModalPosition] = useState({ x: 0, y: 0 });
  const [showAIPanel, setShowAIPanel] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [aiResult, setAIResult] = useState(null);
  const [showTutorial, setShowTutorial] = useState(false);

  // 学生列表状态
  const [students, setStudents] = useState([]);
  const [studentCounter, setStudentCounter] = useState(0);
  const [editingStudent, setEditingStudent] = useState(null); // 当前编辑的学生
  const [editingRawData, setEditingRawData] = useState(''); // 编辑中的原始数据

  // 教师列表状态
  const [teachers, setTeachers] = useState([]);
  const [teacherCounter, setTeacherCounter] = useState(0);
  const [editingTeacher, setEditingTeacher] = useState(null); // 当前编辑的教师
  const [editingTeacherRawData, setEditingTeacherRawData] = useState(''); // 编辑中的教师原始数据

  // 添加学生
  const handleAddStudent = () => {
    const newLetter = String.fromCharCode(65 + studentCounter); // A, B, C...
    const newStudent = {
      id: `student-${Date.now()}`,
      name: `学生${newLetter}`,
      color: JAPANESE_COLORS[studentCounter % JAPANESE_COLORS.length],
      rawData: '', // 存储Excel原始数据
      parsedData: null, // 解析后的数据（后续使用）
      showAvailability: false // 是否在日历上显示该学生的可用性
    };
    setStudents([...students, newStudent]);
    setStudentCounter(studentCounter + 1);
  };

  // 删除学生
  const handleDeleteStudent = (studentId) => {
    setStudents(students.filter(s => s.id !== studentId));
  };

  // 切换单个学生的可用性显示
  const toggleStudentAvailability = (studentId) => {
    setStudents(students.map(s =>
      s.id === studentId ? { ...s, showAvailability: !s.showAvailability } : s
    ));
  };

  // 全选/取消全选学生可用性
  const toggleAllStudentsAvailability = () => {
    const hasDataStudents = students.filter(s => s.rawData);
    if (hasDataStudents.length === 0) return;

    // 如果有任何一个学生未显示，则全部显示；否则全部隐藏
    const anyHidden = hasDataStudents.some(s => !s.showAvailability);
    setStudents(students.map(s =>
      s.rawData ? { ...s, showAvailability: anyHidden } : s
    ));
  };

  // 开始编辑学生
  const handleEditStudent = (student) => {
    setEditingStudent(student);
    setEditingRawData(student.rawData || '');
  };

  // 保存编辑
  const handleSaveEdit = () => {
    if (editingStudent) {
      const parsedStudents = parseStudentRows(editingRawData);

      if (parsedStudents.length === 0) {
        // 没有有效数据
        setEditingStudent(null);
        setEditingRawData('');
        return;
      }

      // 第一个学生更新到当前编辑的卡片
      const firstStudent = parsedStudents[0];
      let updatedStudents = students.map(s =>
        s.id === editingStudent.id
          ? { ...s, rawData: firstStudent.rawData, name: firstStudent.name }
          : s
      );

      // 如果有多个学生，创建额外的卡片
      if (parsedStudents.length > 1) {
        const additionalStudents = parsedStudents.slice(1).map((student, index) => ({
          id: `student-${Date.now()}-${index}`,
          name: student.name,
          color: JAPANESE_COLORS[(studentCounter + index + 1) % JAPANESE_COLORS.length],
          rawData: student.rawData,
          parsedData: null,
          showAvailability: false
        }));

        updatedStudents = [...updatedStudents, ...additionalStudents];
        setStudentCounter(studentCounter + parsedStudents.length - 1);
      }

      setStudents(updatedStudents);
      setEditingStudent(null);
      setEditingRawData('');
    }
  };

  // 取消编辑
  const handleCancelEdit = () => {
    setEditingStudent(null);
    setEditingRawData('');
  };

  // ==================== 教师相关函数 ====================

  // 添加教师
  const handleAddTeacher = () => {
    const newLetter = String.fromCharCode(65 + teacherCounter); // A, B, C...
    const newTeacher = {
      id: `teacher-${Date.now()}`,
      name: `教师${newLetter}`,
      color: JAPANESE_COLORS[teacherCounter % JAPANESE_COLORS.length],
      rawData: '', // 存储Excel原始数据
      parsedData: null, // 解析后的数据（后续使用）
      showAvailability: false // 是否在日历上显示该教师的可用性
    };
    setTeachers([...teachers, newTeacher]);
    setTeacherCounter(teacherCounter + 1);
  };

  // 删除教师
  const handleDeleteTeacher = (teacherId) => {
    setTeachers(teachers.filter(t => t.id !== teacherId));
  };

  // 切换单个教师的可用性显示
  const toggleTeacherAvailability = (teacherId) => {
    setTeachers(teachers.map(t =>
      t.id === teacherId ? { ...t, showAvailability: !t.showAvailability } : t
    ));
  };

  // 全选/取消全选教师可用性
  const toggleAllTeachersAvailability = () => {
    const hasDataTeachers = teachers.filter(t => t.rawData);
    if (hasDataTeachers.length === 0) return;

    // 如果有任何一个教师未显示，则全部显示；否则全部隐藏
    const anyHidden = hasDataTeachers.some(t => !t.showAvailability);
    setTeachers(teachers.map(t =>
      t.rawData ? { ...t, showAvailability: anyHidden } : t
    ));
  };

  // 开始编辑教师
  const handleEditTeacher = (teacher) => {
    setEditingTeacher(teacher);
    setEditingTeacherRawData(teacher.rawData || '');
  };

  // 保存教师编辑
  const handleSaveTeacherEdit = () => {
    if (editingTeacher) {
      const parsedTeachers = parseTeacherRows(editingTeacherRawData);

      if (parsedTeachers.length === 0) {
        // 没有有效数据
        setEditingTeacher(null);
        setEditingTeacherRawData('');
        return;
      }

      // 第一个教师更新到当前编辑的卡片
      const firstTeacher = parsedTeachers[0];
      let updatedTeachers = teachers.map(t =>
        t.id === editingTeacher.id
          ? { ...t, rawData: firstTeacher.rawData, name: firstTeacher.name }
          : t
      );

      // 如果有多个教师，创建额外的卡片
      if (parsedTeachers.length > 1) {
        const additionalTeachers = parsedTeachers.slice(1).map((teacher, index) => ({
          id: `teacher-${Date.now()}-${index}`,
          name: teacher.name,
          color: JAPANESE_COLORS[(teacherCounter + index + 1) % JAPANESE_COLORS.length],
          rawData: teacher.rawData,
          parsedData: null,
          showAvailability: false
        }));

        updatedTeachers = [...updatedTeachers, ...additionalTeachers];
        setTeacherCounter(teacherCounter + parsedTeachers.length - 1);
      }

      setTeachers(updatedTeachers);
      setEditingTeacher(null);
      setEditingTeacherRawData('');
    }
  };

  // 取消教师编辑
  const handleCancelTeacherEdit = () => {
    setEditingTeacher(null);
    setEditingTeacherRawData('');
  };

  // 可用性事件状态
  const [availabilityEvents, setAvailabilityEvents] = useState([]);
  const [showAvailability, setShowAvailability] = useState(true);
  const [calendarDate, setCalendarDate] = useState(new Date());

  // 可用性提示框状态
  const [availabilityPanel, setAvailabilityPanel] = useState({
    show: false,
    students: [],
    timeSlot: '',
    date: '',
    slotIndex: null,
    dayOfWeek: null
  });

  // 刷新可用性事件
  const refreshAvailabilityEvents = () => {
    if (showAvailability) {
      // 只显示被选中的学生的可用性
      const selectedStudents = students.filter(s => s.rawData && s.showAvailability);
      if (selectedStudents.length > 0) {
        const events = generateAvailabilityEvents(selectedStudents, calendarRef);
        setAvailabilityEvents(events);
      } else {
        setAvailabilityEvents([]);
      }
    } else {
      setAvailabilityEvents([]);
    }
  };

  // 当学生数据或可用性开关变化时，重新计算可用性
  useEffect(() => {
    refreshAvailabilityEvents();
  }, [students, showAvailability, calendarDate]);


  // 日历日期变化处理
  const handleDatesSet = (dateInfo) => {
    setCalendarDate(dateInfo.start);
  };

  // 获取学生在特定时间段的可用性详情
  // 处理时间槽点击
  const handleDateClick = (info) => {
    const clickedDate = new Date(info.date);
    const dayOfWeek = clickedDate.getDay();
    const hourFloat = clickedDate.getHours() + clickedDate.getMinutes() / 60;
    const slotIndex = Math.floor((hourFloat - STANDARD_START) / 0.5);

    // 对齐到整小时
    const hourStart = Math.floor(hourFloat);
    const blockStart = new Date(clickedDate);
    blockStart.setHours(hourStart, 0, 0, 0);
    const blockEnd = new Date(blockStart);
    blockEnd.setHours(hourStart + 1, 0, 0, 0);

    // 获取这一小时内所有可用学生（包括两个30分钟槽）
    const slot1Index = Math.floor((hourStart - STANDARD_START) / 0.5);
    const slot2Index = slot1Index + 1;

    const students1 = getStudentsForTimeSlot(students, dayOfWeek, slot1Index);
    const students2 = getStudentsForTimeSlot(students, dayOfWeek, slot2Index);

    // 合并两个槽的学生，去重
    const allStudentsMap = new Map();
    [...students1, ...students2].forEach(student => {
      if (!allStudentsMap.has(student.name)) {
        allStudentsMap.set(student.name, student);
      }
    });
    const availableStudents = Array.from(allStudentsMap.values());

    if (availableStudents.length > 0) {
      const month = blockStart.getMonth() + 1;
      const day = blockStart.getDate();
      const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
      const weekdayStr = weekdays[dayOfWeek];
      const startHour = blockStart.getHours();
      const endHour = blockEnd.getHours();

      const timeSlot = `${startHour}:00 - ${endHour}:00`;
      const dateStr = `${month}月${day}日 ${weekdayStr}`;

      setAvailabilityPanel({
        show: true,
        students: availableStudents,
        timeSlot: timeSlot,
        date: dateStr,
        slotIndex: slot1Index,
        dayOfWeek: dayOfWeek
      });
    }
  };

  // 关闭可用性面板
  const handleCloseAvailabilityPanel = () => {
    setAvailabilityPanel({
      show: false,
      students: [],
      timeSlot: '',
      date: '',
      slotIndex: null,
      dayOfWeek: null
    });
  };


  // 示例课程数据
  const sampleEvents = [
    {
      id: 'sample-1',
      title: '面试练习 - 张三',
      start: '2025-12-10T10:00:00',
      end: '2025-12-10T12:00:00',
      backgroundColor: '#5A6C7D',
      borderColor: '#5A6C7D',
      textColor: '#FFFFFF',
      extendedProps: {
        student: '张三',
        teacher: '李老师',
        campus: '旗舰校',
        room: '个别指导室1',
        description: '1v1大学面试练习'
      }
    },
    {
      id: 'sample-2',
      title: '志望理由书 - 王五',
      start: '2025-12-12T14:00:00',
      end: '2025-12-12T16:00:00',
      backgroundColor: '#6B7C6E',
      borderColor: '#6B7C6E',
      textColor: '#FFFFFF',
      extendedProps: {
        student: '王五',
        teacher: '赵老师',
        campus: '东京本校',
        room: '板二101',
        description: '1v1志望理由书指导'
      }
    },
    {
      id: 'sample-3',
      title: 'EJU日语 - 李四',
      start: '2025-12-15T09:00:00',
      end: '2025-12-15T11:00:00',
      backgroundColor: '#A08B7A',
      borderColor: '#A08B7A',
      textColor: '#FFFFFF',
      extendedProps: {
        student: '李四',
        teacher: '孙老师',
        campus: '旗舰校',
        room: '个别指导室3',
        description: '1v1EJU日语辅导'
      }
    }
  ];

  // AI排课数据配置
  const aiScheduleData = {
    teachers: ['李老师', '赵老师', '孙老师', '钱老师', '周老师', '吴老师'],
    students: ['张三', '王五', '李四', '赵六', '孙七', '周八', '吴九', '郑十'],
    rooms: [
      { id: 'r1', name: '个别指导室1', campus: '旗舰校', capacity: 2 },
      { id: 'r2', name: '个别指导室2', campus: '旗舰校', capacity: 2 },
      { id: 'r3', name: '个别指导室3', campus: '旗舰校', capacity: 2 },
      { id: 'r4', name: '板二101', campus: '东京本校', capacity: 4 },
      { id: 'r5', name: '板二102', campus: '东京本校', capacity: 4 },
      { id: 'r6', name: '板二103', campus: '东京本校', capacity: 4 }
    ],
    courses: [
      { id: 'c1', name: '1v1大学面试练习', teacher: '李老师', student: '张三', duration: 2, color: '#5A6C7D' },
      { id: 'c2', name: '1v1志望理由书指导', teacher: '赵老师', student: '王五', duration: 2, color: '#6B7C6E' },
      { id: 'c3', name: '1v1EJU日语', teacher: '孙老师', student: '李四', duration: 2, color: '#A08B7A' },
      { id: 'c4', name: '1v1校内考小论文', teacher: '钱老师', student: '赵六', duration: 2, color: '#7A8C9E' },
      { id: 'c5', name: '1v1数学辅导', teacher: '周老师', student: '孙七', duration: 2, color: '#8B7C6E' },
      { id: 'c6', name: '1v1英语口语', teacher: '吴老师', student: '周八', duration: 2, color: '#6E7C8B' },
      { id: 'c7', name: '1v1日语听力', teacher: '李老师', student: '吴九', duration: 2, color: '#9E7676' },
      { id: 'c8', name: '1v1综合辅导', teacher: '赵老师', student: '郑十', duration: 2, color: '#7A9E76' }
    ],
    timeSlots: [
      { day: '周一', start: '09:00' },
      { day: '周一', start: '11:00' },
      { day: '周一', start: '14:00' },
      { day: '周一', start: '16:00' },
      { day: '周一', start: '18:00' },
      { day: '周二', start: '09:00' },
      { day: '周二', start: '11:00' },
      { day: '周二', start: '14:00' },
      { day: '周二', start: '16:00' },
      { day: '周二', start: '18:00' },
      { day: '周三', start: '09:00' },
      { day: '周三', start: '11:00' },
      { day: '周三', start: '14:00' },
      { day: '周三', start: '16:00' },
      { day: '周三', start: '18:00' },
      { day: '周四', start: '09:00' },
      { day: '周四', start: '11:00' },
      { day: '周四', start: '14:00' },
      { day: '周四', start: '16:00' },
      { day: '周四', start: '18:00' },
      { day: '周五', start: '09:00' },
      { day: '周五', start: '11:00' },
      { day: '周五', start: '14:00' },
      { day: '周五', start: '16:00' },
      { day: '周五', start: '18:00' }
    ]
  };

  const [events, setEvents] = useState([]);

  // 监听测试数据开关，自动添加/移除示例课程
  useEffect(() => {
    if (showTestData) {
      // 只添加不是教程的示例数据
      const currentNonSampleEvents = events.filter(e =>
        !e.id.startsWith('sample-') && !e.id.startsWith('tutorial-')
      );
      setEvents([...currentNonSampleEvents, ...sampleEvents]);
    } else {
      // 移除示例数据，保留用户创建的和教程数据
      setEvents(events.filter(e => !e.id.startsWith('sample-')));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showTestData]);

  // 已禁用：添加课程功能
  const handleDateSelect = (selectInfo) => {
    // 功能已禁用，不再允许通过点击/拖拽添加课程
    selectInfo.view.calendar.unselect();
  };

  const handleEventClick = (clickInfo) => {
    const rect = clickInfo.el.getBoundingClientRect();
    setModalPosition({
      x: rect.left + rect.width / 2,
      y: rect.top
    });
    setSelectedEvent(clickInfo.event);
    setShowEventModal(true);
  };

  const handleEventDoubleClick = (event) => {
    const newTitle = prompt('修改课程名称:', event.title);
    if (newTitle && newTitle !== event.title) {
      event.setProp('title', newTitle);
      setEvents(events.map(e =>
        e.id === event.id ? { ...e, title: newTitle } : e
      ));
    }
  };

  const handleDeleteEvent = () => {
    if (selectedEvent) {
      selectedEvent.remove();
      setEvents(events.filter(e => e.id !== selectedEvent.id));
      setShowEventModal(false);
      setSelectedEvent(null);
    }
  };

  const handleEventDrop = (info) => {
    info.el.style.transform = 'scale(1.05)';
    setTimeout(() => {
      info.el.style.transform = 'scale(1)';
    }, 200);

    setEvents(events.map(e => {
      if (e.id === info.event.id) {
        return {
          ...e,
          start: info.event.startStr,
          end: info.event.endStr
        };
      }
      return e;
    }));
  };

  const handleEventResize = (info) => {
    info.el.style.transform = 'scale(1.02)';
    setTimeout(() => {
      info.el.style.transform = 'scale(1)';
    }, 200);

    setEvents(events.map(e => {
      if (e.id === info.event.id) {
        return {
          ...e,
          start: info.event.startStr,
          end: info.event.endStr
        };
      }
      return e;
    }));
  };

  const closeModal = () => {
    setShowEventModal(false);
    setSelectedEvent(null);
  };

  // AI自动排课
  const handleAISchedule = async () => {
    setIsGenerating(true);
    setGenerationProgress(0);
    setShowAIPanel(true);

    // 模拟进度更新
    const progressInterval = setInterval(() => {
      setGenerationProgress(prev => {
        if (prev >= 95) {
          clearInterval(progressInterval);
          return 95;
        }
        return prev + Math.random() * 5;
      });
    }, 100);

    try {
      // 创建遗传算法实例
      const ga = new GeneticAlgorithm({
        populationSize: 50,
        mutationRate: 0.1,
        crossoverRate: 0.7,
        elitismRate: 0.1,
        maxGenerations: 100,
        ...aiScheduleData
      });

      // 运行遗传算法
      const result = await new Promise(resolve => {
        setTimeout(() => {
          resolve(ga.evolve());
        }, 100);
      });

      clearInterval(progressInterval);
      setGenerationProgress(100);

      // 转换为日历事件格式
      const calendarEvents = ga.convertToCalendarEvents(result.schedule);

      // 更新日历
      setEvents(calendarEvents);
      setAIResult(result);

      setTimeout(() => {
        setIsGenerating(false);
      }, 500);

    } catch (error) {
      console.error('AI排课失败:', error);
      clearInterval(progressInterval);
      setIsGenerating(false);
      alert('AI排课失败，请重试');
    }
  };

  // 清除所有课程
  const handleClearAll = () => {
    if (window.confirm('确定要清除所有课程吗？')) {
      setEvents([]);
      setAIResult(null);
    }
  };

  // 教程示例数据
  const tutorialEvents = [
    {
      id: 'tutorial-1',
      title: '步骤一：面试练习 - 张三',
      start: '2025-12-02T10:00:00',
      end: '2025-12-02T12:00:00',
      backgroundColor: '#5A6C7D',
      borderColor: '#5A6C7D',
      textColor: '#FFFFFF',
      extendedProps: {
        student: '张三',
        teacher: '李老师',
        campus: '旗舰校',
        room: '个别指导室1',
        description: '1v1大学面试练习（示例课程）'
      }
    },
    {
      id: 'tutorial-2',
      title: '步骤二：志望理由书 - 王五',
      start: '2025-12-03T14:00:00',
      end: '2025-12-03T16:00:00',
      backgroundColor: '#6B7C6E',
      borderColor: '#6B7C6E',
      textColor: '#FFFFFF',
      extendedProps: {
        student: '王五',
        teacher: '赵老师',
        campus: '东京本校',
        room: '板二101',
        description: '1v1志望理由书指导（示例课程）'
      }
    },
    {
      id: 'tutorial-3',
      title: '步骤三：EJU日语 - 李四',
      start: '2025-12-04T09:00:00',
      end: '2025-12-04T11:00:00',
      backgroundColor: '#A08B7A',
      borderColor: '#A08B7A',
      textColor: '#FFFFFF',
      extendedProps: {
        student: '李四',
        teacher: '孙老师',
        campus: '旗舰校',
        room: '个别指导室3',
        description: '1v1EJU日语辅导（示例课程）'
      }
    },
    {
      id: 'tutorial-4',
      title: '步骤四：小论文辅导 - 赵六',
      start: '2025-12-05T16:00:00',
      end: '2025-12-05T18:00:00',
      backgroundColor: '#7A8C9E',
      borderColor: '#7A8C9E',
      textColor: '#FFFFFF',
      extendedProps: {
        student: '赵六',
        teacher: '钱老师',
        campus: '旗舰校',
        room: '个别指导室2',
        description: '1v1校内考小论文（示例课程）'
      }
    }
  ];

  // 切换教程模式
  const handleToggleTutorial = () => {
    if (showTutorial) {
      // 清除教程数据
      setEvents(events.filter(e => !e.id.startsWith('tutorial-')));
      setShowTutorial(false);
    } else {
      // 加载教程数据
      const nonTutorialEvents = events.filter(e => !e.id.startsWith('tutorial-'));
      setEvents([...nonTutorialEvents, ...tutorialEvents]);
      setShowTutorial(true);
    }
  };

  return (
    <div className="function-page">
      <div className="function-header">
        <div className="header-left">
          <h1 className="function-title">排课功能</h1>
          <p className="function-subtitle">添加学生后，拖拽选择时间段创建课程</p>
        </div>
        <div className="header-actions">
          <button className="clear-all-btn" onClick={handleClearAll}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" stroke="currentColor" strokeWidth="2" />
            </svg>
            清空
          </button>
        </div>
      </div>

      {/* 教程说明面板 */}
      {showTutorial && (
        <div className="tutorial-panel">
          <div className="tutorial-header">
            <h3>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '8px' }}>
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M10 6h6M10 10h6M10 14h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
              使用教程
            </h3>
            <span className="tutorial-badge">示例模式</span>
          </div>
          <div className="tutorial-content">
            <div className="tutorial-intro">
              <p>欢迎使用排课系统！以下是四个示例课程，帮助您快速了解系统功能。</p>
            </div>
            <div className="tutorial-steps">
              <div className="tutorial-step">
                <div className="step-number">1</div>
                <div className="step-content">
                  <h4>查看课程详情</h4>
                  <p>点击日历上的课程可以查看详细信息（学生、教师、教室等）</p>
                  <div className="step-example">示例：点击"步骤一：面试练习"查看详情</div>
                </div>
              </div>
              <div className="tutorial-step">
                <div className="step-number">2</div>
                <div className="step-content">
                  <h4>拖拽调整时间</h4>
                  <p>按住课程不放，拖动到新的时间位置即可调整上课时间</p>
                  <div className="step-example">示例：拖动"步骤二：志望理由书"到其他时间</div>
                </div>
              </div>
              <div className="tutorial-step">
                <div className="step-number">3</div>
                <div className="step-content">
                  <h4>双击快速编辑</h4>
                  <p>双击课程标题可以快速修改课程名称</p>
                  <div className="step-example">示例：双击"步骤三：EJU日语"进行重命名</div>
                </div>
              </div>
              <div className="tutorial-step">
                <div className="step-number">4</div>
                <div className="step-content">
                  <h4>AI自动排课</h4>
                  <p>点击"AI自动排课"按钮，系统会自动生成无冲突的课表</p>
                  <div className="step-example">示例：点击右上角AI按钮，查看智能排课结果</div>
                </div>
              </div>
            </div>
            <div className="tutorial-footer">
              <div className="tutorial-tip">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '6px' }}>
                  <path d="M9 18h6M10 22h4M15 2a5 5 0 0 1 0 10 3.5 3.5 0 0 0-1 3H10a3.5 3.5 0 0 0-1-3 5 5 0 0 1 0-10h6z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <strong>提示：</strong>再次点击"隐藏教程"按钮可以清除所有示例课程
              </div>
            </div>
          </div>
        </div>
      )}

      {/* AI排课面板 */}
      {showAIPanel && (
        <div className="ai-panel">
          <div className="ai-panel-header">
            <h3>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '8px' }}>
                <circle cx="12" cy="5" r="2" stroke="currentColor" strokeWidth="2" />
                <circle cx="6" cy="12" r="2" stroke="currentColor" strokeWidth="2" />
                <circle cx="18" cy="12" r="2" stroke="currentColor" strokeWidth="2" />
                <circle cx="12" cy="19" r="2" stroke="currentColor" strokeWidth="2" />
                <path d="M12 7v4M10 11l-2 1M14 11l2 1M10 17l2-2M14 17l-2-2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
              AI排课引擎
            </h3>
            <button className="panel-close" onClick={() => setShowAIPanel(false)}>×</button>
          </div>
          <div className="ai-panel-body">
            {isGenerating ? (
              <div className="generation-progress">
                <div className="progress-label">遗传算法进化中...</div>
                <div className="progress-bar">
                  <div
                    className="progress-fill"
                    style={{ width: `${generationProgress}%` }}
                  ></div>
                </div>
                <div className="progress-text">{Math.round(generationProgress)}%</div>
              </div>
            ) : aiResult ? (
              <div className="generation-result">
                <div className="result-header">
                  <span className="result-badge success">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ marginRight: '6px', verticalAlign: 'middle' }}>
                      <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    排课完成
                  </span>
                  <span className="result-fitness">适应度: {aiResult.fitness.toFixed(2)}/100</span>
                </div>
                <div className="result-stats">
                  <div className="stat-item">
                    <span className="stat-label">进化代数</span>
                    <span className="stat-value">{aiResult.generations}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">课程数量</span>
                    <span className="stat-value">{aiResult.schedule.length}</span>
                  </div>
                </div>
                <div className="conflicts-section">
                  <h4>冲突分析</h4>
                  <div className="conflicts-grid">
                    <div className={`conflict-item ${aiResult.conflicts.teacherConflicts === 0 ? 'success' : 'warning'}`}>
                      <span className="conflict-icon">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                          <circle cx="12" cy="7" r="3" stroke="currentColor" strokeWidth="2" />
                          <path d="M3 21c0-3.5 4-6 9-6s9 2.5 9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                          <path d="M8 9l-3 3M16 9l3 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                        </svg>
                      </span>
                      <span className="conflict-label">教师冲突</span>
                      <span className="conflict-count">{aiResult.conflicts.teacherConflicts}</span>
                    </div>
                    <div className={`conflict-item ${aiResult.conflicts.studentConflicts === 0 ? 'success' : 'warning'}`}>
                      <span className="conflict-icon">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                          <circle cx="9" cy="7" r="3" stroke="currentColor" strokeWidth="2" />
                          <circle cx="17" cy="9" r="2.5" stroke="currentColor" strokeWidth="2" />
                          <path d="M2 21c0-3 3-5 7-5s7 2 7 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                          <path d="M15 21c0-2 2-3.5 4.5-3.5s4.5 1.5 4.5 3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                        </svg>
                      </span>
                      <span className="conflict-label">学生冲突</span>
                      <span className="conflict-count">{aiResult.conflicts.studentConflicts}</span>
                    </div>
                    <div className={`conflict-item ${aiResult.conflicts.roomConflicts === 0 ? 'success' : 'warning'}`}>
                      <span className="conflict-icon">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                          <rect x="3" y="4" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="2" />
                          <path d="M3 9h18M9 4v5M15 4v5" stroke="currentColor" strokeWidth="2" />
                          <circle cx="8" cy="14" r="1.5" fill="currentColor" />
                          <circle cx="12" cy="14" r="1.5" fill="currentColor" />
                          <circle cx="16" cy="14" r="1.5" fill="currentColor" />
                        </svg>
                      </span>
                      <span className="conflict-label">教室冲突</span>
                      <span className="conflict-count">{aiResult.conflicts.roomConflicts}</span>
                    </div>
                    <div className="conflict-item info">
                      <span className="conflict-icon">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                          <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
                          <path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                          <path d="M8 2h8M8 22h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                        </svg>
                      </span>
                      <span className="conflict-label">午休违规</span>
                      <span className="conflict-count">{aiResult.conflicts.lunchTimeViolations}</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="ai-intro">
                <p>基于遗传算法的智能排课系统</p>
                <ul>
                  <li>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ marginRight: '8px', verticalAlign: 'middle' }}>
                      <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    自动避免教师、学生、教室冲突
                  </li>
                  <li>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ marginRight: '8px', verticalAlign: 'middle' }}>
                      <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    优化课程时间分布
                  </li>
                  <li>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ marginRight: '8px', verticalAlign: 'middle' }}>
                      <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    考虑午休和合理作息时间
                  </li>
                  <li>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ marginRight: '8px', verticalAlign: 'middle' }}>
                      <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    50代种群进化，智能寻优
                  </li>
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 主内容区域：学生列表 + 日历 */}
      <div className="main-content-area">
        {/* 左侧学生列表区域 */}
        <div className="student-panel">
          <div className="student-panel-header">
            <button className="panel-action-btn add-btn" onClick={handleAddStudent}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="2" />
                <path d="M4 20c0-4 4-6 8-6s8 2 8 6" stroke="currentColor" strokeWidth="2" />
                <path d="M19 8v6M16 11h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
              添加学生
            </button>
            <button className="panel-action-btn batch-btn">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <circle cx="9" cy="7" r="3" stroke="currentColor" strokeWidth="2" />
                <circle cx="17" cy="9" r="2.5" stroke="currentColor" strokeWidth="2" />
                <path d="M3 20c0-3 3-5 6-5s6 2 6 5" stroke="currentColor" strokeWidth="2" />
                <path d="M15 20c0-2 1.5-3 3.5-3s3.5 1 3.5 3" stroke="currentColor" strokeWidth="2" />
                <path d="M20 5v4M18 7h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
              批量添加
            </button>
            <button className="panel-action-btn filter-btn">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              筛选条件
            </button>
            <button
              className={`panel-action-btn availability-btn ${showAvailability ? 'active' : ''}`}
              onClick={() => setShowAvailability(!showAvailability)}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2" />
                <path d="M3 10h18" stroke="currentColor" strokeWidth="2" />
                <path d="M9 4v6" stroke="currentColor" strokeWidth="2" />
                <path d="M15 4v6" stroke="currentColor" strokeWidth="2" />
                {showAvailability && (
                  <>
                    <rect x="6" y="13" width="4" height="3" fill="currentColor" opacity="0.5" />
                    <rect x="14" y="13" width="4" height="3" fill="currentColor" opacity="0.3" />
                    <rect x="6" y="17" width="4" height="3" fill="currentColor" opacity="0.4" />
                  </>
                )}
              </svg>
              可用时间
            </button>
            <button
              className="panel-action-btn toggle-all-btn"
              onClick={toggleAllStudentsAvailability}
              disabled={students.filter(s => s.rawData).length === 0}
              title="全选/取消全选学生可用性显示"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                {students.filter(s => s.rawData && s.showAvailability).length > 0 ? (
                  <>
                    <rect x="3" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2" fill="currentColor" opacity="0.3" />
                    <path d="M5 6.5l1.5 1.5L9 5.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <rect x="14" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2" fill="currentColor" opacity="0.3" />
                    <path d="M16 6.5l1.5 1.5L20 5.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <rect x="3" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2" fill="currentColor" opacity="0.3" />
                    <path d="M5 17.5l1.5 1.5L9 16.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <rect x="14" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2" fill="currentColor" opacity="0.3" />
                    <path d="M16 17.5l1.5 1.5L20 16.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </>
                ) : (
                  <>
                    <rect x="3" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2" />
                    <rect x="14" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2" />
                    <rect x="3" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2" />
                    <rect x="14" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2" />
                  </>
                )}
              </svg>
              全选显示
            </button>
          </div>

          {/* 可用性颜色图例 */}
          {showAvailability && students.filter(s => s.rawData).length > 0 && (
            <div className="availability-legend">
              <div className="legend-title">可用学生比例</div>
              <div className="legend-items">
                <div className="legend-item">
                  <div className="legend-color" style={{ backgroundColor: 'rgba(132, 169, 169, 0.5)' }}></div>
                  <span>0-20%</span>
                </div>
                <div className="legend-item">
                  <div className="legend-color" style={{ backgroundColor: 'rgba(104, 155, 137, 0.5)' }}></div>
                  <span>20-40%</span>
                </div>
                <div className="legend-item">
                  <div className="legend-color" style={{ backgroundColor: 'rgba(136, 153, 99, 0.6)' }}></div>
                  <span>40-60%</span>
                </div>
                <div className="legend-item">
                  <div className="legend-color" style={{ backgroundColor: 'rgba(183, 143, 93, 0.7)' }}></div>
                  <span>60-80%</span>
                </div>
                <div className="legend-item">
                  <div className="legend-color" style={{ backgroundColor: 'rgba(170, 109, 91, 0.85)' }}></div>
                  <span>80-100%</span>
                </div>
              </div>
            </div>
          )}

          <div className="student-list">
            {students.length === 0 ? (
              <div className="student-empty">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" style={{ opacity: 0.3 }}>
                  <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="2" />
                  <path d="M4 20c0-4 4-6 8-6s8 2 8 6" stroke="currentColor" strokeWidth="2" />
                </svg>
                <p>暂无学生</p>
                <p className="hint">点击"添加学生"开始</p>
              </div>
            ) : (
              students.map((student, index) => (
                <div
                  key={student.id}
                  className={`student-card ${student.rawData ? 'has-data' : ''}`}
                  style={{ borderLeftColor: student.color }}
                >
                  {/* 可用性显示toggle按钮 */}
                  {student.rawData && (
                    <button
                      className={`student-visibility-toggle ${student.showAvailability ? 'active' : ''}`}
                      onClick={() => toggleStudentAvailability(student.id)}
                      title={student.showAvailability ? '隐藏该学生可用性' : '显示该学生可用性'}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                        {student.showAvailability ? (
                          <>
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" strokeWidth="2" />
                            <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" fill="currentColor" />
                          </>
                        ) : (
                          <>
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" strokeWidth="2" />
                            <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" />
                            <line x1="2" y1="2" x2="22" y2="22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                          </>
                        )}
                      </svg>
                    </button>
                  )}
                  <div className="student-card-content">
                    <div className="student-avatar" style={{ backgroundColor: student.color }}>
                      {student.name.slice(-1)}
                    </div>
                    <div className="student-info">
                      <div className="student-name">{student.name}</div>
                      <div className="student-meta">
                        {student.rawData ? '已导入数据' : '待排课'}
                      </div>
                    </div>
                  </div>
                  <div className="student-card-actions">
                    <button
                      className="student-edit-btn"
                      onClick={() => handleEditStudent(student)}
                      title="编辑学生数据"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                        <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke="currentColor" strokeWidth="2" />
                        <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="2" />
                      </svg>
                    </button>
                    <button
                      className="student-delete-btn"
                      onClick={() => handleDeleteStudent(student.id)}
                      title="删除学生"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                        <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* 右侧日历区域 */}
        <div className="calendar-wrapper">
          {/* 可用性图例 */}
          {showAvailability && students.filter(s => s.rawData).length > 0 && (
            <div className="availability-legend">
              <span className="legend-title">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '6px' }}>
                  <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2" />
                  <path d="M3 10h18" stroke="currentColor" strokeWidth="2" />
                </svg>
                学生可用时间
              </span>
              <div className="legend-gradient">
                <span>少</span>
                <div className="legend-bar"></div>
                <span>多</span>
              </div>
              <span className="legend-count">
                {students.filter(s => s.rawData).length} 名学生
              </span>
            </div>
          )}
          <FullCalendar
            ref={calendarRef}
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
            initialView="timeGridWeek"
            initialDate="2025-12-01"
            headerToolbar={{
              left: 'prev,next today',
              center: 'title',
              right: 'dayGridMonth,timeGridWeek,timeGridDay'
            }}
            buttonText={{
              today: '今天',
              month: '月',
              week: '周',
              day: '日'
            }}
            views={{
              dayGridMonth: {
                titleFormat: { year: 'numeric', month: 'long' },
                dayHeaderFormat: { weekday: 'short' }
              },
              timeGridWeek: {
                titleFormat: { year: 'numeric', month: 'long', day: 'numeric' },
                dayHeaderFormat: { weekday: 'short', month: 'numeric', day: 'numeric' },
                slotLabelFormat: {
                  hour: 'numeric',
                  minute: '2-digit',
                  hour12: false
                }
              },
              timeGridDay: {
                titleFormat: { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' }
              }
            }}
            locale="zh-cn"
            timeZone="local"
            slotMinTime="07:00:00"
            slotMaxTime="22:00:00"
            slotDuration="00:30:00"
            slotLabelInterval="01:00:00"
            scrollTime="08:00:00"
            weekends={true}
            navLinks={true}
            editable={true}
            selectable={true}
            selectMirror={true}
            dayMaxEvents={true}
            nowIndicator={true}
            height="auto"
            contentHeight="auto"
            aspectRatio={1.8}
            events={[...events, ...availabilityEvents]}
            select={handleDateSelect}
            eventClick={handleEventClick}
            eventDrop={handleEventDrop}
            eventResize={handleEventResize}
            datesSet={handleDatesSet}
            dateClick={handleDateClick}
            eventContent={(eventInfo) => {
              const { event } = eventInfo;
              return (
                <div
                  className="apple-event-content"
                  onDoubleClick={() => handleEventDoubleClick(event)}
                >
                  <div className="event-time">{eventInfo.timeText}</div>
                  <div className="event-title">{event.title}</div>
                  {event.extendedProps.room && (
                    <div className="event-location">{event.extendedProps.room}</div>
                  )}
                </div>
              );
            }}
          />
        </div>

        {/* 右侧教师面板 */}
        <div className="teacher-panel">
          <div className="teacher-panel-header">
            <button className="panel-action-btn add-btn" onClick={handleAddTeacher}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="2" />
                <path d="M4 20c0-4 4-6 8-6s8 2 8 6" stroke="currentColor" strokeWidth="2" />
                <path d="M19 8v6M16 11h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
              添加教师
            </button>
            <button className="panel-action-btn batch-btn">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <circle cx="9" cy="7" r="3" stroke="currentColor" strokeWidth="2" />
                <circle cx="17" cy="9" r="2.5" stroke="currentColor" strokeWidth="2" />
                <path d="M3 20c0-3 3-5 6-5s6 2 6 5" stroke="currentColor" strokeWidth="2" />
                <path d="M15 20c0-2 1.5-3 3.5-3s3.5 1 3.5 3" stroke="currentColor" strokeWidth="2" />
                <path d="M20 5v4M18 7h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
              批量添加
            </button>
            <button className="panel-action-btn filter-btn">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              筛选条件
            </button>
            <button
              className={`panel-action-btn availability-btn ${false ? 'active' : ''}`}
              onClick={() => { }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2" />
                <path d="M3 10h18" stroke="currentColor" strokeWidth="2" />
                <path d="M9 4v6" stroke="currentColor" strokeWidth="2" />
                <path d="M15 4v6" stroke="currentColor" strokeWidth="2" />
              </svg>
              可用时间
            </button>
            <button
              className="panel-action-btn toggle-all-btn"
              onClick={toggleAllTeachersAvailability}
              disabled={teachers.filter(t => t.rawData).length === 0}
              title="全选/取消全选教师可用性显示"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                {teachers.filter(t => t.rawData && t.showAvailability).length > 0 ? (
                  <>
                    <rect x="3" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2" fill="currentColor" opacity="0.3" />
                    <path d="M5 6.5l1.5 1.5L9 5.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <rect x="14" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2" fill="currentColor" opacity="0.3" />
                    <path d="M16 6.5l1.5 1.5L20 5.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <rect x="3" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2" fill="currentColor" opacity="0.3" />
                    <path d="M5 17.5l1.5 1.5L9 16.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <rect x="14" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2" fill="currentColor" opacity="0.3" />
                    <path d="M16 17.5l1.5 1.5L20 16.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </>
                ) : (
                  <>
                    <rect x="3" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2" />
                    <rect x="14" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2" />
                    <rect x="3" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2" />
                    <rect x="14" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2" />
                  </>
                )}
              </svg>
              全选显示
            </button>
          </div>

          <div className="teacher-list">
            {teachers.length === 0 ? (
              <div className="teacher-empty">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" style={{ opacity: 0.3 }}>
                  <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="2" />
                  <path d="M4 20c0-4 4-6 8-6s8 2 8 6" stroke="currentColor" strokeWidth="2" />
                </svg>
                <p>暂无教师</p>
                <p className="hint">点击"添加教师"开始</p>
              </div>
            ) : (
              teachers.map((teacher, index) => (
                <div
                  key={teacher.id}
                  className={`teacher-card ${teacher.rawData ? 'has-data' : ''}`}
                  style={{ borderLeftColor: teacher.color }}
                >
                  {/* 可用性显示toggle按钮 */}
                  {teacher.rawData && (
                    <button
                      className={`teacher-visibility-toggle ${teacher.showAvailability ? 'active' : ''}`}
                      onClick={() => toggleTeacherAvailability(teacher.id)}
                      title={teacher.showAvailability ? '隐藏该教师可用性' : '显示该教师可用性'}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                        {teacher.showAvailability ? (
                          <>
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" strokeWidth="2" />
                            <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" fill="currentColor" />
                          </>
                        ) : (
                          <>
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" strokeWidth="2" />
                            <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" />
                            <line x1="2" y1="2" x2="22" y2="22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                          </>
                        )}
                      </svg>
                    </button>
                  )}
                  <div className="teacher-card-content">
                    <div className="teacher-avatar" style={{ backgroundColor: teacher.color }}>
                      {teacher.name.slice(-1)}
                    </div>
                    <div className="teacher-info">
                      <div className="teacher-name">{teacher.name}</div>
                      <div className="teacher-meta">
                        {teacher.rawData ? '已导入数据' : '待安排'}
                      </div>
                    </div>
                  </div>
                  <div className="teacher-card-actions">
                    <button
                      className="teacher-edit-btn"
                      onClick={() => handleEditTeacher(teacher)}
                      title="编辑教师数据"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                        <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke="currentColor" strokeWidth="2" />
                        <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="2" />
                      </svg>
                    </button>
                    <button
                      className="teacher-delete-btn"
                      onClick={() => handleDeleteTeacher(teacher.id)}
                      title="删除教师"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                        <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* 教室可用性面板 */}
      <div className="classroom-panel">
        <div className="classroom-panel-header">
          <h3 className="classroom-panel-title">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '8px' }}>
              <rect x="3" y="4" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="2" />
              <path d="M3 9h18M9 4v5M15 4v5" stroke="currentColor" strokeWidth="2" />
              <circle cx="8" cy="14" r="1.5" fill="currentColor" />
              <circle cx="12" cy="14" r="1.5" fill="currentColor" />
              <circle cx="16" cy="14" r="1.5" fill="currentColor" />
            </svg>
            教室可用性
          </h3>
        </div>
        <div className="classroom-panel-content">
          {/* 预留：教室可用性内容将在此显示 */}
        </div>
      </div>

      {showEventModal && selectedEvent && (
        <>
          <div className="modal-backdrop" onClick={closeModal}></div>
          <div
            className="apple-event-modal"
            style={{
              left: `${modalPosition.x}px`,
              top: `${modalPosition.y}px`,
            }}
          >
            <div className="modal-header">
              <div
                className="modal-color-bar"
                style={{ backgroundColor: selectedEvent.backgroundColor }}
              ></div>
              <h3>{selectedEvent.title}</h3>
              <button className="modal-close" onClick={closeModal}>
                <svg width="14" height="14" viewBox="0 0 14 14">
                  <path d="M14 1.41L12.59 0L7 5.59L1.41 0L0 1.41L5.59 7L0 12.59L1.41 14L7 8.41L12.59 14L14 12.59L8.41 7L14 1.41Z" fill="currentColor" />
                </svg>
              </button>
            </div>

            <div className="modal-body">
              <div className="modal-row">
                <span className="modal-icon">[时间]</span>
                <div className="modal-info">
                  <div className="modal-label">时间</div>
                  <div className="modal-value">
                    {selectedEvent.start?.toLocaleString('zh-CN', {
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                    {selectedEvent.end && ` - ${selectedEvent.end.toLocaleString('zh-CN', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}`}
                  </div>
                </div>
              </div>

              {selectedEvent.extendedProps.student && (
                <div className="modal-row">
                  <span className="modal-icon">[用户]</span>
                  <div className="modal-info">
                    <div className="modal-label">学生</div>
                    <div className="modal-value">{selectedEvent.extendedProps.student}</div>
                  </div>
                </div>
              )}

              {selectedEvent.extendedProps.teacher && (
                <div className="modal-row">
                  <span className="modal-icon">[用户]‍[学校]</span>
                  <div className="modal-info">
                    <div className="modal-label">老师</div>
                    <div className="modal-value">{selectedEvent.extendedProps.teacher}</div>
                  </div>
                </div>
              )}

              {selectedEvent.extendedProps.campus && (
                <div className="modal-row">
                  <span className="modal-icon">[学校]</span>
                  <div className="modal-info">
                    <div className="modal-label">校区</div>
                    <div className="modal-value">{selectedEvent.extendedProps.campus}</div>
                  </div>
                </div>
              )}

              {selectedEvent.extendedProps.room && (
                <div className="modal-row">
                  <span className="modal-icon">[位置]</span>
                  <div className="modal-info">
                    <div className="modal-label">教室</div>
                    <div className="modal-value">{selectedEvent.extendedProps.room}</div>
                  </div>
                </div>
              )}

              {selectedEvent.extendedProps.description && (
                <div className="modal-row">
                  <span className="modal-icon">[编辑]</span>
                  <div className="modal-info">
                    <div className="modal-label">说明</div>
                    <div className="modal-value">{selectedEvent.extendedProps.description}</div>
                  </div>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button
                className="modal-button modal-button-danger"
                onClick={handleDeleteEvent}
              >
                删除课程
              </button>
            </div>
          </div>
        </>
      )}

      {/* 学生数据编辑弹窗 */}
      {editingStudent && (
        <>
          <div className="modal-overlay" onClick={handleCancelEdit}></div>
          <div className="student-edit-modal">
            <div className="modal-header">
              <h3>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '8px' }}>
                  <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke="currentColor" strokeWidth="2" />
                  <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="2" />
                </svg>
                编辑学生数据 - {editingStudent.name}
              </h3>
              <button className="modal-close" onClick={handleCancelEdit}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            <div className="modal-body">
              <div className="edit-instruction">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '6px', flexShrink: 0 }}>
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                  <path d="M12 16v-4M12 8h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
                <span>从 <strong>前途塾1v1约课.xlsx</strong> 的 <strong>2512</strong> 表格中复制一整行学生数据粘贴到下方</span>
              </div>

              <div className="column-reference">
                <div className="column-title">默认列信息（共19列）:</div>
                <div className="column-list">
                  {EXCEL_COLUMNS.split('\t').map((col, idx) => (
                    <span key={idx} className="column-tag">{col}</span>
                  ))}
                </div>
              </div>

              <textarea
                className="student-data-input"
                placeholder="请把Excel学生内容复制到此（支持多行，每行一个学生）"
                value={editingRawData}
                onChange={(e) => setEditingRawData(e.target.value)}
                rows={6}
              />

              {editingRawData && (
                <div className="data-preview">
                  {(() => {
                    const parsedStudents = parseStudentRows(editingRawData);
                    const columns = EXCEL_COLUMNS.split('\t');

                    return (
                      <>
                        <div className="preview-header">
                          <div className="preview-title">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '6px' }}>
                              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" strokeWidth="2" />
                              <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" />
                            </svg>
                            数据预览
                          </div>
                          <div className="preview-count">
                            {parsedStudents.length > 1 ? (
                              <span className="multi-student-badge">{parsedStudents.length} 个学生</span>
                            ) : (
                              <span>{parsedStudents[0]?.values.length || 0} 个字段</span>
                            )}
                          </div>
                        </div>

                        {parsedStudents.map((student, studentIdx) => (
                          <div key={studentIdx} className="student-preview-section">
                            {parsedStudents.length > 1 && (
                              <div className="student-preview-header">
                                <span className="student-number">学生 {studentIdx + 1}</span>
                                <span className="student-preview-name">{student.name}</span>
                              </div>
                            )}
                            <div className="preview-table">
                              {columns.map((col, idx) => (
                                <div key={idx} className={`preview-row ${student.values[idx] ? '' : 'empty'}`}>
                                  <div className="preview-label">{col}</div>
                                  <div className="preview-value">
                                    {student.values[idx] || <span className="no-data">-</span>}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </>
                    );
                  })()}
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button className="modal-button modal-button-secondary" onClick={handleCancelEdit}>
                取消
              </button>
              <button className="modal-button modal-button-primary" onClick={handleSaveEdit}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '6px' }}>
                  <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" stroke="currentColor" strokeWidth="2" />
                  <polyline points="17 21 17 13 7 13 7 21" stroke="currentColor" strokeWidth="2" />
                  <polyline points="7 3 7 8 15 8" stroke="currentColor" strokeWidth="2" />
                </svg>
                保存数据
              </button>
            </div>
          </div>
        </>
      )}

      {/* 教师数据编辑弹窗 */}
      {editingTeacher && (
        <>
          <div className="modal-overlay" onClick={handleCancelTeacherEdit}></div>
          <div className="teacher-edit-modal">
            <div className="modal-header">
              <h3>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '8px' }}>
                  <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke="currentColor" strokeWidth="2" />
                  <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="2" />
                </svg>
                编辑教师数据 - {editingTeacher.name}
              </h3>
              <button className="modal-close" onClick={handleCancelTeacherEdit}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            <div className="modal-body">
              <div className="edit-instruction">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '6px', flexShrink: 0 }}>
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                  <path d="M12 16v-4M12 8h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
                <span>从教师数据表格中复制一整行教师数据粘贴到下方</span>
              </div>

              <div className="column-reference">
                <div className="column-title">默认列信息（共15列）:</div>
                <div className="column-list">
                  {TEACHER_COLUMNS.split('\t').map((col, idx) => (
                    <span key={idx} className="column-tag">{col}</span>
                  ))}
                </div>
              </div>

              <textarea
                className="teacher-data-input"
                placeholder="请把Excel教师内容复制到此（支持多行，每行一个教师）"
                value={editingTeacherRawData}
                onChange={(e) => setEditingTeacherRawData(e.target.value)}
                rows={6}
              />

              {editingTeacherRawData && (
                <div className="data-preview">
                  {(() => {
                    const parsedTeachers = parseTeacherRows(editingTeacherRawData);
                    const columns = TEACHER_COLUMNS.split('\t');

                    return (
                      <>
                        <div className="preview-header">
                          <div className="preview-title">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '6px' }}>
                              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" strokeWidth="2" />
                              <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" />
                            </svg>
                            数据预览
                          </div>
                          <div className="preview-count">
                            {parsedTeachers.length > 1 ? (
                              <span className="multi-teacher-badge">{parsedTeachers.length} 个教师</span>
                            ) : (
                              <span>{parsedTeachers[0]?.values.length || 0} 个字段</span>
                            )}
                          </div>
                        </div>

                        {parsedTeachers.map((teacher, teacherIdx) => (
                          <div key={teacherIdx} className="teacher-preview-section">
                            {parsedTeachers.length > 1 && (
                              <div className="teacher-preview-header">
                                <span className="teacher-number">教师 {teacherIdx + 1}</span>
                                <span className="teacher-preview-name">{teacher.name}</span>
                              </div>
                            )}
                            <div className="preview-table">
                              {columns.map((col, idx) => (
                                <div key={idx} className={`preview-row ${teacher.values[idx] ? '' : 'empty'}`}>
                                  <div className="preview-label">{col}</div>
                                  <div className="preview-value">
                                    {teacher.values[idx] || <span className="no-data">-</span>}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </>
                    );
                  })()}
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button className="modal-button modal-button-secondary" onClick={handleCancelTeacherEdit}>
                取消
              </button>
              <button className="modal-button modal-button-primary" onClick={handleSaveTeacherEdit}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '6px' }}>
                  <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" stroke="currentColor" strokeWidth="2" />
                  <polyline points="17 21 17 13 7 13 7 21" stroke="currentColor" strokeWidth="2" />
                  <polyline points="7 3 7 8 15 8" stroke="currentColor" strokeWidth="2" />
                </svg>
                保存数据
              </button>
            </div>
          </div>
        </>
      )}

      {/* 可用性信息面板 */}
      {availabilityPanel.show && (
        <div className="availability-panel">
          <div className="panel-header">
            <div className="panel-title-row">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ marginRight: '8px' }}>
                <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2" />
                <path d="M3 10h18" stroke="currentColor" strokeWidth="2" />
              </svg>
              <div className="panel-title-content">
                <div className="panel-date">{availabilityPanel.date}</div>
                <div className="panel-time">{availabilityPanel.timeSlot}</div>
              </div>
              <button
                className="panel-close-btn"
                onClick={handleCloseAvailabilityPanel}
                aria-label="关闭"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </button>
            </div>
            <div className="panel-count">{availabilityPanel.students.length} 名学生可用</div>
          </div>
          <div className="panel-content">
            {availabilityPanel.students.map((student, idx) => (
              <div key={idx} className="panel-student">
                <div className="panel-student-header">
                  <div
                    className="panel-student-dot"
                    style={{ backgroundColor: student.color }}
                  ></div>
                  <span className="panel-student-name">{student.name}</span>
                </div>
                <div className="panel-constraints">
                  <div className="constraint-item">
                    <span className="constraint-label">上课频次:</span>
                    <span className="constraint-value">{student.constraints.frequency}</span>
                  </div>
                  <div className="constraint-item">
                    <span className="constraint-label">上课时长:</span>
                    <span className="constraint-value">{student.constraints.duration}</span>
                  </div>
                  <div className="constraint-item">
                    <span className="constraint-label">希望时间段:</span>
                    <span className="constraint-value">{student.constraints.preferredDays}</span>
                  </div>
                  {student.constraints.specificTime !== '-' && (
                    <div className="constraint-item">
                      <span className="constraint-label">具体时间:</span>
                      <span className="constraint-value">{student.constraints.specificTime}</span>
                    </div>
                  )}
                  {student.constraints.deadline !== '-' && (
                    <div className="constraint-item">
                      <span className="constraint-label">起止时间:</span>
                      <span className="constraint-value">{student.constraints.deadline}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Function;

