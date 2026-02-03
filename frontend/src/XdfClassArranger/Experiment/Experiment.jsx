/**
 * Experiment Page - Main Component
 * 实验页面 - 主组件
 * 
 * 1v1 Scheduling System Demo and Documentation
 */

import React, { useState } from 'react';
import './Experiment.css';
import { TIME_GRANULARITY } from './utils/dataStructures.js';
import DataStructureDoc from './components/DataStructureDoc.jsx';
import AlgorithmExplainer from './components/AlgorithmExplainer.jsx';
import ConstraintInputPanel from './components/ConstraintInputPanel.jsx';
import CalendarView from './components/CalendarView.jsx';
import { runGreedyScheduler } from './algorithms/greedyScheduler.js';
import { runGeneticScheduler, compareAlgorithms } from './algorithms/geneticScheduler.js';

const Experiment = () => {
  // Active tab state
  const [activeTab, setActiveTab] = useState('structure');
  
  // Data state
  const [teachers, setTeachers] = useState([]);
  const [students, setStudents] = useState([]);
  
  // Settings state
  const [granularity, setGranularity] = useState(TIME_GRANULARITY.FIVE_MIN);
  const [algorithm, setAlgorithm] = useState('greedy'); // 'greedy' | 'genetic' | 'compare'
  
  // Results state
  const [results, setResults] = useState(null);
  const [isScheduling, setIsScheduling] = useState(false);
  const [progress, setProgress] = useState(null);
  const [showHeatmap, setShowHeatmap] = useState(false);

  /**
   * Handle scheduling execution
   * 执行排课
   */
  const handleSchedule = async () => {
    if (teachers.length === 0 || students.length === 0) {
      alert('请先添加教师和学生数据');
      return;
    }

    setIsScheduling(true);
    setProgress({ current: 0, total: students.length, message: '准备中...' });
    
    try {
      let result;
      
      const config = {
        teachers,
        students,
        granularity,
        onProgress: setProgress
      };

      if (algorithm === 'compare') {
        result = await compareAlgorithms(config);
      } else if (algorithm === 'genetic') {
        result = runGeneticScheduler(config);
      } else {
        result = runGreedyScheduler(config);
      }

      setResults(result);
    } catch (error) {
      console.error('Scheduling error:', error);
      alert(`排课出错: ${error.message}`);
    } finally {
      setIsScheduling(false);
      setProgress(null);
    }
  };

  /**
   * Clear results
   * 清空结果
   */
  const handleClearResults = () => {
    setResults(null);
  };

  /**
   * Render scheduling demo tab
   * 渲染排课演示标签页
   */
  const renderSchedulingDemo = () => {
    return (
      <div className="scheduling-demo">
        <div className="demo-settings">
          <h4>排课设置</h4>
          <div className="settings-grid">
            <div className="setting-group">
              <label>时间粒度</label>
              <div className="radio-group">
                <label className="radio-label">
                  <input
                    type="radio"
                    checked={granularity === TIME_GRANULARITY.FIVE_MIN}
                    onChange={() => setGranularity(TIME_GRANULARITY.FIVE_MIN)}
                    disabled={isScheduling}
                  />
                  <span>5分钟</span>
                </label>
                <label className="radio-label">
                  <input
                    type="radio"
                    checked={granularity === TIME_GRANULARITY.FIFTEEN_MIN}
                    onChange={() => setGranularity(TIME_GRANULARITY.FIFTEEN_MIN)}
                    disabled={isScheduling}
                  />
                  <span>15分钟</span>
                </label>
              </div>
            </div>

            <div className="setting-group">
              <label>算法选择</label>
              <div className="radio-group">
                <label className="radio-label">
                  <input
                    type="radio"
                    checked={algorithm === 'greedy'}
                    onChange={() => setAlgorithm('greedy')}
                    disabled={isScheduling}
                  />
                  <span>贪心算法</span>
                </label>
                <label className="radio-label">
                  <input
                    type="radio"
                    checked={algorithm === 'genetic'}
                    onChange={() => setAlgorithm('genetic')}
                    disabled={isScheduling}
                  />
                  <span>遗传算法</span>
                </label>
                <label className="radio-label">
                  <input
                    type="radio"
                    checked={algorithm === 'compare'}
                    onChange={() => setAlgorithm('compare')}
                    disabled={isScheduling}
                  />
                  <span>对比模式</span>
                </label>
              </div>
            </div>

            <div className="setting-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={showHeatmap}
                  onChange={(e) => setShowHeatmap(e.target.checked)}
                />
                <span>显示学生可用性热图</span>
              </label>
            </div>
          </div>

          <div className="action-buttons">
            <button
              className="btn-schedule"
              onClick={handleSchedule}
              disabled={isScheduling || teachers.length === 0 || students.length === 0}
            >
              {isScheduling ? '排课中...' : '开始排课'}
            </button>
            {results && (
              <button
                className="btn-clear-results"
                onClick={handleClearResults}
                disabled={isScheduling}
              >
                清空结果
              </button>
            )}
          </div>

          {progress && (
            <div className="progress-bar">
              <div className="progress-info">
                <span>{progress.message}</span>
                <span>{progress.current} / {progress.total}</span>
              </div>
              <div className="progress-track">
                <div 
                  className="progress-fill"
                  style={{ width: `${(progress.current / progress.total) * 100}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {results && (
          <div className="demo-results">
            {algorithm === 'compare' ? (
              <div className="comparison-results">
                <h4>算法对比结果</h4>
                <div className="comparison-grid">
                  <div className="result-card greedy-result">
                    <h5>贪心算法</h5>
                    <div className="result-stats">
                      <div className="stat">
                        <span className="stat-label">成功率</span>
                        <span className="stat-value">{results.greedy.stats.successRate}%</span>
                      </div>
                      <div className="stat">
                        <span className="stat-label">执行时间</span>
                        <span className="stat-value">{results.greedy.stats.executionTime}ms</span>
                      </div>
                      <div className="stat">
                        <span className="stat-label">排课学生</span>
                        <span className="stat-value">{results.greedy.stats.scheduledStudents}/{results.greedy.stats.totalStudents}</span>
                      </div>
                    </div>
                  </div>

                  <div className="result-card genetic-result">
                    <h5>遗传算法</h5>
                    <div className="result-stats">
                      <div className="stat">
                        <span className="stat-label">成功率</span>
                        <span className="stat-value">{results.genetic.stats.successRate}%</span>
                      </div>
                      <div className="stat">
                        <span className="stat-label">执行时间</span>
                        <span className="stat-value">{results.genetic.stats.executionTime}ms</span>
                      </div>
                      <div className="stat">
                        <span className="stat-label">排课学生</span>
                        <span className="stat-value">{results.genetic.stats.scheduledStudents}/{results.genetic.stats.totalStudents}</span>
                      </div>
                      <div className="stat">
                        <span className="stat-label">适应度</span>
                        <span className="stat-value">{results.genetic.stats.fitness}</span>
                      </div>
                    </div>
                  </div>

                  <div className="result-card comparison-summary">
                    <h5>对比总结</h5>
                    <div className="result-stats">
                      <div className="stat">
                        <span className="stat-label">速度差异</span>
                        <span className="stat-value">遗传算法慢 {results.comparison.speedupFactor}x</span>
                      </div>
                      <div className="stat">
                        <span className="stat-label">成功率差异</span>
                        <span className="stat-value">{results.comparison.successRateDiff}%</span>
                      </div>
                      <div className="stat">
                        <span className="stat-label">推荐算法</span>
                        <span className="stat-value winner">
                          {results.comparison.winner === 'genetic' ? '遗传算法' : '贪心算法'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="calendar-comparison">
                  <div className="calendar-half">
                    <h5>贪心算法结果</h5>
                    <CalendarView
                      courses={results.greedy.result.courses}
                      students={students}
                      teachers={teachers}
                      granularity={granularity}
                      showHeatmap={showHeatmap}
                    />
                  </div>
                  <div className="calendar-half">
                    <h5>遗传算法结果</h5>
                    <CalendarView
                      courses={results.genetic.result.courses}
                      students={students}
                      teachers={teachers}
                      granularity={granularity}
                      showHeatmap={showHeatmap}
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="single-result">
                <h4>排课结果</h4>
                <div className="result-summary">
                  <div className="summary-stat">
                    <span className="stat-label">总学生数</span>
                    <span className="stat-value">{results.stats.totalStudents}</span>
                  </div>
                  <div className="summary-stat success">
                    <span className="stat-label">成功排课</span>
                    <span className="stat-value">{results.stats.scheduledStudents}</span>
                  </div>
                  <div className="summary-stat fail">
                    <span className="stat-label">排课失败</span>
                    <span className="stat-value">{results.stats.totalStudents - results.stats.scheduledStudents}</span>
                  </div>
                  <div className="summary-stat">
                    <span className="stat-label">成功率</span>
                    <span className="stat-value">{results.stats.successRate.toFixed(1)}%</span>
                  </div>
                  <div className="summary-stat">
                    <span className="stat-label">执行时间</span>
                    <span className="stat-value">{results.stats.executionTime}ms</span>
                  </div>
                  {results.stats.fitness !== undefined && (
                    <div className="summary-stat">
                      <span className="stat-label">适应度</span>
                      <span className="stat-value">{results.stats.fitness.toFixed(3)}</span>
                    </div>
                  )}
                </div>

                <CalendarView
                  courses={results.courses}
                  students={students}
                  teachers={teachers}
                  granularity={granularity}
                  showHeatmap={showHeatmap}
                />

                {results.conflicts && results.conflicts.length > 0 && (
                  <div className="conflicts-section">
                    <h5>排课冲突 ({results.conflicts.length})</h5>
                    <div className="conflicts-list">
                      {results.conflicts.slice(0, 10).map((conflict, idx) => (
                        <div key={idx} className="conflict-item">
                          <span className="conflict-student">{conflict.student.name}</span>
                          <span className="conflict-reason">{conflict.reason}</span>
                        </div>
                      ))}
                      {results.conflicts.length > 10 && (
                        <div className="conflicts-more">
                          还有 {results.conflicts.length - 10} 个冲突未显示...
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="experiment-container">
      <div className="experiment-header">
        <h1 className="page-title">实验页面 - 1v1排课系统</h1>
        <p className="page-subtitle">
          数据结构 · 算法说明 · 可视化演示
        </p>
      </div>

      <div className="experiment-tabs">
        <button
          className={`exp-tab ${activeTab === 'structure' ? 'active' : ''}`}
          onClick={() => setActiveTab('structure')}
        >
          数据结构
        </button>
        <button
          className={`exp-tab ${activeTab === 'algorithm' ? 'active' : ''}`}
          onClick={() => setActiveTab('algorithm')}
        >
          算法说明
        </button>
        <button
          className={`exp-tab ${activeTab === 'input' ? 'active' : ''}`}
          onClick={() => setActiveTab('input')}
        >
          约束输入
        </button>
        <button
          className={`exp-tab ${activeTab === 'demo' ? 'active' : ''}`}
          onClick={() => setActiveTab('demo')}
        >
          排课演示
        </button>
      </div>

      <div className="experiment-content">
        {activeTab === 'structure' && (
          <DataStructureDoc granularity={granularity} />
        )}
        
        {activeTab === 'algorithm' && (
          <AlgorithmExplainer />
        )}
        
        {activeTab === 'input' && (
          <ConstraintInputPanel
            teachers={teachers}
            students={students}
            onTeachersChange={setTeachers}
            onStudentsChange={setStudents}
            granularity={granularity}
          />
        )}
        
        {activeTab === 'demo' && renderSchedulingDemo()}
      </div>
    </div>
  );
};

export default Experiment;
