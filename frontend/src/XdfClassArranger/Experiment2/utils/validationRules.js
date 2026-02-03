/**
 * Validation Rules for Experiment2
 * 验证规则
 */

import { timeSlotsOverlap } from './realBusinessDataStructures.js';

/**
 * Validate student data
 */
export function validateStudent(student) {
  const errors = [];
  const warnings = [];
  
  // 基础信息验证
  if (!student.name || student.name.trim() === '') {
    errors.push('学生姓名不能为空');
  }
  
  if (!student.campus || student.campus.trim() === '') {
    warnings.push('未指定校区');
  }
  
  if (!student.subject || student.subject.trim() === '') {
    errors.push('科目不能为空');
  }
  
  // 课时验证
  if (student.totalHours <= 0) {
    errors.push('总课时必须大于0');
  }
  
  if (student.hoursUsed < 0) {
    errors.push('已用课时不能为负数');
  }
  
  if (student.hoursUsed > student.totalHours) {
    errors.push('已用课时不能超过总课时');
  }
  
  // 约束验证
  if (student.constraints) {
    if (!student.constraints.allowedDays || student.constraints.allowedDays.size === 0) {
      errors.push('必须至少选择一天可用时间');
    }
    
    if (student.constraints.duration <= 0) {
      errors.push('课程时长必须大于0');
    }
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Validate teacher data
 */
export function validateTeacher(teacher) {
  const errors = [];
  const warnings = [];
  
  if (!teacher.name || teacher.name.trim() === '') {
    errors.push('教师姓名不能为空');
  }
  
  if (!Array.isArray(teacher.subjects) || teacher.subjects.length === 0) {
    errors.push('教师必须至少有一个可教科目');
  }
  
  if (!Array.isArray(teacher.availableTimeSlots) || teacher.availableTimeSlots.length === 0) {
    warnings.push('教师没有可用时间段');
  }
  
  if (!Array.isArray(teacher.campus) || teacher.campus.length === 0) {
    warnings.push('未指定可上课校区');
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Validate classroom data
 */
export function validateClassroom(classroom) {
  const errors = [];
  const warnings = [];
  
  if (!classroom.name || classroom.name.trim() === '') {
    errors.push('教室名称不能为空');
  }
  
  if (!classroom.campus || classroom.campus.trim() === '') {
    errors.push('教室必须指定校区');
  }
  
  if (classroom.capacity <= 0) {
    errors.push('教室容量必须大于0');
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Validate course scheduling possibility
 */
export function canScheduleCourse(student, teachers, classrooms) {
  const issues = [];
  
  // Check remaining hours
  if (student.remainingHours <= 0) {
    issues.push('学生没有剩余课时');
    return { possible: false, issues };
  }
  
  // Check if there are eligible teachers
  const eligibleTeachers = teachers.filter(t => 
    t.subjects.includes(student.subject) &&
    t.campus.includes(student.campus)
  );
  
  if (eligibleTeachers.length === 0) {
    issues.push(`没有教师可以在${student.campus}教授"${student.subject}"科目`);
    return { possible: false, issues };
  }
  
  // Check if there are classrooms at the campus
  const availableClassrooms = classrooms.filter(c => c.campus === student.campus);
  
  if (availableClassrooms.length === 0) {
    issues.push(`${student.campus}没有可用教室`);
    return { possible: false, issues };
  }
  
  // Check if student has time constraints
  if (!student.constraints.allowedTimeRanges || student.constraints.allowedTimeRanges.length === 0) {
    issues.push('学生没有设置可用时间段');
    return { possible: false, issues };
  }
  
  return { possible: true, issues: [] };
}

/**
 * Check for conflicts in a schedule
 */
export function checkScheduleConflicts(courses) {
  const conflicts = [];
  
  for (let i = 0; i < courses.length; i++) {
    for (let j = i + 1; j < courses.length; j++) {
      const course1 = courses[i];
      const course2 = courses[j];
      
      if (!timeSlotsOverlap(course1.timeSlot, course2.timeSlot)) {
        continue;
      }
      
      // Teacher conflict
      if (course1.teacher.id === course2.teacher.id) {
        conflicts.push({
          type: 'teacher',
          course1,
          course2,
          message: `教师${course1.teacher.name}时间冲突`
        });
      }
      
      // Student conflict
      if (course1.student.id === course2.student.id) {
        conflicts.push({
          type: 'student',
          course1,
          course2,
          message: `学生${course1.student.name}时间冲突`
        });
      }
      
      // Classroom conflict
      if (course1.classroom.id === course2.classroom.id) {
        conflicts.push({
          type: 'classroom',
          course1,
          course2,
          message: `教室${course1.classroom.name}时间冲突`
        });
      }
    }
  }
  
  return conflicts;
}

/**
 * Calculate statistics for a schedule
 */
export function calculateScheduleStats(courses, students, teachers, classrooms) {
  const scheduledStudents = new Set(courses.map(c => c.student.id));
  const activeTeachers = new Set(courses.map(c => c.teacher.id));
  const usedClassrooms = new Set(courses.map(c => c.classroom.id));
  
  // Calculate hours by teacher
  const teacherHours = {};
  courses.forEach(course => {
    const teacherId = course.teacher.id;
    const hours = course.timeSlot.duration * 5 / 60; // 5-min slots to hours
    teacherHours[teacherId] = (teacherHours[teacherId] || 0) + hours;
  });
  
  // Calculate distribution by day
  const dayDistribution = [0, 0, 0, 0, 0, 0, 0];
  courses.forEach(course => {
    dayDistribution[course.timeSlot.day]++;
  });
  
  return {
    totalCourses: courses.length,
    totalStudents: students.length,
    scheduledStudents: scheduledStudents.size,
    unscheduledStudents: students.length - scheduledStudents.size,
    successRate: (scheduledStudents.size / students.length * 100).toFixed(1),
    
    totalTeachers: teachers.length,
    activeTeachers: activeTeachers.size,
    teacherUtilization: (activeTeachers.size / teachers.length * 100).toFixed(1),
    
    totalClassrooms: classrooms.length,
    usedClassrooms: usedClassrooms.size,
    classroomUtilization: (usedClassrooms.size / classrooms.length * 100).toFixed(1),
    
    teacherHours,
    dayDistribution
  };
}
