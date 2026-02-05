/**
 * 排课调整主模态框
 * Schedule Adjustment Modal Component
 * 
 * 功能：
 * - 全屏模态框，左右分栏布局
 * - 管理调整服务实例
 * - 协调子组件交互
 * - 提供筛选和排序控制
 * - 批量重试功能
 */

import React, { useState, useEffect, useMemo } from 'react';
import ScheduleAdjustmentService from '../../services/scheduleAdjustmentService';
import StudentConflictList from './StudentConflictList';
import AdjustmentPanel from './AdjustmentPanel';
import AdjustmentHistory from './AdjustmentHistory';
import { ConflictStatus } from '../../types/adjustmentTypes';
import './ScheduleAdjustmentModal.css';
import './color-fix.css';

const ScheduleAdjustmentModal = ({
  conflicts = [],
  students = [],
  teachers = [],
  classrooms = [],
  scheduledCourses = [],
  selectedAlgorithm = 'triple-match',
  algorithmAdapter = null,
  onClose,
  onSuccess
}) => {
  // 状态管理
  const [adjustmentService, setAdjustmentService] = useState(null);
  const [selectedConflictId, setSelectedConflictId] = useState(null);
  const [filterSeverity, setFilterSeverity] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('severity');
  const [showHistory, setShowHistory] = useState(false);
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true); // 初始化状态
  const [enhancedConflicts, setEnhancedConflicts] = useState([]);
  
  // 初始化服务
  useEffect(() => {
    const initializeService = async () => {
      // 动态导入并创建算法适配器
      const { SchedulingAlgorithmAdapter } = await import('../../algorithms/algorithmAdapter.js');
      const adapter = new SchedulingAlgorithmAdapter(selectedAlgorithm);
      
      const service = new ScheduleAdjustmentService({
        conflicts,
        students,
        teachers,
        classrooms,
        scheduledCourses,
        algorithm: selectedAlgorithm,
        algorithmAdapter: adapter
      });
    
      // 设置监听器
      service.on('onConflictUpdate', (updatedConflict) => {
        setEnhancedConflicts(service.getEnhancedConflicts());
      });
      
      service.on('onDataModified', (record) => {
        console.log('[AdjustmentModal] Data modified:', record);
      });
      
      service.on('onRetryComplete', (result) => {
        console.log('[AdjustmentModal] Retry complete:', result);
        setLoading(false);
      });
      
      setAdjustmentService(service);
      const initialConflicts = service.getEnhancedConflicts();
      setEnhancedConflicts(initialConflicts);
      
      // 默认选中第一个待处理的冲突
      const firstPending = initialConflicts.find(
        c => c.status === ConflictStatus.PENDING
      );
      if (firstPending) {
        setSelectedConflictId(firstPending.id);
        console.log('[AdjustmentModal] Auto-selected first pending conflict:', firstPending.id);
      } else if (initialConflicts.length > 0) {
        // 如果没有待处理的，选中第一个
        setSelectedConflictId(initialConflicts[0].id);
        console.log('[AdjustmentModal] Auto-selected first conflict:', initialConflicts[0].id);
      }
      
      // 初始化完成
      setInitializing(false);
      console.log('[AdjustmentModal] Initialization complete');
    };
    
    initializeService();
  }, []);
  
  // 当前选中的冲突
  const selectedConflict = useMemo(() => {
    if (!adjustmentService || !selectedConflictId) {
      console.log('[AdjustmentModal] No selected conflict:', { adjustmentService: !!adjustmentService, selectedConflictId });
      return null;
    }
    const conflict = adjustmentService.getConflictById(selectedConflictId);
    console.log('[AdjustmentModal] Selected conflict:', conflict);
    return conflict;
  }, [adjustmentService, selectedConflictId, enhancedConflicts]);
  
  // 统计信息
  const stats = useMemo(() => {
    if (!adjustmentService) return null;
    return adjustmentService.getStatistics();
  }, [adjustmentService, enhancedConflicts]);
  
  /**
   * 应用建议
   */
  const handleApplySuggestion = (suggestion) => {
    if (!adjustmentService || !selectedConflictId) return;
    
    setLoading(true);
    const result = adjustmentService.applySuggestion(
      selectedConflictId,
      suggestion.id,
      `应用建议：${suggestion.title}`
    );
    
    if (result.success) {
      // 刷新冲突列表
      setEnhancedConflicts(adjustmentService.getEnhancedConflicts());
      alert('建议已应用');
    } else {
      alert(`应用失败：${result.message}`);
    }
    
    setLoading(false);
  };
  
  /**
   * 手动修改数据
   */
  const handleManualModify = (modifyData) => {
    if (!adjustmentService) return;
    
    const { targetType, data, reason, conflictId, isVisualEdit } = modifyData;
    
    console.log('[AdjustmentModal] Manual modify:', modifyData);
    console.log('[AdjustmentModal] Data to apply:', data);
    
    if (isVisualEdit) {
      // 可视化编辑器的结构化数据
      const conflict = adjustmentService.getConflictById(conflictId);
      if (!conflict) {
        alert('找不到对应的冲突信息');
        return;
      }
      
      let targetId;
      if (targetType === 'student') {
        targetId = conflict.student.id;
      } else if (targetType === 'teacher') {
        targetId = data.teacherId || conflict.teacher?.id;
      } else if (targetType === 'classroom') {
        targetId = data.classroomId || conflict.classroom?.id;
      }
      
      if (!targetId) {
        alert('无法确定修改目标');
        return;
      }
      
      // 获取目标对象
      const target = adjustmentService._findTarget(targetType, targetId);
      if (!target) {
        alert('找不到目标对象');
        return;
      }
      
      console.log('[AdjustmentModal] Target before modification:', JSON.parse(JSON.stringify(target)));
      
      // 应用所有修改
      let modifiedFields = [];
      Object.entries(data).forEach(([field, value]) => {
        if (field === 'teacherId' || field === 'classroomId') return; // 跳过ID字段
        
        const oldValue = target[field];
        
        // 特殊处理 parsedData - 深度合并而不是替换
        if (field === 'parsedData' && typeof value === 'object' && value !== null) {
          if (!target.parsedData) {
            target.parsedData = {};
          }
          
          // 深度合并 parsedData
          Object.entries(value).forEach(([subField, subValue]) => {
            const oldSubValue = target.parsedData[subField];
            if (JSON.stringify(oldSubValue) !== JSON.stringify(subValue)) {
              target.parsedData[subField] = subValue;
              modifiedFields.push(`parsedData.${subField}: ${JSON.stringify(oldSubValue)} → ${JSON.stringify(subValue)}`);
            }
          });
        } else if (field === 'constraints' && typeof value === 'object' && value !== null) {
          // 特殊处理 constraints - 深度合并并转换 Set
          if (!target.constraints) {
            target.constraints = {};
          }
          
          // 深度合并 constraints
          Object.entries(value).forEach(([subField, subValue]) => {
            const oldSubValue = target.constraints[subField];
            
            // 特殊处理 allowedDays（可能是 Set）
            if (subField === 'allowedDays') {
              const newSet = subValue instanceof Set ? subValue : new Set(subValue);
              const oldSet = oldSubValue instanceof Set ? oldSubValue : new Set(oldSubValue || []);
              
              if (JSON.stringify(Array.from(oldSet)) !== JSON.stringify(Array.from(newSet))) {
                target.constraints[subField] = newSet;
                modifiedFields.push(`constraints.${subField}: [${Array.from(oldSet)}] → [${Array.from(newSet)}]`);
              }
            } else {
              if (JSON.stringify(oldSubValue) !== JSON.stringify(subValue)) {
                target.constraints[subField] = subValue;
                modifiedFields.push(`constraints.${subField}: ${JSON.stringify(oldSubValue)} → ${JSON.stringify(subValue)}`);
              }
            }
          });
        } else {
          // 普通字段直接赋值
          if (JSON.stringify(oldValue) !== JSON.stringify(value)) {
            target[field] = value;
            modifiedFields.push(`${field}: ${JSON.stringify(oldValue)} → ${JSON.stringify(value)}`);
          }
        }
      });
      
      console.log('[AdjustmentModal] Target after modification:', JSON.parse(JSON.stringify(target)));
      console.log('[AdjustmentModal] Modified fields:', modifiedFields);
      
      if (modifiedFields.length > 0) {
        // 标记为已修改
        if (!target.isModified) {
          target.isModified = true;
          target.modificationHistory = [];
        }
        
        const modificationRecord = {
          timestamp: new Date().toISOString(),
          targetType,
          targetId,
          targetName: target.name,
          fields: modifiedFields,
          reason,
          conflictId
        };
        
        target.modificationHistory.push(modificationRecord);
        adjustmentService.modificationRecords.push(modificationRecord);
        
        console.log('[AdjustmentModal] Applied modifications:', modificationRecord);
        
        // 不显示alert，直接继续排课
        console.log(`[AdjustmentModal] 已修改 ${modifiedFields.length} 个字段`);
      } else {
        console.warn('[AdjustmentModal] 没有检测到数据变化');
        alert('没有检测到数据变化，请检查推荐方案');
        return; // 如果没有修改，不继续排课
      }
    } else {
      // 原始文本粘贴方式
      alert('数据已修改（文本粘贴模式需要实现具体解析逻辑）');
    }
    
    // 刷新冲突列表
    setEnhancedConflicts(adjustmentService.getEnhancedConflicts());
  };
  
  /**
   * 重新尝试排课
   */
  const handleRetrySchedule = async (conflictId) => {
    if (!adjustmentService) return;
    
    setLoading(true);
    console.log('[AdjustmentModal] 开始重新排课 - conflictId:', conflictId);
    
    const result = await adjustmentService.retryScheduleForStudent(conflictId);
    
    console.log('[AdjustmentModal] 排课结果:', result);
    
    if (result.success) {
      alert(`排课成功！已为学生安排课程`);
      // 刷新冲突列表
      setEnhancedConflicts(adjustmentService.getEnhancedConflicts());
    } else {
      const errorMsg = result.reason || result.message || '未知错误';
      console.error('[AdjustmentModal] 排课失败:', errorMsg);
      
      // 显示更详细的错误信息
      alert(`排课失败：${errorMsg}\n\n可能的原因：\n1. 修改的约束仍然不满足排课条件\n2. 教师或教室资源不足\n3. 时间冲突无法解决\n\n建议：尝试其他推荐方案或手动调整更多约束`);
    }
    
    setLoading(false);
  };
  
  /**
   * 跳过冲突
   */
  const handleSkipConflict = (conflictId) => {
    if (!adjustmentService) return;
    
    if (window.confirm('确定要跳过此学生吗？')) {
      adjustmentService.skipConflict(conflictId);
      setEnhancedConflicts(adjustmentService.getEnhancedConflicts());
      
      // 跳转到下一个
      handleNextConflict();
    }
  };
  
  /**
   * 下一个冲突
   */
  const handleNextConflict = () => {
    if (!adjustmentService) return;
    
    const conflicts = adjustmentService.getEnhancedConflicts();
    const currentIndex = conflicts.findIndex(c => c.id === selectedConflictId);
    
    // 找到下一个待处理的冲突
    for (let i = currentIndex + 1; i < conflicts.length; i++) {
      if (conflicts[i].status === ConflictStatus.PENDING || 
          conflicts[i].status === ConflictStatus.IN_PROGRESS) {
        setSelectedConflictId(conflicts[i].id);
        return;
      }
    }
    
    // 如果没有找到，从头开始找
    for (let i = 0; i < currentIndex; i++) {
      if (conflicts[i].status === ConflictStatus.PENDING || 
          conflicts[i].status === ConflictStatus.IN_PROGRESS) {
        setSelectedConflictId(conflicts[i].id);
        return;
      }
    }
    
    alert('没有更多待处理的冲突');
  };
  
  /**
   * 批量重试
   */
  const handleBatchRetry = async () => {
    if (!adjustmentService) return;
    
    if (!window.confirm('确定要批量重新排课所有未解决的冲突吗？')) {
      return;
    }
    
    setLoading(true);
    const result = await adjustmentService.batchRetrySchedule();
    
    alert(`批量排课完成！\n成功：${result.successCount}个\n失败：${result.failureCount}个`);
    
    // 刷新冲突列表
    setEnhancedConflicts(adjustmentService.getEnhancedConflicts());
    setLoading(false);
  };
  
  /**
   * 保存并关闭
   */
  const handleSaveAndClose = () => {
    if (!adjustmentService) return;
    
    const modifiedData = adjustmentService.getModifiedData();
    
    if (window.confirm('确定要保存所有修改并关闭吗？')) {
      onSuccess(modifiedData);
    }
  };
  
  if (initializing || !adjustmentService) {
    return (
      <div className="adjustment-modal-overlay">
        <div className="adjustment-modal loading">
          <div className="spinner"></div>
          <p>正在初始化调整服务...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="adjustment-modal-overlay">
      <div className="adjustment-modal">
        {/* 模态框头部 */}
        <div className="modal-header">
          <div className="header-left">
            <h2 className="modal-title">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              排课调整
            </h2>
            {stats && (
              <div className="stats-summary">
                <span className="stat-item">
                  总计 <strong>{stats.total}</strong>
                </span>
                <span className="stat-divider">|</span>
                <span className="stat-item resolved">
                  已解决 <strong>{stats.resolved}</strong>
                </span>
                <span className="stat-divider">|</span>
                <span className="stat-item pending">
                  待处理 <strong>{stats.pending}</strong>
                </span>
              </div>
            )}
          </div>
          
          <button className="close-button" onClick={onClose}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>
        
        {/* 筛选和排序控制 */}
        <div className="modal-controls">
          <div className="control-group">
            <label>严重程度：</label>
            <select value={filterSeverity} onChange={(e) => setFilterSeverity(e.target.value)}>
              <option value="all">全部</option>
              <option value="high">高</option>
              <option value="medium">中</option>
              <option value="low">低</option>
            </select>
          </div>
          
          <div className="control-group">
            <label>状态：</label>
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
              <option value="all">全部</option>
              <option value="pending">待处理</option>
              <option value="in_progress">处理中</option>
              <option value="resolved">已解决</option>
              <option value="skipped">已跳过</option>
            </select>
          </div>
          
          <div className="control-group">
            <label>排序：</label>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
              <option value="severity">严重程度</option>
              <option value="name">学生姓名</option>
            </select>
          </div>
        </div>
        
        {/* 主内容区 - 左右分栏 */}
        <div className="modal-body">
          {/* 左侧：冲突列表 */}
          <div className="modal-left">
            <StudentConflictList
              conflicts={enhancedConflicts}
              selectedConflictId={selectedConflictId}
              onSelectConflict={setSelectedConflictId}
              filterSeverity={filterSeverity}
              filterStatus={filterStatus}
              sortBy={sortBy}
            />
          </div>
          
          {/* 右侧：调整面板 */}
          <div className="modal-right">
            <AdjustmentPanel
              conflict={selectedConflict}
              onApplySuggestion={handleApplySuggestion}
              onManualModify={handleManualModify}
              onRetrySchedule={handleRetrySchedule}
              onSkipConflict={handleSkipConflict}
              onNextConflict={handleNextConflict}
              onShowHistory={() => setShowHistory(true)}
              loading={loading}
              availableTeachers={teachers}
              availableClassrooms={classrooms}
            />
          </div>
        </div>
        
        {/* 底部操作栏 */}
        <div className="modal-footer">
          <button
            className="footer-btn batch-retry"
            onClick={handleBatchRetry}
            disabled={loading || stats.pending === 0}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0118.8-4.3M22 12.5a10 10 0 01-18.8 4.2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            批量重试 ({stats?.pending || 0}个)
          </button>
          
          <div className="footer-right">
            <button
              className="footer-btn save"
              onClick={handleSaveAndClose}
              disabled={loading}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <polyline points="17 21 17 13 7 13 7 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <polyline points="7 3 7 8 15 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              保存修改
            </button>
            
            <button className="footer-btn cancel" onClick={onClose}>
              关闭
            </button>
          </div>
        </div>
        
        {/* 修改历史面板 */}
        <AdjustmentHistory
          isOpen={showHistory}
          onClose={() => setShowHistory(false)}
          modificationRecords={adjustmentService.getAllModifications()}
        />
      </div>
    </div>
  );
};

export default ScheduleAdjustmentModal;
