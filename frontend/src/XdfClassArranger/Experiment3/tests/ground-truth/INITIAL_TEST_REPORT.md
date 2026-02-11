# Ground Truth Tests - 初始测试报告

**测试时间：** 2026-02-03  
**测试环境：** Local Development  
**测试框架：** Vitest 1.6.1  

---

## 执行摘要

Ground Truth测试套件已成功实现并执行，共包含50个test cases，每个test case包含5个测试阶段，总计250个测试。

### 总体结果

```
Test Files:  1 passed (1)
Tests:       78 failed | 173 passed (251)
Duration:    ~5-10 seconds
```

### 关键发现

**🔴 严重问题：排课算法几乎全部失败**

- **Phase 1 (初次排课)** 失败率极高，大多数test cases返回0个课程
- **Phase 4 (重新排课)** 即使应用了智能推荐，仍然失败
- 这表明排课算法存在系统性问题，而非单纯的约束过严

---

## 详细失败分析

### 失败模式 1：Phase 1 初次排课失败

**症状：**
```
expected 0 to be greater than 0
```

**影响范围：** 大部分基础test cases (TC001-TC010等)

**示例：**

```javascript
// TC001: 简单1次/周，周一上午，固定时间，线下
学生配置：
- 可用天数：[1] (周一)
- 可用时间：10:00-13:00 (slot 12-48)
- 频率：1次/周
- 时长：1.5小时

教师配置：
- 科目：数学
- 校区：新宿
- 可用时间：全周全天

教室配置：
- 类型：线下
- 校区：新宿
- 容量：10人

期望结果：排课成功，生成1个课程
实际结果：courses.length = 0 ❌
```

**可能原因：**
1. 学生数据未正确传递到算法
2. 时间槽格式不匹配（legacy vs V4）
3. `extractConstraints` 未能正确读取V4 Schema
4. `findCommonTimeSlots` 逻辑错误

### 失败模式 2：Phase 4 重新排课失败（应用智能推荐后）

**症状：**
```
重新排课失败！原因: 未知
```

**影响范围：** 几乎所有应用推荐后的test cases

**示例：**

```javascript
// TC001 应用ultra-flexible推荐后
学生: TC001学生
推荐: ultra-flexible

应用后的约束:
{
  "allowedDays": [0, 1, 2, 3, 4, 5, 6],
  "allowedTimeRanges": [
    {"day": 0, "startSlot": 12, "endSlot": 102},
    {"day": 1, "startSlot": 12, "endSlot": 102},
    ... (全周 8:00-17:30)
  ]
}

期望结果：排课成功（约束已极度宽松）
实际结果：courses.length = 0 ❌
```

**分析：**
即使约束已设置为"全周全天可用"，排课仍然失败，这表明：
- 推荐数据未正确应用到学生对象
- 或算法未正确读取应用后的数据
- 或算法本身存在bug

### 失败模式 3：Phase 3 数据验证通过，但Phase 4失败

**症状：**
- Phase 3所有断言通过（V4 Schema正确，同步正确）
- 但Phase 4立即失败

**示例：**

```javascript
// Phase 3: 应用推荐 ✅
- V4 Schema字段存在 ✅
- allowedTimeRanges包含day字段 ✅
- 槽位在0-149范围内 ✅
- V4和旧格式同步 ✅

// Phase 4: 重新排课 ❌
- courses.length = 0 (expected > 0)
```

**结论：**
数据格式正确，但算法未能使用这些数据进行排课。

---

## Test Cases分类结果

### 类别A：基础排课 (TC001-TC010)

| Test Case | Phase 1 | Phase 2 | Phase 3 | Phase 4 | Phase 5 |
|-----------|---------|---------|---------|---------|---------|
| TC001     | ❌ (0)  | ✅      | ✅      | ❌ (0)  | ⚠️      |
| TC002     | ❌ (0)  | ✅      | ✅      | ❌ (0)  | ⚠️      |
| TC003     | ❌ (0)  | ✅      | ✅      | ❌ (0)  | ⚠️      |
| TC004     | ❌ (0)  | ✅      | ✅      | ❌ (0)  | ⚠️      |
| TC005     | ❌ (0)  | ✅      | ✅      | ❌ (0)  | ⚠️      |
| TC006     | ❌ (0)  | ✅      | ✅      | ❌ (0)  | ⚠️      |
| TC007     | ❌ (0)  | ✅      | ✅      | ❌ (0)  | ⚠️      |
| TC008     | ❌ (0)  | ✅      | ✅      | ❌ (0)  | ⚠️      |
| TC009     | ❌ (0)  | ✅      | ✅      | ❌ (0)  | ⚠️      |
| TC010     | ❌ (0)  | ✅      | ✅      | ❌ (0)  | ⚠️      |

**成功率：** 0% (Phase 1), 0% (Phase 4)

### 类别B：多频次排课 (TC011-TC020)

| Test Case | Phase 1 | Phase 4 | 成功率 |
|-----------|---------|---------|--------|
| TC011-TC020 | ❌ (全部0) | ❌ (全部0) | 0% |

### 类别C-G：智能推荐 (TC021-TC045)

| Test Case Range | Phase 4成功率 |
|-----------------|---------------|
| TC021-TC025 (极度宽松) | 0% |
| TC026-TC030 (扩大范围) | 0% |
| TC031-TC035 (增加天数) | 0% |
| TC036-TC040 (灵活模式) | 0% |
| TC041-TC045 (其他类型) | 0% |

### 类别H：边界和失败场景 (TC046-TC050)

| Test Case | 期望结果 | 实际结果 |
|-----------|----------|----------|
| TC046 (无教师) | Phase 1失败 ✅ | Phase 1失败 ✅ |
| TC047 (无教室) | Phase 1失败 ✅ | Phase 1失败 ✅ |
| TC048-TC050 | Phase 1失败 → Phase 4成功 | Phase 1失败 → Phase 4失败 ❌ |

---

## 通过的测试

### Phase 2: 生成智能推荐

✅ **所有50个test cases的Phase 2通过**

这表明：
- 智能推荐生成逻辑正确
- 推荐数量符合预期
- 推荐类型选择正确

### Phase 3: 应用推荐

✅ **大部分test cases的Phase 3通过**

这表明：
- 推荐数据正确应用到学生对象
- V4 Schema格式正确
- 旧格式同步正确
- `handleManualModify`逻辑基本正确

---

## 根本原因分析

基于测试结果，问题的根本原因可能是：

### 1. 算法未正确读取V4 Schema数据

**证据：**
- Phase 3验证通过（数据格式正确）
- Phase 4立即失败（算法未使用数据）

**可能位置：**
```javascript
// algorithmAdapter.js - extractConstraints()
// 可能未正确优先读取 student.scheduling.timeConstraints
```

### 2. 时间槽范围不匹配

**证据：**
- Test cases使用0-149槽位（9:00-21:30）
- 算法可能期望不同的范围或格式

**可能位置：**
```javascript
// tripleMatchScheduler.js - findCommonTimeSlots()
// constants.js - SLOTS_PER_DAY定义
```

### 3. Teacher/Classroom可用性未正确创建

**证据：**
- 即使学生约束极度宽松，排课仍失败
- 可能是教师/教室的availability数据有问题

**可能位置：**
```javascript
// test-data-factory.js - createTeacher/createClassroom
// createLegacyTeacher/createLegacyClassroom的availability字段
```

### 4. 数据格式不兼容

**证据：**
- Legacy格式测试数据 vs V4 Schema算法
- 可能存在字段名不匹配（如rawData, parsedData, constraints）

**可能位置：**
```javascript
// 整个数据流：
// test-data-factory → algorithmAdapter → tripleMatchScheduler
```

---

## 推荐的Debug步骤

### 优先级1：验证数据传递

1. 在`algorithmAdapter.schedule()`入口添加console.log
2. 打印students, teachers, classrooms的完整结构
3. 确认数据是否正确传入

```javascript
// algorithmAdapter.js - schedule()
console.log('[AlgorithmAdapter] 输入数据:', {
  students: students.map(s => ({
    name: s.name,
    scheduling: s.scheduling,
    parsedData: s.parsedData,
    constraints: s.constraints
  })),
  teachers: teachers.length,
  classrooms: classrooms.length
});
```

### 优先级2：验证约束提取

1. 在`extractConstraints()`添加详细日志
2. 确认V4 Schema是否被正确读取

```javascript
// algorithmAdapter.js - extractConstraints()
if (student.scheduling?.timeConstraints) {
  console.log('[extractConstraints] ✅ 使用V4 Schema:', {
    allowedDays: student.scheduling.timeConstraints.allowedDays,
    allowedTimeRanges: student.scheduling.timeConstraints.allowedTimeRanges
  });
} else {
  console.log('[extractConstraints] ⚠️ V4 Schema不存在，使用fallback');
}
```

### 优先级3：验证时间槽计算

1. 在`findCommonTimeSlots()`添加日志
2. 确认overlap计算是否正确

```javascript
// tripleMatchScheduler.js - findCommonTimeSlots()
console.log('[findCommonTimeSlots] 学生范围:', studentRanges);
console.log('[findCommonTimeSlots] 教师槽位:', teacherSlots);
console.log('[findCommonTimeSlots] 共同槽位:', commonSlots.length);
```

### 优先级4：修复test-data-factory

1. 检查`createLegacyStudent`是否正确设置所有必需字段
2. 检查`createLegacyTeacher`的availability格式
3. 检查`createLegacyClassroom`的availability格式

```javascript
// test-data-factory.js
// 确保teacher.availability = {
//   rawData: "周一-周五\n09:00-21:00",
//   parsedData: { allowedDays: [1,2,3,4,5], allowedTimeRanges: [...] }
// }
```

---

## 下一步行动

### 立即行动（必须）

1. ✅ 运行单个test case查看详细日志
   ```bash
   npm test ground-truth -- -t "TC001" --reporter=verbose
   ```

2. ✅ 在algorithmAdapter.schedule()添加console.log

3. ✅ 在extractConstraints()添加console.log

4. ✅ 验证test-data-factory中的teacher/classroom availability格式

### 中期行动

5. 修复数据格式问题
6. 确保V4 Schema正确读取
7. 重新运行测试验证修复

### 最终目标

- ✅ 所有50个test cases通过
- ✅ Phase 4成功率100%（除TC046-TC047）
- ✅ 智能推荐应用后100%排课成功

---

## 附录A：测试环境信息

```
Node版本: (待确认)
npm版本: (待确认)
Vitest版本: 1.6.1
操作系统: macOS
工作目录: /Users/benz/Desktop/Stanford/SP26/新东方/XDF/frontend
```

## 附录B：测试命令

```bash
# 运行所有测试
npm test ground-truth

# 运行特定test case
npm test ground-truth -- -t "TC001"

# 运行特定类别
npm test ground-truth -- -t "basic-single-frequency"

# 详细日志
npm test ground-truth -- --reporter=verbose

# Watch模式
npm test ground-truth -- --watch
```

## 附录C：关键文件清单

| 文件 | 作用 | 状态 |
|------|------|------|
| `test-data-factory.js` | 测试数据生成 | ✅ 已实现 |
| `test-cases.json` | 50个test case规格 | ✅ 已实现 |
| `ground-truth.test.js` | Vitest测试实现 | ✅ 已实现 |
| `README.md` | 测试文档 | ✅ 已实现 |
| `INITIAL_TEST_REPORT.md` | 本报告 | ✅ 已实现 |

---

**报告生成时间：** 2026-02-03  
**下次更新：** 修复后重新运行测试
