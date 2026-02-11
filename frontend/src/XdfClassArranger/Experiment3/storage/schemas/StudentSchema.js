/**
 * StudentSchema - 学生数据Schema (V4)
 * 
 * 统一的学生数据结构定义
 */

/**
 * 创建默认的学生对象
 */
export function createDefaultStudent(data = {}) {
  return {
    // 基本信息
    name: data.name || '',
    campus: data.campus || '',
    manager: data.manager || '',
    batch: data.batch || '',
    subject: data.subject || '',
    level: data.level || '',
    
    // 课时信息
    courseHours: {
      total: data.courseHours?.total || 0,
      used: data.courseHours?.used || 0,
      remaining: data.courseHours?.remaining || 0,
      weekly: data.courseHours?.weekly || 0,
      timesPerWeek: data.courseHours?.timesPerWeek || 1,
      hoursPerClass: data.courseHours?.hoursPerClass || 2
    },
    
    // 统一约束系统
    scheduling: {
      timeConstraints: {
        allowedDays: data.scheduling?.timeConstraints?.allowedDays || [1, 2, 3, 4, 5],
        allowedTimeRanges: data.scheduling?.timeConstraints?.allowedTimeRanges || [],
        excludedTimeRanges: data.scheduling?.timeConstraints?.excludedTimeRanges || []
      },
      frequencyConstraints: {
        frequency: data.scheduling?.frequencyConstraints?.frequency || '1次/周',
        duration: data.scheduling?.frequencyConstraints?.duration || 120,
        isRecurringFixed: data.scheduling?.frequencyConstraints?.isRecurringFixed ?? true,
        schedulingMode: data.scheduling?.frequencyConstraints?.schedulingMode || 'fixed'
      },
      teacherConstraints: {
        preferredTeachers: data.scheduling?.teacherConstraints?.preferredTeachers || [],
        excludedTeachers: data.scheduling?.teacherConstraints?.excludedTeachers || []
      },
      modeConstraints: {
        mode: data.scheduling?.modeConstraints?.mode || 'offline',
        preferredClassrooms: data.scheduling?.modeConstraints?.preferredClassrooms || []
      }
    },
    
    // 原始数据（用于审计）
    _raw: {
      excelData: data._raw?.excelData || data.rawData || '',
      aiParsingResult: data._raw?.aiParsingResult || data.parsedData || null,
      originalConstraints: data._raw?.originalConstraints || data.constraints || null
    },
    
    // UI状态（不持久化）
    _ui: {
      selected: data._ui?.selected || data.selected || false,
      showAvailability: data._ui?.showAvailability || data.showAvailability || false,
      color: data._ui?.color || data.color || generateColor()
    }
  };
}

/**
 * 验证学生数据
 */
export function validateStudent(student) {
  const errors = [];
  
  if (!student.name) {
    errors.push('学生姓名不能为空');
  }
  
  if (!student.campus) {
    errors.push('校区不能为空');
  }
  
  if (!student.subject) {
    errors.push('科目不能为空');
  }
  
  if (!student.scheduling?.timeConstraints?.allowedDays?.length) {
    errors.push('可用天数不能为空');
  }
  
  if (!student.scheduling?.frequencyConstraints?.frequency) {
    errors.push('上课频率不能为空');
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
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', 
    '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E2',
    '#F8B739', '#52B788'
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}

/**
 * 提取约束用于排课算法
 */
export function extractConstraintsForScheduling(student) {
  return {
    allowedDays: new Set(student.scheduling.timeConstraints.allowedDays),
    allowedTimeRanges: student.scheduling.timeConstraints.allowedTimeRanges.map(r => ({
      day: r.day,
      startSlot: r.startSlot,
      endSlot: r.endSlot
    })),
    excludedTimeRanges: student.scheduling.timeConstraints.excludedTimeRanges.map(r => ({
      day: r.day,
      startSlot: r.startSlot,
      endSlot: r.endSlot
    })),
    duration: student.scheduling.frequencyConstraints.duration / 10, // 转换为10分钟槽数
    frequency: student.scheduling.frequencyConstraints.frequency,
    isRecurringFixed: student.scheduling.frequencyConstraints.isRecurringFixed,
    schedulingMode: student.scheduling.frequencyConstraints.schedulingMode
  };
}

export default {
  createDefaultStudent,
  validateStudent,
  extractConstraintsForScheduling
};
