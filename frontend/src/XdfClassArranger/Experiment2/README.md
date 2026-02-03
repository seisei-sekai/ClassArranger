# Experiment2 - 前途塾1v1排课系统

简洁实用的排课系统，专为非技术管理员设计。

## 概述

Experiment2结合了Experiment的简洁架构和Function的实用功能，提供一个真正可用的排课解决方案。

### 核心特性

- 📥 **双模式数据导入** - Excel批量导入或手动表单输入
- 👥 **完整资源管理** - 学生、教师、教室三方管理
- 🎯 **智能三方匹配** - 自动匹配学生-教师-教室
- 📅 **增强日历视图** - 可拖拽调整的交互式日历
- 💾 **自动数据持久化** - LocalStorage自动保存
- 📊 **详细结果统计** - 成功率、利用率、分布图表
- 🔍 **多维度过滤** - 按校区、科目、教师、学生过滤

## 快速开始

### 1. 导航到页面

在主应用中访问 Experiment2 页面（需要在路由中配置）。

### 2. 导入数据

**方式一：Excel导入（推荐）**

1. 点击"数据导入"标签
2. 选择"Excel粘贴导入"
3. 从前途塾Excel文件复制学生数据
4. 粘贴到文本框
5. 点击"解析数据"
6. 确认后点击"导入"

**方式二：手动输入**

1. 点击"数据导入"标签
2. 选择"手动表单输入"
3. 填写表单
4. 点击"添加"

**方式三：示例数据**

1. 点击侧边栏"导入示例"
2. 系统自动加载5个学生、5个教师、5个教室

### 3. 检查数据

- 点击"学生管理"查看已导入的学生
- 点击"教师管理"查看已导入的教师
- 点击"教室管理"查看已导入的教室

### 4. 开始排课

1. 点击"开始排课"标签
2. 查看数据概览和科目匹配分析
3. 点击"开始排课"按钮
4. 等待排课完成（通常数秒）

### 5. 查看结果

1. 自动跳转到"排课结果"标签
2. 查看统计信息和日历视图
3. 使用过滤器筛选课程
4. 拖拽课程块调整时间
5. 点击课程块查看详情

## 文件结构

```
Experiment2/
├── Experiment2.jsx                    # 主组件
├── Experiment2.css                    # 样式文件
├── README.md                          # 本文件
├── components/                        # UI组件
│   ├── DataImportPanel.jsx            # 数据导入面板
│   ├── StudentPanel.jsx               # 学生管理
│   ├── TeacherPanel.jsx               # 教师管理
│   ├── ClassroomPanel.jsx             # 教室管理
│   ├── SchedulingControlPanel.jsx    # 排课控制
│   ├── EnhancedCalendarView.jsx      # 增强日历
│   └── ResultsSummaryPanel.jsx       # 结果统计
├── parsers/                           # 数据解析
│   ├── excelParser.js                 # Excel解析器
│   └── nlpService.js                  # NLP服务
├── algorithms/                        # 排课算法
│   └── tripleMatchScheduler.js        # 三方匹配调度器
└── utils/                             # 工具函数
    ├── realBusinessDataStructures.js  # 数据结构
    ├── validationRules.js             # 验证规则
    ├── storageManager.js              # 存储管理
    └── exampleDataGenerator.js        # 示例数据
```

## Excel数据格式

### 学生数据格式

**最少需要的列（3列）：**
1. 校区
2. 学管姓名
3. 学生姓名

**推荐包含的列（18列）：**
1. 校区 - 高马/本校
2. 学管姓名
3. 学生姓名
4. 学生批次 - 如2602
5. 录入日期
6. 频次 - 1次/2次/多次
7. 时长 - 如2h、1.5小时
8. 形式 - 线上/线下
9. 内容 - 科目名称
10. 级别
11. 已用课时
12. 目标大学
13. 目标专业
14. 起止时间
15. 希望时间段 - 如"周一-周五下午"
16. 特殊时间
17. 每周频次
18. 课上具体内容

### 教师数据格式

**简化格式（5列）：**
1. 姓名
2. 科目（逗号分隔）
3. 可用时间 - 如"周一/周三/周五 14:00-18:00"
4. 时薪
5. 校区（逗号分隔）

### 教室数据格式

**简化格式（4列）：**
1. 校区
2. 教室名
3. 容量
4. 类型

## 数据结构

### Student (学生)

```javascript
{
  id: string,
  campus: string,           // 校区
  manager: string,          // 学管
  name: string,            // 姓名
  batch: string,           // 批次
  subject: string,         // 科目
  frequency: string,       // 频次
  duration: number,        // 时长（小时）
  format: string,          // 形式
  totalHours: number,      // 总课时
  remainingHours: number,  // 剩余课时
  constraints: {           // 约束
    allowedDays: Set<number>,
    allowedTimeRanges: TimeSlot[],
    excludedTimeRanges: TimeSlot[],
    duration: number,
    frequency: string
  }
}
```

### Teacher (教师)

```javascript
{
  id: string,
  name: string,
  subjects: string[],
  campus: string[],
  availableTimeSlots: TimeSlot[],
  hourlyRate: number,
  maxHoursPerWeek: number
}
```

### Classroom (教室)

```javascript
{
  id: string,
  name: string,
  campus: string,
  capacity: number,
  type: string,
  availableTimeSlots: TimeSlot[]
}
```

### Course (课程 - 排课结果)

```javascript
{
  id: string,
  student: Student,
  teacher: Teacher,
  classroom: Classroom,
  subject: string,
  timeSlot: TimeSlot,
  isRecurring: boolean
}
```

## 排课算法

### 三方匹配调度器

基于Experiment的贪心算法，增加教室匹配：

```
1. 按剩余课时从少到多排序学生（优先处理课时少的）
2. 对每个学生：
   a. 找到可教该科目且在同一校区的教师
   b. 找到学生和教师的时间交集
   c. 为每个时间交集找可用教室
   d. 找到完整匹配后分配课程
   e. 更新教师和教室的可用时间
3. 返回排课结果和冲突列表
```

**时间复杂度**: O(S × T × C)  
S=学生数, T=教师数, C=教室数

**优点**:
- 快速执行（50学生<5秒）
- 确定性结果
- 清晰的失败原因
- 自动负载均衡

## 使用技巧

### 提高排课成功率

1. **确保教师科目覆盖** - 每个科目至少有一位教师
2. **放宽时间约束** - 增加学生可用时间段
3. **增加教室数量** - 特别是热门时段
4. **调整学生优先级** - 手动调整处理顺序

### 处理冲突

1. 查看冲突列表找到原因
2. 调整相关学生的约束
3. 增加对应科目的教师
4. 重新运行排课

### 手动调整

1. 在日历视图中直接拖拽课程块
2. 系统自动验证是否有冲突
3. 点击课程块查看详情或删除

## 数据持久化

所有数据自动保存到浏览器LocalStorage：

- `experiment2_students` - 学生数据
- `experiment2_teachers` - 教师数据
- `experiment2_classrooms` - 教室数据
- `experiment2_courses` - 排课结果
- `experiment2_settings` - 系统设置

**注意**: 清除浏览器缓存会丢失数据，建议定期导出备份。

## 故障排查

### 排课失败

**问题**: 很多学生排课失败

**可能原因**:
- 没有教师可教该科目
- 教师和学生时间不重叠
- 教室数量不足

**解决方法**:
1. 查看"开始排课"页的科目匹配分析
2. 添加缺失科目的教师
3. 调整学生可用时间
4. 增加教室数量

### Excel导入失败

**问题**: 粘贴Excel数据后无法解析

**可能原因**:
- 数据格式不正确
- 缺少必需列

**解决方法**:
1. 确保数据是Tab分隔格式
2. 检查是否包含必需列
3. 尝试手动输入测试

### 日历无法拖拽

**问题**: 课程块无法拖动

**可能原因**:
- 浏览器不支持拖拽API
- 课程数据不完整

**解决方法**:
1. 使用现代浏览器（Chrome/Firefox）
2. 点击课程块查看详情
3. 删除并重新排课

## 性能指标

| 规模 | 学生 | 教师 | 教室 | 排课时间 |
|------|------|------|------|----------|
| 小   | 10   | 5    | 3    | <1s      |
| 中   | 25   | 10   | 5    | <3s      |
| 大   | 50   | 15   | 8    | <5s      |
| 超大 | 100  | 25   | 15   | <15s     |

## 与其他系统比较

| 特性 | Experiment | Function | Experiment2 |
|------|------------|----------|-------------|
| 复杂度 | 简单 | 复杂 | 适中 |
| 数据导入 | 手动 | Excel+NLP | Excel+手动 |
| 排课算法 | Greedy/Genetic | TripleMatch(bug) | Triple+Greedy |
| 日历 | 自定义 | FullCalendar | 增强自定义 |
| 教室管理 | 无 | 有 | 有 |
| 可用性 | 演示 | 不可用 | 可用 |
| 目标用户 | 开发者 | 管理员 | 管理员 |

## 扩展开发

### 添加新功能

1. 在 `components/` 创建新组件
2. 在 `Experiment2.jsx` 中导入和使用
3. 添加到标签页导航

### 自定义样式

编辑 `Experiment2.css`，使用CSS变量保持一致性。

### 集成后端

将来可以集成后端API：
- NLP约束解析
- 数据库持久化
- 多用户协作
- 历史记录

## 许可

本项目是ClassArranger的一部分，遵循项目主LICENSE。
