/**
 * Constraint Types Definition
 * 约束类型定义
 * 
 * Defines all possible constraint types for the scheduling system
 * 定义排课系统的所有约束类型
 */

// Hard Constraints - Must be satisfied (硬约束 - 必须满足)
export const HARD_CONSTRAINTS = {
  TIME_CONFLICT: 'hard_time_conflict',           // Time conflict (时间冲突)
  TEACHER_AVAILABILITY: 'hard_teacher_avail',    // Teacher availability (教师可用性)
  STUDENT_AVAILABILITY: 'hard_student_avail',    // Student availability (学生可用性)
  CLASSROOM_CAPACITY: 'hard_room_capacity',      // Classroom capacity (教室容量)
  SUBJECT_MATCH: 'hard_subject_match',           // Subject matching (科目匹配)
  CAMPUS_MATCH: 'hard_campus_match',             // Campus matching (校区匹配)
  COURSE_DURATION: 'hard_course_duration',       // Course duration requirements (课程时长要求)
  DEADLINE_CONSTRAINT: 'hard_deadline'           // Deadline requirements (截止日期要求)
};

// Soft Constraints - Should be satisfied (软约束 - 建议满足)
export const SOFT_CONSTRAINTS = {
  PREFERRED_TIME: 'soft_preferred_time',         // Preferred time (偏好时间)
  CONSECUTIVE_LIMIT: 'soft_consecutive',         // Consecutive class limit (连续上课限制)
  LUNCH_BREAK: 'soft_lunch_break',               // Lunch break (午休时间)
  TEACHER_PREFERENCE: 'soft_teacher_pref',       // Teacher preference (教师偏好)
  DISTRIBUTION: 'soft_distribution',             // Course distribution (课程分散度)
  EARLY_MORNING: 'soft_early_morning',           // Early morning classes (早晨课程)
  LATE_EVENING: 'soft_late_evening',             // Late evening classes (晚间课程)
  SAME_DAY_CAMPUS: 'soft_same_campus'            // Same campus on same day (同一天同一校区)
};

// Custom Constraints - Admin can add (自定义约束 - 管理员可添加)
export const CUSTOM_CONSTRAINT = 'custom';

// All constraint types combined (所有约束类型)
export const ConstraintTypes = {
  HARD: HARD_CONSTRAINTS,
  SOFT: SOFT_CONSTRAINTS,
  CUSTOM: CUSTOM_CONSTRAINT
};

// Default constraint weights (默认约束权重)
export const DEFAULT_WEIGHTS = {
  // Hard constraints (严重扣分)
  [HARD_CONSTRAINTS.TIME_CONFLICT]: 50,
  [HARD_CONSTRAINTS.TEACHER_AVAILABILITY]: 40,
  [HARD_CONSTRAINTS.STUDENT_AVAILABILITY]: 40,
  [HARD_CONSTRAINTS.CLASSROOM_CAPACITY]: 35,
  [HARD_CONSTRAINTS.SUBJECT_MATCH]: 30,
  [HARD_CONSTRAINTS.CAMPUS_MATCH]: 25,
  [HARD_CONSTRAINTS.COURSE_DURATION]: 20,
  [HARD_CONSTRAINTS.DEADLINE_CONSTRAINT]: 15,
  
  // Soft constraints (轻微扣分)
  [SOFT_CONSTRAINTS.PREFERRED_TIME]: 10,
  [SOFT_CONSTRAINTS.CONSECUTIVE_LIMIT]: 8,
  [SOFT_CONSTRAINTS.LUNCH_BREAK]: 6,
  [SOFT_CONSTRAINTS.TEACHER_PREFERENCE]: 5,
  [SOFT_CONSTRAINTS.DISTRIBUTION]: 5,
  [SOFT_CONSTRAINTS.EARLY_MORNING]: 3,
  [SOFT_CONSTRAINTS.LATE_EVENING]: 3,
  [SOFT_CONSTRAINTS.SAME_DAY_CAMPUS]: 4
};

// Constraint metadata (约束元数据)
export const CONSTRAINT_METADATA = {
  [HARD_CONSTRAINTS.TIME_CONFLICT]: {
    name: '时间冲突',
    nameEn: 'Time Conflict',
    description: '学生、教师或教室在同一时间不能有多个课程',
    descriptionEn: 'Student, teacher, or classroom cannot have multiple courses at the same time',
    category: 'hard',
    editable: false
  },
  [HARD_CONSTRAINTS.TEACHER_AVAILABILITY]: {
    name: '教师可用性',
    nameEn: 'Teacher Availability',
    description: '课程必须安排在教师可用的时间段',
    descriptionEn: 'Course must be scheduled during teacher\'s available time',
    category: 'hard',
    editable: false
  },
  [HARD_CONSTRAINTS.STUDENT_AVAILABILITY]: {
    name: '学生可用性',
    nameEn: 'Student Availability',
    description: '课程必须安排在学生可用的时间段',
    descriptionEn: 'Course must be scheduled during student\'s available time',
    category: 'hard',
    editable: false
  },
  [HARD_CONSTRAINTS.CLASSROOM_CAPACITY]: {
    name: '教室容量',
    nameEn: 'Classroom Capacity',
    description: '教室容量必须满足课程需求',
    descriptionEn: 'Classroom capacity must meet course requirements',
    category: 'hard',
    editable: false
  },
  [HARD_CONSTRAINTS.SUBJECT_MATCH]: {
    name: '科目匹配',
    nameEn: 'Subject Match',
    description: '教师必须能够教授该科目',
    descriptionEn: 'Teacher must be qualified to teach the subject',
    category: 'hard',
    editable: false
  },
  [HARD_CONSTRAINTS.CAMPUS_MATCH]: {
    name: '校区匹配',
    nameEn: 'Campus Match',
    description: '课程必须安排在学生偏好的校区',
    descriptionEn: 'Course must be scheduled at student\'s preferred campus',
    category: 'hard',
    editable: true
  },
  [SOFT_CONSTRAINTS.PREFERRED_TIME]: {
    name: '偏好时间',
    nameEn: 'Preferred Time',
    description: '优先安排在学生偏好的时间段',
    descriptionEn: 'Prefer to schedule during student\'s preferred time',
    category: 'soft',
    editable: true
  },
  [SOFT_CONSTRAINTS.CONSECUTIVE_LIMIT]: {
    name: '连续上课限制',
    nameEn: 'Consecutive Limit',
    description: '避免连续安排过多课程',
    descriptionEn: 'Avoid scheduling too many consecutive courses',
    category: 'soft',
    editable: true
  },
  [SOFT_CONSTRAINTS.LUNCH_BREAK]: {
    name: '午休时间',
    nameEn: 'Lunch Break',
    description: '避免在午休时间(12:00-13:00)安排课程',
    descriptionEn: 'Avoid scheduling during lunch break (12:00-13:00)',
    category: 'soft',
    editable: true
  },
  [SOFT_CONSTRAINTS.TEACHER_PREFERENCE]: {
    name: '教师偏好',
    nameEn: 'Teacher Preference',
    description: '优先使用学生指定的教师',
    descriptionEn: 'Prefer student\'s requested teacher',
    category: 'soft',
    editable: true
  },
  [SOFT_CONSTRAINTS.DISTRIBUTION]: {
    name: '课程分散度',
    nameEn: 'Distribution',
    description: '课程应均匀分布在一周内',
    descriptionEn: 'Courses should be evenly distributed throughout the week',
    category: 'soft',
    editable: true
  }
};

// Export all constraint types as array for iteration (导出所有约束类型数组用于遍历)
export const ALL_CONSTRAINTS = [
  ...Object.values(HARD_CONSTRAINTS),
  ...Object.values(SOFT_CONSTRAINTS)
];

export default ConstraintTypes;

