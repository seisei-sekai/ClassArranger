/**
 * Course Hours Manager
 * 课时管理器
 * 
 * Manages student course hours tracking, consumption, and validation
 * 管理学生课时追踪、消耗和验证
 */

/**
 * Course Hours Manager Class
 * 课时管理器类
 */
class CourseHoursManager {
  constructor() {
    // Storage for student hours state
    // 学生课时状态存储
    this.studentHoursMap = new Map();
  }

  /**
   * Initialize student hours
   * 初始化学生课时
   * 
   * @param {Object} student - Student object
   * @param {number} totalHours - Total course hours available
   * @returns {Object} Initialized hours object
   */
  initializeStudentHours(student, totalHours) {
    if (!student || !student.id) {
      throw new Error('[CourseHoursManager] Invalid student object');
    }

    const hoursData = {
      studentId: student.id,
      studentName: student.name,
      totalHours: totalHours || 0,
      usedHours: 0,
      remainingHours: totalHours || 0,
      scheduledCourses: [], // Array of scheduled course IDs
      history: [] // History of hour consumption
    };

    this.studentHoursMap.set(student.id, hoursData);
    
    console.log(`[CourseHoursManager] Initialized hours for ${student.name}: ${totalHours}h`);
    
    return hoursData;
  }

  /**
   * Calculate hours consumed by a course
   * 计算单节课消耗的课时
   * 
   * Rule: Course duration in hours = hours consumed
   * 规则：课程时长（小时）= 消耗课时数
   * 
   * Example: 2-hour course = 2 course hours
   * 例如：2小时课程 = 2课时
   * 
   * @param {number} courseDurationSlots - Course duration in 5-minute slots
   * @returns {number} Hours consumed
   */
  calculateHoursConsumed(courseDurationSlots) {
    // Each slot = 5 minutes, so 12 slots = 1 hour
    // 每个槽 = 5分钟，所以12个槽 = 1小时
    const hoursConsumed = courseDurationSlots / 12;
    return Math.round(hoursConsumed * 10) / 10; // Round to 1 decimal place
  }

  /**
   * Check if student has remaining hours
   * 检查学生是否还有剩余课时
   * 
   * @param {string} studentId - Student ID
   * @param {number} requiredHours - Required hours for the course
   * @returns {boolean} True if student has enough hours
   */
  hasRemainingHours(studentId, requiredHours) {
    const hoursData = this.studentHoursMap.get(studentId);
    
    if (!hoursData) {
      console.warn(`[CourseHoursManager] No hours data found for student ${studentId}`);
      return false;
    }

    return hoursData.remainingHours >= requiredHours;
  }

  /**
   * Get student hours data
   * 获取学生课时数据
   * 
   * @param {string} studentId - Student ID
   * @returns {Object|null} Hours data or null if not found
   */
  getStudentHours(studentId) {
    return this.studentHoursMap.get(studentId) || null;
  }

  /**
   * Consume hours for a scheduled course
   * 消耗课时（已排课）
   * 
   * @param {string} studentId - Student ID
   * @param {number} hoursToConsume - Hours to consume
   * @param {string} courseId - Course ID for tracking
   * @param {Object} courseDetails - Optional course details for history
   * @returns {Object} Updated hours data
   */
  consumeHours(studentId, hoursToConsume, courseId, courseDetails = {}) {
    const hoursData = this.studentHoursMap.get(studentId);
    
    if (!hoursData) {
      throw new Error(`[CourseHoursManager] Student ${studentId} not initialized`);
    }

    if (hoursData.remainingHours < hoursToConsume) {
      throw new Error(
        `[CourseHoursManager] Insufficient hours for ${hoursData.studentName}: ` +
        `Need ${hoursToConsume}h, have ${hoursData.remainingHours}h`
      );
    }

    // Update hours
    hoursData.usedHours += hoursToConsume;
    hoursData.remainingHours -= hoursToConsume;
    hoursData.scheduledCourses.push(courseId);

    // Record in history
    hoursData.history.push({
      timestamp: new Date().toISOString(),
      action: 'consume',
      amount: hoursToConsume,
      courseId: courseId,
      courseDetails: courseDetails,
      remainingAfter: hoursData.remainingHours
    });

    console.log(
      `[CourseHoursManager] Consumed ${hoursToConsume}h for ${hoursData.studentName}. ` +
      `Remaining: ${hoursData.remainingHours}h / ${hoursData.totalHours}h`
    );

    return hoursData;
  }

  /**
   * Refund hours (e.g., when a course is cancelled)
   * 退还课时（例如取消课程时）
   * 
   * @param {string} studentId - Student ID
   * @param {number} hoursToRefund - Hours to refund
   * @param {string} courseId - Course ID being cancelled
   * @returns {Object} Updated hours data
   */
  refundHours(studentId, hoursToRefund, courseId) {
    const hoursData = this.studentHoursMap.get(studentId);
    
    if (!hoursData) {
      throw new Error(`[CourseHoursManager] Student ${studentId} not initialized`);
    }

    // Update hours
    hoursData.usedHours = Math.max(0, hoursData.usedHours - hoursToRefund);
    hoursData.remainingHours = Math.min(
      hoursData.totalHours,
      hoursData.remainingHours + hoursToRefund
    );

    // Remove course from scheduled courses
    hoursData.scheduledCourses = hoursData.scheduledCourses.filter(id => id !== courseId);

    // Record in history
    hoursData.history.push({
      timestamp: new Date().toISOString(),
      action: 'refund',
      amount: hoursToRefund,
      courseId: courseId,
      remainingAfter: hoursData.remainingHours
    });

    console.log(
      `[CourseHoursManager] Refunded ${hoursToRefund}h for ${hoursData.studentName}. ` +
      `Remaining: ${hoursData.remainingHours}h / ${hoursData.totalHours}h`
    );

    return hoursData;
  }

  /**
   * Get hours statistics for all students
   * 获取所有学生的课时统计
   * 
   * @param {Array<string>} studentIds - Optional array of student IDs to filter
   * @returns {Object} Statistics object
   */
  getHoursStatistics(studentIds = null) {
    const idsToCheck = studentIds || Array.from(this.studentHoursMap.keys());
    
    const stats = {
      totalStudents: idsToCheck.length,
      totalHoursAllocated: 0,
      totalHoursUsed: 0,
      totalHoursRemaining: 0,
      studentsFullyScheduled: 0, // Students with 0 remaining hours
      studentsPartiallyScheduled: 0, // Students with some hours used
      studentsNotScheduled: 0, // Students with no hours used
      averageUtilization: 0, // Percentage
      studentDetails: []
    };

    idsToCheck.forEach(studentId => {
      const hoursData = this.studentHoursMap.get(studentId);
      if (!hoursData) return;

      stats.totalHoursAllocated += hoursData.totalHours;
      stats.totalHoursUsed += hoursData.usedHours;
      stats.totalHoursRemaining += hoursData.remainingHours;

      if (hoursData.remainingHours === 0) {
        stats.studentsFullyScheduled++;
      } else if (hoursData.usedHours > 0) {
        stats.studentsPartiallyScheduled++;
      } else {
        stats.studentsNotScheduled++;
      }

      stats.studentDetails.push({
        studentId: hoursData.studentId,
        studentName: hoursData.studentName,
        totalHours: hoursData.totalHours,
        usedHours: hoursData.usedHours,
        remainingHours: hoursData.remainingHours,
        utilizationRate: hoursData.totalHours > 0 
          ? (hoursData.usedHours / hoursData.totalHours) * 100 
          : 0,
        scheduledCoursesCount: hoursData.scheduledCourses.length
      });
    });

    stats.averageUtilization = stats.totalHoursAllocated > 0
      ? (stats.totalHoursUsed / stats.totalHoursAllocated) * 100
      : 0;

    return stats;
  }

  /**
   * Get students who need more courses scheduled
   * 获取需要排更多课的学生
   * 
   * @param {number} minRemainingHours - Minimum remaining hours threshold (default: 1)
   * @returns {Array<Object>} Array of student hours data with remaining hours
   */
  getStudentsNeedingScheduling(minRemainingHours = 1) {
    const needScheduling = [];

    this.studentHoursMap.forEach((hoursData, studentId) => {
      if (hoursData.remainingHours >= minRemainingHours) {
        needScheduling.push(hoursData);
      }
    });

    // Sort by remaining hours (descending) - prioritize students with more hours
    needScheduling.sort((a, b) => b.remainingHours - a.remainingHours);

    return needScheduling;
  }

  /**
   * Reset all hours data
   * 重置所有课时数据
   */
  reset() {
    this.studentHoursMap.clear();
    console.log('[CourseHoursManager] All hours data has been reset');
  }

  /**
   * Export hours data for persistence
   * 导出课时数据用于持久化
   * 
   * @returns {Array<Object>} Array of all hours data
   */
  exportData() {
    return Array.from(this.studentHoursMap.values());
  }

  /**
   * Import hours data from persistence
   * 从持久化数据导入课时数据
   * 
   * @param {Array<Object>} hoursDataArray - Array of hours data objects
   */
  importData(hoursDataArray) {
    if (!Array.isArray(hoursDataArray)) {
      throw new Error('[CourseHoursManager] Import data must be an array');
    }

    this.reset();
    
    hoursDataArray.forEach(hoursData => {
      if (hoursData.studentId) {
        this.studentHoursMap.set(hoursData.studentId, hoursData);
      }
    });

    console.log(`[CourseHoursManager] Imported hours data for ${hoursDataArray.length} students`);
  }
}

// Create singleton instance
let hoursManagerInstance = null;

/**
 * Get singleton instance of CourseHoursManager
 * 获取课时管理器单例
 * 
 * @returns {CourseHoursManager} Manager instance
 */
export const getCourseHoursManager = () => {
  if (!hoursManagerInstance) {
    hoursManagerInstance = new CourseHoursManager();
  }
  return hoursManagerInstance;
};

/**
 * Create a new CourseHoursManager instance (for testing or isolated contexts)
 * 创建新的课时管理器实例（用于测试或独立上下文）
 * 
 * @returns {CourseHoursManager} New manager instance
 */
export const createCourseHoursManager = () => {
  return new CourseHoursManager();
};

export default {
  getCourseHoursManager,
  createCourseHoursManager
};

