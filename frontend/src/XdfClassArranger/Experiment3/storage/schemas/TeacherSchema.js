/**
 * TeacherSchema - 教师数据Schema (V4)
 * 
 * 统一的教师数据结构定义
 */

/**
 * 创建默认的教师对象
 */
export function createDefaultTeacher(data = {}) {
  return {
    // 基本信息
    name: data.name || '',
    level: data.level || '',
    subject: data.subject || '',
    major: data.major || '',
    
    // 教学能力
    teaching: {
      subjects: data.teaching?.subjects || data.subjects || [],
      campuses: data.teaching?.campuses || data.campuses || data.campus ? [data.campus] : [],
      modes: data.teaching?.modes || data.modes || ['offline'],
      hourlyRate: data.teaching?.hourlyRate || data.hourlyRate || 0,
      maxHoursPerWeek: data.teaching?.maxHoursPerWeek || data.maxHoursPerWeek || 40
    },
    
    // 统一可用性
    availability: {
      timeSlots: data.availability?.timeSlots || data.availableTimeSlots || []
    },
    
    // 原始数据
    _raw: {
      excelData: data._raw?.excelData || data.rawData || '',
      availabilityText: data._raw?.availabilityText || data.availabilityText || ''
    },
    
    // UI状态
    _ui: {
      showAvailability: data._ui?.showAvailability || data.showAvailability || false,
      color: data._ui?.color || data.color || generateColor()
    }
  };
}

/**
 * 验证教师数据
 */
export function validateTeacher(teacher) {
  const errors = [];
  
  if (!teacher.name) {
    errors.push('教师姓名不能为空');
  }
  
  if (!teacher.teaching?.subjects?.length) {
    errors.push('可教科目不能为空');
  }
  
  if (!teacher.teaching?.campuses?.length) {
    errors.push('可用校区不能为空');
  }
  
  if (!teacher.teaching?.modes?.length) {
    errors.push('授课方式不能为空');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * 生成随机颜色
 */
function generateColor() {
  const colors = [
    '#3498db', '#2ecc71', '#e74c3c', '#f39c12', 
    '#9b59b6', '#1abc9c', '#34495e', '#e67e22',
    '#16a085', '#27ae60'
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}

/**
 * 检查教师是否可以教授某科目
 */
export function canTeachSubject(teacher, subject) {
  return teacher.teaching?.subjects?.includes(subject) || false;
}

/**
 * 检查教师是否在某校区工作
 */
export function worksAtCampus(teacher, campus) {
  return teacher.teaching?.campuses?.includes(campus) || false;
}

/**
 * 检查教师是否支持某种模式
 */
export function supportsMode(teacher, mode) {
  return teacher.teaching?.modes?.includes(mode) || false;
}

/**
 * 提取可用时间槽用于排课算法
 */
export function extractAvailabilityForScheduling(teacher) {
  return teacher.availability?.timeSlots || [];
}

export default {
  createDefaultTeacher,
  validateTeacher,
  canTeachSubject,
  worksAtCampus,
  supportsMode,
  extractAvailabilityForScheduling
};
