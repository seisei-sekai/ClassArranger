/**
 * 智能推荐组件
 * Smart Recommendations Component
 * 
 * 功能：
 * - 自动分析冲突并生成多个约束调整方案
 * - 为学生/教师/教室生成定制化推荐
 * - 显示预期效果和置信度
 * - 一键应用推荐方案
 */

import React, { useState, useEffect } from 'react';
import './SmartRecommendations.css';

const SmartRecommendations = ({
  conflict,
  targetType = 'student', // 'student', 'teacher', 'classroom'
  onApplyRecommendation,
  loading = false
}) => {
  const [recommendations, setRecommendations] = useState([]);
  const [generating, setGenerating] = useState(false);
  
  // 生成推荐方案
  useEffect(() => {
    if (!conflict) {
      setRecommendations([]);
      return;
    }
    
    setGenerating(true);
    console.log('[SmartRecommendations] 生成推荐 - conflict:', conflict);
    console.log('[SmartRecommendations] 生成推荐 - targetType:', targetType);
    
    // 异步生成推荐（模拟分析过程）
    setTimeout(() => {
      const generated = generateRecommendations(conflict, targetType);
      console.log('[SmartRecommendations] 生成的推荐数量:', generated.length);
      console.log('[SmartRecommendations] 推荐详情:', generated);
      setRecommendations(generated);
      setGenerating(false);
    }, 500);
  }, [conflict, targetType]);
  
  /**
   * 应用推荐方案
   */
  const handleApplyRecommendation = (recommendation) => {
    if (window.confirm(`确定要应用推荐方案"${recommendation.title}"吗？\n\n${recommendation.description}`)) {
      onApplyRecommendation(recommendation);
    }
  };
  
  if (!conflict) {
    return (
      <div className="smart-recommendations-empty">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
          <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <p>请从左侧选择一个冲突</p>
      </div>
    );
  }
  
  if (generating) {
    return (
      <div className="smart-recommendations-loading">
        <div className="loading-spinner"></div>
        <p>正在分析冲突并生成推荐方案...</p>
      </div>
    );
  }
  
  if (recommendations.length === 0) {
    return (
      <div className="smart-recommendations-empty">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
          <path d="M12 8v4M12 16h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
        <p>暂无可用的推荐方案</p>
      </div>
    );
  }
  
  return (
    <div className="smart-recommendations">
      <div className="recommendations-header">
        <div className="header-icon">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <div className="header-text">
          <h3>智能推荐方案</h3>
          <p>系统已为您生成 {recommendations.length} 个约束调整方案</p>
        </div>
      </div>
      
      <div className="recommendations-list">
        {recommendations.map((recommendation, index) => (
          <div key={recommendation.id} className={`recommendation-card priority-${recommendation.priority}`}>
            <div className="card-header">
              <div className="card-title-section">
                <span className="card-index">#{index + 1}</span>
                <h4 className="card-title">{recommendation.title}</h4>
                <span className={`priority-badge priority-${recommendation.priority}`}>
                  {recommendation.priority === 'high' ? '高优先级' : 
                   recommendation.priority === 'medium' ? '中优先级' : '低优先级'}
                </span>
              </div>
              
              <div className="confidence-section">
                <span className="confidence-label">成功率</span>
                <div className="confidence-bar-container">
                  <div 
                    className={`confidence-bar confidence-${getConfidenceLevel(recommendation.confidence)}`}
                    style={{ width: `${recommendation.confidence * 100}%` }}
                  />
                </div>
                <span className="confidence-value">{Math.round(recommendation.confidence * 100)}%</span>
              </div>
            </div>
            
            <p className="card-description">{recommendation.description}</p>
            
            <div className="card-changes">
              <div className="changes-title">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span>具体调整</span>
              </div>
              <ul className="changes-list">
                {recommendation.changes.map((change, idx) => (
                  <li key={idx} className="change-item">
                    <span className="change-field">{change.field}:</span>
                    <span className="change-old">{change.oldValue}</span>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                      <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span className="change-new">{change.newValue}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="card-effects">
              <div className="effects-title">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span>预期效果</span>
              </div>
              <p className="effects-text">{recommendation.expectedEffect}</p>
            </div>
            
            {recommendation.risks && recommendation.risks.length > 0 && (
              <div className="card-risks">
                <div className="risks-title">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <span>注意事项</span>
                </div>
                <ul className="risks-list">
                  {recommendation.risks.map((risk, idx) => (
                    <li key={idx}>{risk}</li>
                  ))}
                </ul>
              </div>
            )}
            
            <div className="card-actions">
              <button
                className="btn-apply-recommendation"
                onClick={() => handleApplyRecommendation(recommendation)}
                disabled={loading}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                应用此方案并重新排课
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * 获取置信度等级
 */
function getConfidenceLevel(confidence) {
  if (confidence >= 0.8) return 'high';
  if (confidence >= 0.6) return 'medium';
  return 'low';
}

/**
 * 生成推荐方案
 */
function generateRecommendations(conflict, targetType) {
  const recommendations = [];
  const student = conflict.student;
  
  console.log('[generateRecommendations] 输入 - targetType:', targetType);
  console.log('[generateRecommendations] 输入 - student:', student);
  
  if (!student) {
    console.warn('[generateRecommendations] 警告: student 为空');
    return recommendations;
  }
  
  if (targetType === 'student') {
    // 学生约束调整推荐
    
    // 推荐1: 扩大可用时间范围
    const hasTimeRanges = student.parsedData?.allowedTimeRanges?.length > 0;
    if (hasTimeRanges) {
      const currentRanges = student.parsedData.allowedTimeRanges;
      const avgStart = Math.min(...currentRanges.map(r => r.start));
      const avgEnd = Math.max(...currentRanges.map(r => r.end));
      
      recommendations.push({
        id: 'expand-time-range',
        title: '扩大可用时间范围',
        description: '将可用时间段提前1小时开始，延后1小时结束，增加排课灵活性',
        priority: 'high',
        confidence: 0.85,
        changes: [
          {
            field: '时间范围',
            oldValue: `${slotToTimeString(avgStart)} - ${slotToTimeString(avgEnd)}`,
            newValue: `${slotToTimeString(Math.max(0, avgStart - 6))} - ${slotToTimeString(Math.min(149, avgEnd + 6))}`
          }
        ],
        expectedEffect: '增加约10-20%的可用时间槽，显著提高排课成功率。适合时间要求较灵活的学生。',
        risks: [],
        data: {
          parsedData: {
            ...student.parsedData,
            allowedTimeRanges: currentRanges.map(r => ({
              ...r,
              start: Math.max(0, r.start - 6),
              end: Math.min(149, r.end + 6)
            }))
          }
        }
      });
    } else {
      // 如果没有时间范围数据，推荐设置全天可用
      recommendations.push({
        id: 'set-full-day-available',
        title: '设置全天可用时间',
        description: '设置工作日全天（9:00-21:00）可用，提供最大排课灵活性',
        priority: 'high',
        confidence: 0.80,
        changes: [
          {
            field: '时间范围',
            oldValue: '未设置',
            newValue: '周一至周五 9:00-21:00'
          }
        ],
        expectedEffect: '提供充足的可用时间段，大幅提高排课成功率。',
        risks: ['请确认学生在这些时间段确实有空'],
        data: {
          parsedData: {
            allowedDays: [1, 2, 3, 4, 5],
            allowedTimeRanges: [
              { start: 18, end: 90 } // 9:00-21:00
            ]
          }
        }
      });
    }
    
    // 推荐2: 增加可用天数
    const currentDays = student.parsedData?.allowedDays || [1, 2, 3, 4, 5];
    const allDays = [0, 1, 2, 3, 4, 5, 6];
    const additionalDays = allDays.filter(d => !currentDays.includes(d));
    
    if (additionalDays.length > 0 && currentDays.length < 7) {
      const newDays = [...currentDays, ...additionalDays.slice(0, 1)];
      
      recommendations.push({
        id: 'add-available-days',
        title: '增加可用上课天数',
        description: `在原有${currentDays.length}天的基础上增加${additionalDays.slice(0, 1).map(d => ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][d]).join('、')}`,
        priority: 'high',
        confidence: 0.80,
        changes: [
          {
            field: '可用天数',
            oldValue: `${currentDays.length}天 (${currentDays.map(d => ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][d]).join('、')})`,
            newValue: `${newDays.length}天 (${newDays.map(d => ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][d]).join('、')})`
          }
        ],
        expectedEffect: '可用天数增加，教师和教室匹配成功率提升约30-40%。',
        risks: ['请确认学生在新增日期确实有空'],
        data: {
          parsedData: {
            ...student.parsedData,
            allowedDays: newDays
          }
        }
      });
    }
    
    // 推荐3: 调整频率降低单次课时
    const currentFreq = parseInt(student.frequency) || 1;
    const currentDuration = parseFloat(student.duration) || 2.5;
    
    if (currentFreq === 1 && currentDuration >= 2) {
      recommendations.push({
        id: 'adjust-frequency',
        title: '增加上课频率，减少单次时长',
        description: '将1次长课拆分为2次短课，提高时间槽匹配灵活性',
        priority: 'medium',
        confidence: 0.75,
        changes: [
          {
            field: '频率',
            oldValue: `${currentFreq}次/周`,
            newValue: '2次/周'
          },
          {
            field: '单次时长',
            oldValue: `${currentDuration}小时`,
            newValue: `${(currentDuration / 2).toFixed(1)}小时`
          }
        ],
        expectedEffect: '短时间段更容易找到匹配的教师和教室，排课成功率提升约20%。',
          risks: ['需要确认学生接受更频繁但更短的课程安排', '总课时保持不变'],
          data: {
            frequency: '2次/周',
            duration: (currentDuration / 2).toFixed(1) + '小时'
          }
      });
    }
    
    // 推荐4: 灵活时间安排（针对时间冲突）⭐ 重要
    if (currentFreq > 1) {
      recommendations.push({
        id: 'flexible-scheduling',
        title: '采用灵活时间安排（推荐）',
        description: '不使用固定时间重复，而是每次课安排在不同的可用时间段，大幅提高排课成功率',
        priority: 'high',
        confidence: 0.90,
        changes: [
          {
            field: '排课模式',
            oldValue: `固定时间重复（${currentFreq}次/周）`,
            newValue: `灵活时间安排（${currentFreq}次/周，每次不同时间）`
          },
          {
            field: '说明',
            oldValue: '每周同一时间上课',
            newValue: '每周在可用时间范围内灵活安排'
          }
        ],
        expectedEffect: '避免固定时间冲突，每次课独立寻找最佳时间槽。成功率提升约70-80%！特别适合时间冲突严重的情况。',
        risks: ['学生需要接受每周上课时间不固定', '需要及时通知学生每周的上课时间'],
        data: {
          // 保持频率不变，但添加标记表示非固定时间
          frequency: student.frequency,
          schedulingMode: 'flexible', // 新增字段：灵活排课模式
          isRecurringFixed: false // 标记不使用固定时间重复
        }
      });
    }
    
    // 推荐5: 线上线下模式切换
    const studentMode = student.mode || '线下';
    if (studentMode === '线下') {
      recommendations.push({
        id: 'switch-to-online',
        title: '切换为线上授课',
        description: '线上授课不受教室限制，大幅提高排课灵活性',
        priority: 'medium',
        confidence: 0.70,
        changes: [
          {
            field: '授课方式',
            oldValue: '线下',
            newValue: '线上'
          }
        ],
        expectedEffect: '不再受教室资源约束，排课成功率提升约50%。教师选择范围扩大。',
        risks: ['需要确认学生具备线上上课条件', '需要确认学生接受线上授课'],
        data: {
          mode: '线上'
        }
      });
    } else {
      recommendations.push({
        id: 'switch-to-offline',
        title: '切换为线下授课',
        description: '如果教师资源充足但教室紧张，线下授课可能更合适',
        priority: 'low',
        confidence: 0.60,
        changes: [
          {
            field: '授课方式',
            oldValue: '线上',
            newValue: '线下'
          }
        ],
        expectedEffect: '在特定情况下可能改善排课结果，但会增加教室资源约束。',
        risks: ['需要确认有可用教室资源'],
        data: {
          mode: '线下'
        }
      });
    }
    
    // 推荐6: 放宽教师偏好
    if (student.preferredTeacher) {
      recommendations.push({
        id: 'relax-teacher-preference',
        title: '放宽指定教师约束',
        description: '移除指定教师偏好，允许系统自动匹配最合适的教师',
        priority: 'medium',
        confidence: 0.65,
        changes: [
          {
            field: '指定教师',
            oldValue: student.preferredTeacher,
            newValue: '无偏好（自动匹配）'
          }
        ],
        expectedEffect: '教师选择范围扩大，排课成功率提升约40-60%。',
        risks: ['学生可能无法上指定教师的课'],
        data: {
          preferredTeacher: ''
        }
      });
    }
    
    // 推荐7: 调整课时总量（降低门槛）
    const currentCourseHours = parseFloat(student.courseHours) || 30;
    if (currentCourseHours > 10) {
      const reducedHours = Math.floor(currentCourseHours / 2);
      recommendations.push({
        id: 'reduce-total-hours',
        title: '暂时降低课时总量',
        description: '先安排部分课时，成功后再增加课时量，降低排课难度',
        priority: 'low',
        confidence: 0.60,
        changes: [
          {
            field: '课时总量',
            oldValue: `${currentCourseHours}小时`,
            newValue: `${reducedHours}小时`
          }
        ],
        expectedEffect: '降低排课复杂度，提高初次排课成功率。后续可再增加课时。',
        risks: ['需要分阶段完成全部课程安排'],
        data: {
          courseHours: reducedHours
        }
      });
    }
    
    // 如果没有生成任何推荐，添加一个通用推荐
    if (recommendations.length === 0) {
      recommendations.push({
        id: 'general-flexibility',
        title: '全面放宽约束',
        description: '综合调整多个约束条件，提供最大灵活性',
        priority: 'high',
        confidence: 0.75,
        changes: [
          {
            field: '可用天数',
            oldValue: currentDays.map(d => ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][d]).join('、'),
            newValue: '周一至周日全部可用'
          },
          {
            field: '时间范围',
            oldValue: '原有时间范围',
            newValue: '9:00-21:00'
          }
        ],
        expectedEffect: '最大化排课灵活性，大幅提高成功率。',
        risks: ['需要确认学生时间灵活度'],
        data: {
          parsedData: {
            allowedDays: [0, 1, 2, 3, 4, 5, 6],
            allowedTimeRanges: [{ start: 18, end: 90 }]
          }
        }
      });
    }
  } else if (targetType === 'teacher') {
    // 教师约束调整推荐
    const teacher = conflict.teacher || {};
    
    recommendations.push({
      id: 'expand-teacher-availability',
      title: '扩大教师可用时间',
      description: '建议教师增加每周可用时间，提高排课灵活性',
      priority: 'high',
      confidence: 0.75,
      changes: [
        {
          field: '每周最大课时',
          oldValue: `${teacher.maxHoursPerWeek || 40}小时`,
          newValue: `${(teacher.maxHoursPerWeek || 40) + 5}小时`
        }
      ],
      expectedEffect: '教师可承担更多课程，减少因教师时间不足导致的冲突。',
      risks: ['需要与教师沟通确认'],
      data: {
        maxHoursPerWeek: (teacher.maxHoursPerWeek || 40) + 5
      }
    });
  } else if (targetType === 'classroom') {
    // 教室约束调整推荐
    const classroom = conflict.classroom || {};
    
    recommendations.push({
      id: 'increase-classroom-capacity',
      title: '增加教室容量',
      description: '适当增加教室容量，允许更多学生使用该教室',
      priority: 'medium',
      confidence: 0.70,
      changes: [
        {
          field: '容量',
          oldValue: `${classroom.capacity || 2}人`,
          newValue: `${(classroom.capacity || 2) + 1}人`
        }
      ],
      expectedEffect: '教室利用率提高，减少因容量不足导致的冲突。',
      risks: ['需要确认教室实际能容纳更多人'],
      data: {
        capacity: (classroom.capacity || 2) + 1
      }
    });
  }
  
  // 按优先级和置信度排序
  return recommendations.sort((a, b) => {
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
    if (priorityDiff !== 0) return priorityDiff;
    return b.confidence - a.confidence;
  });
}

/**
 * 时间槽转时间字符串
 */
function slotToTimeString(slot) {
  const hours = Math.floor(slot / 6) + 6;
  const minutes = (slot % 6) * 10;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

export default SmartRecommendations;
