/**
 * Test Data Generator
 * 测试数据生成器
 * 
 * Generate random but realistic test data for students, teachers, and classrooms
 */

import { createDefaultConstraint } from '../constraints/newConstraintTypes';
import { JAPANESE_COLORS, SLOTS_PER_DAY } from './constants';

// ==================== Name Pools ====================

const JAPANESE_SURNAMES = [
  '田中', '佐藤', '鈴木', '高橋', '渡辺', '伊藤', '山本', '中村', '小林', '加藤',
  '吉田', '山田', '佐々木', '山口', '松本', '井上', '木村', '林', '斎藤', '清水',
  '森', '池田', '橋本', '山崎', '柴田', '石井', '前田', '小川', '藤井', '岡田'
];

const JAPANESE_GIVEN_NAMES_MALE = [
  '太郎', '次郎', '健太', '誠', '博', '翔太', '大輔', '翔', '拓也', '健一',
  '隆', '達也', '勇', '一郎', '浩二', '修', '光', '直樹', '和也', '明'
];

const JAPANESE_GIVEN_NAMES_FEMALE = [
  '花子', '美咲', '愛', '優子', '陽子', '由美', '恵子', '真理子', '明美', '香織',
  '裕子', '智子', '京子', '千代子', '幸子', '桜', '美穂', '直美', '麻美', '雅子'
];

const TEACHER_NAMES = [
  '林博杰', '刘雨辰', '王子萱', '张明远', '李思琪', '陈浩然', '周欣怡', '吴承恩',
  '徐志摩', '孙悟空', '赵云', '马超', '黄忠', '关羽', '张飞'
];

// ==================== Subject and Campus Pools ====================

const SUBJECTS = [
  '大学面试练习',
  '志望理由书_指导（带着写）',
  '志望理由书_修改（纯修改）',
  'EJU_日语',
  'EJU_文综',
  'EJU_文数',
  'EJU_理数',
  'EJU_化学',
  'EJU_生物',
  '校内考_小论文',
  '校内考_日语',
  '托福',
  'JLPT_N1',
  '其他'
];

const CAMPUSES = [
  '旗舰校',
  '东京本校（板桥第二校舍）',
  '高马本校',
  'VIP中心'
];

const DELIVERY_MODES = ['线上', '线下'];

// Common subjects for perfect matching (保证匹配成功的常见科目)
const COMMON_SUBJECTS = [
  'EJU_日语',
  'EJU_文数',
  'EJU_文综',
  '大学面试练习',
  '志望理由书_指导（带着写）'
];

// ==================== Helper Functions ====================

function randomChoice(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomSubset(array, minCount, maxCount) {
  const count = randomInt(minCount, Math.min(maxCount, array.length));
  const shuffled = [...array].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count).sort((a, b) => a - b);
}

function generateRandomName(gender = null) {
  const surname = randomChoice(JAPANESE_SURNAMES);
  const givenNamePool = gender === 'female' 
    ? JAPANESE_GIVEN_NAMES_FEMALE 
    : gender === 'male'
    ? JAPANESE_GIVEN_NAMES_MALE
    : [...JAPANESE_GIVEN_NAMES_MALE, ...JAPANESE_GIVEN_NAMES_FEMALE];
  const givenName = randomChoice(givenNamePool);
  return `${surname}${givenName}`;
}

// ==================== Constraint Generation ====================

/**
 * Generate random constraints for a student
 * 为学生生成随机约束
 */
function generateRandomConstraints() {
  const constraints = [];

  // 70% chance: time_window
  if (Math.random() < 0.7) {
    const operator = randomChoice(['allow', 'prefer']);
    const weekdays = Math.random() < 0.3 
      ? [1, 2, 3, 4, 5] // Weekdays only
      : Math.random() < 0.5
      ? [6, 7] // Weekends only
      : randomSubset([1, 2, 3, 4, 5, 6, 7], 3, 7); // Mixed

    const timePresets = [
      [{ start: '09:00', end: '12:00' }], // Morning
      [{ start: '13:00', end: '17:00' }], // Afternoon
      [{ start: '18:00', end: '21:00' }], // Evening
      [{ start: '09:00', end: '21:00' }]  // All day
    ];

    constraints.push(createDefaultConstraint('time_window', {
      operator,
      weekdays,
      timeRanges: randomChoice(timePresets),
      strength: 'soft',
      priority: randomInt(4, 7),
      confidence: 0.8 + Math.random() * 0.15,
      note: '随机生成的时间窗口约束'
    }));
  }

  // 30% chance: blackout
  if (Math.random() < 0.3) {
    const reasons = ['language_school', 'travel', 'fixed_event', 'other'];
    const weekdays = randomSubset([1, 2, 3, 4, 5, 6, 7], 1, 3);

    constraints.push(createDefaultConstraint('blackout', {
      weekdays,
      timeRanges: [{ start: '09:00', end: '16:00' }],
      reason: randomChoice(reasons),
      strength: 'hard',
      priority: 10,
      confidence: 0.9 + Math.random() * 0.1,
      note: '随机生成的禁排时间约束'
    }));
  }

  // 80% chance: session_plan
  if (Math.random() < 0.8) {
    constraints.push(createDefaultConstraint('session_plan', {
      totalSessions: randomInt(4, 12),
      sessionDurationMin: randomChoice([90, 120, 150, 180]),
      sessionsPerWeek: randomChoice([1, 2, 3]),
      strength: 'soft',
      priority: randomInt(5, 7),
      confidence: 0.8,
      note: '随机生成的课程计划约束'
    }));
  }

  // 40% chance: resource_preference (campus)
  if (Math.random() < 0.4) {
    constraints.push(createDefaultConstraint('resource_preference', {
      resourceType: 'campus',
      prefer: [randomChoice(CAMPUSES)],
      strength: 'soft',
      priority: randomInt(4, 6),
      confidence: 0.7,
      note: '随机生成的校区偏好'
    }));
  }

  // 20% chance: resource_preference (teacher)
  if (Math.random() < 0.2) {
    constraints.push(createDefaultConstraint('resource_preference', {
      resourceType: 'teacher',
      prefer: [randomChoice(TEACHER_NAMES)],
      strength: 'soft',
      priority: randomInt(5, 7),
      confidence: 0.75,
      note: '随机生成的教师偏好'
    }));
  }

  return constraints;
}

// ==================== Student Generation ====================

/**
 * Generate random student data
 * 生成随机学生数据
 * 
 * @param {number} count - Number of students
 * @param {boolean} includeConstraints - Whether to generate constraints
 * @returns {Array<Object>} Array of students
 */
export function generateRandomStudents(count, includeConstraints = true) {
  const students = [];

  for (let i = 0; i < count; i++) {
    const name = generateRandomName();
    const campus = randomChoice(CAMPUSES);
    const subject = randomChoice(SUBJECTS);
    const mode = randomChoice(DELIVERY_MODES);
    const totalHours = randomInt(10, 50);
    const frequency = `${randomChoice([1, 2, 3])}次`;
    const duration = `${randomChoice([1.5, 2, 2.5, 3])}小时`;
    const level = randomChoice(['初级', '中级', '高级']);
    const manager = randomChoice(['张三', '李四', '王五', '赵六']);
    const batch = `2024${randomChoice(['01', '02', '03', '04'])}`;
    
    if (i === 0) {
      console.log(`[生成学生] 第1个学生 - 姓名: ${name}, 校区: ${campus}, 科目: ${subject}, 课时: ${totalHours}`);
    }

    // Generate mock rawData object (similar to Excel parsed data)
    // Include time preferences for availabilityCalculator
    const preferredDaysOptions = [
      '周一到周五',
      '周末',
      '周一、周三、周五',
      '周二、周四',
      '工作日优先',
      '任意时间'
    ];
    const specificTimeOptions = [
      '上午9:00-12:00',
      '下午13:00-17:00',
      '晚上18:00-21:00',
      '下午或晚上',
      '上午优先',
      ''
    ];
    
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
      录入日期: new Date().toISOString().split('T')[0],
      // Add time preference fields for availabilityCalculator
      希望时间段: randomChoice(preferredDaysOptions),
      具体时间: randomChoice(specificTimeOptions),
      截止时间: '',
      每周频次: frequency
    };

    const student = {
      id: `test-student-${Date.now()}-${Math.random().toString(36).substring(2, 9)}-${i}`,
      name,
      color: JAPANESE_COLORS[i % JAPANESE_COLORS.length],
      campus,
      subject,
      mode,
      frequency,
      duration,
      level,
      manager,
      batch,
      courseHours: {
        totalHours,
        usedHours: 0,
        remainingHours: totalHours
      },
      rawData, // Populated with mock data
      parsedData: null,
      showAvailability: true, // Enable by default for test data
      selected: true, // Auto-select test data students for scheduling
      constraints: includeConstraints ? generateRandomConstraints() : [],
      aiParsed: includeConstraints,
      constraintsModified: false,
      testGenerated: true // Mark as test-generated
    };

    students.push(student);
  }

  return students;
}

// ==================== Teacher Generation ====================

/**
 * Generate random teacher data
 * 生成随机教师数据
 */
export function generateRandomTeachers(count, includeAvailability = true) {
  const teachers = [];

  for (let i = 0; i < count; i++) {
    const name = TEACHER_NAMES[i % TEACHER_NAMES.length] + (i >= TEACHER_NAMES.length ? i : '');
    const teacherSubjects = [];
    const numSubjects = randomInt(2, 5);
    
    for (let j = 0; j < numSubjects; j++) {
      const subject = randomChoice(SUBJECTS);
      if (!teacherSubjects.includes(subject)) {
        teacherSubjects.push(subject);
      }
    }

    const availabilitySlots = includeAvailability ? generateTeacherAvailability() : null;
    // Wrap slots in object format for algorithm adapter
    const availability = availabilitySlots ? { slots: availabilitySlots } : null;
    
    const campuses = randomSubset(CAMPUSES, 1, 3);
    
    // Generate mock rawData object
    const rawData = {
      教师姓名: name,
      教学科目: teacherSubjects.join('、'),
      可用校区: campuses.join('、'),
      上课方式: randomChoice(['线上', '线下', '线上+线下']),
      时薪: randomInt(180, 280) * 10
    };

    const teacher = {
      id: `test-teacher-${Date.now()}-${Math.random().toString(36).substring(2, 9)}-${i}`,
      name,
      color: JAPANESE_COLORS[(count + i) % JAPANESE_COLORS.length],
      subjects: teacherSubjects,
      campus: campuses, // 单数字段，与算法匹配
      campuses, // 复数字段，保留兼容
      modes: randomChoice([['线上'], ['线下'], ['线上', '线下']]),
      hourlyRate: randomInt(180, 280) * 10, // 1800-2800 yen
      rating: randomInt(1, 5),
      availability,
      rawData, // Populated with mock data
      showAvailability: true, // Enable by default
      testGenerated: true
    };

    teachers.push(teacher);
  }

  return teachers;
}

function generateTeacherAvailability() {
  const slots = [];
  const days = randomSubset([1, 2, 3, 4, 5, 6, 7], 3, 7);

  days.forEach(day => {
    const timePresets = [
      { start: '09:00', end: '17:00' },
      { start: '13:00', end: '21:00' },
      { start: '18:00', end: '22:00' },
      { start: '09:00', end: '21:00' }
    ];

    const timeRange = randomChoice(timePresets);
    
    slots.push({
      dayOfWeek: day,
      startTime: timeRange.start,
      endTime: timeRange.end
    });
  });

  return slots;
}

// ==================== Classroom Generation ====================

/**
 * Generate random classroom data
 * 生成随机教室数据
 */
export function generateRandomClassrooms(count) {
  const classrooms = [];
  
  const roomTypes = ['个别指导室', 'VIP教室', '教室'];
  const roomNumbers = Array.from({ length: 20 }, (_, i) => (i + 1).toString().padStart(2, '0'));

  for (let i = 0; i < count; i++) {
    const campus = randomChoice(CAMPUSES);
    const type = randomChoice(roomTypes);
    const number = roomNumbers[i % roomNumbers.length];
    const name = `${number}`;

    const classroom = {
      id: `test-classroom-${Date.now()}-${Math.random().toString(36).substring(2, 9)}-${i}`,
      campus,
      type,
      name,
      entryName: `${campus.substring(0, 2)}${number}`,
      capacity: type === 'VIP教室' ? randomInt(4, 8) : randomInt(10, 30),
      priority: randomInt(1, 10),
      openHours: generateClassroomHours(campus),
      testGenerated: true
    };

    classrooms.push(classroom);
  }

  return classrooms;
}

function generateClassroomHours(campus) {
  // Different campuses have different hours
  if (campus === '东京本校（板桥第二校舍）') {
    return { start: '09:30', end: '21:00' };
  } else {
    return { start: '09:00', end: '21:30' };
  }
}

// ==================== Preset Configurations ====================

export const PRESETS = {
  minimal: {
    name: '最小数据集',
    description: '3个学生 + 2个教师 + 2个教室',
    students: 3,
    teachers: 2,
    classrooms: 2
  },
  perfectMatch: {
    name: '完美匹配',
    description: '10个学生 + 5个教师 + 5个教室（保证100%排课成功）',
    students: 10,
    teachers: 5,
    classrooms: 5,
    isPerfectMatch: true
  },
  realistic: {
    name: '真实规模',
    description: '20个学生 + 10个教师 + 8个教室',
    students: 20,
    teachers: 10,
    classrooms: 8
  },
  stressTest: {
    name: '压力测试',
    description: '100个学生 + 30个教师 + 20个教室',
    students: 100,
    teachers: 30,
    classrooms: 20
  }
};

/**
 * Generate complete test dataset
 * 生成完整的测试数据集
 * 
 * @param {Object} config
 * @param {number} config.students - Number of students
 * @param {number} config.teachers - Number of teachers
 * @param {number} config.classrooms - Number of classrooms
 * @param {boolean} config.includeConstraints - Include constraints for students
 * @param {boolean} config.includeAvailability - Include availability for teachers
 * @returns {Object} {students, teachers, classrooms}
 */
export function generateTestDataset(config) {
  const {
    students: studentCount = 10,
    teachers: teacherCount = 5,
    classrooms: classroomCount = 5,
    includeConstraints = true,
    includeAvailability = true
  } = config;

  console.log('[测试数据生成器] 开始生成:', {
    students: studentCount,
    teachers: teacherCount,
    classrooms: classroomCount,
    includeConstraints,
    includeAvailability
  });

  const students = generateRandomStudents(studentCount, includeConstraints);
  const teachers = generateRandomTeachers(teacherCount, includeAvailability);
  const classrooms = generateRandomClassrooms(classroomCount);

  console.log('[测试数据生成器] 生成完成:', {
    studentsGenerated: students.length,
    teachersGenerated: teachers.length,
    classroomsGenerated: classrooms.length
  });

  return {
    students,
    teachers,
    classrooms
  };
}

/**
 * Generate perfect match dataset (guaranteed 100% scheduling success)
 * 生成完美匹配数据集（保证100%排课成功）
 */
export function generatePerfectMatchDataset(studentCount = 10, teacherCount = 5, classroomCount = 5) {
  console.log('[完美匹配数据] 开始生成');
  console.log('[完美匹配数据] 使用科目:', COMMON_SUBJECTS);
  
  const students = [];
  const teachers = [];
  const classrooms = [];
  
  // 1. Generate students with compatible constraints
  for (let i = 0; i < studentCount; i++) {
    const name = generateRandomName();
    const subject = COMMON_SUBJECTS[i % COMMON_SUBJECTS.length]; // 循环分配常见科目
    const campus = randomChoice(CAMPUSES);
    const totalHours = randomInt(12, 20); // 适中的课时数
    
    // 完美匹配的时间窗口：工作日全天
    const perfectTimeWindow = {
      kind: 'time_window',
      strength: 'soft',
      operator: 'allow',
      weekdays: [1, 2, 3, 4, 5], // 周一到周五
      timeRanges: [{ start: '09:00', end: '21:00' }], // 全天可用
      priority: 5,
      confidence: 1.0,
      note: '完美匹配-工作日全天可用'
    };
    
    // 会话计划：每周1-2次，每次1.5-2小时
    const sessionsPerWeek = randomChoice([1, 2]);
    const sessionDurationHours = randomChoice([1.5, 2]);
    const sessionPlan = {
      kind: 'session_plan',
      strength: 'soft',
      sessionsPerWeek: sessionsPerWeek,
      sessionDurationMin: sessionDurationHours * 60, // Convert hours to minutes
      priority: 5,
      confidence: 1.0,
      note: '完美匹配-合理的上课频次'
    };
    
    const rawData = {
      学生姓名: name,
      校区: campus,
      学管姓名: randomChoice(['张三', '李四', '王五']),
      学生批次: '202401',
      内容: subject,
      频次: `${sessionsPerWeek}次`,
      时长: `${sessionDurationHours}小时`,
      形式: randomChoice(DELIVERY_MODES),
      级别: randomChoice(['初级', '中级', '高级']),
      录入日期: new Date().toISOString().split('T')[0],
      希望时间段: '周一到周五',
      具体时间: '白天或晚上都可以',
      截止时间: '',
      每周频次: `${sessionsPerWeek}次`
    };
    
    // Generate parsedData compatible with availabilityCalculator
    // 工作日 9:00-21:00 = slots 0-144 (relative to STANDARD_START=9:00)
    // SLOTS_PER_HOUR = 12 (5-minute granularity)
    // 09:00 = slot 0, 21:00 = slot 144 (12 hours * 12 slots/hour)
    const parsedData = {
      success: true,
      allowedDays: [1, 2, 3, 4, 5], // Monday-Friday
      allowedTimeRanges: [
        {
          day: null, // Apply to all allowed days
          start: 0,   // 09:00 (relative to STANDARD_START)
          end: 144    // 21:00 (12 hours * 12 slots/hour)
        }
      ],
      excludedTimeRanges: [],
      strictness: 'soft',
      confidence: 1.0,
      slots: [1, 2, 3, 4, 5].map(day => ({
        dayOfWeek: day,
        startTime: '09:00',
        endTime: '21:00'
      }))
    };
    
    students.push({
      id: `perfect-student-${Date.now()}-${Math.random().toString(36).substring(2, 9)}-${i}`,
      name,
      color: JAPANESE_COLORS[i % JAPANESE_COLORS.length],
      campus,
      subject,
      mode: rawData.形式,
      frequency: rawData.频次,
      duration: rawData.时长,
      level: rawData.级别,
      manager: rawData.学管姓名,
      batch: rawData.学生批次,
      courseHours: {
        totalHours,
        usedHours: 0,
        remainingHours: totalHours
      },
      rawData,
      parsedData,
      showAvailability: true,
      selected: true,
      constraints: [perfectTimeWindow, sessionPlan],
      aiParsed: true,
      constraintsModified: false,
      testGenerated: true,
      perfectMatch: true
    });
    
    if (i === 0) {
      console.log('[完美匹配数据] 第1个学生:', {
        name,
        subject,
        courseHours: totalHours,
        constraints: 2,
        parsedData: {
          success: parsedData.success,
          allowedDays: parsedData.allowedDays,
          allowedTimeRanges: parsedData.allowedTimeRanges
        }
      });
    }
  }
  
  // 2. Generate teachers that cover all subjects
  const subjectsNeeded = [...new Set(students.map(s => s.subject))];
  console.log('[完美匹配数据] 需要的科目:', subjectsNeeded);
  
  for (let i = 0; i < teacherCount; i++) {
    const name = TEACHER_NAMES[i % TEACHER_NAMES.length] + (i >= TEACHER_NAMES.length ? i : '');
    
    // 策略：让每个教师教所有常见科目，确保100%覆盖
    // 这样任何学生都能找到合适的教师
    const teacherSubjects = [...COMMON_SUBJECTS];
    
    // 完美匹配的可用性：工作日全天（两种格式）
    // 1. 7x150矩阵格式（用于日历显示）
    const perfectAvailabilityMatrix = Array(7).fill(null).map((_, dayIdx) => {
      if (dayIdx >= 1 && dayIdx <= 5) { // 周一到周五
        return Array(SLOTS_PER_DAY).fill(true); // 全天可用
      }
      return Array(SLOTS_PER_DAY).fill(false); // 周末不可用
    });
    
    // 2. slots格式（用于算法适配器）
    const perfectAvailabilitySlots = {
      slots: [1, 2, 3, 4, 5].map(day => ({
        dayOfWeek: day,
        startTime: '09:00',
        endTime: '21:00'
      }))
    };
    
    const rawData = {
      教师姓名: name,
      教学科目: teacherSubjects.join('、'),
      可用校区: CAMPUSES.join('、'),
      上课方式: '线上+线下',
      时薪: randomInt(200, 250) * 10
    };
    
    teachers.push({
      id: `perfect-teacher-${Date.now()}-${Math.random().toString(36).substring(2, 9)}-${i}`,
      name,
      color: JAPANESE_COLORS[(studentCount + i) % JAPANESE_COLORS.length],
      subjects: teacherSubjects,
      campus: [...CAMPUSES], // 单数字段，与算法匹配
      campuses: [...CAMPUSES], // 复数字段，保留兼容
      modes: ['线上', '线下'],
      hourlyRate: rawData.时薪,
      rating: 5,
      availability: perfectAvailabilitySlots, // 使用slots格式供算法使用
      availabilityMatrix: perfectAvailabilityMatrix, // 保留矩阵格式供日历显示
      rawData,
      showAvailability: true,
      testGenerated: true,
      perfectMatch: true
    });
    
    console.log(`[完美匹配数据] 教师${i+1}: ${name}, 科目: ${teacherSubjects.join('、')}, 校区: ${CAMPUSES.join('、')}, 可用性: ${perfectAvailabilitySlots.slots.length}个时间槽`);
  }
  
  // 3. Generate classrooms
  for (let i = 0; i < classroomCount; i++) {
    classrooms.push(generateRandomClassrooms(1)[0]);
  }
  
  console.log('[完美匹配数据] 生成完成:', {
    students: students.length,
    teachers: teachers.length,
    classrooms: classrooms.length,
    subjectsCovered: subjectsNeeded.length
  });
  
  // 详细检查第一个学生的数据结构
  if (students.length > 0) {
    const firstStudent = students[0];
    console.log('[完美匹配数据] 第一个学生完整数据:', {
      name: firstStudent.name,
      subject: firstStudent.subject,
      campus: firstStudent.campus,
      hasParsedData: !!firstStudent.parsedData,
      parsedDataStructure: firstStudent.parsedData ? {
        success: firstStudent.parsedData.success,
        allowedDaysCount: firstStudent.parsedData.allowedDays?.length,
        allowedDays: firstStudent.parsedData.allowedDays,
        allowedTimeRangesCount: firstStudent.parsedData.allowedTimeRanges?.length,
        firstTimeRange: firstStudent.parsedData.allowedTimeRanges?.[0]
      } : null,
      hasConstraints: !!firstStudent.constraints,
      constraintsCount: firstStudent.constraints?.length,
      constraintsTypes: firstStudent.constraints?.map(c => c.kind)
    });
  }
  
  // 详细检查第一个教师的数据结构
  if (teachers.length > 0) {
    const firstTeacher = teachers[0];
    console.log('[完美匹配数据] 第一个教师完整数据:', {
      name: firstTeacher.name,
      subjectsCount: firstTeacher.subjects?.length,
      subjects: firstTeacher.subjects,
      campusCount: firstTeacher.campus?.length,
      campus: firstTeacher.campus,
      hasAvailability: !!firstTeacher.availability,
      availabilityStructure: firstTeacher.availability ? {
        hasSlotsArray: !!firstTeacher.availability.slots,
        slotsCount: firstTeacher.availability.slots?.length,
        firstSlot: firstTeacher.availability.slots?.[0]
      } : null
    });
  }
  
  return { students, teachers, classrooms };
}

/**
 * Generate test dataset from preset
 * 从预设生成测试数据集
 * 
 * @param {string} presetName - 'minimal', 'perfectMatch', 'realistic', or 'stressTest'
 * @param {boolean} includeConstraints
 * @param {boolean} includeAvailability
 * @returns {Object} {students, teachers, classrooms}
 */
export function generateFromPreset(presetName, includeConstraints = true, includeAvailability = true) {
  const preset = PRESETS[presetName];
  if (!preset) {
    throw new Error(`Unknown preset: ${presetName}`);
  }

  // Use special generator for perfect match
  if (preset.isPerfectMatch) {
    return generatePerfectMatchDataset(preset.students, preset.teachers, preset.classrooms);
  }

  return generateTestDataset({
    students: preset.students,
    teachers: preset.teachers,
    classrooms: preset.classrooms,
    includeConstraints,
    includeAvailability
  });
}

export default {
  generateRandomStudents,
  generateRandomTeachers,
  generateRandomClassrooms,
  generateTestDataset,
  generateFromPreset,
  PRESETS
};
