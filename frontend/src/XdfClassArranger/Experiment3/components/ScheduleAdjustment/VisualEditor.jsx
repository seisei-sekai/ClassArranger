/**
 * Visual Editor Component
 * 可视化编辑器组件
 * 
 * 提供图形化界面修改学生/教师/教室数据
 */

import React, { useState, useEffect } from 'react';
import './VisualEditor.css';

const VisualEditor = ({
  targetType = 'student', // 'student', 'teacher', 'classroom'
  data,
  availableCampuses = ['新宿', '涩谷', '池袋', '御茶水'],
  availableSubjects = ['日语', 'JLPT', 'EJU', '共通テスト', '面试辅导'],
  availableTeachers = [],
  availableClassrooms = [],
  onApplyAndRetry,
  loading = false
}) => {
  // 表单状态
  const [formData, setFormData] = useState({});
  const [timeRanges, setTimeRanges] = useState([]);
  const [selectedDays, setSelectedDays] = useState([]);
  
  // 初始化表单数据
  useEffect(() => {
    if (!data) return;
    
    if (targetType === 'student') {
      setFormData({
        name: data.name || '',
        campus: data.campus || '',
        subject: data.subject || '',
        courseHours: data.courseHours || 30,
        frequency: data.frequency || '1次',
        duration: data.duration || '2.5小时',
        mode: data.mode || '线上',
        level: data.level || '高级',
        preferredTeacher: data.preferredTeacher || ''
      });
      
      // 解析时间范围
      if (data.parsedData?.allowedTimeRanges) {
        setTimeRanges(data.parsedData.allowedTimeRanges.map(r => ({
          day: r.day,
          startTime: slotToTime(r.start),
          endTime: slotToTime(r.end)
        })));
      } else {
        // 默认时间范围
        setTimeRanges([{ day: null, startTime: '09:00', endTime: '18:00' }]);
      }
      
      // 解析可用天
      if (data.parsedData?.allowedDays) {
        setSelectedDays(data.parsedData.allowedDays);
      } else {
        setSelectedDays([1, 2, 3, 4, 5]); // 默认工作日
      }
    } else if (targetType === 'teacher') {
      setFormData({
        name: data.name || '',
        subjects: data.subjects || [],
        campuses: data.campuses || []
      });
    } else if (targetType === 'classroom') {
      setFormData({
        name: data.name || '',
        campus: data.campus || '',
        capacity: data.capacity || 2
      });
    }
  }, [data, targetType]);
  
  /**
   * 槽索引转时间
   */
  const slotToTime = (slot) => {
    const hours = Math.floor(slot / 6) + 6;
    const minutes = (slot % 6) * 10;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
  };
  
  /**
   * 时间转槽索引
   */
  const timeToSlot = (timeStr) => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return (hours - 6) * 6 + Math.floor(minutes / 10);
  };
  
  /**
   * 更新表单字段
   */
  const updateField = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };
  
  /**
   * 切换星期选择
   */
  const toggleDay = (day) => {
    setSelectedDays(prev => 
      prev.includes(day) 
        ? prev.filter(d => d !== day)
        : [...prev, day].sort()
    );
  };
  
  /**
   * 添加时间范围
   */
  const addTimeRange = () => {
    setTimeRanges(prev => [
      ...prev,
      { day: null, startTime: '09:00', endTime: '18:00' }
    ]);
  };
  
  /**
   * 删除时间范围
   */
  const removeTimeRange = (index) => {
    setTimeRanges(prev => prev.filter((_, i) => i !== index));
  };
  
  /**
   * 更新时间范围
   */
  const updateTimeRange = (index, field, value) => {
    setTimeRanges(prev => prev.map((range, i) => 
      i === index ? { ...range, [field]: value } : range
    ));
  };
  
  /**
   * 应用修改并重新排课
   */
  const handleApplyAndRetry = () => {
    // 构建修改后的数据（只包含修改的字段）
    const modifiedData = { ...formData };
    
    // 如果是学生，添加parsedData
    if (targetType === 'student') {
      modifiedData.parsedData = {
        allowedDays: selectedDays,
        allowedTimeRanges: timeRanges.map(r => ({
          day: r.day !== null ? r.day : undefined,
          start: timeToSlot(r.startTime),
          end: timeToSlot(r.endTime)
        }))
      };
    }
    
    onApplyAndRetry(modifiedData, targetType);
  };
  
  const dayNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  
  return (
    <div className="visual-editor">
      <div className="editor-header-info">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <span>可视化编辑器（选择式修改）</span>
      </div>
      
      <div className="visual-editor-body">
        {targetType === 'student' && (
          <>
            {/* 基本信息 */}
            <div className="form-section">
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">学生姓名</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.name || ''}
                    onChange={(e) => updateField('name', e.target.value)}
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">校区</label>
                  <select
                    className="form-select"
                    value={formData.campus || ''}
                    onChange={(e) => updateField('campus', e.target.value)}
                  >
                    <option value="">选择校区</option>
                    {availableCampuses.map(campus => (
                      <option key={campus} value={campus}>{campus}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">科目</label>
                  <select
                    className="form-select"
                    value={formData.subject || ''}
                    onChange={(e) => updateField('subject', e.target.value)}
                  >
                    <option value="">选择科目</option>
                    {availableSubjects.map(subject => (
                      <option key={subject} value={subject}>{subject}</option>
                    ))}
                  </select>
                </div>
                
                <div className="form-group">
                  <label className="form-label">课时数</label>
                  <input
                    type="number"
                    className="form-input"
                    value={formData.courseHours || 0}
                    onChange={(e) => updateField('courseHours', parseInt(e.target.value) || 0)}
                    min="0"
                    max="100"
                  />
                </div>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">频次</label>
                  <select
                    className="form-select"
                    value={formData.frequency || ''}
                    onChange={(e) => updateField('frequency', e.target.value)}
                  >
                    <option value="1次">1次/周</option>
                    <option value="2次">2次/周</option>
                    <option value="3次">3次/周</option>
                    <option value="4次">4次/周</option>
                    <option value="5次">5次/周</option>
                  </select>
                </div>
                
                <div className="form-group">
                  <label className="form-label">时长</label>
                  <select
                    className="form-select"
                    value={formData.duration || ''}
                    onChange={(e) => updateField('duration', e.target.value)}
                  >
                    <option value="1小时">1小时</option>
                    <option value="1.5小时">1.5小时</option>
                    <option value="2小时">2小时</option>
                    <option value="2.5小时">2.5小时</option>
                    <option value="3小时">3小时</option>
                  </select>
                </div>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">授课形式</label>
                  <select
                    className="form-select"
                    value={formData.mode || ''}
                    onChange={(e) => updateField('mode', e.target.value)}
                  >
                    <option value="线上">线上</option>
                    <option value="线下">线下</option>
                    <option value="线上或线下">线上或线下</option>
                  </select>
                </div>
                
                <div className="form-group">
                  <label className="form-label">级别</label>
                  <select
                    className="form-select"
                    value={formData.level || ''}
                    onChange={(e) => updateField('level', e.target.value)}
                  >
                    <option value="初级">初级</option>
                    <option value="中级">中级</option>
                    <option value="高级">高级</option>
                  </select>
                </div>
              </div>
              
              {availableTeachers.length > 0 && (
                <div className="form-group">
                  <label className="form-label">偏好教师（可选）</label>
                  <select
                    className="form-select"
                    value={formData.preferredTeacher || ''}
                    onChange={(e) => updateField('preferredTeacher', e.target.value)}
                  >
                    <option value="">无偏好</option>
                    {availableTeachers.map(teacher => (
                      <option key={teacher.id} value={teacher.id}>
                        {teacher.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
            
            {/* 可用时间设置 */}
            <div className="form-section">
              <div className="section-title">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                  <path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                可用时间设置
              </div>
              
              {/* 星期选择 */}
              <div className="form-group">
                <label className="form-label">可用星期</label>
                <div className="weekday-selector">
                  {dayNames.map((dayName, index) => (
                    <button
                      key={index}
                      className={`weekday-btn ${selectedDays.includes(index) ? 'selected' : ''}`}
                      onClick={() => toggleDay(index)}
                      type="button"
                    >
                      {dayName}
                    </button>
                  ))}
                </div>
                <div className="quick-select-days">
                  <button
                    type="button"
                    className="quick-btn"
                    onClick={() => setSelectedDays([1, 2, 3, 4, 5])}
                  >
                    工作日
                  </button>
                  <button
                    type="button"
                    className="quick-btn"
                    onClick={() => setSelectedDays([0, 6])}
                  >
                    周末
                  </button>
                  <button
                    type="button"
                    className="quick-btn"
                    onClick={() => setSelectedDays([0, 1, 2, 3, 4, 5, 6])}
                  >
                    全选
                  </button>
                  <button
                    type="button"
                    className="quick-btn"
                    onClick={() => setSelectedDays([])}
                  >
                    清空
                  </button>
                </div>
              </div>
              
              {/* 时间范围 */}
              <div className="form-group">
                <label className="form-label">可用时间段</label>
                {timeRanges.map((range, index) => (
                  <div key={index} className="time-range-row">
                    <select
                      className="day-select"
                      value={range.day === null ? 'all' : range.day}
                      onChange={(e) => updateTimeRange(index, 'day', e.target.value === 'all' ? null : parseInt(e.target.value))}
                    >
                      <option value="all">所有可用日</option>
                      {dayNames.map((name, idx) => (
                        <option key={idx} value={idx}>{name}</option>
                      ))}
                    </select>
                    
                    <input
                      type="time"
                      className="time-input"
                      value={range.startTime}
                      onChange={(e) => updateTimeRange(index, 'startTime', e.target.value)}
                    />
                    
                    <span className="time-separator">至</span>
                    
                    <input
                      type="time"
                      className="time-input"
                      value={range.endTime}
                      onChange={(e) => updateTimeRange(index, 'endTime', e.target.value)}
                    />
                    
                    <button
                      type="button"
                      className="btn-delete-range"
                      onClick={() => removeTimeRange(index)}
                      disabled={timeRanges.length === 1}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                        <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2"/>
                      </svg>
                    </button>
                  </div>
                ))}
                
                <button
                  type="button"
                  className="btn-add-range"
                  onClick={addTimeRange}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                  添加时间段
                </button>
              </div>
            </div>
          </>
        )}
        
        {targetType === 'teacher' && (
          <>
            <div className="form-section">
              <div className="form-group">
                <label className="form-label">教师姓名</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.name || ''}
                  onChange={(e) => updateField('name', e.target.value)}
                />
              </div>
              
              <div className="form-group">
                <label className="form-label">可教科目</label>
                <div className="checkbox-group">
                  {availableSubjects.map(subject => (
                    <label key={subject} className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={formData.subjects?.includes(subject)}
                        onChange={(e) => {
                          const newSubjects = e.target.checked
                            ? [...(formData.subjects || []), subject]
                            : (formData.subjects || []).filter(s => s !== subject);
                          updateField('subjects', newSubjects);
                        }}
                      />
                      <span>{subject}</span>
                    </label>
                  ))}
                </div>
              </div>
              
              <div className="form-group">
                <label className="form-label">可授课校区</label>
                <div className="checkbox-group">
                  {availableCampuses.map(campus => (
                    <label key={campus} className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={formData.campuses?.includes(campus)}
                        onChange={(e) => {
                          const newCampuses = e.target.checked
                            ? [...(formData.campuses || []), campus]
                            : (formData.campuses || []).filter(c => c !== campus);
                          updateField('campuses', newCampuses);
                        }}
                      />
                      <span>{campus}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}
        
        {targetType === 'classroom' && (
          <>
            <div className="form-section">
              <div className="form-group">
                <label className="form-label">教室名称</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.name || ''}
                  onChange={(e) => updateField('name', e.target.value)}
                />
              </div>
              
              <div className="form-group">
                <label className="form-label">所属校区</label>
                <select
                  className="form-select"
                  value={formData.campus || ''}
                  onChange={(e) => updateField('campus', e.target.value)}
                >
                  <option value="">选择校区</option>
                  {availableCampuses.map(campus => (
                    <option key={campus} value={campus}>{campus}</option>
                  ))}
                </select>
              </div>
              
              <div className="form-group">
                <label className="form-label">容量</label>
                <input
                  type="number"
                  className="form-input"
                  value={formData.capacity || 0}
                  onChange={(e) => updateField('capacity', parseInt(e.target.value) || 0)}
                  min="1"
                  max="20"
                />
              </div>
            </div>
          </>
        )}
      </div>
      
      {/* 应用按钮 */}
      <div className="visual-editor-footer">
        <button
          type="button"
          className="btn-apply-and-retry"
          onClick={handleApplyAndRetry}
          disabled={loading}
        >
          {loading ? (
            <>
              <span className="spinner"></span>
              <span>排课中...</span>
            </>
          ) : (
            <>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0118.8-4.3M22 12.5a10 10 0 01-18.8 4.2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span>应用修改并重新排课</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default VisualEditor;
