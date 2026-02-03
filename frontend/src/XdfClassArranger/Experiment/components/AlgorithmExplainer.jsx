/**
 * Algorithm Explainer Component
 * 算法说明组件
 * 
 * Explains and compares the scheduling algorithms
 */

import React, { useState } from 'react';

const AlgorithmExplainer = () => {
  const [selectedAlgo, setSelectedAlgo] = useState('greedy');

  const algorithms = {
    greedy: {
      name: '贪心算法 (Greedy Algorithm)',
      description: '按顺序为每个学生分配第一个满足条件的时间槽',
      complexity: {
        time: 'O(S × T × W)',
        space: 'O(S × W)',
        vars: 'S=学生数, T=教师数, W=周数'
      },
      pros: [
        '速度快，适合快速生成初始方案',
        '逻辑简单，易于理解和调试',
        '结果确定，相同输入产生相同输出',
        '内存占用小，适合大规模数据'
      ],
      cons: [
        '容易陷入局部最优，错过全局最优解',
        '对输入顺序敏感，不同顺序可能产生不同质量的结果',
        '难以处理复杂的软约束（如分布均匀性）',
        '一旦做出选择就无法回溯'
      ],
      steps: [
        {
          title: '1. 初始化',
          desc: '准备教师可用时间表，初始化结果数组',
          code: 'teachers.forEach(t => availabilityMap[t.id] = [...t.slots])'
        },
        {
          title: '2. 遍历学生',
          desc: '按优先级或随机顺序遍历每个学生',
          code: 'for (const student of students) { ... }'
        },
        {
          title: '3. 筛选教师',
          desc: '找到所有能教授该科目的教师',
          code: 'eligibleTeachers = teachers.filter(t => t.subjects.includes(student.subject))'
        },
        {
          title: '4. 查找时间槽',
          desc: '在学生和教师的可用时间中找交集',
          code: 'for (timeSlot of findOverlap(student.times, teacher.times)) { ... }'
        },
        {
          title: '5. 分配课程',
          desc: '找到第一个有效时间槽后立即分配',
          code: 'if (valid) { assign(student, teacher, timeSlot); break; }'
        },
        {
          title: '6. 更新状态',
          desc: '更新教师可用时间，标记学生已排课',
          code: 'removeTimeSlot(teacher, timeSlot); student.scheduled = true;'
        }
      ],
      suitable: [
        '需要快速得到可行方案',
        '数据规模大（>100学生）',
        '约束相对简单',
        '实时排课场景'
      ]
    },
    genetic: {
      name: '遗传算法 (Genetic Algorithm)',
      description: '模拟自然进化，通过选择、交叉、变异迭代优化排课方案',
      complexity: {
        time: 'O(G × P × S × C)',
        space: 'O(P × S × W)',
        vars: 'G=代数, P=种群大小, S=学生数, C=约束数'
      },
      pros: [
        '能够找到接近全局最优的解',
        '可以同时优化多个目标（多目标优化）',
        '适合处理复杂约束和软约束',
        '不易陷入局部最优，具有探索能力'
      ],
      cons: [
        '运行时间较长，不适合实时场景',
        '结果不确定，每次运行可能得到不同结果',
        '需要调整参数（种群大小、变异率等）',
        '内存占用较大，存储整个种群'
      ],
      steps: [
        {
          title: '1. 初始化种群',
          desc: '生成N个随机排课方案作为初始种群',
          code: 'population = Array(popSize).fill(null).map(() => randomSchedule())'
        },
        {
          title: '2. 计算适应度',
          desc: '评估每个方案的质量（满足约束程度）',
          code: 'fitness = schedule.map(s => evaluateFitness(s, constraints))'
        },
        {
          title: '3. 选择',
          desc: '根据适应度选择优秀个体作为父代',
          code: 'parents = selectByFitness(population, fitness, eliteRate)'
        },
        {
          title: '4. 交叉',
          desc: '将两个父代的特征组合生成子代',
          code: 'child = crossover(parent1, parent2, crossoverRate)'
        },
        {
          title: '5. 变异',
          desc: '以一定概率随机改变部分基因',
          code: 'if (random() < mutationRate) { mutate(child); }'
        },
        {
          title: '6. 替换与迭代',
          desc: '用新一代替换旧种群，重复直到收敛',
          code: 'population = newGeneration; repeat until maxGen or converged'
        }
      ],
      suitable: [
        '对结果质量要求高',
        '有复杂的软约束需要优化',
        '可以接受较长计算时间',
        '需要平衡多个优化目标'
      ]
    }
  };

  const algo = algorithms[selectedAlgo];

  return (
    <div className="algorithm-explainer">
      <div className="explainer-header">
        <h2>算法说明</h2>
        <p className="explainer-subtitle">
          本系统提供两种排课算法：快速的贪心算法和优化的遗传算法
        </p>
      </div>

      <div className="algo-selector">
        <button
          className={`algo-btn ${selectedAlgo === 'greedy' ? 'active' : ''}`}
          onClick={() => setSelectedAlgo('greedy')}
        >
          贪心算法
        </button>
        <button
          className={`algo-btn ${selectedAlgo === 'genetic' ? 'active' : ''}`}
          onClick={() => setSelectedAlgo('genetic')}
        >
          遗传算法
        </button>
      </div>

      <div className="algo-content">
        <div className="algo-overview">
          <h3>{algo.name}</h3>
          <p className="algo-desc">{algo.description}</p>
          
          <div className="complexity-badges">
            <div className="complexity-badge time">
              <span className="badge-label">时间复杂度</span>
              <code className="badge-value">{algo.complexity.time}</code>
            </div>
            <div className="complexity-badge space">
              <span className="badge-label">空间复杂度</span>
              <code className="badge-value">{algo.complexity.space}</code>
            </div>
          </div>
          <p className="complexity-note">
            <small>{algo.complexity.vars}</small>
          </p>
        </div>

        <div className="algo-steps">
          <h4>算法步骤</h4>
          <div className="steps-container">
            {algo.steps.map((step, idx) => (
              <div key={idx} className="step-card">
                <div className="step-number">{idx + 1}</div>
                <div className="step-content">
                  <h5>{step.title}</h5>
                  <p>{step.desc}</p>
                  <div className="step-code">
                    <code>{step.code}</code>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="algo-proscons">
          <div className="pros-section">
            <h4>✓ 优点</h4>
            <ul>
              {algo.pros.map((pro, idx) => (
                <li key={idx}>{pro}</li>
              ))}
            </ul>
          </div>
          <div className="cons-section">
            <h4>✗ 缺点</h4>
            <ul>
              {algo.cons.map((con, idx) => (
                <li key={idx}>{con}</li>
              ))}
            </ul>
          </div>
        </div>

        <div className="algo-suitable">
          <h4>适用场景</h4>
          <div className="suitable-grid">
            {algo.suitable.map((scenario, idx) => (
              <div key={idx} className="suitable-card">
                <span className="suitable-icon">→</span>
                <span>{scenario}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="comparison-section">
        <h3>算法对比</h3>
        <div className="comparison-table-wrapper">
          <table className="comparison-table">
            <thead>
              <tr>
                <th>对比维度</th>
                <th>贪心算法</th>
                <th>遗传算法</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>执行速度</strong></td>
                <td className="positive">快速 (&lt;1秒)</td>
                <td className="negative">较慢 (数秒到分钟)</td>
              </tr>
              <tr>
                <td><strong>结果质量</strong></td>
                <td className="negative">局部最优</td>
                <td className="positive">接近全局最优</td>
              </tr>
              <tr>
                <td><strong>确定性</strong></td>
                <td className="positive">确定性输出</td>
                <td className="negative">非确定性输出</td>
              </tr>
              <tr>
                <td><strong>内存占用</strong></td>
                <td className="positive">低</td>
                <td className="negative">高</td>
              </tr>
              <tr>
                <td><strong>参数调整</strong></td>
                <td className="positive">无需调整</td>
                <td className="negative">需要调参</td>
              </tr>
              <tr>
                <td><strong>约束处理</strong></td>
                <td className="negative">简单约束</td>
                <td className="positive">复杂约束</td>
              </tr>
              <tr>
                <td><strong>可扩展性</strong></td>
                <td className="positive">好</td>
                <td className="neutral">中等</td>
              </tr>
              <tr>
                <td><strong>易理解性</strong></td>
                <td className="positive">容易理解</td>
                <td className="negative">较难理解</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="flowchart-section">
        <h3>算法流程图</h3>
        <div className="flowchart-container">
          {selectedAlgo === 'greedy' ? (
            <div className="flowchart greedy-flow">
              <div className="flow-node start">开始</div>
              <div className="flow-arrow">↓</div>
              <div className="flow-node">初始化教师可用时间</div>
              <div className="flow-arrow">↓</div>
              <div className="flow-node decision">还有未排课学生？</div>
              <div className="flow-split">
                <div className="flow-branch left">
                  <div className="flow-arrow-text">否</div>
                  <div className="flow-arrow">→</div>
                  <div className="flow-node end">结束，返回结果</div>
                </div>
                <div className="flow-branch right">
                  <div className="flow-arrow-text">是</div>
                  <div className="flow-arrow">↓</div>
                  <div className="flow-node">选择下一个学生</div>
                  <div className="flow-arrow">↓</div>
                  <div className="flow-node">筛选可教该科目的教师</div>
                  <div className="flow-arrow">↓</div>
                  <div className="flow-node decision">找到可用时间槽？</div>
                  <div className="flow-split-inner">
                    <div className="flow-branch-inner left">
                      <div className="flow-arrow-text">否</div>
                      <div className="flow-arrow">→</div>
                      <div className="flow-node">标记为冲突</div>
                    </div>
                    <div className="flow-branch-inner right">
                      <div className="flow-arrow-text">是</div>
                      <div className="flow-arrow">↓</div>
                      <div className="flow-node">分配课程</div>
                      <div className="flow-arrow">↓</div>
                      <div className="flow-node">更新教师可用时间</div>
                    </div>
                  </div>
                  <div className="flow-arrow loop">↑ 继续下一个学生</div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flowchart genetic-flow">
              <div className="flow-node start">开始</div>
              <div className="flow-arrow">↓</div>
              <div className="flow-node">生成初始种群（随机方案）</div>
              <div className="flow-arrow">↓</div>
              <div className="flow-node">计算每个方案的适应度</div>
              <div className="flow-arrow">↓</div>
              <div className="flow-node decision">达到最大代数或收敛？</div>
              <div className="flow-split">
                <div className="flow-branch left">
                  <div className="flow-arrow-text">是</div>
                  <div className="flow-arrow">→</div>
                  <div className="flow-node">选择最优方案</div>
                  <div className="flow-arrow">↓</div>
                  <div className="flow-node end">结束，返回最优解</div>
                </div>
                <div className="flow-branch right">
                  <div className="flow-arrow-text">否</div>
                  <div className="flow-arrow">↓</div>
                  <div className="flow-node">选择：保留适应度高的个体</div>
                  <div className="flow-arrow">↓</div>
                  <div className="flow-node">交叉：组合父代生成子代</div>
                  <div className="flow-arrow">↓</div>
                  <div className="flow-node">变异：随机改变部分基因</div>
                  <div className="flow-arrow">↓</div>
                  <div className="flow-node">生成新一代种群</div>
                  <div className="flow-arrow loop">↑ 迭代进化</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="recommendation-section">
        <h3>算法选择建议</h3>
        <div className="recommendation-cards">
          <div className="rec-card greedy-rec">
            <h4>选择贪心算法，如果：</h4>
            <ul>
              <li>学生和教师数量较多（&gt;50）</li>
              <li>需要实时或快速得到结果</li>
              <li>约束条件相对简单</li>
              <li>对结果质量要求不是特别高</li>
              <li>需要结果可预测、可重现</li>
            </ul>
          </div>
          <div className="rec-card genetic-rec">
            <h4>选择遗传算法，如果：</h4>
            <ul>
              <li>对排课质量要求很高</li>
              <li>有复杂的软约束需要优化</li>
              <li>可以接受较长的计算时间</li>
              <li>需要平衡多个优化目标</li>
              <li>愿意通过调参提升效果</li>
            </ul>
          </div>
          <div className="rec-card hybrid-rec">
            <h4>混合策略（推荐）：</h4>
            <ul>
              <li>先用贪心算法快速生成初始方案</li>
              <li>再用遗传算法优化结果</li>
              <li>贪心算法的输出作为遗传算法的种子</li>
              <li>兼顾速度和质量</li>
              <li>本系统的"比较模式"即采用此策略</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AlgorithmExplainer;
