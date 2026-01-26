/**
 * Constraint Review Dialog
 * 约束审核对话框
 * 
 * UI for reviewing and approving AI-parsed constraints from natural language
 * 用于审核和批准从自然语言解析的AI约束的UI
 */

import React, { useState, useEffect } from 'react';
import './ConstraintReviewDialog.css';
import { getOpenAIParser } from '../services/openaiService';
import { extractConstraintData, getExtractionStatistics } from '../utils/excelConstraintExtractor';
import { matchConstraintToTemplate, getAllTemplates, applyTemplate } from '../utils/constraintTemplates';
import { slotIndexToTime } from '../utils/constants';

const ConstraintReviewDialog = ({ excelData, onClose, onApprove }) => {
  const [students, setStudents] = useState([]);
  const [parsedConstraints, setParsedConstraints] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all'); // all, high, medium, low, pending
  const [statistics, setStatistics] = useState(null);
  const [showTemplates, setShowTemplates] = useState(false);

  // Extract student data on mount
  useEffect(() => {
    if (excelData && excelData.length > 0) {
      console.log('ConstraintReviewDialog received excelData:', excelData.length, 'rows');
      const extracted = extractConstraintData(excelData);
      console.log('Extracted constraint data:', extracted.length, 'students');
      
      if (extracted.length === 0) {
        console.warn('No valid constraint data extracted from Excel rows');
      } else {
        console.log('First extracted student:', extracted[0]);
      }
      
      setStudents(extracted);
      setStatistics(getExtractionStatistics(extracted));
      
      // Initialize parsed constraints with pending status
      const initial = extracted.map(student => ({
        ...student,
        parsed: null,
        status: 'pending', // pending, approved, rejected, edited
        confidence: 0
      }));
      setParsedConstraints(initial);
    }
  }, [excelData]);

  // Start batch parsing
  const handleStartParsing = async () => {
    setIsProcessing(true);
    setProgress({ current: 0, total: students.length });

    const parser = getOpenAIParser();
    
    try {
      const results = await parser.batchParse(students, (current, total) => {
        setProgress({ current, total });
      });

      // Update parsed constraints with results
      const updated = results.map((result, index) => ({
        ...parsedConstraints[index],
        parsed: result,
        confidence: result.confidence || 0,
        status: result.success ? 'pending' : 'error',
        error: result.error || null
      }));

      setParsedConstraints(updated);
    } catch (error) {
      console.error('Batch parsing failed:', error);
      alert(`批量解析失败: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // Get confidence level color
  const getConfidenceColor = (confidence) => {
    if (confidence >= 0.8) return 'high';
    if (confidence >= 0.5) return 'medium';
    return 'low';
  };

  // Filter constraints based on status
  const filteredConstraints = parsedConstraints.filter(item => {
    if (filterStatus === 'all') return true;
    if (filterStatus === 'pending') return item.status === 'pending';
    if (filterStatus === 'approved') return item.status === 'approved';
    if (filterStatus === 'rejected') return item.status === 'rejected';
    if (filterStatus === 'high') return item.confidence >= 0.8;
    if (filterStatus === 'medium') return item.confidence >= 0.5 && item.confidence < 0.8;
    if (filterStatus === 'low') return item.confidence < 0.5;
    return true;
  });

  // Approve single constraint
  const handleApprove = (index) => {
    const updated = [...parsedConstraints];
    updated[index].status = 'approved';
    setParsedConstraints(updated);
  };

  // Reject single constraint
  const handleReject = (index) => {
    const updated = [...parsedConstraints];
    updated[index].status = 'rejected';
    setParsedConstraints(updated);
  };

  // Edit constraint
  const handleEdit = (index) => {
    setSelectedStudent(index);
    setEditMode(true);
  };

  // Save edited constraint
  const handleSaveEdit = (editedConstraint) => {
    const updated = [...parsedConstraints];
    updated[selectedStudent].parsed = editedConstraint;
    updated[selectedStudent].status = 'edited';
    updated[selectedStudent].confidence = 1.0; // Human edited = max confidence
    setParsedConstraints(updated);
    setEditMode(false);
    setSelectedStudent(null);
  };

  // Bulk approve high confidence
  const handleBulkApproveHigh = () => {
    const updated = parsedConstraints.map(item => {
      if (item.confidence >= 0.8 && item.status === 'pending') {
        return { ...item, status: 'approved' };
      }
      return item;
    });
    setParsedConstraints(updated);
  };

  // Bulk reject low confidence
  const handleBulkRejectLow = () => {
    const updated = parsedConstraints.map(item => {
      if (item.confidence < 0.5 && item.status === 'pending') {
        return { ...item, status: 'rejected' };
      }
      return item;
    });
    setParsedConstraints(updated);
  };

  // Final approval - send to parent
  const handleFinalApproval = () => {
    const approved = parsedConstraints
      .filter(item => item.status === 'approved' || item.status === 'edited')
      .map(item => ({
        studentName: item.studentName,
        campus: item.campus,
        originalText: item.combinedText,
        constraint: item.parsed,
        confidence: item.confidence
      }));

    if (approved.length === 0) {
      alert('没有已批准的约束。请至少批准一个约束。');
      return;
    }

    onApprove(approved);
    onClose();
  };

  // Render constraint summary
  const renderConstraintSummary = (parsed) => {
    if (!parsed) return <span className="no-data">未解析</span>;

    const { allowedDays, allowedTimeRanges, excludedTimeRanges } = parsed;
    const dayNames = ['日', '一', '二', '三', '四', '五', '六'];
    
    return (
      <div className="constraint-summary">
        <div className="summary-item">
          <strong>允许日期:</strong>{' '}
          {allowedDays.length === 7 
            ? '全周' 
            : allowedDays.map(d => `周${dayNames[d]}`).join(', ')}
        </div>
        {allowedTimeRanges.length > 0 && (
          <div className="summary-item">
            <strong>允许时间:</strong>{' '}
            {allowedTimeRanges.slice(0, 2).map((range, idx) => {
              const start = slotIndexToTime(range.start);
              const end = slotIndexToTime(range.end);
              return (
                <span key={idx}>
                  {start.string}-{end.string}
                  {idx < allowedTimeRanges.length - 1 && ', '}
                </span>
              );
            })}
            {allowedTimeRanges.length > 2 && ` +${allowedTimeRanges.length - 2}项`}
          </div>
        )}
        {excludedTimeRanges.length > 0 && (
          <div className="summary-item">
            <strong>排除时间:</strong>{' '}
            {excludedTimeRanges.slice(0, 2).map((range, idx) => {
              const start = slotIndexToTime(range.start);
              const end = slotIndexToTime(range.end);
              return (
                <span key={idx}>
                  {start.string}-{end.string}
                  {idx < excludedTimeRanges.length - 1 && ', '}
                </span>
              );
            })}
            {excludedTimeRanges.length > 2 && ` +${excludedTimeRanges.length - 2}项`}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="constraint-review-dialog-overlay">
      <div className="constraint-review-dialog">
        <div className="dialog-header">
          <h2>约束审核 - NLP解析</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        {/* Statistics */}
        {statistics && (
          <div className="statistics-section">
            <div className="stat-item">
              <span className="stat-label">总学生数:</span>
              <span className="stat-value">{statistics.total}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">平均约束文本长度:</span>
              <span className="stat-value">{statistics.avgTextLength}字符</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">已批准:</span>
              <span className="stat-value approved">
                {parsedConstraints.filter(p => p.status === 'approved').length}
              </span>
            </div>
            <div className="stat-item">
              <span className="stat-label">待审核:</span>
              <span className="stat-value pending">
                {parsedConstraints.filter(p => p.status === 'pending').length}
              </span>
            </div>
          </div>
        )}

        {/* Action Bar */}
        <div className="action-bar">
          {!isProcessing && parsedConstraints.every(p => !p.parsed) && (
            <button className="btn-primary" onClick={handleStartParsing}>
              开始批量解析 ({students.length}个学生)
            </button>
          )}
          
          {parsedConstraints.some(p => p.parsed) && (
            <>
              <button className="btn-secondary" onClick={handleBulkApproveHigh}>
                批量批准高置信度 (≥0.8)
              </button>
              <button className="btn-secondary" onClick={handleBulkRejectLow}>
                批量拒绝低置信度 (&lt;0.5)
              </button>
              <div className="filter-group">
                <label>筛选:</label>
                <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                  <option value="all">全部</option>
                  <option value="pending">待审核</option>
                  <option value="approved">已批准</option>
                  <option value="rejected">已拒绝</option>
                  <option value="high">高置信度</option>
                  <option value="medium">中置信度</option>
                  <option value="low">低置信度</option>
                </select>
              </div>
            </>
          )}
        </div>

        {/* Progress Bar */}
        {isProcessing && (
          <div className="progress-section">
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${(progress.current / progress.total) * 100}%` }}
              ></div>
            </div>
            <span className="progress-text">
              处理中: {progress.current} / {progress.total}
            </span>
          </div>
        )}

        {/* Constraints Table */}
        <div className="constraints-table-container">
          <table className="constraints-table">
            <thead>
              <tr>
                <th>学生</th>
                <th>校区</th>
                <th>原始文本</th>
                <th>解析结果</th>
                <th>置信度</th>
                <th>状态</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {filteredConstraints.map((item, index) => {
                const actualIndex = parsedConstraints.indexOf(item);
                return (
                  <tr key={item.id} className={`row-${item.status}`}>
                    <td>{item.studentName}</td>
                    <td>{item.campus}</td>
                    <td className="original-text">
                      <div className="text-preview">{item.combinedText}</div>
                    </td>
                    <td className="parsed-result">
                      {renderConstraintSummary(item.parsed)}
                      {item.parsed?.reasoning && (
                        <div className="reasoning">
                          <small>推理: {item.parsed.reasoning}</small>
                        </div>
                      )}
                    </td>
                    <td>
                      {item.parsed && (
                        <span className={`confidence-badge ${getConfidenceColor(item.confidence)}`}>
                          {(item.confidence * 100).toFixed(0)}%
                        </span>
                      )}
                    </td>
                    <td>
                      <span className={`status-badge ${item.status}`}>
                        {item.status === 'pending' && '待审核'}
                        {item.status === 'approved' && '已批准'}
                        {item.status === 'rejected' && '已拒绝'}
                        {item.status === 'edited' && '已编辑'}
                        {item.status === 'error' && '错误'}
                      </span>
                    </td>
                    <td className="actions">
                      {item.status === 'pending' && item.parsed && (
                        <>
                          <button 
                            className="btn-approve" 
                            onClick={() => handleApprove(actualIndex)}
                            title="批准"
                          >
                            ✓
                          </button>
                          <button 
                            className="btn-reject" 
                            onClick={() => handleReject(actualIndex)}
                            title="拒绝"
                          >
                            ✗
                          </button>
                          <button 
                            className="btn-edit" 
                            onClick={() => handleEdit(actualIndex)}
                            title="编辑"
                          >
                            ✎
                          </button>
                        </>
                      )}
                      {(item.status === 'approved' || item.status === 'edited') && (
                        <button 
                          className="btn-edit" 
                          onClick={() => handleEdit(actualIndex)}
                          title="重新编辑"
                        >
                          ✎
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Footer Actions */}
        <div className="dialog-footer">
          <button className="btn-cancel" onClick={onClose}>
            取消
          </button>
          <button 
            className="btn-final-approve" 
            onClick={handleFinalApproval}
            disabled={!parsedConstraints.some(p => p.status === 'approved' || p.status === 'edited')}
          >
            最终批准并导入 ({parsedConstraints.filter(p => p.status === 'approved' || p.status === 'edited').length}个)
          </button>
        </div>

        {/* Edit Modal */}
        {editMode && selectedStudent !== null && (
          <ConstraintEditModal
            constraint={parsedConstraints[selectedStudent]}
            onSave={handleSaveEdit}
            onCancel={() => {
              setEditMode(false);
              setSelectedStudent(null);
            }}
          />
        )}
      </div>
    </div>
  );
};

/**
 * Constraint Edit Modal
 * 约束编辑模态框
 */
const ConstraintEditModal = ({ constraint, onSave, onCancel }) => {
  const [editedConstraint, setEditedConstraint] = useState(
    constraint.parsed || {
      allowedDays: [0, 1, 2, 3, 4, 5, 6],
      allowedTimeRanges: [],
      excludedTimeRanges: [],
      strictness: 'flexible',
      confidence: 1.0
    }
  );
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const templates = getAllTemplates();

  const handleApplyTemplate = () => {
    if (!selectedTemplate) return;
    const applied = applyTemplate(selectedTemplate);
    if (applied) {
      setEditedConstraint({ ...applied, confidence: 1.0 });
    }
  };

  const handleDayToggle = (day) => {
    const days = [...editedConstraint.allowedDays];
    const index = days.indexOf(day);
    if (index > -1) {
      days.splice(index, 1);
    } else {
      days.push(day);
    }
    setEditedConstraint({ ...editedConstraint, allowedDays: days.sort() });
  };

  const dayNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

  return (
    <div className="edit-modal-overlay">
      <div className="edit-modal">
        <h3>编辑约束 - {constraint.studentName}</h3>
        
        <div className="edit-section">
          <label>应用模板:</label>
          <div className="template-selector">
            <select 
              value={selectedTemplate} 
              onChange={(e) => setSelectedTemplate(e.target.value)}
            >
              <option value="">选择模板...</option>
              {templates.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
            <button onClick={handleApplyTemplate}>应用</button>
          </div>
        </div>

        <div className="edit-section">
          <label>允许日期:</label>
          <div className="day-selector">
            {[0, 1, 2, 3, 4, 5, 6].map(day => (
              <button
                key={day}
                className={`day-btn ${editedConstraint.allowedDays.includes(day) ? 'selected' : ''}`}
                onClick={() => handleDayToggle(day)}
              >
                {dayNames[day]}
              </button>
            ))}
          </div>
        </div>

        <div className="edit-section">
          <label>约束类型:</label>
          <select 
            value={editedConstraint.strictness} 
            onChange={(e) => setEditedConstraint({ ...editedConstraint, strictness: e.target.value })}
          >
            <option value="strict">严格 (Strict)</option>
            <option value="flexible">灵活 (Flexible)</option>
            <option value="preferred">偏好 (Preferred)</option>
          </select>
        </div>

        <div className="edit-section">
          <label>原始文本:</label>
          <div className="original-text-display">{constraint.combinedText}</div>
        </div>

        <div className="modal-footer">
          <button className="btn-cancel" onClick={onCancel}>取消</button>
          <button className="btn-save" onClick={() => onSave(editedConstraint)}>
            保存
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConstraintReviewDialog;

