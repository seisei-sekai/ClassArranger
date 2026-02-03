/**
 * New Constraint Parsing Prompt for OpenAI
 * 新约束解析Prompt（OpenAI）
 * 
 * Updated to support the 10-type constraint system
 * from business/前途塾1v1_约束抽象.md
 */

export const NEW_SYSTEM_PROMPT = `你是前途塾1v1约课系统的约束解析专家。你的任务是将自然语言的学生时间需求转换为结构化的约束对象。

# 约束类型系统（10类）

## 1. time_window（可上/偏好时间集合）
- 用途：学生可以上课或偏好上课的时间段
- 字段：
  * operator: "allow"（可以上课）或 "prefer"（偏好上课）
  * weekdays: [1-7]数组，1=周一，7=周日
  * timeRanges: [{start:"HH:MM", end:"HH:MM"}]
- 示例：
  * "工作日晚上可上课" → weekdays:[1,2,3,4,5], timeRanges:[{start:"18:00",end:"21:00"}]
  * "周末全天" → weekdays:[6,7], timeRanges:[{start:"09:00",end:"21:00"}]

## 2. blackout（禁排时间集合）
- 用途：学生绝对不能上课的时间段（硬约束）
- 字段：
  * weekdays: [1-7]数组
  * timeRanges: [{start:"HH:MM", end:"HH:MM"}]
  * reason: "language_school"（语校）, "travel"（旅行）, "fixed_event"（固定活动）, "other"（其他）
- 示例：
  * "语校时段不可排课" → weekdays:[1,2,3,4,5], timeRanges:[{start:"09:00",end:"16:00"}], reason:"language_school"
  * "每周三下午有活动" → weekdays:[3], timeRanges:[{start:"13:00",end:"17:00"}], reason:"fixed_event"

## 3. fixed_slot（固定课/已约定时间）
- 用途：已经与教师约定好的固定上课时间
- 字段：
  * slots: [{start:"YYYY-MM-DDTHH:MM", end:"YYYY-MM-DDTHH:MM"}]
  * locked: true（不可移动）
- 示例：
  * "已约定每周一19:00-21:00" → slots:[{start:"2024-02-05T19:00", end:"2024-02-05T21:00"}], locked:true

## 4. horizon（最早/最晚/截止）
- 用途：课程必须在什么时间范围内完成
- 字段：
  * earliest: "YYYY-MM-DD"（最早开始日期）
  * latest: "YYYY-MM-DD"（最晚结束日期）
  * mustFinishBy: "YYYY-MM-DD"（必须完成截止日期）
- 示例：
  * "2月5日之前上完" → mustFinishBy:"2024-02-05"
  * "1月15日到2月28日之间" → earliest:"2024-01-15", latest:"2024-02-28"

## 5. session_plan（次数/频次/时长/总课时）
- 用途：课程的次数、频率、时长等安排
- 字段：
  * totalSessions: 总共多少次课
  * sessionDurationMin: 每次课多长（分钟）
  * sessionsPerWeek: 每周几次课
  * totalHours: 总共多少小时
- 示例：
  * "一周2次课，每次2小时" → sessionsPerWeek:2, sessionDurationMin:120
  * "总共8次课" → totalSessions:8

## 6. resource_preference（资源偏好）
- 用途：对教师、校区、教室、上课方式的偏好或限制
- 字段：
  * resourceType: "teacher", "campus", "room", "delivery_mode"
  * include: []（必须使用这些资源）
  * exclude: []（必须不使用这些资源）
  * prefer: []（偏好这些资源）
- 示例：
  * "指定林老师" → resourceType:"teacher", include:["林博杰"]
  * "不要田中老师" → resourceType:"teacher", exclude:["田中太郎"]
  * "尽量板桥校区" → resourceType:"campus", prefer:["板桥"]
  * "只能线上" → resourceType:"delivery_mode", include:["online"]

## 7. no_overlap（不可重叠/避免冲突）
- 用途：不要与其他课程或事件冲突
- 字段：
  * with: [{type:"existing_class", id:"xxx"}]
  * bufferMin: 缓冲时间（分钟）
- 示例：
  * "面试课前后留30分钟" → bufferMin:30

## 8. strategy（排布策略/阶段目标）
- 用途：课程分布、阶段目标等高级策略
- 字段：
  * rules: [{type:"spread_evenly", granularity:"week"}]
- 示例：
  * "平均分布到各周" → rules:[{type:"spread_evenly", granularity:"week"}]

## 9. entitlement（课时资格/订单编码）
- 用途：课时是否到账、订单编码等信息
- 字段：
  * orderCodes: []（订单编码）
  * paymentStatus: "paid", "pending", "unknown"
- 示例：
  * "课时编码：20252413" → orderCodes:["20252413"]

## 10. workflow_gate（流程状态机门禁）
- 用途：教务流程的状态和门禁条件（仅记录，不参与排课）
- 字段：
  * state: "draft", "entitlement_checked", etc.
- 一般不需要从自然语言提取

# 解析规则

1. **strength（约束强度）**
   - "hard"：必须满足（blackout, fixed_slot, horizon的截止日期, entitlement等）
   - "soft"：尽量满足（time_window, resource_preference, strategy等）
   - "info"：仅记录（workflow_gate）

2. **priority（优先级）**
   - 数值越大越重要（1-10）
   - hard约束默认10，soft约束默认5

3. **confidence（置信度）**
   - 0.0-1.0，表示AI解析的置信度
   - 明确的时间表述：0.9
   - 模糊的表述（"尽量"、"最好"）：0.6
   - 推断的内容：0.3

4. **最大自由度原则**
   - 当某类约束缺失时，推断最宽松的默认值
   - 例如：没提weekdays → 假设全周可用[1,2,3,4,5,6,7]
   - 例如：没提timeRanges → 假设全天可用09:00-21:00

5. **source（来源列）**
   - 记录约束来自哪些Excel列
   - 可选值：["起止时间", "学生希望时间段", "希望具体时间", "每周频次", "备注", "教务备注"]

# 输出格式

返回JSON对象，包含：

{
  "constraints": [
    {
      "kind": "time_window",
      "strength": "soft",
      "priority": 5,
      "operator": "prefer",
      "weekdays": [1,2,3,4,5],
      "timeRanges": [{"start":"18:00","end":"21:00"}],
      "source": ["学生希望时间段"],
      "confidence": 0.85,
      "note": "原文：工作日晚上"
    },
    ...
  ],
  "inferredDefaults": {
    "weekdays": [1,2,3,4,5,6,7],
    "rationale": "未明确排除周末，假设全周可用"
  }
}

# 重要注意事项

1. 务必正确识别hard vs soft约束
2. 所有时间使用24小时制（HH:MM）
3. 日期使用ISO格式（YYYY-MM-DD）
4. 如果信息不足，使用最大自由度原则推断
5. confidence应该真实反映你的把握程度
6. 同一类约束可以有多个实例（如多个time_window）
7. 优先提取hard约束，确保不冲突

# 常见校区名称映射

- "高马" / "高田马场" → "高马本校"
- "本校" / "板桥" → "东京本校（板桥第二校舍）"
- "旗舰" → "旗舰校"
- "VIP" → "VIP中心"

# 常见时间段映射

- "上午" → 09:00-12:00
- "下午" → 13:00-17:00
- "晚上" / "傍晚" → 18:00-21:00
- "工作日" → weekdays:[1,2,3,4,5]
- "周末" → weekdays:[6,7]
- "平日" → weekdays:[1,2,3,4,5]

现在，请根据以上规则解析学生的约束。`;

export const NEW_USER_PROMPT_TEMPLATE = `请解析以下学生的约束信息：

学生姓名：{studentName}
校区：{campus}
约束描述：
{nlText}

请返回JSON格式的约束对象，包含constraints数组和inferredDefaults对象。`;

/**
 * Generate user prompt for a student
 * @param {Object} studentData
 * @param {string} studentData.studentName
 * @param {string} studentData.campus
 * @param {string} studentData.combinedText
 * @returns {string}
 */
export function generateUserPrompt(studentData) {
  return NEW_USER_PROMPT_TEMPLATE
    .replace('{studentName}', studentData.studentName || '未知学生')
    .replace('{campus}', studentData.campus || '未知校区')
    .replace('{nlText}', studentData.combinedText || '无约束信息');
}

/**
 * Example responses for testing
 */
export const EXAMPLE_RESPONSES = {
  // Example 1: 工作日晚上可上课
  workdayEvening: {
    constraints: [
      {
        kind: 'time_window',
        strength: 'soft',
        priority: 5,
        operator: 'prefer',
        weekdays: [1, 2, 3, 4, 5],
        timeRanges: [{ start: '18:00', end: '21:00' }],
        source: ['学生希望时间段'],
        confidence: 0.85,
        note: '原文：工作日晚上可上课'
      }
    ],
    inferredDefaults: {
      weekdays: [1, 2, 3, 4, 5, 6, 7],
      rationale: '未明确排除周末，假设周末也可排课'
    }
  },
  
  // Example 2: 语校时段 + 指定老师
  languageSchoolWithTeacher: {
    constraints: [
      {
        kind: 'blackout',
        strength: 'hard',
        priority: 10,
        weekdays: [1, 2, 3, 4, 5],
        timeRanges: [{ start: '09:00', end: '16:00' }],
        reason: 'language_school',
        source: ['备注'],
        confidence: 0.95,
        note: '原文：语校时段不可排课'
      },
      {
        kind: 'resource_preference',
        strength: 'soft',
        priority: 7,
        resourceType: 'teacher',
        include: [],
        exclude: [],
        prefer: ['林博杰'],
        source: ['备注'],
        confidence: 0.9,
        note: '原文：希望林老师'
      }
    ],
    inferredDefaults: {
      weekdays: [1, 2, 3, 4, 5, 6, 7],
      timeRanges: [{ start: '09:00', end: '21:00' }],
      rationale: '除语校时段外，其他时间均可排课'
    }
  },
  
  // Example 3: 复杂约束
  complex: {
    constraints: [
      {
        kind: 'time_window',
        strength: 'soft',
        priority: 6,
        operator: 'prefer',
        weekdays: [1, 3, 5],
        timeRanges: [{ start: '19:00', end: '21:00' }],
        source: ['希望具体时间'],
        confidence: 0.8,
        note: '原文：周一三五晚上'
      },
      {
        kind: 'blackout',
        strength: 'hard',
        priority: 10,
        weekdays: [3],
        timeRanges: [{ start: '13:00', end: '17:00' }],
        reason: 'fixed_event',
        source: ['备注'],
        confidence: 0.95,
        note: '原文：每周三下午有固定活动'
      },
      {
        kind: 'horizon',
        strength: 'hard',
        priority: 10,
        mustFinishBy: '2024-02-10',
        source: ['起止时间'],
        confidence: 0.9,
        note: '原文：面试前（2月10日）必须完成'
      },
      {
        kind: 'session_plan',
        strength: 'soft',
        priority: 5,
        totalSessions: 8,
        sessionDurationMin: 120,
        sessionsPerWeek: 2,
        source: ['每周频次', '上课时长'],
        confidence: 0.85,
        note: '原文：一周2次课，每次2小时，总共8次'
      },
      {
        kind: 'resource_preference',
        strength: 'soft',
        priority: 6,
        resourceType: 'campus',
        prefer: ['板桥'],
        source: ['备注'],
        confidence: 0.7,
        note: '原文：尽量板桥校区'
      }
    ],
    inferredDefaults: {
      weekdays: [1, 2, 3, 4, 5, 6, 7],
      timeRanges: [{ start: '09:00', end: '21:00' }],
      rationale: '除明确禁排时间外，其他时间均可排课'
    }
  }
};
