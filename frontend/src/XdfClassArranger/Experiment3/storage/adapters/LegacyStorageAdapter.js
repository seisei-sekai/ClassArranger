/**
 * LegacyStorageAdapter - 旧系统存储适配器
 * 
 * 在Repository和旧localStorage Service之间提供桥接
 * 允许新旧系统共存
 */

import {
  studentsStorage,
  teachersStorage,
  classroomsStorage,
  scheduledCoursesStorage
} from '../../../services/localStorageService.js';
import { StudentSchema, TeacherSchema, ClassroomSchema } from '../schemas/index.js';

/**
 * 从旧格式转换到V4格式
 */
export class LegacyStorageAdapter {
  /**
   * 同步旧localStorage到tempMongoDB
   */
  static async syncFromLegacyStorage(repositories) {
    console.log('[LegacyAdapter] Syncing from legacy storage...');
    
    try {
      // 加载旧数据
      const oldStudents = studentsStorage.load();
      const oldTeachers = teachersStorage.load();
      const oldClassrooms = classroomsStorage.load();
      
      // 检查tempMongoDB是否为空
      const existingStudentsCount = await repositories.students.count();
      const existingTeachersCount = await repositories.teachers.count();
      const existingClassroomsCount = await repositories.classrooms.count();
      
      console.log('[LegacyAdapter] Existing data:', {
        students: existingStudentsCount,
        teachers: existingTeachersCount,
        classrooms: existingClassroomsCount
      });
      
      // 如果tempMongoDB为空且localStorage有数据，进行同步
      if (existingStudentsCount === 0 && oldStudents.length > 0) {
        console.log('[LegacyAdapter] Syncing students...');
        for (const student of oldStudents) {
          const v4Student = this.convertStudentToV4(student);
          await repositories.students.create(v4Student);
        }
      }
      
      if (existingTeachersCount === 0 && oldTeachers.length > 0) {
        console.log('[LegacyAdapter] Syncing teachers...');
        for (const teacher of oldTeachers) {
          const v4Teacher = this.convertTeacherToV4(teacher);
          await repositories.teachers.create(v4Teacher);
        }
      }
      
      if (existingClassroomsCount === 0 && oldClassrooms.length > 0) {
        console.log('[LegacyAdapter] Syncing classrooms...');
        for (const classroom of oldClassrooms) {
          const v4Classroom = this.convertClassroomToV4(classroom);
          await repositories.classrooms.create(v4Classroom);
        }
      }
      
      console.log('[LegacyAdapter] Sync completed');
      return { success: true };
    } catch (error) {
      console.error('[LegacyAdapter] Sync failed:', error);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * 同步tempMongoDB到旧localStorage
   */
  static async syncToLegacyStorage(repositories) {
    console.log('[LegacyAdapter] Syncing to legacy storage...');
    
    try {
      const students = await repositories.students.findAll();
      const teachers = await repositories.teachers.findAll();
      const classrooms = await repositories.classrooms.findAll();
      
      // 转换为旧格式
      const oldStudents = students.map(s => this.convertStudentFromV4(s));
      const oldTeachers = teachers.map(t => this.convertTeacherFromV4(t));
      const oldClassrooms = classrooms.map(c => this.convertClassroomFromV4(c));
      
      // 保存到旧存储
      studentsStorage.save(oldStudents);
      teachersStorage.save(oldTeachers);
      classroomsStorage.save(oldClassrooms);
      
      console.log('[LegacyAdapter] Sync to legacy completed');
      return { success: true };
    } catch (error) {
      console.error('[LegacyAdapter] Sync to legacy failed:', error);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * 转换学生到V4格式
   */
  static convertStudentToV4(oldStudent) {
    return {
      name: oldStudent.name || '',
      campus: oldStudent.campus || '',
      manager: oldStudent.manager || '',
      batch: oldStudent.batch || '',
      subject: oldStudent.subject || '',
      level: oldStudent.level || '',
      
      courseHours: oldStudent.courseHours || {
        total: 0,
        used: 0,
        remaining: 0,
        weekly: 0,
        timesPerWeek: 1,
        hoursPerClass: 2
      },
      
      scheduling: {
        timeConstraints: {
          allowedDays: this.extractAllowedDays(oldStudent),
          allowedTimeRanges: this.extractAllowedTimeRanges(oldStudent),
          excludedTimeRanges: this.extractExcludedTimeRanges(oldStudent)
        },
        frequencyConstraints: {
          frequency: oldStudent.frequency || '1次/周',
          duration: this.parseDuration(oldStudent.duration),
          isRecurringFixed: oldStudent.isRecurringFixed ?? true,
          schedulingMode: oldStudent.schedulingMode || 'fixed'
        },
        teacherConstraints: {
          preferredTeachers: oldStudent.preferredTeacher ? [oldStudent.preferredTeacher] : [],
          excludedTeachers: []
        },
        modeConstraints: {
          mode: oldStudent.mode || 'offline',
          preferredClassrooms: []
        }
      },
      
      _raw: {
        excelData: oldStudent.rawData || '',
        aiParsingResult: oldStudent.parsedData || null,
        originalConstraints: oldStudent.constraints || null
      },
      
      _ui: {
        selected: oldStudent.selected || false,
        showAvailability: oldStudent.showAvailability || false,
        color: oldStudent.color || this.generateColor()
      }
    };
  }
  
  /**
   * 从V4格式转换学生
   */
  static convertStudentFromV4(v4Student) {
    return {
      id: v4Student._id,
      name: v4Student.name,
      campus: v4Student.campus,
      manager: v4Student.manager,
      batch: v4Student.batch,
      subject: v4Student.subject,
      level: v4Student.level,
      
      courseHours: v4Student.courseHours,
      
      // 约束 - 使用scheduling作为唯一来源
      constraints: {
        allowedDays: new Set(v4Student.scheduling.timeConstraints.allowedDays),
        allowedTimeRanges: v4Student.scheduling.timeConstraints.allowedTimeRanges,
        excludedTimeRanges: v4Student.scheduling.timeConstraints.excludedTimeRanges,
        duration: v4Student.scheduling.frequencyConstraints.duration / 10,
        frequency: v4Student.scheduling.frequencyConstraints.frequency
      },
      
      // 保持parsedData为约束的副本（向后兼容）
      parsedData: {
        allowedDays: v4Student.scheduling.timeConstraints.allowedDays,
        allowedTimeRanges: v4Student.scheduling.timeConstraints.allowedTimeRanges.map(r => ({
          day: r.day,
          start: r.startSlot,
          end: r.endSlot
        })),
        excludedTimeRanges: v4Student.scheduling.timeConstraints.excludedTimeRanges
      },
      
      frequency: v4Student.scheduling.frequencyConstraints.frequency,
      duration: `${v4Student.scheduling.frequencyConstraints.duration / 60}小时`,
      isRecurringFixed: v4Student.scheduling.frequencyConstraints.isRecurringFixed,
      schedulingMode: v4Student.scheduling.frequencyConstraints.schedulingMode,
      mode: v4Student.scheduling.modeConstraints.mode,
      preferredTeacher: v4Student.scheduling.teacherConstraints.preferredTeachers[0] || null,
      
      rawData: v4Student._raw.excelData,
      selected: v4Student._ui.selected,
      showAvailability: v4Student._ui.showAvailability,
      color: v4Student._ui.color
    };
  }
  
  /**
   * 转换教师到V4格式
   */
  static convertTeacherToV4(oldTeacher) {
    return {
      name: oldTeacher.name || '',
      level: oldTeacher.level || '',
      subject: oldTeacher.subject || '',
      major: oldTeacher.major || '',
      
      teaching: {
        subjects: oldTeacher.subjects || [],
        campuses: oldTeacher.campuses || (oldTeacher.campus ? [oldTeacher.campus] : []),
        modes: oldTeacher.modes || ['offline'],
        hourlyRate: oldTeacher.hourlyRate || 0,
        maxHoursPerWeek: oldTeacher.maxHoursPerWeek || 40
      },
      
      availability: {
        timeSlots: oldTeacher.availableTimeSlots || oldTeacher.availability?.slots || []
      },
      
      _raw: {
        excelData: oldTeacher.rawData || '',
        availabilityText: oldTeacher.availabilityText || ''
      },
      
      _ui: {
        showAvailability: oldTeacher.showAvailability || false,
        color: oldTeacher.color || this.generateColor()
      }
    };
  }
  
  /**
   * 从V4格式转换教师
   */
  static convertTeacherFromV4(v4Teacher) {
    return {
      id: v4Teacher._id,
      name: v4Teacher.name,
      level: v4Teacher.level,
      subject: v4Teacher.subject,
      major: v4Teacher.major,
      
      subjects: v4Teacher.teaching.subjects,
      campuses: v4Teacher.teaching.campuses,
      campus: v4Teacher.teaching.campuses[0] || '',
      modes: v4Teacher.teaching.modes,
      hourlyRate: v4Teacher.teaching.hourlyRate,
      maxHoursPerWeek: v4Teacher.teaching.maxHoursPerWeek,
      
      availableTimeSlots: v4Teacher.availability.timeSlots,
      availability: {
        slots: v4Teacher.availability.timeSlots
      },
      
      rawData: v4Teacher._raw.excelData,
      availabilityText: v4Teacher._raw.availabilityText,
      showAvailability: v4Teacher._ui.showAvailability,
      color: v4Teacher._ui.color
    };
  }
  
  /**
   * 转换教室到V4格式
   */
  static convertClassroomToV4(oldClassroom) {
    return {
      name: oldClassroom.name || oldClassroom.entryName || oldClassroom.roomName || '',
      campus: oldClassroom.campus || '',
      area: oldClassroom.area || '',
      type: oldClassroom.type || '1v1教室',
      capacity: oldClassroom.capacity || 2,
      priority: oldClassroom.priority || 3,
      
      availability: {
        timeSlots: oldClassroom.availableTimeRanges || []
      },
      
      _raw: {
        excelData: oldClassroom.rawData || ''
      }
    };
  }
  
  /**
   * 从V4格式转换教室
   */
  static convertClassroomFromV4(v4Classroom) {
    return {
      id: v4Classroom._id,
      name: v4Classroom.name,
      campus: v4Classroom.campus,
      area: v4Classroom.area,
      type: v4Classroom.type,
      capacity: v4Classroom.capacity,
      priority: v4Classroom.priority,
      
      availableTimeRanges: v4Classroom.availability.timeSlots,
      
      rawData: v4Classroom._raw.excelData
    };
  }
  
  // 辅助方法
  static extractAllowedDays(oldStudent) {
    if (oldStudent.parsedData?.allowedDays) {
      return Array.isArray(oldStudent.parsedData.allowedDays)
        ? oldStudent.parsedData.allowedDays
        : Array.from(oldStudent.parsedData.allowedDays);
    }
    if (oldStudent.constraints?.allowedDays) {
      return oldStudent.constraints.allowedDays instanceof Set
        ? Array.from(oldStudent.constraints.allowedDays)
        : oldStudent.constraints.allowedDays;
    }
    return [1, 2, 3, 4, 5];
  }
  
  static extractAllowedTimeRanges(oldStudent) {
    if (oldStudent.parsedData?.allowedTimeRanges?.length > 0) {
      return oldStudent.parsedData.allowedTimeRanges.map(r => ({
        day: r.day,
        startSlot: r.start || r.startSlot,
        endSlot: r.end || r.endSlot
      }));
    }
    if (oldStudent.constraints?.allowedTimeRanges?.length > 0) {
      return oldStudent.constraints.allowedTimeRanges.map(r => ({
        day: r.day,
        startSlot: r.startSlot,
        endSlot: r.endSlot
      }));
    }
    const allowedDays = this.extractAllowedDays(oldStudent);
    return allowedDays.map(day => ({
      day,
      startSlot: 48,
      endSlot: 108
    }));
  }
  
  static extractExcludedTimeRanges(oldStudent) {
    if (oldStudent.parsedData?.excludedTimeRanges?.length > 0) {
      return oldStudent.parsedData.excludedTimeRanges.map(r => ({
        day: r.day,
        startSlot: r.start || r.startSlot,
        endSlot: r.end || r.endSlot
      }));
    }
    if (oldStudent.constraints?.excludedTimeRanges?.length > 0) {
      return oldStudent.constraints.excludedTimeRanges.map(r => ({
        day: r.day,
        startSlot: r.startSlot,
        endSlot: r.endSlot
      }));
    }
    return [];
  }
  
  static parseDuration(duration) {
    if (!duration) return 120;
    if (typeof duration === 'number') return duration * 60;
    if (typeof duration === 'string') {
      const match = duration.match(/(\d+\.?\d*)/);
      if (match) return parseFloat(match[1]) * 60;
    }
    return 120;
  }
  
  static generateColor() {
    const colors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A',
      '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E2'
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  }
}

export default LegacyStorageAdapter;
