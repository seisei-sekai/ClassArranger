/**
 * Example Data Generator for Experiment2
 * 示例数据生成器
 * 
 * Generates realistic example data for testing
 */

import { 
  createStudent, 
  createTeacher, 
  createClassroom,
  SUBJECTS,
  TIME_GRANULARITY
} from './realBusinessDataStructures.js';

/**
 * Generate example data
 */
export function generateExampleData() {
  const granularity = TIME_GRANULARITY.FIVE_MIN;
  
  // Example teachers
  const teachers = [
    createTeacher({
      name: '王老师',
      subjects: ['数学', '物理'],
      campus: ['高马', '本校'],
      hourlyRate: 350,
      availableTimeSlots: [
        { day: 1, startSlot: 0, endSlot: 96 },   // Mon 9-17
        { day: 3, startSlot: 0, endSlot: 96 },   // Wed 9-17
        { day: 5, startSlot: 48, endSlot: 120 }  // Fri 13-19
      ]
    }),
    createTeacher({
      name: '李老师',
      subjects: ['英语', '日语'],
      campus: ['高马'],
      hourlyRate: 300,
      availableTimeSlots: [
        { day: 2, startSlot: 24, endSlot: 108 },  // Tue 11-18
        { day: 4, startSlot: 24, endSlot: 108 },  // Thu 11-18
        { day: 6, startSlot: 0, endSlot: 72 }     // Sat 9-15
      ]
    }),
    createTeacher({
      name: '张老师',
      subjects: ['数学', '化学', '生物'],
      campus: ['本校'],
      hourlyRate: 320,
      availableTimeSlots: [
        { day: 1, startSlot: 48, endSlot: 120 },  // Mon 13-19
        { day: 3, startSlot: 48, endSlot: 120 },  // Wed 13-19
        { day: 5, startSlot: 0, endSlot: 96 }     // Fri 9-17
      ]
    }),
    createTeacher({
      name: '赵老师',
      subjects: ['历史', '地理', '政治'],
      campus: ['高马', '本校'],
      hourlyRate: 280,
      availableTimeSlots: [
        { day: 2, startSlot: 0, endSlot: 96 },    // Tue 9-17
        { day: 4, startSlot: 0, endSlot: 96 },    // Thu 9-17
      ]
    }),
    createTeacher({
      name: '陈老师',
      subjects: ['论文指导', '计算机'],
      campus: ['高马'],
      hourlyRate: 400,
      availableTimeSlots: [
        { day: 6, startSlot: 0, endSlot: 120 },   // Sat 9-19
        { day: 0, startSlot: 0, endSlot: 120 }    // Sun 9-19
      ]
    })
  ];

  // Example students
  const students = [
    createStudent({
      name: '张三',
      campus: '高马',
      manager: '徐笑然',
      batch: '2602',
      subject: '数学',
      frequency: '2次',
      duration: 2,
      format: '线下',
      totalHours: 80,
      hoursUsed: 10,
      constraints: {
        allowedDays: new Set([1, 3, 5]),
        allowedTimeRanges: [
          { day: 1, startSlot: 48, endSlot: 108 },  // Mon 13-18
          { day: 3, startSlot: 48, endSlot: 108 },  // Wed 13-18
          { day: 5, startSlot: 48, endSlot: 108 }   // Fri 13-18
        ],
        duration: 24, // 2 hours
        frequency: '2次/周'
      }
    }),
    createStudent({
      name: '李四',
      campus: '高马',
      manager: '胡润江',
      batch: '2602',
      subject: '英语',
      frequency: '2次',
      duration: 1.5,
      format: '线下',
      totalHours: 60,
      hoursUsed: 5,
      constraints: {
        allowedDays: new Set([2, 4]),
        allowedTimeRanges: [
          { day: 2, startSlot: 48, endSlot: 96 },   // Tue 13-17
          { day: 4, startSlot: 48, endSlot: 96 }    // Thu 13-17
        ],
        duration: 18, // 1.5 hours
        frequency: '2次/周'
      }
    }),
    createStudent({
      name: '王五',
      campus: '本校',
      manager: '张晨',
      batch: '2602',
      subject: '物理',
      frequency: '1次',
      duration: 2,
      format: '线下',
      totalHours: 40,
      hoursUsed: 0,
      constraints: {
        allowedDays: new Set([1]),
        allowedTimeRanges: [
          { day: 1, startSlot: 0, endSlot: 72 }     // Mon 9-15
        ],
        duration: 24,
        frequency: '1次/周'
      }
    }),
    createStudent({
      name: '赵六',
      campus: '高马',
      manager: '陈语',
      batch: '2602',
      subject: '日语',
      frequency: '3次',
      duration: 1,
      format: '线上',
      totalHours: 60,
      hoursUsed: 15,
      constraints: {
        allowedDays: new Set([2, 4, 6]),
        allowedTimeRanges: [
          { day: 2, startSlot: 60, endSlot: 108 },  // Tue 14-18
          { day: 4, startSlot: 60, endSlot: 108 },  // Thu 14-18
          { day: 6, startSlot: 24, endSlot: 84 }    // Sat 11-16
        ],
        duration: 12, // 1 hour
        frequency: '3次/周'
      }
    }),
    createStudent({
      name: '孙七',
      campus: '本校',
      manager: '赵微',
      batch: '2504',
      subject: '化学',
      frequency: '2次',
      duration: 2,
      format: '线下',
      totalHours: 80,
      hoursUsed: 20,
      constraints: {
        allowedDays: new Set([3, 5]),
        allowedTimeRanges: [
          { day: 3, startSlot: 48, endSlot: 120 },  // Wed 13-19
          { day: 5, startSlot: 24, endSlot: 96 }    // Fri 11-17
        ],
        duration: 24,
        frequency: '2次/周'
      }
    })
  ];

  // Example classrooms
  const classrooms = [
    createClassroom({
      name: 'A101',
      campus: '高马',
      capacity: 2,
      type: '1v1教室'
    }),
    createClassroom({
      name: 'A102',
      campus: '高马',
      capacity: 2,
      type: '1v1教室'
    }),
    createClassroom({
      name: 'A103',
      campus: '高马',
      capacity: 2,
      type: '1v1教室'
    }),
    createClassroom({
      name: 'B201',
      campus: '本校',
      capacity: 2,
      type: '1v1教室'
    }),
    createClassroom({
      name: 'B202',
      campus: '本校',
      capacity: 2,
      type: '1v1教室'
    })
  ];

  // Set default availability for all classrooms (all week, all day)
  classrooms.forEach(classroom => {
    classroom.availableTimeSlots = [];
    for (let day = 0; day <= 6; day++) {
      classroom.availableTimeSlots.push({
        day,
        startSlot: 0,
        endSlot: granularity.slotsPerDay
      });
    }
  });

  return {
    students,
    teachers,
    classrooms
  };
}
