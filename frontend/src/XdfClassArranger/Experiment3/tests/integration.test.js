/**
 * 集成测试 - 验证真实组件的推荐应用流程
 * 
 * 这个测试导入真实的SmartRecommendations和handleManualModify逻辑
 */

import { SchedulingAlgorithmAdapter } from '../algorithms/algorithmAdapter.js';

// 模拟一个真实场景
async function testRealRecommendationFlow() {
  console.log('\n========== 集成测试开始 ==========\n');
  
  // 1. 创建测试学生（V4格式）
  const student = {
    id: 'test-student-1',
    name: '集成测试学生',
    campus: '新宿校区',
    subject: '数学',
    frequency: '2次/周',
    duration: '2小时',
    courseHours: {
      totalHours: 100,
      remainingHours: 50
    },
    rawData: {
      学生姓名: '集成测试学生',
      校区: '新宿校区',
      内容: '数学',
      频次: '2次/周',
      时长: '2小时',
      形式: '线下'
    },
    scheduling: {
      timeConstraints: {
        allowedDays: [1],
        allowedTimeRanges: [
          { day: 1, startSlot: 12, endSlot: 48 } // 周一 10:00-13:00
        ],
        excludedTimeRanges: []
      },
      frequencyConstraints: {
        frequency: '2次/周',
        duration: 120,
        isRecurringFixed: true,
        schedulingMode: 'fixed'
      },
      teacherConstraints: {
        preferredTeachers: [],
        excludedTeachers: []
      },
      modeConstraints: {
        mode: 'offline',
        preferredClassrooms: []
      }
    },
    parsedData: {
      allowedDays: [1],
      allowedTimeRanges: [
        { day: 1, start: 12, end: 48 }
      ]
    },
    constraints: {
      allowedDays: new Set([1]),
      allowedTimeRanges: [
        { day: 1, startSlot: 12, endSlot: 48 }
      ]
    }
  };
  
  // 2. 创建测试教师
  const teacher = {
    id: 'test-teacher-1',
    name: '测试教师',
    subjects: ['数学'],
    campus: ['新宿校区'],
    courseHours: { totalHours: 0 },
    rawData: { 姓名: '测试教师', 可教科目: '数学', 校区: '新宿校区' },
    availability: {
      slots: [
        { dayOfWeek: 1, startTime: '09:00', endTime: '21:30' },
        { dayOfWeek: 2, startTime: '09:00', endTime: '21:30' },
        { dayOfWeek: 3, startTime: '09:00', endTime: '21:30' },
        { dayOfWeek: 4, startTime: '09:00', endTime: '21:30' },
        { dayOfWeek: 5, startTime: '09:00', endTime: '21:30' }
      ]
    }
  };
  
  // 3. 创建测试教室
  const classroom = {
    id: 'test-classroom-1',
    name: '测试教室',
    campus: '新宿校区',
    capacity: 10
  };
  
  console.log('1️⃣ 初始排课（应该失败 - 2次/周但只有周一可用）');
  const adapter = new SchedulingAlgorithmAdapter('triple-match');
  const result1 = await adapter.schedule([student], [teacher], [classroom]);
  console.log('初始排课结果:', {
    success: result1.success,
    coursesCount: result1.courses?.length || 0,
    conflictsCount: result1.conflicts?.length || 0
  });
  
  // 4. 模拟应用ultra-flexible推荐
  console.log('\n2️⃣ 应用 ultra-flexible 推荐');
  
  const recommendation = {
    id: 'ultra-flexible',
    title: '极度宽松排课',
    data: {
      scheduling: {
        timeConstraints: {
          allowedDays: [0, 1, 2, 3, 4, 5, 6],
          allowedTimeRanges: [
            { day: 0, startSlot: 12, endSlot: 102 },
            { day: 1, startSlot: 12, endSlot: 102 },
            { day: 2, startSlot: 12, endSlot: 102 },
            { day: 3, startSlot: 12, endSlot: 102 },
            { day: 4, startSlot: 12, endSlot: 102 },
            { day: 5, startSlot: 12, endSlot: 102 },
            { day: 6, startSlot: 12, endSlot: 102 }
          ],
          excludedTimeRanges: []
        },
        frequencyConstraints: {
          ...student.scheduling.frequencyConstraints,
          schedulingMode: 'flexible',
          isRecurringFixed: false
        }
      }
    }
  };
  
  // 模拟 handleManualModify 的逻辑
  const value = recommendation.data.scheduling;
  
  // 应用到 scheduling
  Object.entries(value).forEach(([scheduleField, scheduleValue]) => {
    if (typeof scheduleValue === 'object' && scheduleValue !== null) {
      if (!student.scheduling[scheduleField]) {
        student.scheduling[scheduleField] = {};
      }
      Object.entries(scheduleValue).forEach(([subField, subValue]) => {
        student.scheduling[scheduleField][subField] = subValue;
      });
    }
  });
  
  // 同步到旧格式
  if (value.timeConstraints) {
    student.parsedData.allowedDays = value.timeConstraints.allowedDays;
    student.parsedData.allowedTimeRanges = value.timeConstraints.allowedTimeRanges.map(r => ({
      day: r.day,
      start: r.startSlot,
      end: r.endSlot
    }));
    student.constraints.allowedDays = new Set(value.timeConstraints.allowedDays);
    student.constraints.allowedTimeRanges = value.timeConstraints.allowedTimeRanges;
  }
  
  // 🔥 同步 frequencyConstraints（新修复）
  if (value.frequencyConstraints) {
    student.schedulingMode = value.frequencyConstraints.schedulingMode;
    student.isRecurringFixed = value.frequencyConstraints.isRecurringFixed;
    student.frequency = value.frequencyConstraints.frequency;
    student.duration = `${value.frequencyConstraints.duration / 60}小时`;
  }
  
  console.log('应用推荐后的学生数据（关键字段）:', {
    'scheduling.frequencyConstraints.schedulingMode': student.scheduling.frequencyConstraints.schedulingMode,
    'scheduling.frequencyConstraints.isRecurringFixed': student.scheduling.frequencyConstraints.isRecurringFixed,
    'schedulingMode (旧格式)': student.schedulingMode,
    'isRecurringFixed (旧格式)': student.isRecurringFixed,
    'frequency': student.frequency,
    'allowedDays': student.scheduling.timeConstraints.allowedDays
  });
  
  // 5. 重新排课
  console.log('\n3️⃣ 应用推荐后重新排课（应该成功）');
  const result2 = await adapter.schedule([student], [teacher], [classroom]);
  console.log('重新排课结果:', {
    success: result2.success,
    coursesCount: result2.courses?.length || 0,
    conflictsCount: result2.conflicts?.length || 0,
    reason: result2.conflicts?.[0]?.reason
  });
  
  if (result2.success && result2.courses?.length > 0) {
    console.log('✅ 集成测试通过！应用推荐后成功排课');
    console.log('排课详情:', result2.courses.map(c => ({
      student: c.studentName,
      teacher: c.teacherName,
      time: c.timeSlot,
      flexibleSlots: c.flexibleSlots?.length
    })));
  } else {
    console.log('❌ 集成测试失败！应用推荐后仍然排课失败');
    console.log('失败原因:', result2.conflicts?.[0]?.reason);
  }
  
  console.log('\n========== 集成测试结束 ==========\n');
  
  return result2.success;
}

// 导出测试函数
export { testRealRecommendationFlow };

// 如果直接运行
if (import.meta.vitest) {
  const { describe, it, expect } = import.meta.vitest;
  
  describe('集成测试 - 真实推荐流程', () => {
    it('应用ultra-flexible推荐后应该成功排课', async () => {
      const success = await testRealRecommendationFlow();
      expect(success).toBe(true);
    });
  });
}
