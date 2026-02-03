/**
 * Genetic Algorithm Adapter
 * 遗传算法适配器
 * 
 * Adapter to use the existing genetic algorithm from the main system
 */

import GeneticAlgorithm from '../../Function/GeneticAlgorithm.jsx';
import { createCourse, deepClone } from '../utils/dataStructures.js';

/**
 * Genetic Scheduler Adapter
 * 遗传调度器适配器
 */
export class GeneticScheduler {
  constructor(config = {}) {
    this.teachers = config.teachers || [];
    this.students = config.students || [];
    this.granularity = config.granularity;
    this.onProgress = config.onProgress || (() => {});
    
    // GA parameters
    this.populationSize = config.populationSize || 50;
    this.maxGenerations = config.maxGenerations || 100;
    this.mutationRate = config.mutationRate || 0.15;
    this.crossoverRate = config.crossoverRate || 0.8;
  }

  /**
   * Run the genetic algorithm
   * 运行遗传算法
   */
  schedule() {
    const startTime = Date.now();
    
    // Convert students to courses format expected by GA
    const courses = this.convertStudentsToCourses();
    
    // Prepare time slots
    const timeSlots = this.generateTimeSlots();
    
    // Create a virtual room for 1v1 classes (to avoid undefined room.id errors)
    // 为1v1课程创建虚拟教室（避免 undefined room.id 错误）
    const virtualRoom = {
      id: 'virtual-room-1v1',
      name: '1v1教室',
      capacity: 2,
      campus: '虚拟校区'
    };
    
    // Configure and run GA
    const ga = new GeneticAlgorithm({
      populationSize: this.populationSize,
      mutationRate: this.mutationRate,
      crossoverRate: this.crossoverRate,
      maxGenerations: this.maxGenerations,
      
      teachers: this.teachers,
      students: this.students,
      rooms: [virtualRoom], // Provide a virtual room for 1v1
      courses: courses,
      timeSlots: timeSlots,
      
      constraintEngine: null // Use built-in constraints
    });

    // Run the algorithm with progress callback
    let lastReportedGen = 0;
    const originalProgress = ga.onProgress;
    ga.onProgress = (generation, fitness) => {
      if (generation - lastReportedGen >= 5 || generation === this.maxGenerations) {
        this.onProgress({
          current: generation,
          total: this.maxGenerations,
          message: `进化中 (第${generation}代, 适应度: ${fitness.toFixed(3)})`
        });
        lastReportedGen = generation;
      }
      if (originalProgress) {
        originalProgress(generation, fitness);
      }
    };

    const result = ga.evolve();
    
    // Convert result back to our format
    const endTime = Date.now();
    const formattedResult = this.formatResult(result, startTime, endTime);
    
    return formattedResult;
  }

  /**
   * Convert students to course objects for GA
   * 将学生转换为课程对象供遗传算法使用
   */
  convertStudentsToCourses() {
    const courses = [];
    
    this.students.forEach(student => {
      const frequency = this.parseFrequency(student.constraints.frequency);
      
      // Find eligible teachers for this student
      const eligibleTeachers = this.teachers.filter(t => 
        t.subjects.includes(student.subject)
      );
      
      if (eligibleTeachers.length === 0) {
        console.warn(`No teacher found for student ${student.name} (subject: ${student.subject})`);
        return;
      }
      
      // Create a course entry for each required session per week
      for (let i = 0; i < frequency; i++) {
        // Assign a random teacher (GA will optimize this)
        const teacher = eligibleTeachers[Math.floor(Math.random() * eligibleTeachers.length)];
        
        courses.push({
          id: `${student.id}-session-${i}`,
          name: `${student.subject} - ${student.name}`,
          studentId: student.id,
          student: student,
          teacher: teacher,
          subject: student.subject,
          duration: student.constraints.duration || 24
        });
      }
    });
    
    return courses;
  }

  /**
   * Parse frequency string (e.g., "2次/周" -> 2)
   * 解析频率字符串
   */
  parseFrequency(frequencyStr) {
    if (!frequencyStr) return 1;
    
    const match = frequencyStr.match(/(\d+)次/);
    if (!match) return 1;
    
    return parseInt(match[1]) || 1;
  }

  /**
   * Generate all possible time slots
   * 生成所有可能的时间槽
   */
  generateTimeSlots() {
    const slots = [];
    const slotsPerDay = this.granularity.slotsPerDay;
    const slotsPerHour = this.granularity.slotsPerHour;
    const minutesPerSlot = this.granularity.minutes;
    
    // For each day of week
    for (let day = 0; day < 7; day++) {
      // Generate slots throughout the day
      // We'll create overlapping slots to give GA more options
      const minDuration = 12; // Minimum 1 hour
      const maxDuration = 48; // Maximum 4 hours
      
      for (let start = 0; start < slotsPerDay - minDuration; start += 6) { // Every 30 min
        for (let duration = minDuration; duration <= maxDuration; duration += 12) { // 1h increments
          if (start + duration <= slotsPerDay) {
            // Convert slot indices to time strings
            const startMinutes = start * minutesPerSlot;
            const endMinutes = (start + duration) * minutesPerSlot;
            
            const startHour = 9 + Math.floor(startMinutes / 60);
            const startMin = startMinutes % 60;
            const endHour = 9 + Math.floor(endMinutes / 60);
            const endMin = endMinutes % 60;
            
            const startTime = `${String(startHour).padStart(2, '0')}:${String(startMin).padStart(2, '0')}`;
            const endTime = `${String(endHour).padStart(2, '0')}:${String(endMin).padStart(2, '0')}`;
            
            slots.push({
              day,
              startSlot: start,
              endSlot: start + duration,
              duration,
              start: startTime,
              end: endTime
            });
          }
        }
      }
    }
    
    return slots;
  }

  /**
   * Format GA result to our standard format
   * 格式化遗传算法结果为标准格式
   */
  formatResult(gaResult, startTime, endTime) {
    const results = {
      courses: [],
      conflicts: [],
      stats: {
        totalStudents: this.students.length,
        scheduledStudents: 0,
        totalAttempts: 0,
        successRate: 0,
        fitness: 0,
        generations: 0
      }
    };

    if (!gaResult || !gaResult.schedule || gaResult.schedule.length === 0) {
      results.stats.executionTime = endTime - startTime;
      results.stats.fitness = gaResult?.fitness || 0;
      results.stats.generations = gaResult?.generations || 0;
      
      // All students are unscheduled
      this.students.forEach(student => {
        results.conflicts.push({
          student,
          reason: '遗传算法未能找到满足约束的方案'
        });
      });
      
      return results;
    }

    // Track which students have been scheduled
    const scheduledStudents = new Set();

    // Convert GA schedule to our course format
    gaResult.schedule.forEach(assignment => {
      if (!assignment.student || !assignment.teacher || !assignment.timeSlot) {
        return;
      }

      const course = createCourse({
        student: assignment.student,
        teacher: assignment.teacher,
        subject: assignment.student.subject || assignment.courseName,
        timeSlot: assignment.timeSlot,
        isRecurring: true,
        recurrencePattern: 'weekly'
      });

      results.courses.push(course);
      scheduledStudents.add(assignment.student.id);
    });

    // Find unscheduled students
    this.students.forEach(student => {
      if (!scheduledStudents.has(student.id)) {
        results.conflicts.push({
          student,
          reason: '遗传算法未能找到满足约束的方案'
        });
      }
    });

    // Calculate statistics
    results.stats.scheduledStudents = scheduledStudents.size;
    results.stats.totalAttempts = this.students.length;
    results.stats.successRate = (scheduledStudents.size / this.students.length) * 100;
    results.stats.executionTime = endTime - startTime;
    results.stats.fitness = gaResult.fitness || 0;
    results.stats.generations = gaResult.generations || 0;

    return results;
  }

  /**
   * Get scheduling statistics
   * 获取排课统计信息
   */
  getStats(results) {
    return {
      totalStudents: results.stats.totalStudents,
      scheduledStudents: results.stats.scheduledStudents,
      unscheduledStudents: results.stats.totalStudents - results.stats.scheduledStudents,
      successRate: results.stats.successRate.toFixed(1),
      executionTime: results.stats.executionTime,
      fitness: results.stats.fitness.toFixed(3),
      generations: results.stats.generations,
      averageTimePerStudent: (results.stats.executionTime / results.stats.totalStudents).toFixed(2)
    };
  }
}

/**
 * Factory function to create and run genetic scheduler
 * 工厂函数：创建并运行遗传调度器
 */
export function runGeneticScheduler(config) {
  const scheduler = new GeneticScheduler(config);
  return scheduler.schedule();
}

/**
 * Run both algorithms and compare results
 * 运行两种算法并比较结果
 */
export async function compareAlgorithms(config) {
  const { GreedyScheduler } = await import('./greedyScheduler.js');
  
  const startTime = Date.now();
  
  // Run greedy algorithm
  const greedyScheduler = new GreedyScheduler({
    ...config,
    onProgress: (progress) => {
      if (config.onProgress) {
        config.onProgress({
          ...progress,
          algorithm: 'greedy'
        });
      }
    }
  });
  const greedyResult = greedyScheduler.schedule();
  
  // Run genetic algorithm
  const geneticScheduler = new GeneticScheduler({
    ...config,
    onProgress: (progress) => {
      if (config.onProgress) {
        config.onProgress({
          ...progress,
          algorithm: 'genetic'
        });
      }
    }
  });
  const geneticResult = geneticScheduler.schedule();
  
  const endTime = Date.now();
  
  // Compare results
  const comparison = {
    greedy: {
      result: greedyResult,
      stats: greedyScheduler.getStats(greedyResult)
    },
    genetic: {
      result: geneticResult,
      stats: geneticScheduler.getStats(geneticResult)
    },
    comparison: {
      totalTime: endTime - startTime,
      speedupFactor: (geneticResult.stats.executionTime / greedyResult.stats.executionTime).toFixed(2),
      successRateDiff: (geneticResult.stats.successRate - greedyResult.stats.successRate).toFixed(1),
      winner: geneticResult.stats.scheduledStudents >= greedyResult.stats.scheduledStudents ? 'genetic' : 'greedy'
    }
  };
  
  return comparison;
}
