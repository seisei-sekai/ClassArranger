/**
 * ClassroomSchema - 教室数据Schema (V4)
 * 
 * 统一的教室数据结构定义
 */

/**
 * 创建默认的教室对象
 */
export function createDefaultClassroom(data = {}) {
  return {
    // 基本信息
    name: data.name || data.entryName || data.roomName || '',
    campus: data.campus || '',
    area: data.area || '',
    type: data.type || '1v1教室',
    capacity: data.capacity || 2,
    priority: data.priority || 3,
    
    // 统一可用性
    availability: {
      timeSlots: data.availability?.timeSlots || data.availableTimeRanges || []
    },
    
    // 原始数据
    _raw: {
      excelData: data._raw?.excelData || data.rawData || ''
    }
  };
}

/**
 * 验证教室数据
 */
export function validateClassroom(classroom) {
  const errors = [];
  
  if (!classroom.name) {
    errors.push('教室名称不能为空');
  }
  
  if (!classroom.campus) {
    errors.push('校区不能为空');
  }
  
  if (!classroom.capacity || classroom.capacity < 1) {
    errors.push('容量必须大于0');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * 检查教室容量是否满足要求
 */
export function hasCapacity(classroom, required) {
  return classroom.capacity >= required;
}

/**
 * 检查教室是否在某校区
 */
export function isAtCampus(classroom, campus) {
  return classroom.campus === campus;
}

/**
 * 提取可用时间槽用于排课算法
 */
export function extractAvailabilityForScheduling(classroom) {
  return classroom.availability?.timeSlots || [];
}

/**
 * 按优先级比较教室
 */
export function compareByPriority(a, b) {
  return (b.priority || 0) - (a.priority || 0);
}

export default {
  createDefaultClassroom,
  validateClassroom,
  hasCapacity,
  isAtCampus,
  extractAvailabilityForScheduling,
  compareByPriority
};
