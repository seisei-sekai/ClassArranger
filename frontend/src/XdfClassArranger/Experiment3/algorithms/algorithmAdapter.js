/**
 * Scheduling Algorithm Adapter for Experiment3
 * 排课算法适配器
 *
 * Adapts between Function's data format and Experiment1/2's algorithm interfaces
 * 在Function数据格式和Experiment1/2算法接口之间转换
 *
 * Updated to support new 10-type constraint system
 */

import { GreedyScheduler } from "./greedyScheduler.js";
import { TripleMatchScheduler } from "./tripleMatchScheduler.js";
import { parseStudentAvailability } from "../utils/availabilityCalculator.js";
import { SLOTS_PER_DAY } from "../utils/constants.js";
import { NewConstraintEngine } from "../constraints/NewConstraintEngine.js";

/**
 * Time granularity constant for 5-minute slots
 */
const TIME_GRANULARITY_5MIN = {
  minutes: 5,
  slotsPerHour: 12,
  slotsPerDay: 150,
  label: "5分钟",
};

/**
 * Scheduling Algorithm Adapter
 */
export class SchedulingAlgorithmAdapter {
  constructor(algorithmType = "triple-match") {
    this.algorithmType = algorithmType;
  }

  /**
   * Main scheduling method
   * 主排课方法
   */
  async schedule(students, teachers, classrooms, options = {}) {
    try {
      // 1. Adapt input data
      const adaptedData = this.adaptInputData(students, teachers, classrooms);

      // 2. Run selected algorithm
      let result;
      switch (this.algorithmType) {
        case "greedy":
          result = this.runGreedyAlgorithm(adaptedData, options);
          break;
        case "triple-match":
          result = this.runTripleMatchAlgorithm(adaptedData, options);
          break;
        default:
          throw new Error(`Unknown algorithm type: ${this.algorithmType}`);
      }

      // 3. Adapt output data
      return this.adaptOutputData(result, students, teachers, classrooms);
    } catch (error) {
      console.error("[AlgorithmAdapter] Scheduling error:", error);
      throw error;
    }
  }

  /**
   * Adapt Function's data format to Experiment1/2 format
   * 将Function数据格式转换为Experiment1/2格式
   */
  adaptInputData(students, teachers, classrooms) {
    return {
      students: this.adaptStudents(students),
      teachers: this.adaptTeachers(teachers),
      classrooms: this.adaptClassrooms(classrooms),
      granularity: TIME_GRANULARITY_5MIN,
    };
  }

  /**
   * Adapt students data
   */
  adaptStudents(students) {
    console.log(
      `[AlgorithmAdapter.adaptStudents] 开始适配 ${students.length} 个学生`,
    );
    
    // 🔥 调试：检查每个学生为什么被过滤
    students.forEach((s, idx) => {
      const hasRawData = !!s.rawData;
      const hasCourseHours = !!s.courseHours;
      const totalHours = s.courseHours?.totalHours;
      const passed = hasRawData && totalHours > 0;
      
      console.log(`[AlgorithmAdapter] 学生${idx + 1} "${s.name}":`, {
        hasRawData,
        hasCourseHours,
        totalHours,
        passed,
        rawDataKeys: s.rawData ? Object.keys(s.rawData).slice(0, 5) : null,
        studentId: s.id
      });
    });

    const adapted = students
      .filter((s) => s.rawData && s.courseHours?.totalHours > 0)
      .map((student, index) => {
        // Parse availability using Function's parser
        const availability = parseStudentAvailability(student);

        // Extract constraints
        const constraints = this.extractConstraints(student, availability);

        if (index === 0) {
          console.log(
            `[AlgorithmAdapter.adaptStudents] 第1个学生 ${student.name}:`,
            {
              hasAvailability: !!availability,
              availabilityType: availability ? typeof availability : null,
              hasParsedData: !!availability?.parsedData,
              constraints: {
                allowedDays: Array.from(constraints.allowedDays || []),
                allowedTimeRangesCount: constraints.allowedTimeRanges?.length,
                duration: constraints.duration,
                frequency: constraints.frequency,
              },
            },
          );
        }

        return {
          id:
            student.id ||
            `student-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          name: student.rawData?.学生姓名 || student.name || "未知学生",
          campus: student.rawData?.校区 || student.campus || "高马",
          manager: student.rawData?.学管姓名 || "",
          batch: student.rawData?.学生批次 || "",
          subject: student.rawData?.内容 || student.subject || "",
          frequency: student.frequency || student.rawData?.频次 || "2次",  // 🔥 优先从修改后的字段读取
          duration: this.parseDuration(student.duration || student.rawData?.时长) || 2,
          format: student.mode || student.rawData?.形式 || "线下",
          totalHours: student.courseHours?.totalHours || 0,
          remainingHours: student.courseHours?.remainingHours || 0,
          hoursUsed:
            (student.courseHours?.totalHours || 0) -
            (student.courseHours?.remainingHours || 0),
          constraints: constraints,
          
          // 🔥 关键修复：传递 schedulingMode 和 isRecurringFixed
          schedulingMode: student.schedulingMode || student.scheduling?.frequencyConstraints?.schedulingMode || 'fixed',
          isRecurringFixed: student.isRecurringFixed ?? student.scheduling?.frequencyConstraints?.isRecurringFixed ?? true,
          
          // 🔥 保留完整的 scheduling 对象（供算法读取）
          scheduling: student.scheduling,
          
          originalData: student, // Keep reference
        };
      });

    console.log(
      `[AlgorithmAdapter.adaptStudents] 适配完成，输出 ${adapted.length} 个学生`,
    );
    return adapted;
  }

  /**
   * Extract constraints from student data
   * 支持新的10类约束系统 + V4 Schema (Supports new 10-type constraint system + V4 Schema)
   */
  extractConstraints(student, availability) {
    // === V4 Schema Support (最高优先级) ===
    // 检查是否为V4格式（有scheduling字段）
    if (student.scheduling && student.scheduling.timeConstraints) {
      console.log(`[AlgorithmAdapter] ✅ 使用 V4 Schema (student.scheduling):`, student.name);
      
      const scheduling = student.scheduling;
      const constraints = {
        allowedDays: new Set(scheduling.timeConstraints.allowedDays || [1, 2, 3, 4, 5]),
        allowedTimeRanges: (scheduling.timeConstraints.allowedTimeRanges || []).map(r => ({
          day: r.day,
          startSlot: r.startSlot,
          endSlot: r.endSlot
        })),
        excludedTimeRanges: (scheduling.timeConstraints.excludedTimeRanges || []).map(r => ({
          day: r.day,
          startSlot: r.startSlot,
          endSlot: r.endSlot
        })),
        duration: (scheduling.frequencyConstraints.duration / 10) || 12, // 分钟转换为10分钟槽数
        frequency: scheduling.frequencyConstraints.frequency || "1次/周",
        isRecurringFixed: scheduling.frequencyConstraints.isRecurringFixed ?? true,
        schedulingMode: scheduling.frequencyConstraints.schedulingMode || 'fixed'
      };
      
      console.log(`[AlgorithmAdapter] V4约束:`, {
        allowedDays: Array.from(constraints.allowedDays),
        timeRangesCount: constraints.allowedTimeRanges.length,
        duration: constraints.duration,
        frequency: constraints.frequency,
        schedulingMode: constraints.schedulingMode
      });
      
      return constraints;
    }
    
    // === 🔥 修复：优先使用 parsedData/constraints（旧格式，手动修改后的数据）===
    // 检查是否有 parsedData 或 constraints 对象（非数组）包含时间约束
    const hasParsedDataTimeConstraints = student.parsedData?.allowedDays || student.parsedData?.allowedTimeRanges;
    const hasConstraintsTimeConstraints = student.constraints && 
      !Array.isArray(student.constraints) && 
      (student.constraints.allowedDays || student.constraints.allowedTimeRanges);
    
    if (hasParsedDataTimeConstraints || hasConstraintsTimeConstraints) {
      console.log(`[AlgorithmAdapter] ✅ 使用 Legacy parsedData/constraints:`, student.name);
      
      const constraints = {
        allowedDays: new Set(),
        allowedTimeRanges: [],
        excludedTimeRanges: [],
        duration: this.parseDuration(student.duration || student.rawData?.时长) * 12 || 24,
        frequency: student.frequency || student.rawData?.频次 || "1次/周",
      };
      
      // 从 parsedData 读取时间约束
      if (student.parsedData) {
        if (student.parsedData.allowedDays) {
          const days = Array.isArray(student.parsedData.allowedDays) 
            ? student.parsedData.allowedDays 
            : [student.parsedData.allowedDays];
          days.forEach(day => constraints.allowedDays.add(day));
        }
        
        if (student.parsedData.allowedTimeRanges) {
          constraints.allowedTimeRanges = student.parsedData.allowedTimeRanges.map(r => ({
            day: r.day,
            startSlot: r.start || r.startSlot,
            endSlot: r.end || r.endSlot
          }));
        }
      }
      
      // 从 constraints 对象读取时间约束（可能覆盖 parsedData）
      if (student.constraints && !Array.isArray(student.constraints)) {
        if (student.constraints.allowedDays) {
          constraints.allowedDays = student.constraints.allowedDays instanceof Set 
            ? student.constraints.allowedDays 
            : new Set(student.constraints.allowedDays);
        }
        
        if (student.constraints.allowedTimeRanges) {
          constraints.allowedTimeRanges = student.constraints.allowedTimeRanges;
        }
        
        if (student.constraints.excludedTimeRanges) {
          constraints.excludedTimeRanges = student.constraints.excludedTimeRanges;
        }
      }
      
      console.log(`[AlgorithmAdapter] Legacy约束:`, {
        allowedDays: Array.from(constraints.allowedDays),
        timeRangesCount: constraints.allowedTimeRanges.length,
        duration: constraints.duration,
        frequency: constraints.frequency
      });
      
      return constraints;
    }
    
    // === 新的10类约束系统 ===
    // Check if student has new-style constraints (数组格式)
    if (
      student.constraints &&
      Array.isArray(student.constraints) &&
      student.constraints.length > 0
    ) {
      console.log(`[AlgorithmAdapter] ✅ 使用新的10类约束系统:`, student.name);
      return this.convertNewConstraintsToAlgorithmFormat(
        student.constraints,
        student,
      );
    }

    // === Fallback to legacy constraint extraction ===
    const constraints = {
      allowedDays: new Set(),
      allowedTimeRanges: [],
      excludedTimeRanges: [],
      duration: this.parseDuration(student.rawData?.时长) * 12, // Convert to 5-min slots
      frequency: student.rawData?.频次 || "1次/周",
    };

    console.log(`[AlgorithmAdapter] 提取学生 ${student.name} 的约束，原始数据:`, {
      hasParsedData: !!student.parsedData,
      hasConstraints: !!student.constraints,
      hasScheduling: !!student.scheduling,
      hasAvailability: !!availability,
      studentKeys: Object.keys(student)
    });
    
    // 优先使用 parsedData（智能推荐和可视化编辑器修改的数据）
    if (student.parsedData) {
      console.log(`[AlgorithmAdapter] ✅ 使用 student.parsedData:`, student.parsedData);
      
      // 处理 allowedDays
      if (student.parsedData.allowedDays) {
        const days = Array.isArray(student.parsedData.allowedDays) 
          ? student.parsedData.allowedDays 
          : Array.from(student.parsedData.allowedDays);
        days.forEach(day => constraints.allowedDays.add(day));
        console.log(`[AlgorithmAdapter]   添加 allowedDays:`, days);
      }
      
      // 处理 allowedTimeRanges
      if (student.parsedData.allowedTimeRanges && student.parsedData.allowedTimeRanges.length > 0) {
        console.log(`[AlgorithmAdapter]   处理 ${student.parsedData.allowedTimeRanges.length} 个时间范围`);
        student.parsedData.allowedTimeRanges.forEach((range, idx) => {
          console.log(`[AlgorithmAdapter]     范围 ${idx + 1}:`, range);
          
          // 如果 range 没有 day 字段，应用到所有 allowedDays
          if (range.day !== undefined && range.day !== null) {
            constraints.allowedTimeRanges.push({
              day: range.day,
              startSlot: range.start || range.startSlot,
              endSlot: range.end || range.endSlot
            });
          } else {
            // 没有指定 day，应用到所有允许的天数
            const allowedDays = Array.from(constraints.allowedDays);
            console.log(`[AlgorithmAdapter]     无 day 字段，应用到: [${allowedDays}]`);
            if (allowedDays.length === 0) {
              // 如果还没有 allowedDays，使用工作日
              [1, 2, 3, 4, 5].forEach(day => {
                constraints.allowedDays.add(day);
                constraints.allowedTimeRanges.push({
                  day,
                  startSlot: range.start || range.startSlot,
                  endSlot: range.end || range.endSlot
                });
              });
            } else {
              allowedDays.forEach(day => {
                constraints.allowedTimeRanges.push({
                  day,
                  startSlot: range.start || range.startSlot,
                  endSlot: range.end || range.endSlot
                });
              });
            }
          }
        });
      }
    } else if (student.constraints && (student.constraints.allowedDays?.size > 0 || student.constraints.allowedTimeRanges?.length > 0)) {
      // 如果没有 parsedData，但有 constraints（来自智能推荐）
      console.log(`[AlgorithmAdapter] ✅ 使用 student.constraints:`, student.constraints);
      
      if (student.constraints.allowedDays) {
        const days = student.constraints.allowedDays instanceof Set
          ? Array.from(student.constraints.allowedDays)
          : student.constraints.allowedDays;
        days.forEach(day => constraints.allowedDays.add(day));
      }
      
      if (student.constraints.allowedTimeRanges) {
        constraints.allowedTimeRanges = student.constraints.allowedTimeRanges.map(r => ({
          day: r.day,
          startSlot: r.startSlot,
          endSlot: r.endSlot
        }));
      }
      
      if (student.constraints.excludedTimeRanges) {
        constraints.excludedTimeRanges = student.constraints.excludedTimeRanges;
      }
    } else if (availability?.parsedData?.slots) {
      // 如果没有 parsedData，使用 availability
      availability.parsedData.slots.forEach((slot) => {
        constraints.allowedDays.add(slot.dayOfWeek);

        constraints.allowedTimeRanges.push({
          day: slot.dayOfWeek,
          startSlot: this.timeToSlot(slot.startTime),
          endSlot: this.timeToSlot(slot.endTime),
        });
      });
    }

    // If no availability data, use default weekdays afternoon
    if (constraints.allowedDays.size === 0) {
      [1, 2, 3, 4, 5].forEach((day) => {
        constraints.allowedDays.add(day);
        constraints.allowedTimeRanges.push({
          day,
          startSlot: 48, // 13:00
          endSlot: 108, // 18:00
        });
      });
    }

    console.log(`[AlgorithmAdapter] 提取的约束:`, {
      allowedDays: Array.from(constraints.allowedDays),
      allowedTimeRanges: constraints.allowedTimeRanges,
      duration: constraints.duration,
      frequency: constraints.frequency
    });

    return constraints;
  }

  /**
   * Convert new 10-type constraints to algorithm format
   * 将新的10类约束转换为算法格式
   */
  convertNewConstraintsToAlgorithmFormat(newConstraints, student) {
    const algorithmConstraints = {
      allowedDays: new Set(),
      allowedTimeRanges: [],
      excludedTimeRanges: [],
      duration: 24, // Default 2 hours = 24 * 5min slots
      frequency: "2次/周",
      fixedSlots: [],
      resourcePreferences: {
        teachers: { include: [], exclude: [], prefer: [] },
        campuses: { include: [], exclude: [], prefer: [] },
      },
    };

    console.log(
      `[AlgorithmAdapter] 转换约束 - 学生: ${student.name}, 约束数量: ${newConstraints.length}`,
    );

    for (const constraint of newConstraints) {
      console.log(`[AlgorithmAdapter] 处理约束类型: ${constraint.kind}`);
      switch (constraint.kind) {
        case "time_window":
          this._applyTimeWindow(constraint, algorithmConstraints);
          break;

        case "blackout":
          this._applyBlackout(constraint, algorithmConstraints);
          break;

        case "fixed_slot":
          this._applyFixedSlot(constraint, algorithmConstraints);
          break;

        case "session_plan":
          this._applySessionPlan(constraint, algorithmConstraints);
          break;

        case "resource_preference":
          this._applyResourcePreference(constraint, algorithmConstraints);
          break;

        // Other constraint types can be added here as needed
      }
    }

    // If no allowed days set, default to weekdays
    if (algorithmConstraints.allowedDays.size === 0) {
      console.log(`[AlgorithmAdapter] 警告：没有允许的天数，使用默认值`);
      [1, 2, 3, 4, 5].forEach((day) =>
        algorithmConstraints.allowedDays.add(day),
      );
      algorithmConstraints.allowedTimeRanges.push({
        day: 1,
        startSlot: 36, // 09:00
        endSlot: 108, // 21:00
      });
    }

    console.log(
      `[AlgorithmAdapter] 最终约束 - 允许天数: ${Array.from(algorithmConstraints.allowedDays).join(",")}, 时间段: ${algorithmConstraints.allowedTimeRanges.length}, 时长: ${algorithmConstraints.duration}槽`,
    );

    return algorithmConstraints;
  }

  _applyTimeWindow(constraint, target) {
    constraint.weekdays?.forEach((day) => {
      target.allowedDays.add(day);
    });

    constraint.timeRanges?.forEach((range) => {
      constraint.weekdays?.forEach((day) => {
        target.allowedTimeRanges.push({
          day,
          startSlot: this.timeToSlot(range.start),
          endSlot: this.timeToSlot(range.end),
        });
      });
    });
  }

  _applyBlackout(constraint, target) {
    constraint.timeRanges?.forEach((range) => {
      constraint.weekdays?.forEach((day) => {
        target.excludedTimeRanges.push({
          day,
          startSlot: this.timeToSlot(range.start),
          endSlot: this.timeToSlot(range.end),
        });
      });
    });
  }

  _applyFixedSlot(constraint, target) {
    constraint.slots?.forEach((slot) => {
      const startDate = new Date(slot.start);
      const endDate = new Date(slot.end);
      target.fixedSlots.push({
        day: startDate.getDay() || 7, // 0 (Sunday) -> 7
        startSlot: this.timeToSlot(startDate.toTimeString().substring(0, 5)),
        endSlot: this.timeToSlot(endDate.toTimeString().substring(0, 5)),
        date: startDate.toISOString().split("T")[0],
      });
    });
  }

  _applySessionPlan(constraint, target) {
    if (constraint.sessionDurationMin) {
      target.duration = Math.round(constraint.sessionDurationMin / 5); // Convert to 5-min slots
    }
    if (constraint.sessionsPerWeek) {
      target.frequency = `${constraint.sessionsPerWeek}次/周`;
    }
  }

  _applyResourcePreference(constraint, target) {
    const resourceType = constraint.resourceType;

    if (resourceType === "teacher") {
      target.resourcePreferences.teachers.include = constraint.include || [];
      target.resourcePreferences.teachers.exclude = constraint.exclude || [];
      target.resourcePreferences.teachers.prefer = constraint.prefer || [];
    } else if (resourceType === "campus") {
      target.resourcePreferences.campuses.include = constraint.include || [];
      target.resourcePreferences.campuses.exclude = constraint.exclude || [];
      target.resourcePreferences.campuses.prefer = constraint.prefer || [];
    }
  }

  /**
   * Adapt teachers data
   */
  adaptTeachers(teachers) {
    console.log(
      `[AlgorithmAdapter.adaptTeachers] 开始适配 ${teachers.length} 个教师`,
    );

    const adapted = teachers.map((teacher, index) => {
      const availability =
        teacher.availability || teacher.parsedAvailability || {};
      const availableSlots = this.parseTeacherAvailability(availability);

      if (index === 0) {
        console.log(
          `[AlgorithmAdapter.adaptTeachers] 第1个教师 ${teacher.name}:`,
          {
            hasAvailability: !!availability,
            availabilityType: typeof availability,
            hasSlots: !!availability.slots,
            slotsCount: availability.slots?.length,
            parsedSlotsCount: availableSlots?.length,
            subjects: this.parseSubjects(
              teacher.可教科目 || teacher.subjects || "",
            ),
            campus: this.parseCampus(teacher.校区 || teacher.campus || ""),
          },
        );
      }

      return {
        id:
          teacher.id ||
          `teacher-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: teacher.姓名 || teacher.name || "未知教师",
        subjects: this.parseSubjects(
          teacher.可教科目 || teacher.subjects || "",
        ),
        campus: this.parseCampus(teacher.校区 || teacher.campus || ""),
        availableTimeSlots: availableSlots,
        hourlyRate: parseFloat(teacher.时薪) || 300,
        maxHoursPerWeek: 40,
        originalData: teacher,
      };
    });

    console.log(
      `[AlgorithmAdapter.adaptTeachers] 适配完成，输出 ${adapted.length} 个教师`,
    );
    return adapted;
  }

  /**
   * Parse teacher availability to time slots
   */
  parseTeacherAvailability(availability) {
    const slots = [];

    if (!availability || !availability.slots) {
      // Default: weekdays 9-17
      for (let day = 1; day <= 5; day++) {
        slots.push({
          day,
          startSlot: 0,
          endSlot: 96,
        });
      }
      return slots;
    }

    availability.slots.forEach((slot) => {
      slots.push({
        day: slot.dayOfWeek,
        startSlot: this.timeToSlot(slot.startTime),
        endSlot: this.timeToSlot(slot.endTime),
      });
    });

    return slots;
  }

  /**
   * Adapt classrooms data
   */
  adaptClassrooms(classrooms) {
    return classrooms.map((classroom) => ({
      id:
        classroom.id ||
        `classroom-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: classroom.教室名 || classroom.name || "未知教室",
      campus: classroom.校区 || classroom.campus || "高马",
      capacity: parseInt(classroom.容量) || 2,
      type: classroom.类型 || "1v1教室",
      availableTimeSlots: this.getDefaultClassroomAvailability(),
      originalData: classroom,
    }));
  }

  /**
   * Get default classroom availability (all week, all day)
   */
  getDefaultClassroomAvailability() {
    const slots = [];
    for (let day = 0; day <= 6; day++) {
      slots.push({
        day,
        startSlot: 0,
        endSlot: 150, // Full day
      });
    }
    return slots;
  }

  /**
   * Run greedy algorithm
   */
  runGreedyAlgorithm(adaptedData, options) {
    const scheduler = new GreedyScheduler({
      teachers: adaptedData.teachers,
      students: adaptedData.students,
      granularity: adaptedData.granularity,
      onProgress: options.onProgress,
    });

    return scheduler.schedule();
  }

  /**
   * Run triple match algorithm
   */
  runTripleMatchAlgorithm(adaptedData, options) {
    const scheduler = new TripleMatchScheduler({
      students: adaptedData.students,
      teachers: adaptedData.teachers,
      classrooms: adaptedData.classrooms,
      granularity: adaptedData.granularity,
      onProgress: options.onProgress,
    });

    return scheduler.schedule();
  }

  /**
   * Adapt algorithm output to unified format
   * 将算法输出转换为统一格式
   */
  adaptOutputData(
    result,
    originalStudents,
    originalTeachers,
    originalClassrooms,
  ) {
    const courses = result.courses || [];
    const conflicts = result.conflicts || [];
    const totalStudents = result.stats?.totalStudents || originalStudents?.length || 0;
    const scheduledStudents = result.stats?.scheduledStudents || 0;
    
    // 🔥 添加 success 字段：如果排课了任何课程，就认为成功
    const success = courses.length > 0 || (totalStudents > 0 && conflicts.length < totalStudents);
    
    return {
      success: success,
      courses: courses,
      conflicts: conflicts,
      stats: {
        totalStudents: totalStudents,
        scheduledStudents: scheduledStudents,
        unscheduledStudents: result.stats?.unscheduledStudents || 0,
        successRate: result.stats?.successRate || 0,
        executionTime: result.stats?.executionTime || 0,
        totalCourses: courses.length,
      },
      algorithmType: this.algorithmType,
    };
  }

  /**
   * Helper: Parse duration string to hours
   */
  parseDuration(durationStr) {
    if (!durationStr) return 2;
    const str = String(durationStr);
    const match = str.match(/([\d.]+)/);
    return match ? parseFloat(match[1]) : 2;
  }

  /**
   * Helper: Parse subjects string to array
   */
  parseSubjects(subjectsStr) {
    if (!subjectsStr) return [];
    if (Array.isArray(subjectsStr)) return subjectsStr;

    return String(subjectsStr)
      .split(/[,，、]/)
      .map((s) => s.trim())
      .filter((s) => s);
  }

  /**
   * Helper: Parse campus string to array
   */
  parseCampus(campusStr) {
    if (!campusStr) return ["高马", "本校"];
    if (Array.isArray(campusStr)) return campusStr;

    const parsed = String(campusStr)
      .split(/[,，、]/)
      .map((s) => s.trim())
      .filter((s) => s);

    return parsed.length > 0 ? parsed : ["高马", "本校"];
  }

  /**
   * Helper: Convert time string to slot index
   * Time format: "HH:MM" or "HH:MM:SS"
   */
  timeToSlot(timeStr) {
    if (!timeStr) return 0;

    const parts = timeStr.split(":");
    const hour = parseInt(parts[0]);
    const minute = parseInt(parts[1] || 0);

    // Assuming 9:00 as slot 0
    const startHour = 9;
    const totalMinutes = (hour - startHour) * 60 + minute;
    return Math.floor(totalMinutes / 5); // 5-minute slots
  }

  /**
   * Helper: Convert slot index to time string
   */
  slotToTime(slotIndex) {
    const startHour = 9;
    const totalMinutes = slotIndex * 5;
    const hour = startHour + Math.floor(totalMinutes / 60);
    const minute = totalMinutes % 60;
    return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
  }
}

/**
 * Factory functions for easy use
 */
export function createGreedyScheduler() {
  return new SchedulingAlgorithmAdapter("greedy");
}

export function createTripleMatchScheduler() {
  return new SchedulingAlgorithmAdapter("triple-match");
}
