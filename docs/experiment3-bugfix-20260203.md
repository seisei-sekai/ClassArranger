# Experiment3 Bug修复记录

**修复日期**: 2026-02-03  
**版本**: v2.0.1  
**状态**: ✅ 已修复

---

## 🐛 Bug清单

### Bug #1: 日历视图切换无法选择另一个选项

**问题描述**: 
用户无法从"周视图"切换到"月视图"，按钮被disabled

**原因分析**:
周视图按钮有`disabled={scheduledCourses.length === 0}`条件，导致在没有排课结果时无法切换

**修复方案**:
移除视图切换按钮的disabled限制，允许随时切换视图

**修复文件**:
- `frontend/src/XdfClassArranger/Experiment3/Experiment3.jsx`

**代码变更**:
```jsx
// Before
<button
  className={`view-btn ${viewMode === 'custom' ? 'active' : ''}`}
  onClick={() => setViewMode('custom')}
  disabled={scheduledCourses.length === 0} // ❌ 会阻止切换
>

// After
<button
  className={`view-btn ${viewMode === 'custom' ? 'active' : ''}`}
  onClick={() => setViewMode('custom')}
  // ✅ 移除disabled，允许自由切换
>
```

---

### Bug #2: 生成的测试数据在卡片里无法显示任何信息

**问题描述**:
生成测试数据后，学生/教师卡片显示为空白或"待排课"

**原因分析**:
测试数据的`rawData`字段为空字符串`''`，导致判断`rawData ? '已导入数据' : '待排课'`失败

**修复方案**:
为测试数据生成完整的`rawData`对象，模拟Excel导入的数据结构

**修复文件**:
- `frontend/src/XdfClassArranger/Experiment3/utils/testDataGenerator.js`

**代码变更**:

```javascript
// Before
const student = {
  name,
  campus,
  subject,
  rawData: '', // ❌ 空字符串导致显示问题
  ...
};

// After
const rawData = {
  学生姓名: name,
  校区: campus,
  学管姓名: manager,
  学生批次: batch,
  内容: subject,
  频次: frequency,
  时长: duration,
  形式: mode,
  级别: level,
  录入日期: new Date().toISOString().split('T')[0]
};

const student = {
  name,
  campus,
  subject,
  rawData, // ✅ 完整的数据对象
  ...
};
```

**同时修复**:
- 教师数据的`rawData`也更新为对象
- 学生和教师的`showAvailability`默认设为`true`

---

### Bug #3: 生成的测试数据无法点击排课系统进行排课

**问题描述**:
生成测试数据后，点击"一键排课"按钮无法排课

**原因分析**:
排课算法的`adaptStudents`函数过滤条件：
```javascript
.filter(s => s.rawData && s.courseHours?.totalHours > 0)
```
测试数据的`rawData`为空字符串，被过滤掉

**修复方案**:
与Bug #2相同，为测试数据生成完整的`rawData`对象

**影响文件**:
- `frontend/src/XdfClassArranger/Experiment3/utils/testDataGenerator.js`

**验证方法**:
```
生成测试数据 → 点击一键排课 → 应该能成功排课
```

---

### Bug #4: 生成的测试数据在日历没有显示任何信息

**问题描述**:
生成测试数据后，日历上没有显示学生的可用性色块

**原因分析**:
1. 测试数据的`showAvailability`默认为`false`
2. 教师的`availability`可能为null
3. `handleGenerateTestData`没有触发可用性刷新

**修复方案**:

1. **testDataGenerator.js**:
   - 学生的`showAvailability`默认设为`true`
   - 教师的`showAvailability`默认设为`true`
   - 确保`includeAvailability=true`时生成完整的availability数据

2. **Experiment3.jsx**:
   - `handleGenerateTestData`中调用`setShowAvailability(true)`
   - 清空`availabilityEvents`数组，让useEffect重新计算

**修复文件**:
- `frontend/src/XdfClassArranger/Experiment3/utils/testDataGenerator.js`
- `frontend/src/XdfClassArranger/Experiment3/Experiment3.jsx`

**代码变更**:
```javascript
// handleGenerateTestData
const handleGenerateTestData = (testData) => {
  // ...清空现有数据...
  
  setStudents(testData.students);
  setTeachers(testData.teachers);
  setClassrooms(testData.classrooms);
  
  // ✅ 新增：启用可用性显示
  setShowAvailability(true);
  
  // useEffect会自动重新生成availabilityEvents
};
```

---

### Bug #5: UI教程弹出窗口有时会超出屏幕边界

**问题描述**:
新手引导的弹窗在某些位置会超出屏幕边界，导致内容不可见

**原因分析**:
`calculatePosition`函数只是简单计算位置，没有检查窗口边界

**修复方案**:
添加边界检测逻辑：
- 横向边界：确保 `padding ≤ left ≤ windowWidth - cardWidth - padding`
- 纵向边界：确保 `padding ≤ top ≤ windowHeight - cardHeight - padding`

**修复文件**:
- `frontend/src/XdfClassArranger/Experiment3/components/OnboardingTour.jsx`

**代码变更**:
```javascript
const calculatePosition = (rect, position) => {
  const cardWidth = 360;
  const cardHeight = 250;
  const padding = 20;
  
  let top, left;
  // ...计算初始位置...
  
  // ✅ 新增：边界检测
  const windowWidth = window.innerWidth;
  const windowHeight = window.innerHeight;
  
  // 横向边界检查
  if (left < padding) {
    left = padding;
  } else if (left + cardWidth > windowWidth - padding) {
    left = windowWidth - cardWidth - padding;
  }
  
  // 纵向边界检查
  if (top < padding) {
    top = padding;
  } else if (top + cardHeight > windowHeight - padding) {
    top = windowHeight - cardHeight - padding;
  }
  
  setPosition({ top: `${top}px`, left: `${left}px` });
};
```

---

### Bug #6: rawData.split is not a function (追加修复)

**问题描述**:
生成测试数据后立即报错：
```
Uncaught TypeError: rawData.split is not a function
at parseStudentAvailabilityFromRawData (availabilityCalculator.js:243:26)
```

**原因分析**:
Bug #2的修复引入了新问题：
- 修复Bug #2时，将测试数据的`rawData`从空字符串改为对象
- 但`availabilityCalculator.js`中的`parseStudentAvailabilityFromRawData`函数期望`rawData`是字符串
- 该函数调用`rawData.split('\t')`解析Excel数据，对象无法调用`.split()`方法

**修复方案**:

1. **availabilityCalculator.js**: 修改`parseStudentAvailabilityFromRawData`函数以支持两种格式
   ```javascript
   // Before
   const values = rawData.split('\t'); // ❌ 仅支持字符串
   
   // After
   if (typeof rawData === 'string') {
     // Excel粘贴格式
     const values = rawData.split('\t');
     frequency = values[5] || '';
     duration = values[6] || '';
     // ...
   } else if (typeof rawData === 'object') {
     // 对象格式（测试数据或已解析数据）
     frequency = rawData.频次 || rawData.frequency || '';
     duration = rawData.时长 || rawData.duration || '';
     // ...
   }
   ```

2. **testDataGenerator.js**: 增强测试数据的`rawData`对象，添加时间偏好字段
   ```javascript
   const rawData = {
     学生姓名: name,
     校区: campus,
     // ... 基本信息 ...
     // ✅ 新增：时间偏好字段（供availabilityCalculator使用）
     希望时间段: '周一到周五',
     具体时间: '下午13:00-17:00',
     截止时间: '',
     每周频次: frequency
   };
   ```

**影响文件**:
- `frontend/src/XdfClassArranger/Experiment3/utils/availabilityCalculator.js`
- `frontend/src/XdfClassArranger/Experiment3/utils/testDataGenerator.js`

**技术细节**:

`availabilityCalculator.js` 使用三级优先级解析学生可用性：
1. **Priority 1**: NLP `parsedData`（最高优先级）
2. **Priority 2**: `constraint` data
3. **Priority 3**: 从`rawData`解析（回退方案）← 这里出错

测试数据生成了新约束系统（`constraints`数组），但`availabilityCalculator`不识别新约束格式，所以回退到Priority 3，导致错误。

**验证方法**:
```
生成测试数据 → 检查控制台无错误 → 日历应显示彩色可用性色块
```

---

## ✅ 修复验证

### 测试步骤

1. **测试日历视图切换**:
   ```
   进入Experiment3 → 点击"周视图" → 点击"月视图" → 应该能切换
   ```

2. **测试数据显示**:
   ```
   点击"测试数据" → 选择"真实规模" → 生成
   → 学生卡片应显示"已导入数据 • AI已解析 • 3个约束"
   → 教师卡片应显示"已导入数据"
   ```

3. **测试数据排课**:
   ```
   生成测试数据后 → 点击"一键排课"
   → 应该成功排课，显示进度条
   → 排课完成后显示结果统计
   ```

4. **测试日历显示**:
   ```
   生成测试数据后 → 日历应显示彩色可用性色块
   → 排课后应显示排课结果
   ```

5. **测试教程边界**:
   ```
   点击"?" → 开始新手引导
   → 所有步骤的弹窗应该完全在屏幕内
   → 尝试缩小浏览器窗口，弹窗应自动调整
   ```

---

## 📊 影响评估

| Bug | 严重性 | 影响范围 | 修复难度 | 状态 |
|-----|--------|----------|----------|------|
| #1 视图切换 | 中 | 所有用户 | 低 | ✅ |
| #2 数据显示 | 高 | 测试数据用户 | 中 | ✅ |
| #3 无法排课 | 高 | 测试数据用户 | 中 | ✅ |
| #4 日历显示 | 高 | 测试数据用户 | 中 | ✅ |
| #5 边界检测 | 低 | 首次用户 | 低 | ✅ |
| #6 rawData类型错误 | 高 | 测试数据用户 | 中 | ✅ |

---

## 🔧 技术细节

### Bug #2-4 根因

测试数据生成器的设计缺陷：
- 没有模拟Excel导入的数据结构
- `rawData`字段为空导致多处判断失败
- `showAvailability`默认关闭导致日历无内容

### 解决方案核心

**统一数据结构**: 测试数据必须与Excel导入数据保持相同结构

**关键字段**:
- `rawData`: 对象（非空字符串）
- `showAvailability`: true
- `availability`: 完整的时间槽数组
- `courseHours`: 包含totalHours等

---

## 🎯 防护措施

为防止类似问题，建议：

1. **数据结构文档化**: 明确定义Student/Teacher/Classroom的schema
2. **类型检查**: 使用TypeScript或JSDoc
3. **测试覆盖**: 为测试数据生成器添加集成测试
4. **边界检测工具**: 创建通用的边界检测hook

---

## 📝 后续改进建议

1. **数据验证**: 在`handleGenerateTestData`中验证生成的数据完整性
2. **UI反馈**: 生成测试数据后自动打开第一个学生的约束面板，引导用户查看
3. **教程优化**: 添加响应式设计，自动适应小屏幕
4. **错误提示**: 如果测试数据无法排课，显示具体原因

---

## 🆕 Bug #6: 点击教程按钮无法打开 (2026-02-03)

**问题描述**:
点击右上角的"?"帮助按钮后，新手引导无法打开

**原因分析**:
`OnboardingTour` 组件内部使用 `isVisible` 状态和 localStorage 检查来决定是否显示。第一次完成教程后，localStorage 会记录 `xdf_has_seen_onboarding`，导致再次点击帮助按钮时，`isVisible` 保持为 false

**修复方案**:
1. 为 `OnboardingTour` 组件添加 `forceShow` prop
2. 当从帮助按钮触发时，传入 `forceShow={true}`
3. useEffect 检查 `forceShow`，如果为 true 则强制显示，绕过 localStorage 检查

**修复文件**:
- `frontend/src/XdfClassArranger/Experiment3/components/OnboardingTour.jsx`
- `frontend/src/XdfClassArranger/Experiment3/Experiment3.jsx`

**代码变更**:

```jsx
// OnboardingTour.jsx - Before
const OnboardingTour = ({ onComplete }) => {
  const [isVisible, setIsVisible] = useState(false);
  
  useEffect(() => {
    const hasSeenTour = localStorage.getItem('xdf_has_seen_onboarding');
    if (!hasSeenTour) {
      setIsVisible(true);
    }
  }, []);

// OnboardingTour.jsx - After
const OnboardingTour = ({ onComplete, forceShow = false }) => {
  const [isVisible, setIsVisible] = useState(false);
  
  useEffect(() => {
    if (forceShow) {
      setIsVisible(true); // ✅ 强制显示
    } else {
      const hasSeenTour = localStorage.getItem('xdf_has_seen_onboarding');
      if (!hasSeenTour) {
        setIsVisible(true);
      }
    }
  }, [forceShow]);

// Experiment3.jsx - Before
<OnboardingTour onComplete={() => setShowOnboarding(false)} />

// Experiment3.jsx - After
<OnboardingTour 
  onComplete={() => setShowOnboarding(false)} 
  forceShow={true} 
/>
```

---

## 🆕 Bug #7: 测试数据的 rawData.split 错误 (2026-02-03)

**问题描述**:
生成测试数据后，控制台报错：
```
Uncaught TypeError: rawData.split is not a function
at parseStudentAvailabilityFromRawData
```

**原因分析**:
1. Bug #2 的修复中，我们将测试数据的 `rawData` 从空字符串改为对象
2. 但 `availabilityCalculator.js` 的 `parseStudentAvailabilityFromRawData` 函数期望 `rawData` 是字符串，并调用 `.split('\t')`
3. 当 `rawData` 是对象时，`.split()` 方法不存在，导致报错

**修复方案**:

1. **availabilityCalculator.js**:
   - 修改 `parseStudentAvailabilityFromRawData` 函数，同时支持字符串和对象格式
   - 对于字符串：按 tab 分割（原有逻辑）
   - 对于对象：直接读取字段（新增逻辑）

2. **testDataGenerator.js**:
   - 为测试数据的 `rawData` 对象添加时间偏好字段
   - 包括：`希望时间段`、`具体时间`、`截止时间`、`每周频次`

**修复文件**:
- `frontend/src/XdfClassArranger/Experiment3/utils/availabilityCalculator.js`
- `frontend/src/XdfClassArranger/Experiment3/utils/testDataGenerator.js`

**代码变更**:

```javascript
// availabilityCalculator.js
export const parseStudentAvailabilityFromRawData = (rawData) => {
  if (!rawData) return null;

  let frequency, duration, deadline, preferredDays, specificTime, weeklyFrequency;

  // ✅ 兼容字符串和对象两种格式
  if (typeof rawData === 'string') {
    const values = rawData.split('\t');
    frequency = values[5] || '';
    duration = values[6] || '';
    deadline = values[13] || '';
    preferredDays = values[14] || '';
    specificTime = values[15] || '';
    weeklyFrequency = values[16] || '';
  } else if (typeof rawData === 'object') {
    // ✅ 对象格式（测试数据）
    frequency = rawData.频次 || rawData.frequency || '';
    duration = rawData.时长 || rawData.duration || '';
    deadline = rawData.截止时间 || rawData.deadline || '';
    preferredDays = rawData.希望时间段 || rawData.preferredDays || '';
    specificTime = rawData.具体时间 || rawData.specificTime || '';
    weeklyFrequency = rawData.每周频次 || rawData.weeklyFrequency || '';
  } else {
    return null;
  }
  
  // ... 其余解析逻辑不变
};

// testDataGenerator.js - 增强 rawData
const preferredDaysOptions = [
  '周一到周五', '周末', '周一、周三、周五', 
  '周二、周四', '工作日优先', '任意时间'
];
const specificTimeOptions = [
  '上午9:00-12:00', '下午13:00-17:00', '晚上18:00-21:00',
  '下午或晚上', '上午优先', ''
];

const rawData = {
  // ... 原有字段
  希望时间段: randomChoice(preferredDaysOptions),
  具体时间: randomChoice(specificTimeOptions),
  截止时间: '',
  每周频次: frequency
};
```

---

**修复状态**: ✅ 全部7个bug已修复  
**测试状态**: 待用户验证  
**回归风险**: 低（修改了数据兼容性逻辑和组件显示控制）
