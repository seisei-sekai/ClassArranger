# Experiment Page - 实验页面

1v1排课系统实验和演示页面

## 概述

这是一个独立的实验页面，用于演示1v1排课系统的核心数据结构、算法和可视化功能。适合用于教学、测试和算法对比。

## 功能特性

- 📊 **数据结构文档** - 详细说明教师、学生、课程等数据结构
- 🧠 **算法说明** - 贪心算法vs遗传算法的对比和流程图
- 📝 **约束输入** - 交互式添加教师和学生，设置排课约束
- 📅 **可视化日历** - 周视图展示排课结果，支持热图模式
- 🎲 **随机数据生成** - 快速生成测试数据
- ⚡ **双算法支持** - 贪心算法（快速）和遗传算法（优化）
- 🔄 **算法对比** - 并排对比两种算法的结果和性能

## 文件结构

```
Experiment/
├── Experiment.jsx              # 主组件 - 标签页导航和状态管理
├── Experiment.css              # 样式文件 - 日系性冷淡风格
├── README.md                   # 本文件
├── components/                 # UI组件
│   ├── AlgorithmExplainer.jsx  # 算法说明组件
│   ├── CalendarView.jsx        # 日历视图组件
│   ├── ConstraintInputPanel.jsx # 约束输入面板
│   ├── DataGenerator.jsx       # 随机数据生成器
│   └── DataStructureDoc.jsx    # 数据结构文档组件
├── algorithms/                 # 调度算法
│   ├── geneticScheduler.js     # 遗传算法适配器
│   └── greedyScheduler.js      # 贪心算法实现
└── utils/                      # 工具函数
    ├── dataStructures.js       # 数据结构定义和工具
    └── validationUtils.js      # 约束验证工具
```

## 快速开始

### 1. 导航到实验页面

在主应用中点击"实验"导航项，或直接访问 `/experiment` 路由。

### 2. 查看数据结构

点击"数据结构"标签页，了解系统使用的核心数据结构。

### 3. 了解算法

点击"算法说明"标签页，学习贪心算法和遗传算法的工作原理。

### 4. 生成测试数据

1. 点击"约束输入"标签页
2. 点击"随机生成"按钮
3. 选择预设场景（小/中/大规模）

### 5. 运行排课

1. 点击"排课演示"标签页
2. 选择时间粒度（5分钟或15分钟）
3. 选择算法（贪心/遗传/对比）
4. 点击"开始排课"
5. 查看可视化结果

## 组件说明

### DataStructureDoc

展示核心数据结构的文档组件，包括字段说明、示例数据和设计理由。

**Props:**
- `granularity`: 时间粒度设置

### AlgorithmExplainer

详细说明两种排课算法的组件，包括复杂度分析、流程图和使用建议。

**特点:**
- 交互式算法切换
- 步骤详解
- 优缺点对比表格

### ConstraintInputPanel

用于添加和管理教师/学生数据的交互面板。

**Props:**
- `teachers`: 教师数组
- `students`: 学生数组
- `onTeachersChange`: 教师更新回调
- `onStudentsChange`: 学生更新回调
- `granularity`: 时间粒度

**功能:**
- 手动添加数据
- 随机生成数据
- 删除数据
- 实时验证

### CalendarView

可视化展示排课结果的周日历组件。

**Props:**
- `courses`: 课程数组
- `students`: 学生数组
- `teachers`: 教师数组
- `granularity`: 时间粒度
- `showHeatmap`: 是否显示热图

**特点:**
- 彩色编码课程
- 学生可用性热图
- 统计信息
- 悬停详情

### DataGenerator

生成随机测试数据的组件。

**Props:**
- `onGenerate`: 数据生成回调
- `granularity`: 时间粒度

**功能:**
- 自定义数量生成
- 预设场景
- 随机化规则说明

## 算法说明

### 贪心算法 (GreedyScheduler)

**特点:**
- 时间复杂度: O(S × T × W)
- 快速执行 (通常<1秒)
- 确定性结果
- 适合大规模数据

**工作流程:**
1. 按顺序遍历学生
2. 为每个学生查找合格教师
3. 找到第一个满足约束的时间槽
4. 立即分配课程
5. 更新教师可用时间

### 遗传算法 (GeneticScheduler)

**特点:**
- 时间复杂度: O(G × P × S × C)
- 较慢执行 (数秒到分钟)
- 非确定性结果
- 接近全局最优

**工作流程:**
1. 生成随机排课方案种群
2. 评估每个方案的适应度
3. 选择优秀方案
4. 交叉生成新方案
5. 变异探索解空间
6. 迭代直到收敛

## 时间粒度

系统支持两种时间粒度:

### 5分钟粒度 (默认)
- 每小时12个槽位
- 每天150个槽位 (9:00-21:30)
- 精确的时间控制
- 更大的计算量

### 15分钟粒度
- 每小时4个槽位
- 每天50个槽位 (9:00-21:30)
- 简化的时间控制
- 更快的计算速度

## 数据结构

### Teacher (教师)

```javascript
{
  id: string,
  name: string,
  subjects: string[],
  availableTimeSlots: TimeSlot[],
  hourlyRate: number,
  maxHoursPerWeek: number
}
```

### Student (学生)

```javascript
{
  id: string,
  name: string,
  subject: string,
  totalHours: number,
  usedHours: number,
  remainingHours: number,
  validPeriod: { start: Date, end: Date },
  constraints: Constraints
}
```

### Course (课程)

```javascript
{
  id: string,
  student: Student,
  teacher: Teacher,
  subject: string,
  timeSlot: TimeSlot,
  isRecurring: boolean,
  recurrencePattern: string
}
```

### TimeSlot (时间槽)

```javascript
{
  day: number,        // 0=周日, 1=周一, ..., 6=周六
  startSlot: number,  // 槽位索引
  endSlot: number,    // 槽位索引
  duration: number,   // 持续槽位数
  start: string,      // "09:00"
  end: string         // "11:00"
}
```

## 性能指标

### 贪心算法

| 规模 | 教师 | 学生 | 执行时间 |
|------|------|------|----------|
| 小   | 5    | 10   | <100ms   |
| 中   | 10   | 25   | <300ms   |
| 大   | 20   | 50   | <1s      |
| 压力 | 50   | 100  | <3s      |

### 遗传算法

| 规模 | 教师 | 学生 | 执行时间 |
|------|------|------|----------|
| 小   | 5    | 10   | 2-5s     |
| 中   | 10   | 25   | 5-15s    |
| 大   | 20   | 50   | 15-45s   |
| 压力 | 50   | 100  | 30-120s  |

## 样式主题

页面采用**日系性冷淡风格**:

- 简洁的线条和布局
- 柔和的色彩搭配
- 适度的留白空间
- 清晰的视觉层次
- 平滑的过渡动画

CSS变量继承自主题系统:
- `--bg-primary`, `--bg-secondary`: 背景色
- `--text-primary`, `--text-secondary`: 文字色
- `--border-primary`, `--border-light`: 边框色
- `--primary-color`: 主题色
- `--shadow-md`: 阴影效果

## 开发指南

### 添加新算法

1. 在 `algorithms/` 目录创建新文件
2. 实现 `schedule()` 方法
3. 返回标准结果格式
4. 在 `Experiment.jsx` 中添加选项

### 添加新组件

1. 在 `components/` 目录创建新组件
2. 遵循现有组件的props模式
3. 添加PropTypes验证（可选）
4. 在主组件中引入和使用

### 自定义样式

编辑 `Experiment.css` 文件，使用现有CSS变量保持一致性。

## 故障排查

### 排课失败

**可能原因:**
- 学生和教师时间不重叠
- 教师不能教授该科目
- 学生没有剩余课时
- 约束条件过于严格

**解决方法:**
- 调整学生的可用时间
- 增加更多教师
- 放宽约束条件
- 使用遗传算法尝试优化

### 性能慢

**可能原因:**
- 数据量过大
- 使用遗传算法
- 时间粒度太细

**解决方法:**
- 减少学生/教师数量
- 使用贪心算法
- 切换到15分钟粒度
- 减少遗传算法代数

### UI不响应

**可能原因:**
- 浏览器内存不足
- 数据过多导致渲染慢

**解决方法:**
- 刷新页面
- 清空数据重新生成
- 使用更少的数据

## 扩展建议

1. **教室管理** - 添加教室资源约束
2. **日期选择** - 支持具体日期和假期
3. **导出功能** - 导出结果为Excel/PDF
4. **拖拽调整** - 手动拖拽调整课程时间
5. **撤销重做** - 支持操作历史
6. **保存方案** - 保存和加载排课方案
7. **打印优化** - 优化打印布局

## 参考文档

- [实验页面实施总结](../../docs/experiment-page-implementation.md) - 完整技术文档
- [数据结构定义](./utils/dataStructures.js) - 源码中的详细注释
- [算法实现](./algorithms/) - 贪心和遗传算法源码

## 许可

本实验页面是ClassArranger项目的一部分，遵循项目主LICENSE。
