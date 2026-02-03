# Experiment3 - Function完整版副本

## 概述

Experiment3是Function排课系统的完整副本，用于实验和测试目的。

## 创建时间

**Created:** 2026-02-02
**Purpose:** Function页面的完整镜像，用于独立测试和实验

## 与Function的关系

- **Experiment3** = Function的完整克隆
- 包含所有70个文件
- 所有功能完全相同
- 独立运行，不影响原Function页面

## 为什么创建Experiment3？

1. **安全测试** - 可以在不影响原Function的情况下进行修改和测试
2. **功能实验** - 尝试新功能而不破坏生产环境
3. **版本对比** - 可以同时运行两个版本进行对比
4. **备份保护** - 保留Function的完整工作副本

## 文件结构（与Function完全相同）

```
Experiment3/
├── Experiment3.jsx                     # 主组件（原Function.jsx）
├── Experiment3.css                     # 样式文件（原Function.css）
├── GeneticAlgorithm.jsx               # 遗传算法
├── components/                        # UI组件
│   ├── ClassroomPanel.jsx
│   ├── ConstraintManager.jsx
│   ├── ConstraintPanel.jsx
│   ├── ConstraintReviewDialog.jsx
│   └── TimeSlotDetailPanel.jsx
├── constraints/                       # 约束引擎
│   ├── ConstraintEngine.js
│   └── constraintTypes.js
├── matching/                          # 匹配引擎
│   └── TripleMatchingEngine.js
├── parsers/                          # 解析器
│   ├── NLPTimeParser.js
│   └── SubjectParser.js
├── services/                         # 服务层
│   ├── openaiService.js
│   ├── scheduleService.js
│   ├── studentDataCleanerService.js
│   └── validPeriodParser.js
├── utils/                           # 工具函数
│   ├── availabilityCalculator.js
│   ├── classroomParser.js
│   ├── constants.js
│   ├── constraintTemplates.js
│   ├── constraintValidator.js
│   ├── courseHoursManager.js
│   ├── excelConstraintExtractor.js
│   ├── nlpLogger.js
│   ├── overlapAnalyzer.js
│   ├── performanceCache.js
│   ├── studentParser.js
│   └── teacherParser.js
├── workers/                         # Web Workers
│   └── scheduling.worker.js
├── hooks/                          # React Hooks
│   └── useScheduleState.js
├── models/                         # 数据模型
│   └── scheduleTypes.js
├── prompts/                        # AI提示词
│   └── constraintParsingPrompt.js
├── examples/                       # 示例代码
│   └── scheduleIntegration.example.js
├── __tests__/                      # 测试文件
│   └── constraintParsing.test.js
└── Information_Plan/               # 测试数据
    ├── Student_data.xlsx
    ├── Teacher_data.xlsx
    └── Classroom_data.xlsx
```

## 主要功能（完全继承自Function）

### 1. 数据导入
- ✅ Excel批量导入（支持33列格式）
- ✅ 手动单个添加
- ✅ AI智能数据清洗
- ✅ NLP约束解析

### 2. 三方匹配
- ✅ 学生-教师-教室智能匹配
- ✅ TripleMatchingEngine
- ✅ 科目、校区、时间自动匹配
- ✅ 约束引擎验证

### 3. 排课算法
- ✅ 遗传算法（GeneticAlgorithm）
- ✅ 贪心算法
- ✅ 多目标优化
- ✅ 冲突检测和解决

### 4. 高级功能
- ✅ NLP时间约束解析
- ✅ OpenAI API集成
- ✅ 课时自动计算
- ✅ 可用性热力图
- ✅ FullCalendar日历视图
- ✅ Web Worker多线程排课
- ✅ 性能缓存优化

### 5. UI组件
- ✅ 约束管理面板
- ✅ 约束审核对话框
- ✅ 教室管理面板
- ✅ 时间槽详情面板
- ✅ 日本风格配色

## 使用方法

### 访问页面
在导航菜单中点击"Function完整版"，或访问 `/experiment3` 路径。

### 数据导入
1. 准备Excel数据（格式与Function相同）
2. 点击"导入数据"
3. 粘贴Excel内容
4. 选择使用AI清洗（可选）
5. 解析并导入

### 开始排课
1. 确保已导入学生、教师、教室数据
2. 设置排课参数
3. 选择算法（遗传/贪心）
4. 点击"开始排课"
5. 查看结果

## 与其他实验页面对比

| 特性 | Experiment | Experiment2 | **Experiment3** |
|------|------------|-------------|----------------|
| 基于 | 简化设计 | Experiment改进 | **Function克隆** |
| 代码量 | 1,500行 | 5,000行 | **8,000+行** |
| 文件数 | 10 | 17 | **70** |
| AI集成 | ❌ | ❌ | **✅** |
| NLP解析 | ❌ | 预留 | **✅** |
| Web Worker | ❌ | ❌ | **✅** |
| FullCalendar | ❌ | ❌ | **✅** |
| 数据清洗 | ❌ | ❌ | **✅** |
| 约束引擎 | 简单 | 基础 | **完整** |
| 测试覆盖 | ❌ | ❌ | **✅** |
| 适用场景 | 学习 | 生产（简单） | **生产（完整）** |

## 注意事项

### LocalStorage键名
Experiment3使用与Function相同的LocalStorage键：
- `students` - 学生数据
- `teachers` - 教师数据
- `classrooms` - 教室数据
- `events` - 课程事件
- `aiResult` - AI结果

⚠️ **重要**: Experiment3和Function共享相同的LocalStorage，修改一个会影响另一个！

### API配置
需要配置OpenAI API密钥才能使用AI功能：
- NLP约束解析
- 智能数据清洗

### 性能
由于功能完整，Experiment3比Experiment/Experiment2更重：
- 初始加载较慢
- 内存占用较大
- 适合高端设备

## 开发建议

### 修改建议
如果要修改Experiment3：
1. 先备份当前版本
2. 小步修改，频繁测试
3. 使用独立的LocalStorage键（如果需要）
4. 记录所有修改

### 测试建议
1. 使用 `Information_Plan/` 中的测试数据
2. 运行单元测试（`__tests__/`）
3. 对比Function和Experiment3的结果
4. 测试边界情况

### 调试技巧
- 使用 `nlpLogger` 查看NLP日志
- 检查浏览器Console
- 使用React DevTools
- 监控性能（Performance Cache）

## 文档

完整文档位于：
- `AI排课使用说明.md` - AI功能说明
- `SVG图标设计说明.md` - 图标设计
- `可用性颜色系统说明.md` - 颜色系统
- `学生可用性显示控制说明.md` - 可用性显示
- `教程系统使用说明.md` - 教程系统
- `utils/README.md` - 工具函数文档
- `models/__tests__/README.md` - 测试文档

## 许可

本项目是ClassArranger的一部分，遵循项目主LICENSE。
