# 统一数据层架构文档

**Created:** 2026-02-03
**Last Updated:** 2026-02-03
**Purpose:** tempFrontEndMongoDB 统一数据访问层完整指南

---

## 概述

`tempFrontEndMongoDB` 是一个前端MongoDB模拟器，提供统一的数据访问接口，解决了项目中数据结构和约束系统不一致的问题。

### 核心特性

- MongoDB风格的Repository API（与后端一致）
- 统一的V4 Schema定义
- 自动数据迁移（V3 → V4）
- 向后兼容旧格式
- localStorage持久化存储

---

## 快速开始

### 1. 基础使用

```javascript
import { StudentRepository, TeacherRepository, ClassroomRepository } from 
  '@/XdfClassArranger/Experiment3/storage';

// 创建Repository实例
const studentRepo = new StudentRepository();
const teacherRepo = new TeacherRepository();
const classroomRepo = new ClassroomRepository();

// 创建学生
const student = await studentRepo.create({
  name: '张三',
  campus: '新宿校区',
  subject: '数学',
  scheduling: {
    timeConstraints: {
      allowedDays: [1, 2, 3, 4, 5],  // 周一至周五
      allowedTimeRanges: [
        { day: 1, startSlot: 30, endSlot: 60 },  // 周一 11:00-16:00
        { day: 2, startSlot: 30, endSlot: 60 }   // 周二 11:00-16:00
      ],
      excludedTimeRanges: []
    },
    frequencyConstraints: {
      frequency: '2次/周',
      duration: 120,  // 分钟
      isRecurringFixed: true,
      schedulingMode: 'fixed'
    }
  }
});

// 查询学生
const allStudents = await studentRepo.findAll();
const studentById = await studentRepo.findById(student._id);
const mathStudents = await studentRepo.findBySubject('数学');

// 更新学生
await studentRepo.updateById(student._id, {
  campus: '涩谷校区'
});

// 删除学生
await studentRepo.deleteById(student._id);
```

### 2. 使用Custom Hook

```javascript
import { useStudentRepository } from '@/XdfClassArranger/Experiment3/hooks/useRepositories';

function MyComponent() {
  const { 
    students, 
    loading, 
    createStudent, 
    updateStudent, 
    deleteStudent,
    reload
  } = useStudentRepository();
  
  const handleAdd = async () => {
    await createStudent({
      name: '新学生',
      campus: '新宿校区',
      subject: '英语',
      // ... 其他字段
    });
  };
  
  if (loading) return <div>Loading...</div>;
  
  return (
    <div>
      <button onClick={handleAdd}>添加学生</button>
      {students.map(s => <div key={s._id}>{s.name}</div>)}
    </div>
  );
}
```

---

## V4 Schema 详解

### Student Schema (V4)

```javascript
{
  // === 元数据 ===
  _id: 'students_1738580123456_abc123',
  _version: 4,
  _createdAt: Date,
  _updatedAt: Date,
  
  // === 基本信息 ===
  name: '张三',
  campus: '新宿校区',
  manager: '李老师',
  batch: '2026春季',
  subject: '数学',
  level: 'N1',
  
  // === 课时信息 ===
  courseHours: {
    total: 20,
    used: 5,
    remaining: 15,
    weekly: 4,
    timesPerWeek: 2,
    hoursPerClass: 2
  },
  
  // === 统一约束系统 ===
  scheduling: {
    // 时间约束
    timeConstraints: {
      allowedDays: [1, 2, 3, 4, 5],  // 周一至周五
      allowedTimeRanges: [
        { day: 1, startSlot: 30, endSlot: 60 },
        { day: 2, startSlot: 30, endSlot: 60 }
      ],
      excludedTimeRanges: [
        { day: 3, startSlot: 42, endSlot: 48 }
      ]
    },
    
    // 频率约束
    frequencyConstraints: {
      frequency: '2次/周',
      duration: 120,  // 分钟
      isRecurringFixed: true,
      schedulingMode: 'fixed'  // 'fixed' | 'flexible'
    },
    
    // 教师约束
    teacherConstraints: {
      preferredTeachers: ['teacher_123'],
      excludedTeachers: []
    },
    
    // 模式约束
    modeConstraints: {
      mode: 'offline',  // 'online' | 'offline'
      preferredClassrooms: []
    }
  },
  
  // === 原始数据（审计用）===
  _raw: {
    excelData: '新宿校区\t李老师\t张三...',
    aiParsingResult: { /* AI解析结果 */ },
    originalConstraints: [ /* 原始约束数组 */ ]
  },
  
  // === UI 状态 ===
  _ui: {
    selected: false,
    showAvailability: true,
    color: '#FF6B6B'
  }
}
```

### Teacher Schema (V4)

```javascript
{
  _id: 'teachers_1738580123456_xyz789',
  _version: 4,
  _createdAt: Date,
  _updatedAt: Date,
  
  name: '王老师',
  level: 'S级',
  subject: '数学',
  major: '数学教育',
  
  teaching: {
    subjects: ['数学', '物理'],
    campuses: ['新宿校区', '涩谷校区'],
    modes: ['online', 'offline'],
    hourlyRate: 500,
    maxHoursPerWeek: 40
  },
  
  availability: {
    timeSlots: [
      { day: 1, startSlot: 24, endSlot: 72 },
      { day: 2, startSlot: 24, endSlot: 72 }
    ]
  },
  
  _raw: {
    excelData: 'S级\t王老师\t数学...',
    availabilityText: '周一周二10:00-18:00'
  },
  
  _ui: {
    showAvailability: false,
    color: '#3498db'
  }
}
```

### Classroom Schema (V4)

```javascript
{
  _id: 'classrooms_1738580123456_def456',
  _version: 4,
  _createdAt: Date,
  _updatedAt: Date,
  
  name: '1v1教室A',
  campus: '新宿校区',
  area: 'A区',
  type: '1v1教室',
  capacity: 2,
  priority: 5,
  
  availability: {
    timeSlots: [
      { day: 1, startSlot: 0, endSlot: 150 },
      { day: 2, startSlot: 0, endSlot: 150 }
    ]
  },
  
  _raw: {
    excelData: '新宿校区\tA区\t1v1教室A...'
  }
}
```

---

## Repository API 参考

### 通用方法（所有Repository）

```javascript
// CREATE
await repo.create(data)              // 创建单个文档
await repo.createMany([data1, data2]) // 批量创建

// READ
await repo.findById(id)               // 根据ID查找
await repo.findOne(query)             // 查找单个
await repo.findMany(query, options)   // 查找多个
await repo.findAll()                  // 查找所有
await repo.count(query)               // 计数

// UPDATE
await repo.updateById(id, updateData) // 根据ID更新
await repo.updateOne(query, data)     // 更新单个
await repo.updateMany(query, data)    // 批量更新

// DELETE
await repo.deleteById(id)             // 根据ID删除
await repo.deleteOne(query)           // 删除单个
await repo.deleteMany(query)          // 批量删除

// UTILITY
await repo.exists(query)              // 检查是否存在
await repo.clear()                    // 清空集合
```

### StudentRepository 专用方法

```javascript
await studentRepo.findByCampus('新宿校区')
await studentRepo.findBySubject('数学')
await studentRepo.findByManager('李老师')
await studentRepo.findByBatch('2026春季')
await studentRepo.findSelected()
await studentRepo.findWithRemainingHours()
await studentRepo.updateConstraints(id, constraints)
await studentRepo.updateSchedulingMode(id, 'flexible')
await studentRepo.updateUIState(id, { selected: true })
```

### TeacherRepository 专用方法

```javascript
await teacherRepo.findBySubject('数学')
await teacherRepo.findByCampus('新宿校区')
await teacherRepo.findBySubjectAndCampus('数学', '新宿校区')
await teacherRepo.findOnlineTeachers()
await teacherRepo.findOfflineTeachers()
await teacherRepo.updateAvailability(id, timeSlots)
await teacherRepo.updateTeachingAbility(id, { subjects: [...] })
```

### ClassroomRepository 专用方法

```javascript
await classroomRepo.findByCampus('新宿校区')
await classroomRepo.findByType('1v1教室')
await classroomRepo.findByArea('A区')
await classroomRepo.findByMinCapacity(2)
await classroomRepo.findByCampusAndCapacity('新宿校区', 2)
await classroomRepo.updateAvailability(id, timeSlots)
await classroomRepo.updateCapacity(id, 5)
await classroomRepo.findAllSortedByPriority()
```

---

## 查询语法

### 简单查询

```javascript
// 精确匹配
await repo.findOne({ name: '张三' })
await repo.findMany({ campus: '新宿校区' })

// 多条件
await repo.findMany({ 
  campus: '新宿校区',
  subject: '数学'
})
```

### 嵌套字段查询

```javascript
// 使用点号访问嵌套字段
await studentRepo.findMany({ 
  'scheduling.modeConstraints.mode': 'online'
})

await studentRepo.findMany({
  'scheduling.frequencyConstraints.schedulingMode': 'flexible'
})
```

### 分页和排序

```javascript
// 分页
await repo.findMany(
  { campus: '新宿校区' },
  { skip: 0, limit: 10 }
)

// 排序
await repo.findMany(
  {},
  { sort: { name: 1 } }  // 1=升序, -1=降序
)

// 分页+排序
await repo.findMany(
  { subject: '数学' },
  { skip: 10, limit: 10, sort: { _createdAt: -1 } }
)
```

---

## 数据迁移

### 自动迁移

系统会在首次使用时自动检测并迁移旧数据：

```javascript
import { initializeStorage } from '@/XdfClassArranger/Experiment3/storage';

// 自动迁移（推荐）
await initializeStorage({ autoMigrate: true });
```

### 手动迁移

```javascript
import { migrateToV4, hasMigrated, restoreBackup } from 
  '@/XdfClassArranger/Experiment3/storage';

// 检查是否已迁移
if (!hasMigrated()) {
  // 执行迁移
  const result = await migrateToV4({ 
    force: false,  // 强制迁移
    backup: true   // 备份旧数据
  });
  
  console.log('迁移结果:', result);
}

// 如果迁移出问题，恢复备份
if (somethingWrong) {
  restoreBackup();
}
```

### 迁移过程

```
旧数据 (xdf_students, xdf_teachers, xdf_classrooms)
    ↓
读取并转换
    ↓
合并约束字段（parsedData + constraints → scheduling）
    ↓
V4 Schema
    ↓
保存到 tempMongoDB_students, tempMongoDB_teachers, tempMongoDB_classrooms
```

---

## 向后兼容

### 双格式支持

算法和组件同时支持V4和旧格式：

```javascript
// 算法适配器自动检测格式
extractConstraints(student) {
  // 优先级: V4 Schema > constraints > parsedData
  
  // V4 Schema
  if (student.scheduling?.timeConstraints) {
    return extractFromScheduling(student.scheduling);
  }
  
  // 旧格式
  if (student.constraints) {
    return extractFromConstraints(student.constraints);
  }
  
  if (student.parsedData) {
    return extractFromParsedData(student.parsedData);
  }
}
```

### 智能推荐双格式输出

```javascript
// SmartRecommendations 同时生成两种格式
const recommendation = {
  data: isV4 ? {
    // V4格式
    scheduling: {
      timeConstraints: { ... },
      frequencyConstraints: { ... }
    }
  } : {
    // 旧格式
    parsedData: { ... },
    constraints: { ... }
  }
};
```

### 适配器层

使用 `LegacyStorageAdapter` 进行格式转换：

```javascript
import { LegacyStorageAdapter } from '@/XdfClassArranger/Experiment3/storage';

// V4 → 旧格式
const legacyStudent = LegacyStorageAdapter.convertStudentFromV4(v4Student);

// 旧格式 → V4
const v4Student = LegacyStorageAdapter.convertStudentToV4(legacyStudent);

// 双向同步
await LegacyStorageAdapter.syncFromLegacyStorage(repositories);
await LegacyStorageAdapter.syncToLegacyStorage(repositories);
```

---

## 时间槽系统

### 时间槽定义

- **槽索引范围**: 0-149（150个10分钟槽）
- **时间范围**: 6:00-25:00（隔天1:00）
- **计算公式**: `slot = (hour - 6) * 6 + floor(minute / 10)`

### 时间转换示例

```javascript
// 时间 → 槽
9:00  → slot 18   // (9-6)*6 + 0 = 18
13:30 → slot 51   // (13-6)*6 + 3 = 51
18:00 → slot 72   // (18-6)*6 + 0 = 72

// 槽 → 时间
slot 18 → 9:00
slot 51 → 13:30
slot 72 → 18:00
```

### allowedTimeRanges 示例

```javascript
scheduling: {
  timeConstraints: {
    allowedDays: [1, 2, 3],  // 周一、周二、周三
    allowedTimeRanges: [
      { day: 1, startSlot: 18, endSlot: 72 },  // 周一 9:00-18:00
      { day: 2, startSlot: 30, endSlot: 60 },  // 周二 11:00-16:00
      { day: 3, startSlot: 24, endSlot: 54 }   // 周三 10:00-15:00
    ]
  }
}
```

---

## 排课模式

### Fixed Mode（固定时间）

```javascript
scheduling: {
  frequencyConstraints: {
    frequency: '2次/周',
    duration: 120,
    isRecurringFixed: true,
    schedulingMode: 'fixed'
  }
}
```

**特点**：每周同一时间上课（如周一10:00、周三10:00）

### Flexible Mode（灵活时间）

```javascript
scheduling: {
  frequencyConstraints: {
    frequency: '2次/周',
    duration: 120,
    isRecurringFixed: false,
    schedulingMode: 'flexible'
  }
}
```

**特点**：每次课可以不同时间（如本周一10:00、本周三14:00，下周可能变化）

---

## 高级用法

### 1. 批量操作

```javascript
// 批量创建学生
const studentsData = [
  { name: '学生1', campus: '新宿校区', ... },
  { name: '学生2', campus: '涩谷校区', ... },
  { name: '学生3', campus: '新宿校区', ... }
];

const students = await studentRepo.createMany(studentsData);
console.log(`创建了 ${students.length} 个学生`);

// 批量更新
await studentRepo.updateMany(
  { campus: '新宿校区' },
  { 'scheduling.modeConstraints.mode': 'online' }
);

// 批量删除
await studentRepo.deleteMany({ batch: '2025秋季' });
```

### 2. 复杂查询

```javascript
// 查找满足多个条件的学生
const students = await studentRepo.findAll();
const filtered = students.filter(s => 
  s.campus === '新宿校区' &&
  s.scheduling.timeConstraints.allowedDays.length >= 5 &&
  s.courseHours.remaining > 0
);

// 按科目和校区查找教师
const teachers = await teacherRepo.findBySubjectAndCampus('数学', '新宿校区');

// 查找支持线上的高容量教室
const classrooms = await classroomRepo.findAll();
const suitable = classrooms.filter(c =>
  c.capacity >= 5 &&
  c.campus === '新宿校区'
);
```

### 3. 约束更新

```javascript
// 更新学生时间约束
await studentRepo.updateConstraints(studentId, {
  allowedDays: [0, 1, 2, 3, 4, 5, 6],  // 全周
  allowedTimeRanges: [
    { day: 1, startSlot: 12, endSlot: 102 }  // 周一全天
  ]
});

// 切换为灵活排课模式
await studentRepo.updateSchedulingMode(studentId, 'flexible');

// 更新UI状态
await studentRepo.updateUIState(studentId, { 
  selected: true,
  showAvailability: true
});
```

---

## 与排课算法集成

### 提取约束用于排课

```javascript
import { extractConstraintsForScheduling } from 
  '@/XdfClassArranger/Experiment3/storage/schemas/StudentSchema';

const student = await studentRepo.findById(studentId);
const constraints = extractConstraintsForScheduling(student);

// 返回格式（供算法使用）：
{
  allowedDays: Set([1, 2, 3, 4, 5]),
  allowedTimeRanges: [
    { day: 1, startSlot: 30, endSlot: 60 }
  ],
  excludedTimeRanges: [],
  duration: 12,  // 10分钟槽数
  frequency: '2次/周',
  isRecurringFixed: true,
  schedulingMode: 'fixed'
}
```

### 排课算法自动适配

```javascript
// algorithmAdapter.js 自动检测并使用V4格式
extractConstraints(student, availability) {
  // V4 Schema (最高优先级)
  if (student.scheduling?.timeConstraints) {
    return {
      allowedDays: new Set(student.scheduling.timeConstraints.allowedDays),
      allowedTimeRanges: student.scheduling.timeConstraints.allowedTimeRanges,
      // ...
    };
  }
  
  // 旧格式回退逻辑
  // ...
}
```

---

## 调试和监控

### 启用详细日志

所有Repository操作都会输出console.log：

```javascript
[StudentRepository] Created: students_1738580123456_abc123
[TempMongoDB] Saved students: 5 documents
[AlgorithmAdapter] ✅ 使用 V4 Schema (student.scheduling)
[findCommonTimeSlots] ✅ 使用 V4 Schema
```

### 数据检查

```javascript
import { getTempFrontEndMongoDB } from '@/XdfClassArranger/Experiment3/storage';

const db = getTempFrontEndMongoDB();

// 导出所有数据
const allData = db.exportAll();
console.log('所有数据:', allData);

// 检查集合
const students = await db.findAll('students');
console.log('学生数量:', students.length);
console.log('第一个学生:', students[0]);
```

### 性能监控

```javascript
console.time('查询学生');
const students = await studentRepo.findByCampus('新宿校区');
console.timeEnd('查询学生');  // 查询学生: 2.5ms
```

---

## 最佳实践

### 1. 使用Hook管理状态

```javascript
// ✅ 推荐
const { students, createStudent, updateStudent } = useStudentRepository();

// ❌ 不推荐
const repo = new StudentRepository();
const [students, setStudents] = useState([]);
// 需要手动管理状态同步
```

### 2. 总是使用V4 Schema

```javascript
// ✅ 推荐：创建时使用V4格式
await studentRepo.create({
  name: '张三',
  scheduling: {
    timeConstraints: { /* V4格式 */ },
    frequencyConstraints: { /* V4格式 */ }
  }
});

// ❌ 避免：混用旧格式
await studentRepo.create({
  name: '张三',
  constraints: { /* 旧格式 */ },
  parsedData: { /* 旧格式 */ }
});
```

### 3. 利用Schema辅助函数

```javascript
import { createDefaultStudent, validateStudent } from 
  '@/XdfClassArranger/Experiment3/storage/schemas/StudentSchema';

// 创建带默认值的学生
const student = createDefaultStudent({
  name: '张三',
  campus: '新宿校区'
  // 其他字段使用默认值
});

// 验证数据
const validation = validateStudent(student);
if (!validation.valid) {
  console.error('验证失败:', validation.errors);
}
```

### 4. 错误处理

```javascript
try {
  const student = await studentRepo.create(data);
} catch (error) {
  if (error.message.includes('already exists')) {
    console.error('学生已存在');
  } else {
    console.error('创建失败:', error);
  }
}
```

---

## 数据流图

```
用户操作（添加/编辑学生）
    ↓
Component (Experiment3.jsx)
    ↓
useStudentRepository Hook
    ↓
StudentRepository
    ↓
TempFrontEndMongoDB
    ↓
localStorage (tempMongoDB_students)
    ↓
自动同步到旧格式（可选）
    ↓
localStorage (xdf_students)
```

---

## 与智能推荐集成

### 生成推荐时

```javascript
// SmartRecommendations.jsx 自动检测格式
const isV4 = student.scheduling && student.scheduling.timeConstraints;

// 生成双格式推荐
const recommendation = {
  data: createDualFormatData(student, {
    // V4格式数据
    timeConstraints: { ... }
  }, {
    // 旧格式数据（向后兼容）
    parsedData: { ... },
    constraints: { ... }
  })
};
```

### 应用推荐时

```javascript
// ScheduleAdjustmentModal.jsx 双格式处理
handleManualModify(modifyData) {
  // 检测并处理 scheduling 字段（V4）
  if (data.scheduling) {
    target.scheduling = deepMerge(target.scheduling, data.scheduling);
    
    // 同步到旧格式
    target.parsedData = convertToLegacy(data.scheduling);
    target.constraints = convertToLegacy(data.scheduling);
  }
  
  // 处理旧格式
  if (data.parsedData || data.constraints) {
    // ...旧逻辑
    
    // 同步到V4
    if (target.scheduling) {
      target.scheduling.timeConstraints = convertToV4(data);
    }
  }
}
```

---

## 测试

### 运行测试

```javascript
// 在浏览器控制台中
import { runAllTests } from 
  '@/XdfClassArranger/Experiment3/storage/test/testRepository';

await runAllTests();
```

### 测试输出

```
===== 测试 StudentRepository =====
✓ 创建学生成功: students_1738580123456_abc123
✓ 查找学生成功: 测试学生1
✓ 更新学生成功: 涩谷校区
✓ 按校区查询成功: 1
✓ 删除学生成功
✅ StudentRepository 所有测试通过

===== 测试 TeacherRepository =====
...
✅ 全部测试通过
```

---

## 常见问题

### Q1: 如何查看存储的数据？

```javascript
// 方法1: Repository
const students = await studentRepo.findAll();
console.log(students);

// 方法2: 直接访问localStorage
const raw = localStorage.getItem('tempMongoDB_students');
console.log(JSON.parse(raw));

// 方法3: 数据库导出
import { getTempFrontEndMongoDB } from '@/XdfClassArranger/Experiment3/storage';
const db = getTempFrontEndMongoDB();
console.log(db.exportAll());
```

### Q2: 如何清空所有数据？

```javascript
// 清空单个集合
await studentRepo.clear();

// 清空所有
const db = getTempFrontEndMongoDB();
await db.clearCollection('students');
await db.clearCollection('teachers');
await db.clearCollection('classrooms');
await db.clearCollection('courses');
```

### Q3: 数据迁移失败怎么办？

```javascript
// 恢复备份
import { restoreBackup } from '@/XdfClassArranger/Experiment3/storage';
restoreBackup();

// 强制重新迁移
import { migrateToV4 } from '@/XdfClassArranger/Experiment3/storage';
await migrateToV4({ force: true, backup: true });
```

### Q4: 如何在排课调整中使用？

智能推荐和排课调整已自动集成V4支持：

```javascript
// SmartRecommendations 自动生成双格式
// ScheduleAdjustmentModal 自动识别并同步双格式
// 无需手动处理
```

---

## 文件结构

```
frontend/src/XdfClassArranger/Experiment3/storage/
├── index.js                           # 统一导出
├── tempFrontEndMongoDB.js            # MongoDB模拟器核心
├── repositories/
│   ├── BaseRepository.js             # 基础Repository
│   ├── StudentRepository.js          # 学生Repository
│   ├── TeacherRepository.js          # 教师Repository
│   ├── ClassroomRepository.js        # 教室Repository
│   └── CourseRepository.js           # 课程Repository
├── schemas/
│   ├── index.js                      # Schema导出
│   ├── StudentSchema.js              # 学生Schema
│   ├── TeacherSchema.js              # 教师Schema
│   └── ClassroomSchema.js            # 教室Schema
├── adapters/
│   └── LegacyStorageAdapter.js       # 旧格式适配器
├── migrations/
│   └── migrateToV4.js                # V3→V4迁移
├── test/
│   └── testRepository.js             # 测试套件
└── hooks/
    └── useRepositories.js            # Repository Hooks
```

---

## 相关文档

- [智能推荐100%成功率修复方案](./smart-recommendations-100-percent-fix.md)
- [排课系统核心功能技术文档](./排课系统核心功能技术文档.md)
- [排课调整系统实施总结](./schedule-adjustment-implementation.md)

---

## 总结

`tempFrontEndMongoDB` 提供了：

✅ **统一的数据结构** - V4 Schema消除了数据不一致  
✅ **MongoDB风格API** - 与后端接口保持一致  
✅ **自动迁移** - 无缝从旧格式升级  
✅ **向后兼容** - 不破坏现有功能  
✅ **类型安全** - Schema定义和验证  
✅ **易于测试** - 完整的测试套件  
✅ **详细日志** - 便于调试和追踪  

系统现在有了清晰的数据流和统一的约束管理，智能推荐的成功率将大幅提升！
