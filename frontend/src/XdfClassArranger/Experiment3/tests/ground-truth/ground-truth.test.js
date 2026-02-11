/**
 * Ground Truth Tests - 排课系统完整流程测试
 * 
 * 50个deterministic test cases，覆盖：
 * 1. 数据生成
 * 2. 初次排课
 * 3. 智能推荐生成
 * 4. 应用推荐
 * 5. 重新排课
 */

import { describe, it, expect, beforeEach } from 'vitest';
import testCases from './test-cases.json';
import {
  createStudent,
  createTeacher,
  createClassroom,
  createLegacyStudent,
  createLegacyTeacher,
  createLegacyClassroom,
  validateStudentData,
  validateSync,
  timeToSlot,
  slotToTime
} from './test-data-factory.js';
import { SchedulingAlgorithmAdapter } from '../../algorithms/algorithmAdapter.js';
import { TripleMatchScheduler } from '../../algorithms/tripleMatchScheduler.js';

// 模拟智能推荐生成（简化版本）
function generateSmartRecommendations(student) {
  const recommendations = [];
  const isV4 = student.scheduling && student.scheduling.timeConstraints;
  
  // 获取当前约束
  const currentDays = isV4 
    ? student.scheduling.timeConstraints.allowedDays
    : (student.parsedData?.allowedDays || [1,2,3,4,5]);
  
  const currentTimeRanges = isV4
    ? student.scheduling.timeConstraints.allowedTimeRanges
    : (student.parsedData?.allowedTimeRanges || []);
  
  const currentFreq = isV4 
    ? parseInt(student.scheduling.frequencyConstraints.frequency)
    : parseInt(student.frequency) || 1;
  
  // 推荐0: 极度宽松
  const ultraFlexibleTimeSlots = [
    { day: 0, startSlot: 12, endSlot: 102 },
    { day: 1, startSlot: 12, endSlot: 102 },
    { day: 2, startSlot: 12, endSlot: 102 },
    { day: 3, startSlot: 12, endSlot: 102 },
    { day: 4, startSlot: 12, endSlot: 102 },
    { day: 5, startSlot: 12, endSlot: 102 },
    { day: 6, startSlot: 12, endSlot: 102 }
  ];
  
  recommendations.push({
    id: 'ultra-flexible',
    title: '极度宽松排课',
    data: isV4 ? {
      scheduling: {
        timeConstraints: {
          allowedDays: [0, 1, 2, 3, 4, 5, 6],
          allowedTimeRanges: ultraFlexibleTimeSlots,
          excludedTimeRanges: []
        },
        frequencyConstraints: {
          ...student.scheduling.frequencyConstraints,
          schedulingMode: 'flexible',
          isRecurringFixed: false
        }
      }
    } : {
      parsedData: {
        allowedDays: [0, 1, 2, 3, 4, 5, 6],
        allowedTimeRanges: ultraFlexibleTimeSlots.map(r => ({
          day: r.day,
          start: r.startSlot,
          end: r.endSlot
        }))
      },
      constraints: {
        allowedDays: new Set([0, 1, 2, 3, 4, 5, 6]),
        allowedTimeRanges: ultraFlexibleTimeSlots,
        excludedTimeRanges: []
      },
      schedulingMode: 'flexible',
      isRecurringFixed: false
    }
  });
  
  // 推荐1: 扩大时间范围
  if (currentTimeRanges.length > 0) {
    const expandedTimeSlots = currentTimeRanges.map(r => ({
      day: r.day,
      startSlot: Math.max(0, (r.start || r.startSlot) - 6),
      endSlot: Math.min(149, (r.end || r.endSlot) + 6)
    }));
    
    recommendations.push({
      id: 'expand-time-range',
      title: '扩大可用时间范围',
      data: isV4 ? {
        scheduling: {
          timeConstraints: {
            ...student.scheduling.timeConstraints,
            allowedTimeRanges: expandedTimeSlots
          }
        }
      } : {
        parsedData: {
          ...student.parsedData,
          allowedTimeRanges: expandedTimeSlots.map(r => ({
            day: r.day,
            start: r.startSlot,
            end: r.endSlot
          }))
        },
        constraints: {
          ...(student.constraints || {}),
          allowedTimeRanges: expandedTimeSlots
        }
      }
    });
  }
  
  // 推荐2: 增加可用天数
  const allDays = [0, 1, 2, 3, 4, 5, 6];
  const additionalDays = allDays.filter(d => !currentDays.includes(d));
  
  if (additionalDays.length > 0 && currentDays.length < 7) {
    const newDays = [...currentDays, ...additionalDays.slice(0, 1)];
    const avgStart = currentTimeRanges.length > 0 
      ? Math.min(...currentTimeRanges.map(r => r.start || r.startSlot))
      : 48;
    const avgEnd = currentTimeRanges.length > 0
      ? Math.max(...currentTimeRanges.map(r => r.end || r.endSlot))
      : 108;
    
    const newTimeSlots = newDays.map(day => ({
      day,
      startSlot: avgStart,
      endSlot: avgEnd
    }));
    
    recommendations.push({
      id: 'add-available-days',
      title: '增加可用上课天数',
      data: isV4 ? {
        scheduling: {
          timeConstraints: {
            ...student.scheduling.timeConstraints,
            allowedDays: newDays,
            allowedTimeRanges: newTimeSlots
          }
        }
      } : {
        parsedData: {
          ...student.parsedData,
          allowedDays: newDays,
          allowedTimeRanges: newTimeSlots.map(r => ({
            day: r.day,
            start: r.startSlot,
            end: r.endSlot
          }))
        },
        constraints: {
          ...(student.constraints || {}),
          allowedDays: new Set(newDays),
          allowedTimeRanges: newTimeSlots
        }
      }
    });
  }
  
  // 推荐3: 灵活时间安排
  if (currentFreq > 1) {
    recommendations.push({
      id: 'flexible-scheduling',
      title: '采用灵活时间安排',
      data: isV4 ? {
        scheduling: {
          frequencyConstraints: {
            ...student.scheduling.frequencyConstraints,
            schedulingMode: 'flexible',
            isRecurringFixed: false
          },
          timeConstraints: {
            ...student.scheduling.timeConstraints,
            allowedDays: currentDays,
            allowedTimeRanges: currentTimeRanges
          }
        }
      } : {
        parsedData: {
          ...student.parsedData,
          allowedDays: currentDays,
          allowedTimeRanges: currentTimeRanges.map(r => ({
            day: r.day,
            start: r.start || r.startSlot,
            end: r.end || r.endSlot
          }))
        },
        constraints: {
          ...(student.constraints || {}),
          allowedDays: new Set(currentDays),
          allowedTimeRanges: currentTimeRanges
        },
        schedulingMode: 'flexible',
        isRecurringFixed: false
      }
    });
  }
  
  // 推荐4: 切换线上模式
  const currentMode = student.scheduling?.modeConstraints?.mode || student.mode || 'offline';
  if (currentMode === 'offline') {
    recommendations.push({
      id: 'switch-online',
      title: '切换为线上授课',
      data: isV4 ? {
        scheduling: {
          modeConstraints: {
            ...student.scheduling.modeConstraints,
            mode: 'online'
          }
        }
      } : {
        mode: 'online'
      }
    });
  }
  
  // 推荐5: 调整频率
  if (currentFreq === 1) {
    recommendations.push({
      id: 'adjust-frequency',
      title: '增加上课频率到2次/周',
      data: isV4 ? {
        scheduling: {
          frequencyConstraints: {
            ...student.scheduling.frequencyConstraints,
            frequency: '2次/周'
          }
        }
      } : {
        frequency: '2次/周'
      }
    });
  }
  
  // 推荐6: 放宽教师约束
  recommendations.push({
    id: 'relax-teacher-preference',
    title: '放宽教师选择',
    data: isV4 ? {
      scheduling: {
        teacherConstraints: {
          preferredTeachers: [],
          excludedTeachers: []
        }
      }
    } : {
      preferredTeacher: null
    }
  });
  
  // 推荐7: 全面放宽约束
  recommendations.push({
    id: 'general-flexibility',
    title: '全面放宽所有约束',
    data: isV4 ? {
      scheduling: {
        timeConstraints: {
          allowedDays: [0, 1, 2, 3, 4, 5, 6],
          allowedTimeRanges: ultraFlexibleTimeSlots,
          excludedTimeRanges: []
        },
        frequencyConstraints: {
          ...student.scheduling.frequencyConstraints,
          schedulingMode: 'flexible',
          isRecurringFixed: false
        },
        teacherConstraints: {
          preferredTeachers: [],
          excludedTeachers: []
        },
        modeConstraints: {
          mode: 'online',
          preferredClassrooms: []
        }
      }
    } : {
      parsedData: {
        allowedDays: [0, 1, 2, 3, 4, 5, 6],
        allowedTimeRanges: ultraFlexibleTimeSlots.map(r => ({
          day: r.day,
          start: r.startSlot,
          end: r.endSlot
        }))
      },
      constraints: {
        allowedDays: new Set([0, 1, 2, 3, 4, 5, 6]),
        allowedTimeRanges: ultraFlexibleTimeSlots,
        excludedTimeRanges: []
      },
      schedulingMode: 'flexible',
      isRecurringFixed: false,
      mode: 'online',
      preferredTeacher: null
    }
  });
  
  return recommendations;
}

// 模拟应用推荐（与ScheduleAdjustmentModal.handleManualModify一致）
function applyRecommendation(student, recommendation) {
  const modifiedStudent = JSON.parse(JSON.stringify(student));
  const data = recommendation.data;
  
  // 应用所有修改
  Object.entries(data).forEach(([field, value]) => {
    // === V4 Schema: 特殊处理 scheduling ===
    if (field === 'scheduling' && typeof value === 'object' && value !== null) {
      if (!modifiedStudent.scheduling) {
        modifiedStudent.scheduling = {
          timeConstraints: {},
          frequencyConstraints: {},
          teacherConstraints: {},
          modeConstraints: {}
        };
      }
      
      // 深度合并 scheduling
      Object.entries(value).forEach(([scheduleField, scheduleValue]) => {
        if (typeof scheduleValue === 'object' && scheduleValue !== null) {
          if (!modifiedStudent.scheduling[scheduleField]) {
            modifiedStudent.scheduling[scheduleField] = {};
          }
          
          Object.entries(scheduleValue).forEach(([subField, subValue]) => {
            modifiedStudent.scheduling[scheduleField][subField] = subValue;
          });
        } else {
          modifiedStudent.scheduling[scheduleField] = scheduleValue;
        }
      });
      
      // 同步到旧格式（向后兼容）
      if (value.timeConstraints) {
        modifiedStudent.parsedData = modifiedStudent.parsedData || {};
        modifiedStudent.parsedData.allowedDays = value.timeConstraints.allowedDays;
        modifiedStudent.parsedData.allowedTimeRanges = value.timeConstraints.allowedTimeRanges?.map(r => ({
          day: r.day,
          start: r.startSlot,
          end: r.endSlot
        })) || [];
        
        modifiedStudent.constraints = modifiedStudent.constraints || {};
        modifiedStudent.constraints.allowedDays = new Set(value.timeConstraints.allowedDays);
        modifiedStudent.constraints.allowedTimeRanges = value.timeConstraints.allowedTimeRanges;
      }
      
      if (value.frequencyConstraints) {
        modifiedStudent.schedulingMode = value.frequencyConstraints.schedulingMode;
        modifiedStudent.isRecurringFixed = value.frequencyConstraints.isRecurringFixed;
        modifiedStudent.frequency = value.frequencyConstraints.frequency;
        modifiedStudent.duration = `${value.frequencyConstraints.duration / 60}小时`;
      }
    }
    // === 旧格式: parsedData ===
    else if (field === 'parsedData' && typeof value === 'object' && value !== null) {
      modifiedStudent.parsedData = modifiedStudent.parsedData || {};
      Object.entries(value).forEach(([subField, subValue]) => {
        modifiedStudent.parsedData[subField] = subValue;
      });
      
      // 同步到V4 Schema
      if (modifiedStudent.scheduling) {
        if (value.allowedDays) {
          modifiedStudent.scheduling.timeConstraints = modifiedStudent.scheduling.timeConstraints || {};
          modifiedStudent.scheduling.timeConstraints.allowedDays = value.allowedDays;
        }
        if (value.allowedTimeRanges) {
          modifiedStudent.scheduling.timeConstraints = modifiedStudent.scheduling.timeConstraints || {};
          modifiedStudent.scheduling.timeConstraints.allowedTimeRanges = value.allowedTimeRanges.map(r => ({
            day: r.day,
            startSlot: r.start || r.startSlot,
            endSlot: r.end || r.endSlot
          }));
        }
      }
    }
    // === 旧格式: constraints ===
    else if (field === 'constraints' && typeof value === 'object' && value !== null) {
      modifiedStudent.constraints = modifiedStudent.constraints || {};
      Object.entries(value).forEach(([subField, subValue]) => {
        modifiedStudent.constraints[subField] = subValue;
      });
      
      // 同步到V4 Schema
      if (modifiedStudent.scheduling) {
        if (value.allowedDays) {
          modifiedStudent.scheduling.timeConstraints = modifiedStudent.scheduling.timeConstraints || {};
          modifiedStudent.scheduling.timeConstraints.allowedDays = Array.from(value.allowedDays);
        }
        if (value.allowedTimeRanges) {
          modifiedStudent.scheduling.timeConstraints = modifiedStudent.scheduling.timeConstraints || {};
          modifiedStudent.scheduling.timeConstraints.allowedTimeRanges = value.allowedTimeRanges;
        }
      }
    }
    // === 其他字段 ===
    else {
      modifiedStudent[field] = value;
    }
  });
  
  // 修复JSON.parse/stringify导致的Set -> Array转换
  if (modifiedStudent.constraints && Array.isArray(modifiedStudent.constraints.allowedDays)) {
    modifiedStudent.constraints.allowedDays = new Set(modifiedStudent.constraints.allowedDays);
  }
  
  return modifiedStudent;
}

describe('Ground Truth Tests - 排课系统完整流程', () => {
  // 运行所有50个test cases
  describe.each(testCases)('$id: $description', (testCase) => {
    let student, teachers, classrooms;
    let algorithmAdapter;
    let initialSchedulingResult;
    let recommendations;
    let selectedRecommendation;
    let modifiedStudent;
    let rescheduleResult;
    
    beforeEach(() => {
      // Phase 0: 准备数据
      student = createLegacyStudent(testCase.studentConfig);
      teachers = testCase.teacherConfigs.map(cfg => createLegacyTeacher(cfg));
      classrooms = testCase.classroomConfigs.map(cfg => createLegacyClassroom(cfg));
      
      // 创建算法适配器
      algorithmAdapter = new SchedulingAlgorithmAdapter('triple-match');
    });
    
    it('Phase 1: 初次排课', async () => {
      console.log(`\n[$

{testCase.id}] ===== Phase 1: 初次排课 =====`);
      console.log('学生数据:', {
        name: student.name,
        subject: student.subject,
        campus: student.campus,
        frequency: student.frequency,
        duration: student.duration,
        scheduling: student.scheduling
      });
      
      // 验证数据格式
      const validation = validateStudentData(student);
      expect(validation.valid, `数据验证失败: ${validation.errors.join(', ')}`).toBe(true);
      
      // 执行排课
      initialSchedulingResult = await algorithmAdapter.schedule(
        [student],
        teachers,
        classrooms
      );
      
      console.log('排课结果:', {
        success: initialSchedulingResult.courses?.length > 0,
        coursesCount: initialSchedulingResult.courses?.length || 0,
        conflictsCount: initialSchedulingResult.conflicts?.length || 0
      });
      
      // 验证预期结果
      if (testCase.phase1_initialScheduling?.expected === 'success') {
        expect(initialSchedulingResult.courses?.length).toBeGreaterThan(0);
      } else if (testCase.phase1_initialScheduling?.expected === 'failure') {
        expect(initialSchedulingResult.courses?.length || 0).toBe(0);
        if (testCase.phase1_initialScheduling.expectedReason) {
          const reason = initialSchedulingResult.conflicts?.[0]?.reason || '';
          expect(reason).toMatch(new RegExp(testCase.phase1_initialScheduling.expectedReason));
        }
      }
    });
    
    it('Phase 2: 生成智能推荐', () => {
      console.log(`\n[${testCase.id}] ===== Phase 2: 生成智能推荐 =====`);
      
      // 生成推荐
      recommendations = generateSmartRecommendations(student);
      
      console.log('生成的推荐数量:', recommendations.length);
      console.log('推荐ID列表:', recommendations.map(r => r.id));
      
      // 验证推荐数量
      if (testCase.phase2_smartRecommendation?.expectedRecommendations !== undefined) {
        expect(recommendations.length).toBe(testCase.phase2_smartRecommendation.expectedRecommendations);
      } else {
        expect(recommendations.length).toBeGreaterThan(0);
      }
      
      // 选择推荐方案
      const recommendationId = testCase.phase2_smartRecommendation?.selectedRecommendation;
      if (recommendationId) {
        selectedRecommendation = recommendations.find(r => r.id === recommendationId);
        expect(selectedRecommendation, `未找到推荐方案: ${recommendationId}`).toBeDefined();
        
        console.log('选中推荐:', {
          id: selectedRecommendation.id,
          title: selectedRecommendation.title,
          dataKeys: Object.keys(selectedRecommendation.data)
        });
      }
    });
    
    it('Phase 3: 应用推荐', () => {
      if (!selectedRecommendation) {
        console.log(`[${testCase.id}] 跳过 Phase 3: 无选中推荐`);
        return;
      }
      
      console.log(`\n[${testCase.id}] ===== Phase 3: 应用推荐 =====`);
      console.log('应用前学生数据:', {
        scheduling: student.scheduling,
        parsedData: student.parsedData,
        constraints: student.constraints ? {
          allowedDays: Array.from(student.constraints.allowedDays || []),
          allowedTimeRanges: student.constraints.allowedTimeRanges
        } : null
      });
      
      // 应用推荐
      modifiedStudent = applyRecommendation(student, selectedRecommendation);
      
      console.log('应用后学生数据:', {
        scheduling: modifiedStudent.scheduling,
        parsedData: modifiedStudent.parsedData,
        constraints: modifiedStudent.constraints ? {
          allowedDays: Array.from(modifiedStudent.constraints.allowedDays || []),
          allowedTimeRanges: modifiedStudent.constraints.allowedTimeRanges
        } : null
      });
      
      // === 关键验证点 ===
      
      // 1. V4 Schema存在
      expect(modifiedStudent.scheduling, 'V4 Schema: scheduling 字段缺失').toBeDefined();
      expect(modifiedStudent.scheduling.timeConstraints, 'V4 Schema: timeConstraints 缺失').toBeDefined();
      expect(modifiedStudent.scheduling.frequencyConstraints, 'V4 Schema: frequencyConstraints 缺失').toBeDefined();
      
      // 2. 时间约束完整性
      const timeConstraints = modifiedStudent.scheduling.timeConstraints;
      expect(timeConstraints.allowedDays, 'allowedDays 缺失').toBeDefined();
      expect(Array.isArray(timeConstraints.allowedDays), 'allowedDays 不是数组').toBe(true);
      expect(timeConstraints.allowedDays.length, 'allowedDays 为空').toBeGreaterThan(0);
      
      expect(timeConstraints.allowedTimeRanges, 'allowedTimeRanges 缺失').toBeDefined();
      expect(Array.isArray(timeConstraints.allowedTimeRanges), 'allowedTimeRanges 不是数组').toBe(true);
      expect(timeConstraints.allowedTimeRanges.length, 'allowedTimeRanges 为空').toBeGreaterThan(0);
      
      // 3. 每个时间范围必须有day字段
      timeConstraints.allowedTimeRanges.forEach((range, idx) => {
        expect(range.day, `Range[${idx}] 缺少 day 字段`).toBeDefined();
        expect(range.day, `Range[${idx}] day 超出范围 (0-6): ${range.day}`).toBeGreaterThanOrEqual(0);
        expect(range.day, `Range[${idx}] day 超出范围 (0-6): ${range.day}`).toBeLessThanOrEqual(6);
        
        expect(range.startSlot, `Range[${idx}] 缺少 startSlot`).toBeDefined();
        expect(range.startSlot, `Range[${idx}] startSlot 超出范围: ${range.startSlot}`).toBeGreaterThanOrEqual(0);
        expect(range.startSlot, `Range[${idx}] startSlot 超出范围: ${range.startSlot}`).toBeLessThan(150);
        
        expect(range.endSlot, `Range[${idx}] 缺少 endSlot`).toBeDefined();
        expect(range.endSlot, `Range[${idx}] endSlot 超出范围: ${range.endSlot}`).toBeGreaterThanOrEqual(0);
        expect(range.endSlot, `Range[${idx}] endSlot 超出范围: ${range.endSlot}`).toBeLessThanOrEqual(150);
        
        expect(range.startSlot, `Range[${idx}] startSlot >= endSlot`).toBeLessThan(range.endSlot);
      });
      
      // 4. 旧格式同步验证（只在未指定validations或包含sync验证时运行）
      const shouldCheckSync = !testCase.phase3_applyRecommendation?.validations || 
                              testCase.phase3_applyRecommendation?.validations.includes('V4 and legacy formats synced');
      
      if (shouldCheckSync && modifiedStudent.parsedData) {
        expect(modifiedStudent.parsedData.allowedDays, 'parsedData.allowedDays 缺失').toBeDefined();
        expect(modifiedStudent.parsedData.allowedTimeRanges, 'parsedData.allowedTimeRanges 缺失').toBeDefined();
        
        // 验证同步正确性
        const syncValidation = validateSync(modifiedStudent);
        if (!syncValidation.valid) {
          console.warn('同步验证失败:', syncValidation.errors);
        }
        expect(syncValidation.valid, `同步验证失败: ${syncValidation.errors.join(', ')}`).toBe(true);
      }
      
      // 5. 验证推荐预期改变
      if (testCase.phase3_applyRecommendation?.expectedChanges) {
        const expectedChanges = testCase.phase3_applyRecommendation.expectedChanges;
        
        Object.entries(expectedChanges).forEach(([path, expectedValue]) => {
          const actualValue = path.split('.').reduce((obj, key) => obj?.[key], modifiedStudent);
          
          if (typeof expectedValue === 'boolean') {
            expect(!!actualValue, `${path} 预期改变但未改变`).toBe(expectedValue);
          } else if (Array.isArray(expectedValue)) {
            expect(JSON.stringify(actualValue)).toBe(JSON.stringify(expectedValue));
          } else {
            expect(actualValue).toBe(expectedValue);
          }
        });
      }
      
      // 6. 验证具体的验证点
      if (testCase.phase3_applyRecommendation?.validations) {
        testCase.phase3_applyRecommendation.validations.forEach(validation => {
          if (validation === 'all timeRanges have day field') {
            timeConstraints.allowedTimeRanges.forEach((range, idx) => {
              expect(range.day, `Range[${idx}] 缺少 day 字段`).toBeDefined();
            });
          }
          if (validation === 'all slots in 0-149 range') {
            timeConstraints.allowedTimeRanges.forEach((range, idx) => {
              expect(range.startSlot).toBeGreaterThanOrEqual(0);
              expect(range.startSlot).toBeLessThan(150);
              expect(range.endSlot).toBeGreaterThanOrEqual(0);
              expect(range.endSlot).toBeLessThanOrEqual(150);
            });
          }
          if (validation === 'V4 and legacy formats synced') {
            const sync = validateSync(modifiedStudent);
            expect(sync.valid, `同步失败: ${sync.errors.join(', ')}`).toBe(true);
          }
        });
      }
    });
    
    it('Phase 4: 重新排课', async () => {
      if (!modifiedStudent) {
        modifiedStudent = student; // 如果没有应用推荐，使用原始学生
      }
      
      console.log(`\n[${testCase.id}] ===== Phase 4: 重新排课 =====`);
      console.log('修改后学生约束:', {
        scheduling: modifiedStudent.scheduling,
        parsedData: modifiedStudent.parsedData?.allowedTimeRanges?.length,
        constraints: modifiedStudent.constraints?.allowedTimeRanges?.length
      });
      
      // 执行重新排课
      rescheduleResult = await algorithmAdapter.schedule(
        [modifiedStudent],
        teachers,
        classrooms
      );
      
      console.log('重新排课结果:', {
        success: rescheduleResult.courses?.length > 0,
        coursesCount: rescheduleResult.courses?.length || 0,
        conflictsCount: rescheduleResult.conflicts?.length || 0,
        reason: rescheduleResult.conflicts?.[0]?.reason || rescheduleResult.message
      });
      
      // 验证预期结果
      if (testCase.phase4_reschedule?.expected === 'success') {
        // 关键断言：必须排课成功
        expect(
          rescheduleResult.courses?.length,
          `重新排课失败！原因: ${rescheduleResult.conflicts?.[0]?.reason || rescheduleResult.message || '未知'}\n` +
          `学生: ${modifiedStudent.name}\n` +
          `约束: ${JSON.stringify(modifiedStudent.scheduling?.timeConstraints, null, 2)}\n` +
          `推荐: ${selectedRecommendation?.id}`
        ).toBeGreaterThan(0);
        
        // 验证课程数据
        const course = rescheduleResult.courses[0];
        expect(course.student.name).toBe(modifiedStudent.name);
        expect(course.teacher).toBeDefined();
        expect(course.classroom).toBeDefined();
        expect(course.timeSlot).toBeDefined();
        
        // 对于灵活模式，验证flexibleSlots
        if (modifiedStudent.scheduling?.frequencyConstraints?.schedulingMode === 'flexible') {
          const freqNum = parseInt(modifiedStudent.scheduling.frequencyConstraints.frequency) || 1;
          if (freqNum > 1 && course.flexibleSlots) {
            expect(course.flexibleSlots.length, '灵活模式：时间槽数量应等于频率').toBe(freqNum);
            
            // 验证不同天数
            const days = new Set(course.flexibleSlots.map(s => s.day));
            expect(days.size, '灵活模式：应该在不同天数').toBe(freqNum);
          }
        }
      } else if (testCase.phase4_reschedule?.expected === 'failure') {
        expect(rescheduleResult.courses?.length || 0).toBe(0);
      }
    });
    
    it('Phase 5: 数据完整性验证', () => {
      if (!modifiedStudent) return;
      
      console.log(`\n[${testCase.id}] ===== Phase 5: 数据完整性验证 =====`);
      
      // 验证同步
      const syncValidation = validateSync(modifiedStudent);
      if (!syncValidation.valid) {
        console.error('同步验证错误:', syncValidation.errors);
      }
      
      // 验证V4 Schema
      expect(modifiedStudent.scheduling).toBeDefined();
      expect(modifiedStudent.scheduling.timeConstraints).toBeDefined();
      expect(modifiedStudent.scheduling.frequencyConstraints).toBeDefined();
      
      // 验证时间范围格式
      const ranges = modifiedStudent.scheduling.timeConstraints.allowedTimeRanges;
      ranges.forEach((range, idx) => {
        expect(range, `Range[${idx}] 为空`).toBeDefined();
        expect(range.day, `Range[${idx}] day 缺失`).toBeDefined();
        expect(range.startSlot, `Range[${idx}] startSlot 缺失`).toBeDefined();
        expect(range.endSlot, `Range[${idx}] endSlot 缺失`).toBeDefined();
        
        // 验证范围
        expect(range.day).toBeGreaterThanOrEqual(0);
        expect(range.day).toBeLessThanOrEqual(6);
        expect(range.startSlot).toBeGreaterThanOrEqual(0);
        expect(range.startSlot).toBeLessThan(150);
        expect(range.endSlot).toBeGreaterThanOrEqual(0);
        expect(range.endSlot).toBeLessThanOrEqual(150);
        expect(range.startSlot).toBeLessThan(range.endSlot);
      });
      
      // 验证旧格式同步
      if (modifiedStudent.parsedData?.allowedTimeRanges) {
        const parsedRanges = modifiedStudent.parsedData.allowedTimeRanges;
        parsedRanges.forEach((range, idx) => {
          expect(range.day, `parsedData Range[${idx}] day 缺失`).toBeDefined();
          expect(range.start, `parsedData Range[${idx}] start 缺失`).toBeDefined();
          expect(range.end, `parsedData Range[${idx}] end 缺失`).toBeDefined();
        });
      }
      
      if (modifiedStudent.constraints?.allowedTimeRanges) {
        const constraintRanges = modifiedStudent.constraints.allowedTimeRanges;
        constraintRanges.forEach((range, idx) => {
          expect(range.day, `constraints Range[${idx}] day 缺失`).toBeDefined();
          expect(range.startSlot, `constraints Range[${idx}] startSlot 缺失`).toBeDefined();
          expect(range.endSlot, `constraints Range[${idx}] endSlot 缺失`).toBeDefined();
        });
      }
    });
  });
  
  // 统计测试
  it('整体统计', () => {
    const total = testCases.length;
    const categories = {};
    
    testCases.forEach(tc => {
      categories[tc.category] = (categories[tc.category] || 0) + 1;
    });
    
    console.log('\n===== 测试统计 =====');
    console.log('总测试数量:', total);
    console.log('类别分布:', categories);
    
    expect(total).toBe(50);
  });
});

/**
 * 辅助函数：模拟冲突检测
 */
function simulateConflictDetection(schedulingResult, student) {
  if (schedulingResult.conflicts && schedulingResult.conflicts.length > 0) {
    return {
      hasConflict: true,
      conflicts: schedulingResult.conflicts
    };
  }
  
  // 如果排课失败，创建模拟冲突
  if (!schedulingResult.courses || schedulingResult.courses.length === 0) {
    return {
      hasConflict: true,
      conflicts: [{
        id: `conflict_${Date.now()}`,
        type: 'SCHEDULING_FAILED',
        student,
        reason: schedulingResult.message || '排课失败',
        details: schedulingResult
      }]
    };
  }
  
  return {
    hasConflict: false,
    conflicts: []
  };
}
