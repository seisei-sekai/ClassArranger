/**
 * Triple Matching Engine
 * 三方匹配引擎
 * 
 * Intelligent scheduling system matching Students ↔ Teachers ↔ Classrooms
 * 学生 ↔ 教师 ↔ 教室智能调度系统
 * 
 * Based on Constraint Satisfaction Problem (CSP) and Genetic Algorithm (GA)
 * 基于约束满足问题(CSP)和遗传算法(GA)的混合方法
 */

import {
  SLOTS_PER_DAY,
  timeToSlotIndex,
  slotIndexToTime
} from '../utils/constants';
import { parseStudentAvailability } from '../utils/availabilityCalculator';

class TripleMatchingEngine {
  constructor(students, teachers, classrooms, constraintEngine) {
    this.students = students || [];
    this.teachers = teachers || [];
    this.classrooms = classrooms || [];
    this.constraintEngine = constraintEngine;
    
    // Caches (缓存)
    this.viableCombinations = [];
    this.occupiedSlots = {
      teachers: new Map(),
      classrooms: new Map(),
      students: new Map()
    };
  }
  
  /**
   * Main matching process
   * 主匹配流程
   * 
   * 1. Pre-filter: Quickly exclude impossible combinations based on hard constraints
   * 2. Heuristic search: Priority processing of students with most constraints
   * 3. Genetic algorithm: Global optimization of schedule
   * 
   * 1. 预过滤：基于硬约束快速排除不可能的组合
   * 2. 启发式搜索：优先处理约束最多的学生
   * 3. 遗传算法优化：全局优化课表
   * 
   * @returns {Promise<Object>} { schedule, statistics }
   */
  async match() {
    console.log('🔄 Starting triple matching engine...');
    
    // Step 1: Pre-filter viable combinations (步骤1：预过滤可行组合)
    console.log('📋 Step 1: Pre-filtering combinations...');
    this.viableCombinations = this.preFilterCombinations();
    console.log(`✅ Found ${this.viableCombinations.length} viable combinations`);
    
    if (this.viableCombinations.length === 0) {
      return {
        schedule: [],
        statistics: {
          success: false,
          message: 'No viable combinations found',
          totalStudents: this.students.length,
          scheduledStudents: 0
        }
      };
    }
    
    // Step 2: Heuristic initial solution (步骤2：启发式初始解)
    console.log('🎯 Step 2: Generating heuristic schedule...');
    const initialSchedule = this.heuristicScheduling(this.viableCombinations);
    console.log(`✅ Initial schedule created with ${initialSchedule.length} courses`);
    
    // Return initial solution (返回初始解)
    // Note: Genetic algorithm optimization will be done in phase3-enhanced-ga
    // 注意：遗传算法优化将在phase3-enhanced-ga中完成
    
    const statistics = this.calculateStatistics(initialSchedule);
    
    return {
      schedule: initialSchedule,
      statistics
    };
  }
  
  /**
   * Pre-filter: Find viable (teacher, classroom, time) combinations for each student
   * 预过滤：为每个学生找出可行的(教师,教室,时间)组合
   * 
   * @returns {Array} Array of viable combinations (可行组合数组)
   */
  preFilterCombinations() {
    const combinations = [];
    
    this.students.forEach(student => {
      // Parse student availability (using parsedData if available)
      const studentAvailability = parseStudentAvailability(student);
      if (!studentAvailability) return;
      
      // Get course information (获取课程信息)
      const courseSubject = this.getCourseSubject(student);
      const courseDuration = this.getCourseDuration(student);
      const preferredCampus = this.getPreferredCampus(student);
      
      // Find qualified teachers (找到能教该科目的教师)
      const qualifiedTeachers = this.teachers.filter(teacher =>
        this.canTeachSubject(teacher, courseSubject)
      );
      
      if (qualifiedTeachers.length === 0) {
        console.warn(`⚠️ No qualified teachers for student ${student.name} (${courseSubject})`);
        return;
      }
      
      // Find available classrooms (找到可用教室)
      const availableClassrooms = this.classrooms.filter(room =>
        this.isRoomSuitable(room, preferredCampus, 2) // 1v1 requires capacity >= 2
      );
      
      if (availableClassrooms.length === 0) {
        console.warn(`⚠️ No available classrooms for student ${student.name}`);
        return;
      }
      
      // Enumerate all possible time slots (枚举所有可能的时间槽)
      for (let day = 0; day < 7; day++) {
        for (let startSlot = 0; startSlot < SLOTS_PER_DAY - courseDuration; startSlot++) {
          // Check if student is available for entire duration
          // 检查学生是否在整个课程时长内都可用
          if (!this.isStudentAvailableForDuration(studentAvailability, day, startSlot, courseDuration)) {
            continue;
          }
          
          // Check teacher and classroom availability
          // 检查教师和教室在这个时间的可用性
          qualifiedTeachers.forEach(teacher => {
            availableClassrooms.forEach(classroom => {
              combinations.push({
                student: {
                  id: student.id,
                  name: student.name,
                  data: student
                },
                teacher: {
                  id: teacher.id,
                  name: teacher.name,
                  data: teacher
                },
                classroom: {
                  id: classroom.id,
                  name: classroom.name,
                  data: classroom
                },
                day,
                startSlot,
                duration: courseDuration,
                subject: courseSubject,
                score: 0 // Will be calculated during selection (在选择时计算)
              });
            });
          });
        }
      }
    });
    
    return combinations;
  }
  
  /**
   * Heuristic scheduling: Priority processing of students with strictest constraints
   * 启发式调度：优先处理约束最严格的学生
   * 
   * @param {Array} combinations - Viable combinations (可行组合)
   * @returns {Array} Schedule (课表)
   */
  heuristicScheduling(combinations) {
    // Count combinations per student (统计每个学生的可选组合数量)
    const studentComboCounts = this.countCombinationsPerStudent(combinations);
    
    // Sort students by combo count (ascending - fewer options = higher priority)
    // 按组合数排序（升序 - 选择越少优先级越高）
    const sortedStudents = [...this.students]
      .filter(s => studentComboCounts[s.id] > 0)
      .sort((a, b) => studentComboCounts[a.id] - studentComboCounts[b.id]);
    
    const schedule = [];
    this.resetOccupiedSlots();
    
    // Process each student in order (依次处理每个学生)
    sortedStudents.forEach(student => {
      const validCombos = combinations.filter(c =>
        c.student.id === student.id &&
        !this.hasConflict(c, this.occupiedSlots)
      );
      
      if (validCombos.length > 0) {
        // Select best combination based on scoring (基于评分选择最佳组合)
        const bestCombo = this.selectBestCombo(validCombos, this.occupiedSlots);
        
        if (bestCombo) {
          const course = this.createCourse(bestCombo);
          schedule.push(course);
          this.markOccupied(bestCombo, this.occupiedSlots);
        }
      }
    });
    
    return schedule;
  }
  
  /**
   * Count combinations per student
   * 统计每个学生的组合数量
   */
  countCombinationsPerStudent(combinations) {
    const counts = {};
    combinations.forEach(combo => {
      const studentId = combo.student.id;
      counts[studentId] = (counts[studentId] || 0) + 1;
    });
    return counts;
  }
  
  /**
   * Check if combination has conflicts with occupied slots
   * 检查组合是否与已占用时间槽冲突
   */
  hasConflict(combo, occupiedSlots) {
    const { student, teacher, classroom, day, startSlot, duration } = combo;
    
    // Check each slot in duration (检查时长内的每个时间槽)
    for (let slot = startSlot; slot < startSlot + duration; slot++) {
      const slotKey = `${day}-${slot}`;
      
      // Student conflict (学生冲突)
      if (occupiedSlots.students.has(student.id)) {
        const studentSlots = occupiedSlots.students.get(student.id);
        if (studentSlots.has(slotKey)) return true;
      }
      
      // Teacher conflict (教师冲突)
      if (occupiedSlots.teachers.has(teacher.id)) {
        const teacherSlots = occupiedSlots.teachers.get(teacher.id);
        if (teacherSlots.has(slotKey)) return true;
      }
      
      // Classroom conflict (教室冲突)
      if (occupiedSlots.classrooms.has(classroom.id)) {
        const roomSlots = occupiedSlots.classrooms.get(classroom.id);
        if (roomSlots.has(slotKey)) return true;
      }
    }
    
    return false;
  }
  
  /**
   * Select best combination based on scoring
   * 基于评分选择最佳组合
   */
  selectBestCombo(validCombos, occupiedSlots) {
    if (validCombos.length === 0) return null;
    
    // Score each combination (为每个组合评分)
    const scoredCombos = validCombos.map(combo => ({
      ...combo,
      score: this.scoreCombination(combo, occupiedSlots)
    }));
    
    // Sort by score (descending) (按分数降序排序)
    scoredCombos.sort((a, b) => b.score - a.score);
    
    return scoredCombos[0];
  }
  
  /**
   * Score a combination
   * 为组合评分
   * 
   * Higher score = better (分数越高越好)
   */
  scoreCombination(combo, occupiedSlots) {
    let score = 100;
    
    // Prefer earlier time slots (偏好较早的时间槽)
    const timeScore = (SLOTS_PER_DAY - combo.startSlot) / SLOTS_PER_DAY * 20;
    score += timeScore;
    
    // Prefer weekdays over weekends (偏好工作日)
    if (combo.day >= 1 && combo.day <= 5) {
      score += 10;
    }
    
    // Avoid lunch time (避免午餐时间)
    const time = slotIndexToTime(combo.startSlot);
    if (time.hour === 12) {
      score -= 5;
    }
    
    // Prefer less congested time slots (偏好不拥挤的时间槽)
    const congestion = this.getSlotCongestion(combo.day, combo.startSlot, occupiedSlots);
    score -= congestion * 3;
    
    return score;
  }
  
  /**
   * Get slot congestion level
   * 获取时间槽拥挤程度
   */
  getSlotCongestion(day, startSlot, occupiedSlots) {
    let congestion = 0;
    const slotKey = `${day}-${startSlot}`;
    
    occupiedSlots.teachers.forEach(slots => {
      if (slots.has(slotKey)) congestion++;
    });
    
    return congestion;
  }
  
  /**
   * Create course from combination
   * 从组合创建课程
   */
  createCourse(combo) {
    const startTime = slotIndexToTime(combo.startSlot);
    const endTime = slotIndexToTime(combo.startSlot + combo.duration);
    
    return {
      id: `course-${combo.student.id}-${combo.day}-${combo.startSlot}`,
      student: combo.student.data,
      teacher: combo.teacher.data,
      room: combo.classroom.data,
      subject: combo.subject,
      timeSlot: {
        day: combo.day,
        startSlot: combo.startSlot,
        duration: combo.duration,
        start: startTime.string,
        end: endTime.string
      },
      score: combo.score
    };
  }
  
  /**
   * Mark slots as occupied
   * 标记时间槽为已占用
   */
  markOccupied(combo, occupiedSlots) {
    const { student, teacher, classroom, day, startSlot, duration } = combo;
    
    // Initialize maps if needed (如果需要则初始化映射)
    if (!occupiedSlots.students.has(student.id)) {
      occupiedSlots.students.set(student.id, new Set());
    }
    if (!occupiedSlots.teachers.has(teacher.id)) {
      occupiedSlots.teachers.set(teacher.id, new Set());
    }
    if (!occupiedSlots.classrooms.has(classroom.id)) {
      occupiedSlots.classrooms.set(classroom.id, new Set());
    }
    
    // Mark each slot in duration (标记时长内的每个时间槽)
    for (let slot = startSlot; slot < startSlot + duration; slot++) {
      const slotKey = `${day}-${slot}`;
      occupiedSlots.students.get(student.id).add(slotKey);
      occupiedSlots.teachers.get(teacher.id).add(slotKey);
      occupiedSlots.classrooms.get(classroom.id).add(slotKey);
    }
  }
  
  /**
   * Reset occupied slots
   * 重置已占用时间槽
   */
  resetOccupiedSlots() {
    this.occupiedSlots = {
      teachers: new Map(),
      classrooms: new Map(),
      students: new Map()
    };
  }
  
  /**
   * Calculate statistics
   * 计算统计信息
   */
  calculateStatistics(schedule) {
    const scheduledStudentIds = new Set(schedule.map(c => c.student.id));
    
    return {
      success: true,
      totalStudents: this.students.length,
      scheduledStudents: scheduledStudentIds.size,
      unscheduledStudents: this.students.length - scheduledStudentIds.size,
      totalCourses: schedule.length,
      utilizationRate: ((scheduledStudentIds.size / this.students.length) * 100).toFixed(2) + '%',
      averageScore: schedule.length > 0
        ? (schedule.reduce((sum, c) => sum + (c.score || 0), 0) / schedule.length).toFixed(2)
        : 0
    };
  }
  
  // ==================== Helper Methods ====================
  // ==================== 辅助方法 ====================
  
  /**
   * Get course subject from student data
   * 从学生数据获取课程科目
   */
  getCourseSubject(student) {
    // Parse from student.rawData.courseContent
    // 从student.rawData.courseContent解析
    const content = student.rawData?.courseContent || '';
    
    if (content.includes('面试')) return '面试';
    if (content.includes('志望理由書') || content.includes('志望理由书')) return '志望理由書';
    if (content.includes('EJU')) return 'EJU';
    if (content.includes('小论文')) return '小论文';
    if (content.includes('日语')) return '日语';
    
    return '其他';
  }
  
  /**
   * Get course duration in slots
   * 获取课程时长（以slot为单位）
   */
  getCourseDuration(student) {
    // Parse from student.rawData.courseDuration
    // Assuming 2 hours = 120 minutes = 24 slots (24 * 5 minutes)
    // 假设2小时 = 120分钟 = 24个时间槽 (24 * 5分钟)
    const durationHours = student.rawData?.courseDuration || 2;
    return Math.floor(durationHours * 12); // 12 slots per hour
  }
  
  /**
   * Get preferred campus
   * 获取偏好校区
   */
  getPreferredCampus(student) {
    return student.rawData?.preferredCampus || '板橋二丁目';
  }
  
  /**
   * Check if teacher can teach subject
   * 检查教师是否能教授该科目
   */
  canTeachSubject(teacher, subject) {
    // For now, assume all teachers can teach all subjects
    // 暂时假设所有教师能教所有科目
    // TODO: Implement teacher qualification checking
    return true;
  }
  
  /**
   * Check if room is suitable
   * 检查教室是否合适
   */
  isRoomSuitable(room, campus, minCapacity) {
    if (room.campus && room.campus !== campus) return false;
    if (room.capacity < minCapacity) return false;
    return true;
  }
  
  /**
   * Check if student is available for entire duration
   * 检查学生是否在整个课程时长内都可用
   */
  isStudentAvailableForDuration(availability, day, startSlot, duration) {
    for (let slot = startSlot; slot < startSlot + duration && slot < SLOTS_PER_DAY; slot++) {
      if (!availability[day][slot]) {
        return false;
      }
    }
    return true;
  }
}

export default TripleMatchingEngine;

