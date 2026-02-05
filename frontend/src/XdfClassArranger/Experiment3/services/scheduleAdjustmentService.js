/**
 * 排课调整服务
 * Schedule Adjustment Service
 * 
 * 核心业务逻辑：
 * - 管理调整流程状态
 * - 协调冲突分析和建议生成
 * - 处理数据修改和标记
 * - 执行单个/批量重新排课
 */

import {
  analyzeConflicts,
  updateConflictStatus,
  markConflictAsModified,
  getConflictStatistics
} from '../utils/conflictAnalyzer';
import { generateSuggestions } from '../utils/suggestionEngine';
import {
  ConflictStatus,
  TargetType,
  createModificationRecord
} from '../types/adjustmentTypes';
import { deepClone } from '../utils/dataStructures';

/**
 * 排课调整服务类
 */
class ScheduleAdjustmentService {
  /**
   * 构造函数
   * @param {Object} config - 配置对象
   * @param {Array} config.conflicts - 原始冲突列表
   * @param {Array} config.students - 学生列表
   * @param {Array} config.teachers - 教师列表
   * @param {Array} config.classrooms - 教室列表
   * @param {Array} config.scheduledCourses - 已排课程列表
   * @param {string} config.algorithm - 使用的排课算法
   * @param {Object} config.algorithmAdapter - 算法适配器实例
   */
  constructor(config) {
    const {
      conflicts = [],
      students = [],
      teachers = [],
      classrooms = [],
      scheduledCourses = [],
      algorithm = 'triple-match',
      algorithmAdapter = null
    } = config;
    
    // 存储原始数据（深拷贝，避免直接修改）
    this.originalStudents = deepClone(students);
    this.originalTeachers = deepClone(teachers);
    this.originalClassrooms = deepClone(classrooms);
    
    // 当前工作数据
    this.students = deepClone(students);
    this.teachers = deepClone(teachers);
    this.classrooms = deepClone(classrooms);
    this.scheduledCourses = deepClone(scheduledCourses);
    
    // 算法相关
    this.algorithm = algorithm;
    this.algorithmAdapter = algorithmAdapter;
    
    // 分析冲突，生成增强的冲突对象
    this.enhancedConflicts = analyzeConflicts(
      conflicts,
      this.students,
      this.teachers,
      this.classrooms
    );
    
    // 为每个冲突生成建议
    this.enhancedConflicts.forEach(conflict => {
      conflict.suggestions = generateSuggestions(
        conflict,
        this.students,
        this.teachers,
        this.classrooms,
        this.scheduledCourses
      );
    });
    
    // 修改记录
    this.modificationRecords = [];
    
    // 监听器
    this.listeners = {
      onConflictUpdate: [],
      onDataModified: [],
      onRetryComplete: []
    };
  }
  
  /**
   * 获取增强的冲突列表
   * @returns {Array<EnhancedConflict>}
   */
  getEnhancedConflicts() {
    return this.enhancedConflicts;
  }
  
  /**
   * 根据ID获取冲突
   * @param {string} conflictId - 冲突ID
   * @returns {EnhancedConflict|null}
   */
  getConflictById(conflictId) {
    return this.enhancedConflicts.find(c => c.id === conflictId) || null;
  }
  
  /**
   * 为指定冲突生成建议
   * @param {string} conflictId - 冲突ID
   * @returns {Array<Suggestion>}
   */
  generateSuggestionsForConflict(conflictId) {
    const conflict = this.getConflictById(conflictId);
    if (!conflict) {
      return [];
    }
    
    // 重新生成建议（基于最新数据）
    const newSuggestions = generateSuggestions(
      conflict,
      this.students,
      this.teachers,
      this.classrooms,
      this.scheduledCourses
    );
    
    // 更新冲突的建议列表
    conflict.suggestions = newSuggestions;
    
    return newSuggestions;
  }
  
  /**
   * 应用建议
   * @param {string} conflictId - 冲突ID
   * @param {string} suggestionId - 建议ID
   * @param {string} reason - 应用原因（可选）
   * @returns {Object} 应用结果
   */
  applySuggestion(conflictId, suggestionId, reason = '应用智能建议') {
    const conflict = this.getConflictById(conflictId);
    if (!conflict) {
      return { success: false, message: '冲突不存在' };
    }
    
    const suggestion = conflict.suggestions.find(s => s.id === suggestionId);
    if (!suggestion) {
      return { success: false, message: '建议不存在' };
    }
    
    try {
      // 调用建议的应用函数
      if (suggestion.applyAction) {
        suggestion.applyAction(this);
      }
      
      // 根据建议类型应用修改
      const result = this._applySuggestionData(conflict, suggestion, reason);
      
      if (result.success) {
        // 标记冲突为已修改
        const modifiedConflict = markConflictAsModified(conflict, result.modificationRecord);
        this._updateConflict(modifiedConflict);
        
        // 触发监听器
        this._notifyListeners('onDataModified', result.modificationRecord);
      }
      
      return result;
    } catch (error) {
      console.error('[AdjustmentService] Error applying suggestion:', error);
      return { success: false, message: error.message };
    }
  }
  
  /**
   * 内部方法：应用建议的数据修改
   */
  _applySuggestionData(conflict, suggestion, reason) {
    const { type, data } = suggestion;
    
    switch (type) {
      case 'TIME':
        // 时间槽建议：标记学生时间约束已修改
        return this.modifyData(
          TargetType.STUDENT,
          conflict.student.id,
          'timeConstraint',
          data.timeSlot,
          reason,
          conflict.id
        );
        
      case 'TEACHER':
        // 教师建议：标记推荐教师
        return this.modifyData(
          TargetType.STUDENT,
          conflict.student.id,
          'preferredTeacher',
          data.teacher.id,
          reason,
          conflict.id
        );
        
      case 'ROOM':
        // 教室建议：标记推荐教室
        return this.modifyData(
          TargetType.STUDENT,
          conflict.student.id,
          'preferredRoom',
          data.room.id,
          reason,
          conflict.id
        );
        
      case 'CONSTRAINT':
        // 约束建议：根据具体操作修改
        if (data.action === 'relax_time_constraint') {
          return this._relaxTimeConstraint(conflict, reason);
        } else if (data.action === 'increase_teacher_hours') {
          return this._increaseTeacherHours(conflict, reason);
        }
        break;
        
      default:
        return { success: false, message: '未知的建议类型' };
    }
  }
  
  /**
   * 修改数据
   * @param {string} targetType - 目标类型 (student/teacher/classroom)
   * @param {string} targetId - 目标ID
   * @param {string} field - 字段名
   * @param {*} newValue - 新值
   * @param {string} reason - 修改原因
   * @param {string} conflictId - 关联的冲突ID（可选）
   * @returns {Object} 修改结果
   */
  modifyData(targetType, targetId, field, newValue, reason, conflictId = null) {
    const target = this._findTarget(targetType, targetId);
    
    if (!target) {
      return {
        success: false,
        message: `找不到目标对象: ${targetType} ${targetId}`
      };
    }
    
    const oldValue = target[field];
    
    // 创建修改记录
    const modificationRecord = createModificationRecord(
      targetType,
      targetId,
      target.name,
      field,
      oldValue,
      newValue,
      reason,
      conflictId
    );
    
    // 应用修改
    target[field] = newValue;
    
    // 标记为已修改
    this._markAsModified(targetType, targetId, modificationRecord);
    
    // 保存修改记录
    this.modificationRecords.push(modificationRecord);
    
    // 触发监听器
    this._notifyListeners('onDataModified', modificationRecord);
    
    return {
      success: true,
      modificationRecord,
      target
    };
  }
  
  /**
   * 标记数据为已修改
   */
  _markAsModified(targetType, targetId, record) {
    const target = this._findTarget(targetType, targetId);
    if (!target) return;
    
    if (!target.isModified) {
      target.isModified = true;
      target.modificationHistory = [];
    }
    target.modificationHistory.push(record);
  }
  
  /**
   * 查找目标对象
   */
  _findTarget(targetType, targetId) {
    let collection;
    
    switch (targetType) {
      case TargetType.STUDENT:
        collection = this.students;
        break;
      case TargetType.TEACHER:
        collection = this.teachers;
        break;
      case TargetType.CLASSROOM:
        collection = this.classrooms;
        break;
      default:
        return null;
    }
    
    return collection.find(item => item.id === targetId);
  }
  
  /**
   * 重新尝试为单个学生排课
   * @param {string} conflictId - 冲突ID
   * @returns {Promise<Object>} 排课结果
   */
  async retryScheduleForStudent(conflictId) {
    const conflict = this.getConflictById(conflictId);
    if (!conflict) {
      return { success: false, message: '冲突不存在' };
    }
    
    // 更新冲突状态为处理中
    this._updateConflict(updateConflictStatus(conflict, ConflictStatus.IN_PROGRESS));
    
    try {
      // 只为这一个学生排课
      const studentToSchedule = [conflict.student];
      
      if (!this.algorithmAdapter) {
        throw new Error('算法适配器未初始化');
      }
      
      // 调用算法
      const result = await this.algorithmAdapter.schedule(
        studentToSchedule,
        this.teachers,
        this.classrooms
      );
      
      if (result.courses && result.courses.length > 0) {
        // 排课成功
        const course = result.courses[0];
        this.scheduledCourses.push(course);
        
        // 更新冲突状态为已解决
        this._updateConflict(updateConflictStatus(conflict, ConflictStatus.RESOLVED));
        
        // 触发监听器
        this._notifyListeners('onRetryComplete', {
          conflictId,
          success: true,
          course
        });
        
        return {
          success: true,
          course,
          message: '排课成功'
        };
      } else {
        // 排课失败，更新失败原因
        let newReason = '未知原因';
        
        if (result.conflicts && result.conflicts.length > 0) {
          const studentConflict = result.conflicts[0];
          newReason = studentConflict.reason || studentConflict.type || '排课条件不满足';
          
          // 添加更详细的信息
          if (studentConflict.details) {
            newReason += ` - ${studentConflict.details}`;
          }
        } else if (result.message) {
          newReason = result.message;
        } else {
          newReason = '排课算法未返回有效结果，可能是约束条件过于严格';
        }
        
        console.log('[AdjustmentService] 排课失败详情:', {
          conflictId,
          reason: newReason,
          result,
          student: conflict.student
        });
        
        conflict.reason = newReason;
        
        // 重新生成建议
        conflict.suggestions = generateSuggestions(
          conflict,
          this.students,
          this.teachers,
          this.classrooms,
          this.scheduledCourses
        );
        
        this._updateConflict(conflict);
        
        // 触发监听器
        this._notifyListeners('onRetryComplete', {
          conflictId,
          success: false,
          reason: newReason
        });
        
        return {
          success: false,
          reason: newReason,
          message: newReason
        };
      }
    } catch (error) {
      console.error('[AdjustmentService] Retry failed:', error);
      
      // 触发监听器
      this._notifyListeners('onRetryComplete', {
        conflictId,
        success: false,
        error: error.message
      });
      
      return {
        success: false,
        message: `排课出错: ${error.message}`
      };
    }
  }
  
  /**
   * 批量重新排课所有未解决的冲突
   * @returns {Promise<Object>} 批量排课结果
   */
  async batchRetrySchedule() {
    const pendingConflicts = this.enhancedConflicts.filter(
      c => c.status === ConflictStatus.PENDING || c.status === ConflictStatus.IN_PROGRESS
    );
    
    if (pendingConflicts.length === 0) {
      return {
        success: true,
        message: '没有待处理的冲突',
        results: []
      };
    }
    
    const startTime = Date.now();
    const results = [];
    
    for (const conflict of pendingConflicts) {
      const result = await this.retryScheduleForStudent(conflict.id);
      results.push({
        conflictId: conflict.id,
        studentName: conflict.student.name,
        ...result
      });
    }
    
    const executionTime = Date.now() - startTime;
    const successCount = results.filter(r => r.success).length;
    
    return {
      success: true,
      totalAttempts: results.length,
      successCount,
      failureCount: results.length - successCount,
      executionTime,
      results
    };
  }
  
  /**
   * 跳过冲突
   * @param {string} conflictId - 冲突ID
   */
  skipConflict(conflictId) {
    const conflict = this.getConflictById(conflictId);
    if (conflict) {
      this._updateConflict(updateConflictStatus(conflict, ConflictStatus.SKIPPED));
    }
  }
  
  /**
   * 获取所有修改记录
   * @returns {Array<ModificationRecord>}
   */
  getAllModifications() {
    return this.modificationRecords;
  }
  
  /**
   * 获取冲突统计信息
   * @returns {Object}
   */
  getStatistics() {
    return getConflictStatistics(this.enhancedConflicts);
  }
  
  /**
   * 获取修改后的数据
   * @returns {Object}
   */
  getModifiedData() {
    return {
      students: this.students,
      teachers: this.teachers,
      classrooms: this.classrooms,
      scheduledCourses: this.scheduledCourses
    };
  }
  
  /**
   * 添加监听器
   * @param {string} eventName - 事件名称
   * @param {Function} callback - 回调函数
   */
  on(eventName, callback) {
    if (this.listeners[eventName]) {
      this.listeners[eventName].push(callback);
    }
  }
  
  /**
   * 移除监听器
   * @param {string} eventName - 事件名称
   * @param {Function} callback - 回调函数
   */
  off(eventName, callback) {
    if (this.listeners[eventName]) {
      this.listeners[eventName] = this.listeners[eventName].filter(cb => cb !== callback);
    }
  }
  
  /**
   * 内部方法：通知监听器
   */
  _notifyListeners(eventName, data) {
    if (this.listeners[eventName]) {
      this.listeners[eventName].forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`[AdjustmentService] Listener error (${eventName}):`, error);
        }
      });
    }
  }
  
  /**
   * 内部方法：更新冲突对象
   */
  _updateConflict(updatedConflict) {
    const index = this.enhancedConflicts.findIndex(c => c.id === updatedConflict.id);
    if (index !== -1) {
      this.enhancedConflicts[index] = updatedConflict;
      this._notifyListeners('onConflictUpdate', updatedConflict);
    }
  }
  
  /**
   * 内部方法：放宽时间约束
   */
  _relaxTimeConstraint(conflict, reason) {
    const student = conflict.student;
    
    // 扩大可用天数（如果当前少于5天，增加到5天）
    if (student.parsedData?.allowedDays?.length < 5) {
      return this.modifyData(
        TargetType.STUDENT,
        student.id,
        'allowedDays',
        [1, 2, 3, 4, 5],
        reason,
        conflict.id
      );
    }
    
    // 或者扩大时间范围
    return this.modifyData(
      TargetType.STUDENT,
      student.id,
      'timeNote',
      '已放宽时间约束',
      reason,
      conflict.id
    );
  }
  
  /**
   * 内部方法：增加教师课时上限
   */
  _increaseTeacherHours(conflict, reason) {
    // 从冲突原因中提取教师名称
    const teacherName = conflict.metadata?.extractedInfo?.teacherName;
    if (!teacherName) {
      return { success: false, message: '无法识别教师' };
    }
    
    const teacher = this.teachers.find(t => t.name === teacherName);
    if (!teacher) {
      return { success: false, message: '找不到教师' };
    }
    
    const currentMax = teacher.maxHoursPerWeek || 40;
    const newMax = currentMax + 5;
    
    return this.modifyData(
      TargetType.TEACHER,
      teacher.id,
      'maxHoursPerWeek',
      newMax,
      reason,
      conflict.id
    );
  }
}

export default ScheduleAdjustmentService;
