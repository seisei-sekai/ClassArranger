/**
 * migrateToV4 - 数据迁移脚本 (V3 → V4)
 * 
 * 将旧的localStorage数据迁移到新的tempFrontEndMongoDB
 */

import { StudentRepository } from '../repositories/StudentRepository.js';
import { TeacherRepository } from '../repositories/TeacherRepository.js';
import { ClassroomRepository } from '../repositories/ClassroomRepository.js';
import { CourseRepository } from '../repositories/CourseRepository.js';
import { getTempFrontEndMongoDB } from '../tempFrontEndMongoDB.js';

/**
 * 从旧localStorage加载数据
 */
function loadFromLocalStorage(key, defaultValue = []) {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : defaultValue;
  } catch (error) {
    console.error(`Failed to load ${key}:`, error);
    return defaultValue;
  }
}

/**
 * 保存迁移记录
 */
function saveMigrationRecord(version, date) {
  const record = {
    version,
    date,
    status: 'completed'
  };
  
  localStorage.setItem('tempMongoDB_migration', JSON.stringify(record));
  console.log('[Migration] Saved migration record:', record);
}

/**
 * 检查是否已迁移
 */
export function hasMigrated() {
  try {
    const record = localStorage.getItem('tempMongoDB_migration');
    if (!record) return false;
    
    const parsed = JSON.parse(record);
    return parsed.version === 'V4' && parsed.status === 'completed';
  } catch (error) {
    return false;
  }
}

/**
 * 主迁移函数
 */
export async function migrateToV4(options = {}) {
  const { force = false, backup = true } = options;
  
  // 检查是否已迁移
  if (!force && hasMigrated()) {
    console.log('[Migration] Already migrated to V4, skipping...');
    return {
      success: true,
      message: 'Already migrated',
      stats: {}
    };
  }
  
  console.log('[Migration] Starting migration to V4...');
  
  try {
    // 备份旧数据
    if (backup) {
      backupOldData();
    }
    
    // 加载旧数据
    const oldStudents = loadFromLocalStorage('xdf_students', []);
    const oldTeachers = loadFromLocalStorage('xdf_teachers', []);
    const oldClassrooms = loadFromLocalStorage('xdf_classrooms', []);
    const oldCourses = loadFromLocalStorage('xdf_scheduled_courses', []);
    
    console.log('[Migration] Loaded old data:', {
      students: oldStudents.length,
      teachers: oldTeachers.length,
      classrooms: oldClassrooms.length,
      courses: oldCourses.length
    });
    
    // 迁移数据
    const studentRepo = new StudentRepository();
    const teacherRepo = new TeacherRepository();
    const classroomRepo = new ClassroomRepository();
    const courseRepo = new CourseRepository();
    
    let stats = {
      students: { success: 0, failed: 0 },
      teachers: { success: 0, failed: 0 },
      classrooms: { success: 0, failed: 0 },
      courses: { success: 0, failed: 0 }
    };
    
    // 迁移学生
    for (const oldStudent of oldStudents) {
      try {
        const newStudent = transformStudentToV4(oldStudent);
        await studentRepo.create(newStudent);
        stats.students.success++;
      } catch (error) {
        console.error('[Migration] Failed to migrate student:', oldStudent.name, error);
        stats.students.failed++;
      }
    }
    
    // 迁移教师
    for (const oldTeacher of oldTeachers) {
      try {
        const newTeacher = transformTeacherToV4(oldTeacher);
        await teacherRepo.create(newTeacher);
        stats.teachers.success++;
      } catch (error) {
        console.error('[Migration] Failed to migrate teacher:', oldTeacher.name, error);
        stats.teachers.failed++;
      }
    }
    
    // 迁移教室
    for (const oldClassroom of oldClassrooms) {
      try {
        const newClassroom = transformClassroomToV4(oldClassroom);
        await classroomRepo.create(newClassroom);
        stats.classrooms.success++;
      } catch (error) {
        console.error('[Migration] Failed to migrate classroom:', oldClassroom.name, error);
        stats.classrooms.failed++;
      }
    }
    
    // 迁移课程
    for (const oldCourse of oldCourses) {
      try {
        const newCourse = transformCourseToV4(oldCourse);
        await courseRepo.create(newCourse);
        stats.courses.success++;
      } catch (error) {
        console.error('[Migration] Failed to migrate course:', oldCourse.id, error);
        stats.courses.failed++;
      }
    }
    
    // 保存迁移记录
    saveMigrationRecord('V4', new Date());
    
    console.log('[Migration] Migration completed successfully:', stats);
    
    return {
      success: true,
      message: 'Migration completed',
      stats
    };
  } catch (error) {
    console.error('[Migration] Migration failed:', error);
    return {
      success: false,
      message: error.message,
      stats: null
    };
  }
}

/**
 * 备份旧数据
 */
function backupOldData() {
  const backup = {
    timestamp: new Date().toISOString(),
    data: {
      students: loadFromLocalStorage('xdf_students', []),
      teachers: loadFromLocalStorage('xdf_teachers', []),
      classrooms: loadFromLocalStorage('xdf_classrooms', []),
      courses: loadFromLocalStorage('xdf_scheduled_courses', [])
    }
  };
  
  localStorage.setItem('tempMongoDB_backup_v3', JSON.stringify(backup));
  console.log('[Migration] Backup created');
}

/**
 * 恢复备份数据
 */
export function restoreBackup() {
  try {
    const backup = localStorage.getItem('tempMongoDB_backup_v3');
    if (!backup) {
      throw new Error('No backup found');
    }
    
    const parsed = JSON.parse(backup);
    localStorage.setItem('xdf_students', JSON.stringify(parsed.data.students));
    localStorage.setItem('xdf_teachers', JSON.stringify(parsed.data.teachers));
    localStorage.setItem('xdf_classrooms', JSON.stringify(parsed.data.classrooms));
    localStorage.setItem('xdf_scheduled_courses', JSON.stringify(parsed.data.courses));
    
    // 清除迁移记录
    localStorage.removeItem('tempMongoDB_migration');
    
    console.log('[Migration] Backup restored');
    return { success: true };
  } catch (error) {
    console.error('[Migration] Failed to restore backup:', error);
    return { success: false, error: error.message };
  }
}

/**
 * 转换学生数据到V4
 */
function transformStudentToV4(oldStudent) {
  return {
    // 基本信息
    name: oldStudent.name || '',
    campus: oldStudent.campus || '',
    manager: oldStudent.manager || '',
    batch: oldStudent.batch || '',
    subject: oldStudent.subject || '',
    level: oldStudent.level || '',
    
    // 课时信息
    courseHours: oldStudent.courseHours || calculateCourseHours(oldStudent),
    
    // 统一约束系统
    scheduling: {
      timeConstraints: {
        allowedDays: extractAllowedDays(oldStudent),
        allowedTimeRanges: extractAllowedTimeRanges(oldStudent),
        excludedTimeRanges: extractExcludedTimeRanges(oldStudent)
      },
      frequencyConstraints: {
        frequency: oldStudent.frequency || '1次/周',
        duration: parseDuration(oldStudent.duration),
        isRecurringFixed: oldStudent.isRecurringFixed ?? oldStudent.schedulingMode !== 'flexible',
        schedulingMode: oldStudent.schedulingMode || 'fixed'
      },
      teacherConstraints: {
        preferredTeachers: oldStudent.preferredTeacher ? [oldStudent.preferredTeacher] : [],
        excludedTeachers: []
      },
      modeConstraints: {
        mode: oldStudent.mode || 'offline',
        preferredClassrooms: []
      }
    },
    
    // 原始数据
    _raw: {
      excelData: oldStudent.rawData || '',
      aiParsingResult: oldStudent.parsedData || null,
      originalConstraints: oldStudent.constraints || null
    },
    
    // UI状态
    _ui: {
      selected: oldStudent.selected || false,
      showAvailability: oldStudent.showAvailability || false,
      color: oldStudent.color || generateColor()
    }
  };
}

/**
 * 提取allowedDays
 */
function extractAllowedDays(oldStudent) {
  // 优先级：parsedData > constraints > 默认
  if (oldStudent.parsedData?.allowedDays) {
    return Array.isArray(oldStudent.parsedData.allowedDays)
      ? oldStudent.parsedData.allowedDays
      : Array.from(oldStudent.parsedData.allowedDays);
  }
  
  if (oldStudent.constraints?.allowedDays) {
    return oldStudent.constraints.allowedDays instanceof Set
      ? Array.from(oldStudent.constraints.allowedDays)
      : Array.isArray(oldStudent.constraints.allowedDays)
        ? oldStudent.constraints.allowedDays
        : [1, 2, 3, 4, 5];
  }
  
  // 默认工作日
  return [1, 2, 3, 4, 5];
}

/**
 * 提取allowedTimeRanges
 */
function extractAllowedTimeRanges(oldStudent) {
  // 优先级：parsedData > constraints > 默认
  if (oldStudent.parsedData?.allowedTimeRanges?.length > 0) {
    return oldStudent.parsedData.allowedTimeRanges.map(r => ({
      day: r.day,
      startSlot: r.start || r.startSlot,
      endSlot: r.end || r.endSlot
    }));
  }
  
  if (oldStudent.constraints?.allowedTimeRanges?.length > 0) {
    return oldStudent.constraints.allowedTimeRanges.map(r => ({
      day: r.day,
      startSlot: r.startSlot,
      endSlot: r.endSlot
    }));
  }
  
  // 默认下午时段 (13:00-18:00)
  const allowedDays = extractAllowedDays(oldStudent);
  return allowedDays.map(day => ({
    day,
    startSlot: 48,  // 13:00
    endSlot: 108    // 18:00
  }));
}

/**
 * 提取excludedTimeRanges
 */
function extractExcludedTimeRanges(oldStudent) {
  if (oldStudent.parsedData?.excludedTimeRanges?.length > 0) {
    return oldStudent.parsedData.excludedTimeRanges.map(r => ({
      day: r.day,
      startSlot: r.start || r.startSlot,
      endSlot: r.end || r.endSlot
    }));
  }
  
  if (oldStudent.constraints?.excludedTimeRanges?.length > 0) {
    return oldStudent.constraints.excludedTimeRanges.map(r => ({
      day: r.day,
      startSlot: r.startSlot,
      endSlot: r.endSlot
    }));
  }
  
  return [];
}

/**
 * 计算课时信息
 */
function calculateCourseHours(oldStudent) {
  if (oldStudent.courseHours) {
    return oldStudent.courseHours;
  }
  
  // 从旧字段计算
  const timesPerWeek = parseInt(oldStudent.frequency) || 1;
  const hoursPerClass = parseFloat(oldStudent.duration) || 2;
  const weekly = timesPerWeek * hoursPerClass;
  
  return {
    total: oldStudent.totalHours || 0,
    used: oldStudent.usedHours || 0,
    remaining: oldStudent.remainingHours || 0,
    weekly,
    timesPerWeek,
    hoursPerClass
  };
}

/**
 * 解析时长（转换为分钟）
 */
function parseDuration(duration) {
  if (!duration) return 120; // 默认2小时
  
  if (typeof duration === 'number') {
    return duration * 60; // 假设输入为小时
  }
  
  if (typeof duration === 'string') {
    const match = duration.match(/(\d+\.?\d*)/);
    if (match) {
      return parseFloat(match[1]) * 60;
    }
  }
  
  return 120;
}

/**
 * 转换教师数据到V4
 */
function transformTeacherToV4(oldTeacher) {
  return {
    // 基本信息
    name: oldTeacher.name || '',
    level: oldTeacher.level || '',
    subject: oldTeacher.subject || '',
    major: oldTeacher.major || '',
    
    // 教学能力
    teaching: {
      subjects: oldTeacher.subjects || [],
      campuses: oldTeacher.campuses || oldTeacher.campus ? [oldTeacher.campus] : [],
      modes: oldTeacher.modes || ['offline'],
      hourlyRate: oldTeacher.hourlyRate || 0,
      maxHoursPerWeek: oldTeacher.maxHoursPerWeek || 40
    },
    
    // 统一可用性
    availability: {
      timeSlots: oldTeacher.availableTimeSlots || oldTeacher.availability?.slots || []
    },
    
    // 原始数据
    _raw: {
      excelData: oldTeacher.rawData || '',
      availabilityText: oldTeacher.availabilityText || ''
    },
    
    // UI状态
    _ui: {
      showAvailability: oldTeacher.showAvailability || false,
      color: oldTeacher.color || generateColor()
    }
  };
}

/**
 * 转换教室数据到V4
 */
function transformClassroomToV4(oldClassroom) {
  return {
    // 基本信息
    name: oldClassroom.name || oldClassroom.entryName || oldClassroom.roomName || '',
    campus: oldClassroom.campus || '',
    area: oldClassroom.area || '',
    type: oldClassroom.type || '1v1教室',
    capacity: oldClassroom.capacity || 2,
    priority: oldClassroom.priority || 3,
    
    // 统一可用性
    availability: {
      timeSlots: oldClassroom.availableTimeRanges || []
    },
    
    // 原始数据
    _raw: {
      excelData: oldClassroom.rawData || ''
    }
  };
}

/**
 * 转换课程数据到V4
 */
function transformCourseToV4(oldCourse) {
  return {
    // 保留原有结构，添加版本标记
    ...oldCourse,
    // 课程数据不需要大幅改动，主要是学生/教师/教室引用
  };
}

/**
 * 生成随机颜色
 */
function generateColor() {
  const colors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', 
    '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E2',
    '#F8B739', '#52B788'
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}

export default {
  migrateToV4,
  hasMigrated,
  restoreBackup
};
