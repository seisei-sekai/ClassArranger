/**
 * Calendar Event Converter for Experiment3
 * 日历事件转换器
 * 
 * Converts between scheduling results and FullCalendar event format
 */

import { slotIndexToTime, JAPANESE_COLORS } from './constants.js';

/**
 * Convert a course to FullCalendar event format
 * 将课程转换为FullCalendar事件格式
 */
export function convertCourseToFullCalendarEvent(course, baseDate = new Date()) {
  if (!course || !course.timeSlot) {
    console.warn('[EventConverter] Invalid course - missing timeSlot:', course);
    return null;
  }

  const { student, teacher, classroom, timeSlot, subject } = course;
  
  // 🔥 处理虚拟课程（使用 course 的直接属性）
  const isVirtual = course.isVirtual || course.status === 'unscheduled';
  const confirmationStatus = course.confirmationStatus || 'pending'; // 确认状态
  
  const studentObj = student || {
    id: course.studentId,
    name: course.studentName,
    campus: course.campus
  };
  
  const teacherObj = teacher || {
    id: course.teacherId,
    name: course.teacherName
  };
  
  if (!studentObj || !teacherObj) {
    console.warn('[EventConverter] Invalid course - missing student or teacher:', course);
    return null;
  }
  
  // Validate timeSlot structure
  if (timeSlot.day === undefined || timeSlot.startSlot === undefined || timeSlot.endSlot === undefined) {
    console.warn('[EventConverter] Invalid timeSlot structure:', timeSlot);
    return null;
  }

  // Calculate start date/time
  const startDateTime = calculateDateTimeFromSlot(
    baseDate,
    timeSlot.day,
    timeSlot.startSlot
  );
  
  // Calculate end date/time
  const endDateTime = calculateDateTimeFromSlot(
    baseDate,
    timeSlot.day,
    timeSlot.endSlot
  );

  // 🔥 根据状态确定颜色和样式类
  // 状态1: 成功生成 + 待确认 → 彩色 + 半透明灰色斜条
  // 状态2: 成功生成 + 已确认 → 纯彩色
  // 状态3: 失败生成 + 待确认 → 灰色斜条纹（虚拟）
  // 状态4: 失败生成 + 已确认 → 彩色纯颜色
  
  let color, classNames, title;
  
  if (isVirtual && confirmationStatus === 'pending') {
    // 状态3: 失败生成 + 待确认
    color = '#9CA3AF';
    classNames = ['event-type-course', 'event-virtual', 'event-pending'];
    title = `${studentObj.name} - 待排课`;
  } else if (isVirtual && confirmationStatus === 'confirmed') {
    // 状态4: 失败生成 + 已确认
    color = getColorForStudent(studentObj.id);
    classNames = ['event-type-course', 'event-confirmed'];
    title = `${studentObj.name} - ${teacherObj.name}`;
  } else if (!isVirtual && confirmationStatus === 'pending') {
    // 状态1: 成功生成 + 待确认（有斜条纹提示）
    color = getColorForStudent(studentObj.id);
    classNames = ['event-type-course', 'event-pending-with-stripe'];
    title = `${studentObj.name} - ${teacherObj.name}`;
  } else {
    // 状态2: 成功生成 + 已确认（纯色，默认）
    color = getColorForStudent(studentObj.id);
    classNames = ['event-type-course', 'event-confirmed'];
    title = `${studentObj.name} - ${teacherObj.name}`;
  }

  return {
    id: course.id || `course-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    title: title,
    start: startDateTime.toISOString(),
    end: endDateTime.toISOString(),
    backgroundColor: color,
    borderColor: isVirtual && confirmationStatus === 'pending' ? '#6B7280' : color,
    textColor: isVirtual && confirmationStatus === 'pending' ? '#374151' : '#FFFFFF',
    classNames: classNames,
    display: 'block', // 实心块显示
    extendedProps: {
      eventType: 'course', // 事件类型标识
      isVirtual: isVirtual, // 🔥 标记虚拟课程
      confirmationStatus: confirmationStatus, // 🔥 确认状态
      status: course.status || 'scheduled', // 🔥 课程状态
      conflictReason: course.conflictReason, // 🔥 失败原因
      studentId: studentObj.id,
      studentName: studentObj.name,
      teacherId: teacherObj.id,
      teacherName: teacherObj.name,
      classroomId: classroom?.id || course.classroomId,
      classroomName: classroom?.name || course.classroomName || '虚拟教室',
      subject: subject || studentObj.subject || course.subject,
      campus: studentObj.campus || course.campus,
      duration: timeSlot.duration,
      format: studentObj.format || course.format || '线下',
      courseData: course
    },
    editable: confirmationStatus !== 'confirmed', // 已确认的课程不可编辑
    draggable: confirmationStatus !== 'confirmed' // 已确认的课程不可拖动
  };
}

/**
 * Convert multiple courses to FullCalendar events
 * 批量转换课程为FullCalendar事件
 */
export function convertCoursesToFullCalendarEvents(courses, baseDate = new Date()) {
  if (!Array.isArray(courses)) {
    console.warn('[EventConverter] Courses is not an array:', courses);
    return [];
  }

  return courses
    .map(course => convertCourseToFullCalendarEvent(course, baseDate))
    .filter(event => event !== null);
}

/**
 * Calculate date time from day and slot index
 * 从星期和槽位索引计算日期时间
 */
function calculateDateTimeFromSlot(baseDate, dayOfWeek, slotIndex) {
  const date = new Date(baseDate);
  
  // Get Monday of current week
  const currentDay = date.getDay();
  const monday = new Date(date);
  monday.setDate(date.getDate() - currentDay + (currentDay === 0 ? -6 : 1));
  
  // Add days to reach target day
  const targetDate = new Date(monday);
  if (dayOfWeek === 0) {
    targetDate.setDate(monday.getDate() + 6); // Sunday
  } else {
    targetDate.setDate(monday.getDate() + dayOfWeek - 1);
  }
  
  // Convert slot to time
  const timeObj = slotIndexToTime(slotIndex);
  targetDate.setHours(timeObj.hour, timeObj.minute, 0, 0);
  
  return targetDate;
}

/**
 * Get consistent color for a student
 * 为学生获取一致的颜色
 */
function getColorForStudent(studentId) {
  if (!studentId) return JAPANESE_COLORS[0];
  
  let hash = 0;
  for (let i = 0; i < studentId.length; i++) {
    hash = studentId.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  const colors = [
    '#4CAF50', '#2196F3', '#FF9800', '#9C27B0',
    '#F44336', '#00BCD4', '#FFC107', '#E91E63',
    '#3F51B5', '#009688', '#FF5722', '#673AB7'
  ];
  
  return colors[Math.abs(hash) % colors.length];
}

/**
 * Convert FullCalendar event back to course format
 * 将FullCalendar事件转回课程格式
 */
export function convertFullCalendarEventToCourse(event) {
  const extendedProps = event.extendedProps || {};
  
  // If we have the original course data, use it
  if (extendedProps.courseData) {
    return extendedProps.courseData;
  }
  
  // Otherwise reconstruct from event data
  const startDate = new Date(event.start);
  const endDate = new Date(event.end);
  
  return {
    id: event.id,
    student: {
      id: extendedProps.studentId,
      name: extendedProps.studentName,
      campus: extendedProps.campus
    },
    teacher: {
      id: extendedProps.teacherId,
      name: extendedProps.teacherName
    },
    classroom: {
      id: extendedProps.classroomId,
      name: extendedProps.classroomName
    },
    subject: extendedProps.subject,
    timeSlot: {
      day: startDate.getDay(),
      startSlot: this.dateTimeToSlot(startDate),
      endSlot: this.dateTimeToSlot(endDate),
      duration: extendedProps.duration,
      start: `${String(startDate.getHours()).padStart(2, '0')}:${String(startDate.getMinutes()).padStart(2, '0')}`,
      end: `${String(endDate.getHours()).padStart(2, '0')}:${String(endDate.getMinutes()).padStart(2, '0')}`
    }
  };
}

/**
 * Convert date time to slot index
 */
function dateTimeToSlot(dateTime) {
  const hour = dateTime.getHours();
  const minute = dateTime.getMinutes();
  const startHour = 9;
  const totalMinutes = (hour - startHour) * 60 + minute;
  return Math.floor(totalMinutes / 5);
}

/**
 * Generate recurring events for a course
 * 为循环课程生成重复事件
 */
export function generateRecurringEvents(course, weeks = 4, baseDate = new Date()) {
  // 灵活排课模式：为每个时间槽生成一个事件
  if (course.schedulingMode === 'flexible' && course.flexibleSlots) {
    console.log('[EventConverter] 生成灵活排课事件，时间槽数量:', course.flexibleSlots.length);
    
    const events = [];
    course.flexibleSlots.forEach((timeSlot, index) => {
      const flexibleCourse = {
        ...course,
        timeSlot: timeSlot,
        id: `${course.id || 'flexible'}-slot-${index}`
      };
      
      const event = convertCourseToFullCalendarEvent(flexibleCourse, baseDate);
      if (event) {
        event.title = `${course.student.name} - ${course.teacher.name} (${index + 1}/${course.flexibleSlots.length})`;
        event.extendedProps.flexibleIndex = index;
        event.extendedProps.totalFlexibleSlots = course.flexibleSlots.length;
        events.push(event);
      }
    });
    
    return events;
  }
  
  // 非重复课程
  if (!course.isRecurring) {
    return [convertCourseToFullCalendarEvent(course, baseDate)].filter(e => e !== null);
  }

  // 传统固定时间重复
  const events = [];
  for (let week = 0; week < weeks; week++) {
    const weekDate = new Date(baseDate);
    weekDate.setDate(baseDate.getDate() + week * 7);
    
    const event = convertCourseToFullCalendarEvent(course, weekDate);
    if (event) {
      event.id = `${course.id}-week${week}`;
      events.push(event);
    }
  }
  
  return events;
}
