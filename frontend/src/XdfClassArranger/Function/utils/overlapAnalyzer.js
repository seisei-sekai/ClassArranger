/**
 * Overlap Analyzer
 * 重叠度分析器
 * 
 * Real-time analysis of student time overlap with 256-level depth
 * 实时分析学生时间重叠情况（256级深度）
 */

import {
  SLOTS_PER_DAY,
  TIME_GRANULARITY,
  timeToSlotIndex,
  slotIndexToTime
} from './constants';
import { parseStudentAvailability, getColorDepth } from './availabilityCalculator';

/**
 * Overlap Analyzer Class
 * 重叠度分析器类
 */
export class OverlapAnalyzer {
  constructor(students) {
    this.students = students || [];
    this.overlapMatrix = null;
    this.maxOverlap = 0;
    this.depthMatrix = null;
    this.studentRefsMatrix = null;
    this.lastUpdate = null;
    
    if (students && students.length > 0) {
      this.rebuild();
    }
  }
  
  /**
   * Rebuild overlap matrix
   * 重建重叠矩阵
   */
  rebuild() {
    this.buildOverlapMatrix();
    this.lastUpdate = Date.now();
  }
  
  /**
   * Build overlap matrix [7 days × 150 slots]
   * 构建重叠矩阵 [7天 × 150槽]
   */
  buildOverlapMatrix() {
    // Initialize matrices (初始化矩阵)
    const matrix = Array(7).fill(null).map(() => 
      Array(SLOTS_PER_DAY).fill(null).map(() => ({
        count: 0,
        students: [],
        normalizedDepth: 0,
        ratio: 0
      }))
    );
    
    const studentRefs = Array(7).fill(null).map(() => 
      Array(SLOTS_PER_DAY).fill(null).map(() => [])
    );
    
    let maxOverlap = 0;
    let totalStudentsWithData = 0;
    
    // Process each student (处理每个学生)
    this.students.forEach(student => {
      if (!student.rawData) return;
      
      const availability = parseStudentAvailability(student.rawData);
      if (!availability) return;
      
      totalStudentsWithData++;
      
      for (let day = 0; day < 7; day++) {
        for (let slot = 0; slot < SLOTS_PER_DAY; slot++) {
          if (availability[day][slot]) {
            matrix[day][slot].count++;
            matrix[day][slot].students.push({
              id: student.id,
              name: student.name,
              color: student.color,
              rawData: student.rawData
            });
            studentRefs[day][slot].push(student);
            
            maxOverlap = Math.max(maxOverlap, matrix[day][slot].count);
          }
        }
      }
    });
    
    // Normalize depth (归一化深度)
    const depthMatrix = Array(7).fill(null).map(() => Array(SLOTS_PER_DAY).fill(0));
    
    for (let day = 0; day < 7; day++) {
      for (let slot = 0; slot < SLOTS_PER_DAY; slot++) {
        const count = matrix[day][slot].count;
        if (maxOverlap > 0) {
          const depth = getColorDepth(count, maxOverlap);
          matrix[day][slot].normalizedDepth = depth;
          matrix[day][slot].ratio = count / maxOverlap;
          depthMatrix[day][slot] = depth;
        }
      }
    }
    
    this.overlapMatrix = matrix;
    this.depthMatrix = depthMatrix;
    this.studentRefsMatrix = studentRefs;
    this.maxOverlap = maxOverlap || 1;
    this.totalStudents = totalStudentsWithData;
  }
  
  /**
   * Get slot information
   * 获取特定时间槽的重叠信息
   * 
   * @param {number} day - Day of week (0=Sunday) (星期几 0=周日)
   * @param {number} slotIndex - Slot index (时间槽索引)
   * @returns {Object} Slot info (时间槽信息)
   */
  getSlotInfo(day, slotIndex) {
    if (!this.overlapMatrix) this.rebuild();
    
    if (day < 0 || day >= 7 || slotIndex < 0 || slotIndex >= SLOTS_PER_DAY) {
      return null;
    }
    
    const slotData = this.overlapMatrix[day][slotIndex];
    const time = slotIndexToTime(slotIndex);
    
    return {
      day,
      slotIndex,
      time: time.string,
      count: slotData.count,
      depth: slotData.normalizedDepth,
      ratio: slotData.ratio,
      students: slotData.students,
      maxOverlap: this.maxOverlap,
      totalStudents: this.totalStudents
    };
  }
  
  /**
   * Get slot info by time
   * 根据时间获取时间槽信息
   * 
   * @param {number} day - Day of week (星期几)
   * @param {number} hour - Hour (小时)
   * @param {number} minute - Minute (分钟)
   * @returns {Object} Slot info (时间槽信息)
   */
  getSlotInfoByTime(day, hour, minute = 0) {
    const slotIndex = timeToSlotIndex(hour, minute);
    return this.getSlotInfo(day, slotIndex);
  }
  
  /**
   * Find maximum overlap
   * 查找最大重叠数
   * 
   * @returns {number} Max overlap count (最大重叠数)
   */
  findMaxOverlap() {
    return this.maxOverlap;
  }
  
  /**
   * Get overlap matrix
   * 获取重叠矩阵
   * 
   * @returns {Array} Overlap matrix (重叠矩阵)
   */
  getOverlapMatrix() {
    if (!this.overlapMatrix) this.rebuild();
    return this.overlapMatrix;
  }
  
  /**
   * Get depth matrix
   * 获取深度矩阵
   * 
   * @returns {Array} Depth matrix (深度矩阵)
   */
  getDepthMatrix() {
    if (!this.depthMatrix) this.rebuild();
    return this.depthMatrix;
  }
  
  /**
   * Get statistics
   * 获取统计信息
   * 
   * @returns {Object} Statistics (统计信息)
   */
  getStatistics() {
    if (!this.overlapMatrix) this.rebuild();
    
    let totalSlots = 0;
    let usedSlots = 0;
    let depthSum = 0;
    const depthDistribution = Array(257).fill(0); // 0-256
    
    for (let day = 0; day < 7; day++) {
      for (let slot = 0; slot < SLOTS_PER_DAY; slot++) {
        totalSlots++;
        const slotData = this.overlapMatrix[day][slot];
        
        if (slotData.count > 0) {
          usedSlots++;
          depthSum += slotData.normalizedDepth;
          depthDistribution[Math.floor(slotData.normalizedDepth)]++;
        }
      }
    }
    
    return {
      totalSlots,
      usedSlots,
      emptySlots: totalSlots - usedSlots,
      utilizationRate: (usedSlots / totalSlots * 100).toFixed(2) + '%',
      maxOverlap: this.maxOverlap,
      averageDepth: usedSlots > 0 ? (depthSum / usedSlots).toFixed(2) : 0,
      depthDistribution,
      totalStudents: this.totalStudents,
      lastUpdate: this.lastUpdate ? new Date(this.lastUpdate).toISOString() : null
    };
  }
  
  /**
   * Find time slots with specific overlap count
   * 查找具有特定重叠数的时间槽
   * 
   * @param {number} minCount - Minimum overlap count (最小重叠数)
   * @param {number} maxCount - Maximum overlap count (最大重叠数)
   * @returns {Array} Array of slots (时间槽数组)
   */
  findSlotsByOverlap(minCount = 1, maxCount = Infinity) {
    if (!this.overlapMatrix) this.rebuild();
    
    const slots = [];
    
    for (let day = 0; day < 7; day++) {
      for (let slot = 0; slot < SLOTS_PER_DAY; slot++) {
        const count = this.overlapMatrix[day][slot].count;
        if (count >= minCount && count <= maxCount) {
          slots.push({
            day,
            slot,
            count,
            depth: this.depthMatrix[day][slot],
            students: this.overlapMatrix[day][slot].students
          });
        }
      }
    }
    
    return slots;
  }
  
  /**
   * Find best time slots for scheduling
   * 查找最佳排课时间槽
   * 
   * Strategy: Find slots with maximum student availability
   * 策略：查找学生可用性最大的时间槽
   * 
   * @param {number} requiredStudentCount - Required number of students (需要的学生数)
   * @param {number} limit - Number of results to return (返回结果数量)
   * @returns {Array} Best slots (最佳时间槽)
   */
  findBestSlots(requiredStudentCount = 1, limit = 10) {
    const slots = this.findSlotsByOverlap(requiredStudentCount);
    
    // Sort by overlap count (descending) (按重叠数降序排序)
    slots.sort((a, b) => b.count - a.count);
    
    return slots.slice(0, limit);
  }
  
  /**
   * Update students and rebuild
   * 更新学生数据并重建
   * 
   * @param {Array} students - Updated student array (更新的学生数组)
   */
  updateStudents(students) {
    this.students = students;
    this.rebuild();
  }
  
  /**
   * Check if needs rebuild (cache invalidation)
   * 检查是否需要重建（缓存失效）
   * 
   * @param {number} maxAge - Maximum age in milliseconds (最大年龄毫秒数)
   * @returns {boolean} True if needs rebuild (如果需要重建则返回true)
   */
  needsRebuild(maxAge = 5000) {
    if (!this.lastUpdate) return true;
    return (Date.now() - this.lastUpdate) > maxAge;
  }
}

export default OverlapAnalyzer;

