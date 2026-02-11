# Ground Truth 测试套件

**创建时间：** 2026-02-03  
**最后更新：** 2026-02-03  
**目的：** 提供50个deterministic test cases作为排课系统的ground truth，用于调试智能推荐应用后的排课失败问题

---

## 概述

这套测试包含50个精心设计的test cases，覆盖从数据生成、初次排课、智能推荐、应用推荐到重新排课的完整流程。每个test case都是deterministic的，可以作为ground truth来验证系统行为。

## 文件结构

```
frontend/src/XdfClassArranger/Experiment3/tests/ground-truth/
├── test-data-factory.js      # 测试数据工厂
├── test-cases.json            # 50个test cases的JSON规格
├── ground-truth.test.js       # Vitest测试实现
└── README.md                  # 本文档
```

## 时间槽系统

基于 `constants.js`：

- **粒度：** 5分钟/槽
- **范围：** 0-149 (9:00-21:30)
- **每小时：** 12个槽
- **计算公式：** `slotIndex = floor((hour - 9) * 12 + minute / 5)`

### 示例

```javascript
9:00  → slot 0
10:30 → slot 18
13:30 → slot 54
18:00 → slot 108
21:30 → slot 150 (超出范围)
```

## Test Cases分类

### 类别A：基础排课（10个 - TC001-TC010）

验证基础单次/周排课功能：

- TC001: 简单1次/周，周一上午
- TC002: 1次/周，周三下午，1.5小时
- TC003: 1次/周，周五晚上，2.5小时
- TC004: 不同校区（涩谷校区）
- TC005: 不同科目（化学）
- TC006: 短时长（1小时）
- TC007: 长时长（3小时）
- TC008: 线上模式
- TC009: 周末排课
- TC010: 多时段可选

### 类别B：多频次排课（10个 - TC011-TC020）

验证2次/周、3次/周等多频次场景：

- TC011: 2次/周，固定时间
- TC012: 2次/周，不同天数
- TC013: 3次/周，固定时间
- TC014: 2次/周，灵活模式
- TC015: 3次/周，灵活模式
- TC016: 2次/周，时长不同（每次1小时）
- TC017: 4次/周，灵活模式
- TC018: 2次/周，时间跨度大
- TC019: 2次/周，周末+工作日
- TC020: 2次/周，连续两天

### 类别C：智能推荐 - 极度宽松（5个 - TC021-TC025）

验证"极度宽松排课"推荐：

- TC021: 仅工作日→全周
- TC022: 固定→灵活，时间冲突场景
- TC023: 2次/周约束严格→全周全天
- TC024: 3次/周约束严格
- TC025: 线下→线上，扩大资源池

### 类别D：智能推荐 - 扩大时间范围（5个 - TC026-TC030）

验证"扩大可用时间范围"推荐：

- TC026: 13:00-16:00→12:00-17:00
- TC027: 仅下午→全天
- TC028: 2次/周，同时扩大两天
- TC029: 跨午休时间
- TC030: 晚上时段延后

### 类别E：智能推荐 - 增加可用天数（5个 - TC031-TC035）

验证"增加可用上课天数"推荐：

- TC031: 周一→周一+周二
- TC032: 工作日→工作日+周末
- TC033: 2天→5天
- TC034: 2次/周+灵活模式
- TC035: 仅周末→周末+工作日

### 类别F：智能推荐 - 灵活时间安排（5个 - TC036-TC040）

验证"灵活时间安排"推荐（固定→灵活）：

- TC036: 2次/周，固定→灵活
- TC037: 3次/周，固定→灵活
- TC038: 时间冲突严重场景
- TC039: 教师资源紧张
- TC040: 4次/周

### 类别G：智能推荐 - 其他类型（5个 - TC041-TC045）

验证其他推荐类型：

- TC041: 切换线上（线下→线上）
- TC042: 调整频率（1次/周→2次/周）
- TC043: 放宽教师约束
- TC044: 全面放宽约束
- TC045: 组合推荐（先灵活，再极度宽松）

### 类别H：边界情况和失败场景（5个 - TC046-TC050）

验证已知失败场景和边界情况：

- TC046: 无可用教师（科目不匹配）
- TC047: 无可用教室（校区不匹配）
- TC048: 时间冲突无法解决（但推荐后应成功）
- TC049: 约束过严（时间段太短）（但推荐后应成功）
- TC050: 推荐数据格式验证（边界测试）

## 运行测试

### 运行所有测试

```bash
cd frontend
npm test ground-truth
```

### 运行特定test case

```bash
npm test ground-truth -- -t "TC001"
```

### 运行特定类别

```bash
npm test ground-truth -- -t "basic-single-frequency"
npm test ground-truth -- -t "smart-recommendation-ultra-flexible"
```

### 以watch模式运行

```bash
npm test ground-truth -- --watch
```

### 生成覆盖率报告

```bash
npm test ground-truth -- --coverage
```

## 测试流程

每个test case包含5个阶段：

### Phase 1: 初次排课

- **目的：** 验证基础排课功能
- **输入：** 学生、教师、教室数据
- **输出：** 排课结果（courses或conflicts）
- **验证：** 数据格式、排课成功/失败预期

### Phase 2: 生成智能推荐

- **目的：** 验证推荐生成逻辑
- **输入：** 学生约束、排课结果
- **输出：** 推荐列表
- **验证：** 推荐数量、推荐类型

### Phase 3: 应用推荐

- **目的：** 验证推荐数据正确应用到学生对象
- **输入：** 学生对象、选中推荐
- **输出：** 修改后的学生对象
- **验证：**
  - V4 Schema字段存在
  - 所有`allowedTimeRanges`包含`day`字段
  - 所有槽位在0-149范围内
  - V4和旧格式正确同步
  - 推荐预期改变生效

### Phase 4: 重新排课

- **目的：** 验证修改约束后能成功排课
- **输入：** 修改后的学生、教师、教室
- **输出：** 排课结果
- **验证：**
  - **关键：** 必须排课成功（TC046-TC047除外）
  - 课程数量、课程数据完整性
  - 灵活模式：验证flexibleSlots

### Phase 5: 数据完整性验证

- **目的：** 最终验证所有数据格式正确
- **验证：**
  - V4 Schema完整
  - 旧格式同步
  - 时间范围格式正确
  - 无缺失字段

## 关键验证点

### 1. 数据格式完整性

```javascript
// V4 Schema
student.scheduling.timeConstraints.allowedDays
student.scheduling.timeConstraints.allowedTimeRanges
student.scheduling.frequencyConstraints.duration
student.scheduling.frequencyConstraints.schedulingMode

// 旧格式同步
student.parsedData.allowedDays
student.parsedData.allowedTimeRanges
student.constraints.allowedDays (Set)
student.constraints.allowedTimeRanges
```

### 2. 时间槽格式

```javascript
// 每个时间范围必须有：
{
  day: 0-6,         // 必须存在
  startSlot: 0-149, // 必须存在
  endSlot: 0-150    // 必须存在
}

// startSlot < endSlot
```

### 3. 推荐数据格式

```javascript
// V4格式推荐
recommendation.data = {
  scheduling: {
    timeConstraints: { ... },
    frequencyConstraints: { ... }
  }
}

// 旧格式推荐
recommendation.data = {
  parsedData: { ... },
  constraints: { ... },
  schedulingMode: '...',
  isRecurringFixed: true/false
}
```

### 4. 同步逻辑

- V4 → 旧格式：所有字段正确同步
- 旧格式 → V4：所有字段正确同步
- `startSlot/endSlot` ↔ `start/end` 正确转换
- `allowedDays` Set ↔ Array 正确转换

## Debug工作流

### 步骤1：运行所有测试

```bash
npm test ground-truth
```

### 步骤2：识别失败模式

查看测试输出，识别：

- 哪些类别失败率高？
- 哪个阶段失败？（Phase 3 vs Phase 4）
- 什么类型的推荐失败？

### 步骤3：深入分析失败test

```bash
npm test ground-truth -- -t "TC021"
```

查看console.log输出：

- 学生数据（应用前/后）
- 推荐数据
- 排课结果
- 错误消息

### 步骤4：对比预期vs实际

检查：

- `scheduling.timeConstraints.allowedTimeRanges`是否有`day`字段？
- 槽位是否在0-149范围内？
- V4和旧格式是否同步？
- `handleManualModify`是否正确应用了推荐数据？
- `extractConstraints`是否正确读取了V4数据？

### 步骤5：修复代码

常见修复点：

#### 修复点A：SmartRecommendations.jsx

确保所有推荐的`allowedTimeRanges`包含`day`字段：

```javascript
recommendations.push({
  id: 'expand-time-range',
  data: {
    scheduling: {
      timeConstraints: {
        allowedTimeRanges: expandedTimeSlots.map(r => ({
          day: r.day,          // ← 必须有
          startSlot: r.start,
          endSlot: r.end
        }))
      }
    }
  }
});
```

#### 修复点B：ScheduleAdjustmentModal.jsx (handleManualModify)

确保深度合并和同步：

```javascript
// 深度合并 scheduling
if (field === 'scheduling') {
  Object.entries(value).forEach(([scheduleField, scheduleValue]) => {
    Object.entries(scheduleValue).forEach(([subField, subValue]) => {
      target.scheduling[scheduleField][subField] = subValue;
    });
  });
  
  // 同步到旧格式
  if (value.timeConstraints) {
    target.parsedData = {
      allowedDays: value.timeConstraints.allowedDays,
      allowedTimeRanges: value.timeConstraints.allowedTimeRanges.map(r => ({
        day: r.day,
        start: r.startSlot,
        end: r.endSlot
      }))
    };
  }
}
```

#### 修复点C：algorithmAdapter.js (extractConstraints)

优先读取V4 Schema：

```javascript
extractConstraints(student, availability) {
  // V4 Schema优先
  if (student.scheduling?.timeConstraints) {
    return {
      allowedDays: new Set(student.scheduling.timeConstraints.allowedDays),
      allowedTimeRanges: student.scheduling.timeConstraints.allowedTimeRanges,
      duration: student.scheduling.frequencyConstraints.duration / 10, // 分钟转槽数
      frequency: student.scheduling.frequencyConstraints.frequency
    };
  }
  
  // 旧格式fallback
  if (student.parsedData) { ... }
}
```

#### 修复点D：tripleMatchScheduler.js (findCommonTimeSlots)

处理`allowedTimeRanges`缺少`day`字段的情况：

```javascript
// 如果studentRange没有day字段，扩展为多个范围
const studentRangesWithDay = studentRanges.flatMap(range => {
  if (range.day !== undefined) {
    return [range];
  }
  // 为每个允许的天数创建一个范围
  return Array.from(allowedDaysSet).map(day => ({
    ...range,
    day
  }));
});

// 然后使用studentRangesWithDay进行overlap检测
```

### 步骤6：重新运行测试

```bash
npm test ground-truth
```

确认所有测试通过。

## 预期结果

### 成功标准

- ✅ 所有50个test cases通过
- ✅ Phase 4（重新排课）100%成功（除TC046-TC047）
- ✅ 所有数据格式验证通过
- ✅ V4和旧格式完全同步

### 如果有测试失败

❌ **测试失败 = 代码有bug**

Test cases是ground truth，不应修改。应修复代码直到所有测试通过。

## 测试输出示例

### 成功输出

```
✓ [TC001] Phase 1: 初次排课
✓ [TC001] Phase 2: 生成智能推荐
✓ [TC001] Phase 3: 应用推荐
✓ [TC001] Phase 4: 重新排课
✓ [TC001] Phase 5: 数据完整性验证

Test Files  1 passed (1)
     Tests  250 passed (250)
```

### 失败输出

```
✗ [TC021] Phase 4: 重新排课
  - Expected: courses.length > 0
  - Received: 0
  - Reason: 排课算法未返回有效结果
  - 学生约束: {...}
  - 推荐: ultra-flexible
```

## 常见问题

### Q1: 为什么所有Phase 4都失败？

A: 可能原因：

1. `handleManualModify`未正确应用推荐数据
2. `extractConstraints`未读取V4 Schema
3. 推荐数据缺少`day`字段
4. 时间槽超出0-149范围

### Q2: 如何调试特定test case？

```bash
# 运行单个test
npm test ground-truth -- -t "TC021"

# 查看详细console.log
npm test ground-truth -- -t "TC021" --reporter=verbose
```

### Q3: 如何验证数据同步？

使用`validateSync`函数：

```javascript
import { validateSync } from './test-data-factory.js';

const syncValidation = validateSync(student);
if (!syncValidation.valid) {
  console.error('同步错误:', syncValidation.errors);
}
```

### Q4: Phase 1失败但Phase 4成功？

这是正常的！某些test cases（如TC048-TC049）故意设计初次排课失败，但应用推荐后成功。

### Q5: 如何添加新的test case？

1. 在`test-cases.json`添加新条目
2. 遵循现有格式
3. 运行测试验证

## 数据工厂API

### createStudent(config)

创建V4格式学生对象。

### createTeacher(config)

创建V4格式教师对象。

### createClassroom(config)

创建V4格式教室对象。

### createLegacyStudent(config)

创建带旧格式兼容的学生对象（用于测试）。

### timeToSlot(timeStr)

时间字符串 → 槽位索引。

```javascript
timeToSlot('13:30') // → 54
```

### slotToTime(slot)

槽位索引 → 时间字符串。

```javascript
slotToTime(54) // → '13:30'
```

### validateStudentData(student)

验证学生数据完整性。

### validateSync(student)

验证V4和旧格式同步一致性。

## 最佳实践

1. **始终运行完整测试套件** - 确保没有回归
2. **使用test cases作为ground truth** - 代码适配test cases，而非相反
3. **详细查看console.log** - 测试包含丰富的调试信息
4. **验证同步** - 确保V4和旧格式一致
5. **关注Phase 4** - 这是最关键的验证点

## 维护

### 更新test cases

如果需求变更，更新对应的test case：

1. 修改`test-cases.json`
2. 确保格式一致
3. 运行测试验证

### 添加新验证点

在`ground-truth.test.js`的Phase 3或Phase 5添加新的expect断言。

### 更新数据工厂

如果V4 Schema有变更，更新`test-data-factory.js`中的create函数。

## 总结

这套Ground Truth测试是排课系统的质量保证基石。所有代码变更都应通过这50个test cases的验证。测试即文档，测试即规格。

---

**如有问题，参考：**

- `test-data-factory.js` - 数据生成逻辑
- `test-cases.json` - 完整test case定义
- `ground-truth.test.js` - 测试实现
- 本README - 使用指南
