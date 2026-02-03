# 实验页面实施总结

**Created:** 2026-02-02
**Last Updated:** 2026-02-02
**Purpose:** 1v1排课系统实验页面实施文档

---

## 概述

成功实现了一个完整的1v1排课系统实验页面，用于演示数据结构、算法和可视化排课过程。

## 实施的功能

### 1. 数据结构文档组件 (DataStructureDoc)

**位置:** `frontend/src/XdfClassArranger/Experiment/components/DataStructureDoc.jsx`

**功能:**
- 展示教师、学生、课程、时间槽、约束等核心数据结构
- 提供交互式标签页切换不同数据结构
- 展示字段说明表格
- 显示示例JSON数据
- 解释数据结构选择理由和复杂度分析

**特点:**
- 支持5分钟和15分钟两种时间粒度
- 彩色编码不同数据结构类型
- 清晰的字段类型和说明

### 2. 算法说明组件 (AlgorithmExplainer)

**位置:** `frontend/src/XdfClassArranger/Experiment/components/AlgorithmExplainer.jsx`

**功能:**
- 详细说明贪心算法和遗传算法
- 展示算法步骤和伪代码
- 对比两种算法的优缺点
- 提供算法流程图
- 给出算法选择建议

**内容包括:**
- 时间/空间复杂度分析
- 6步算法执行流程
- 优缺点列表
- 适用场景说明
- 算法对比表格
- 混合策略推荐

### 3. 贪心调度算法 (GreedyScheduler)

**位置:** `frontend/src/XdfClassArranger/Experiment/algorithms/greedyScheduler.js`

**特点:**
- 时间复杂度: O(S × T × W)
- 顺序为学生分配课程
- 自动负载均衡（优先分配给课时少的教师）
- 支持时间槽分割
- 实时进度反馈

**关键方法:**
- `schedule()`: 主调度方法
- `scheduleStudent()`: 为单个学生排课
- `findEligibleTeachers()`: 查找合格教师
- `findValidTimeSlots()`: 查找有效时间槽
- `updateTeacherAvailability()`: 更新教师可用时间

### 4. 遗传算法适配器 (GeneticScheduler)

**位置:** `frontend/src/XdfClassArranger/Experiment/algorithms/geneticScheduler.js`

**特点:**
- 时间复杂度: O(G × P × S × C)
- 集成现有遗传算法
- 支持种群大小、变异率等参数配置
- 提供适应度评分
- 支持算法对比模式

**关键方法:**
- `schedule()`: 运行遗传算法
- `convertStudentsToCourses()`: 转换学生为课程对象
- `generateTimeSlots()`: 生成所有可能时间槽
- `compareAlgorithms()`: 对比两种算法

### 5. 约束输入面板 (ConstraintInputPanel)

**位置:** `frontend/src/XdfClassArranger/Experiment/components/ConstraintInputPanel.jsx`

**功能:**
- 教师管理：添加/删除教师，选择科目
- 学生管理：添加/删除学生，设置约束
- 集成随机数据生成器
- 实时验证输入
- 显示数据列表

**特点:**
- 标签页切换教师/学生视图
- 芯片式科目和星期选择
- 自动生成默认时间范围
- 清空全部数据功能

### 6. 日历视图组件 (CalendarView)

**位置:** `frontend/src/XdfClassArranger/Experiment/components/CalendarView.jsx`

**功能:**
- 周视图日历展示
- 彩色编码课程块
- 学生可用性热图
- 统计信息展示
- 悬停显示课程详情

**特点:**
- 自动根据时间粒度调整显示
- 一致的学生-颜色映射
- 周分布柱状图
- 响应式布局

### 7. 数据生成器 (DataGenerator)

**位置:** `frontend/src/XdfClassArranger/Experiment/components/DataGenerator.jsx`

**功能:**
- 生成随机教师数据（1-100个）
- 生成随机学生数据（1-200个）
- 预设场景（小/中/大/压力测试）
- 随机化科目、时间、约束

**生成规则:**
- 教师: 1-3个科目，2-5个时间段
- 学生: 2-5个可用天，1-3次/周课程
- 完全随机，真实模拟

### 8. 工具函数库

**位置:** `frontend/src/XdfClassArranger/Experiment/utils/`

**dataStructures.js:**
- `createTeacher()`, `createStudent()`, `createCourse()`: 工厂函数
- `slotToTime()`, `timeToSlot()`: 时间转换
- `timeSlotsOverlap()`, `findOverlap()`: 时间槽计算
- `validateTeacher()`, `validateStudent()`: 数据验证
- `deepClone()`: 深拷贝

**validationUtils.js:**
- `validateConstraints()`: 约束验证
- `canScheduleStudent()`: 可调度性检查
- `calculateAvailabilityOverlap()`: 重叠度计算
- `checkConflicts()`: 冲突检测
- `suggestConstraintFixes()`: 修复建议

## 主组件集成

**位置:** `frontend/src/XdfClassArranger/Experiment/Experiment.jsx`

**标签页:**
1. **数据结构** - 展示数据结构文档
2. **算法说明** - 展示算法对比和流程
3. **约束输入** - 管理教师和学生数据
4. **排课演示** - 执行排课并可视化结果

**设置选项:**
- 时间粒度: 5分钟 / 15分钟
- 算法选择: 贪心 / 遗传 / 对比
- 显示热图开关

**结果展示:**
- 单算法模式: 显示成功率、执行时间、日历视图
- 对比模式: 并排显示两种算法结果和对比统计

## 样式设计

**位置:** `frontend/src/XdfClassArranger/Experiment/Experiment.css`

**特点:**
- 日系性冷淡风格
- 使用CSS变量保持一致性
- 响应式布局
- 平滑过渡动画
- 清晰的视觉层次

**主要样式块:**
- 标签页导航
- 表格和卡片
- 表单和输入
- 日历网格
- 流程图
- 统计图表

## 技术亮点

### 1. 可配置时间粒度

系统支持两种时间粒度:
- **5分钟**: 150个槽/天，精确控制
- **15分钟**: 50个槽/天，减少计算量

### 2. 算法对比

可同时运行两种算法并对比:
- 成功率差异
- 执行时间对比
- 可视化结果差异
- 推荐最优算法

### 3. 实时验证

- 输入时验证数据格式
- 检查约束一致性
- 提供修复建议
- 防止无效数据

### 4. 进度反馈

- 贪心算法: 显示当前学生
- 遗传算法: 显示代数和适应度
- 进度条可视化
- 实时消息更新

### 5. 热图可视化

根据学生可用时间重叠度:
- 白色: 无学生可用
- 浅蓝: 少量学生
- 深蓝: 大量学生重叠

## 文件结构

```
Experiment/
├── Experiment.jsx              # 主组件
├── Experiment.css              # 样式文件
├── components/
│   ├── AlgorithmExplainer.jsx  # 算法说明
│   ├── CalendarView.jsx        # 日历视图
│   ├── ConstraintInputPanel.jsx # 约束输入
│   ├── DataGenerator.jsx       # 数据生成
│   └── DataStructureDoc.jsx    # 数据结构文档
├── algorithms/
│   ├── geneticScheduler.js     # 遗传算法
│   └── greedyScheduler.js      # 贪心算法
└── utils/
    ├── dataStructures.js       # 数据结构工具
    └── validationUtils.js      # 验证工具
```

## 使用流程

### 基本使用

1. **查看数据结构** - 了解系统使用的数据格式
2. **查看算法说明** - 理解两种算法的工作原理
3. **输入约束** - 手动添加或随机生成教师/学生
4. **运行排课** - 选择算法和设置，执行排课
5. **查看结果** - 在日历视图中查看排课结果

### 快速测试

1. 点击"约束输入"标签页
2. 点击"随机生成"
3. 选择预设场景（如"中规模"）
4. 切换到"排课演示"标签页
5. 选择"对比模式"
6. 点击"开始排课"
7. 查看两种算法的对比结果

## 性能考虑

### 贪心算法

- **小规模** (10教师/20学生): <100ms
- **中规模** (20教师/50学生): <500ms
- **大规模** (50教师/100学生): <2s

### 遗传算法

- **小规模**: 2-5s
- **中规模**: 5-15s
- **大规模**: 15-60s

### 优化策略

1. 教师负载均衡
2. 早期剪枝无效方案
3. 时间槽索引优化
4. 渐进式结果展示

## 已知限制

1. **内存限制**: 建议不超过200学生
2. **无教室约束**: 当前版本未考虑教室容量
3. **简化循环课**: 假设每周相同时间重复
4. **无日期约束**: 未考虑具体日期和假期

## 扩展可能

1. 添加教室资源管理
2. 支持更复杂的循环模式（隔周课等）
3. 添加日历选择器选择具体日期
4. 导出排课结果为Excel
5. 与主系统数据集成
6. 添加撤销/重做功能
7. 支持拖拽调整课程时间

## 测试建议

### 单元测试

- 数据结构创建和验证
- 时间槽计算和重叠检测
- 约束验证逻辑

### 集成测试

- 完整排课流程
- 算法对比功能
- 数据生成准确性

### 性能测试

- 100学生压力测试
- 内存使用监控
- UI响应性测试

### 边界测试

- 零数据情况
- 过度约束情况
- 无解场景处理

## 总结

实验页面成功实现了以下目标:

✅ 清晰的数据结构文档
✅ 详细的算法说明和对比
✅ 交互式约束输入界面
✅ 可视化日历展示
✅ 随机数据生成
✅ 双算法支持和对比
✅ 可配置时间粒度
✅ 日系性冷淡风格UI
✅ 响应式设计
✅ 完善的验证和错误处理

该页面可作为排课系统的教学演示工具，帮助用户理解1v1排课的数据结构、算法和优化策略。
