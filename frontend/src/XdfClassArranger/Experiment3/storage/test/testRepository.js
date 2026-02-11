/**
 * Repository 测试文件
 * 
 * 测试tempFrontEndMongoDB和Repository的功能
 */

import { StudentRepository, TeacherRepository, ClassroomRepository } from '../index.js';
import { createDefaultStudent } from '../schemas/StudentSchema.js';
import { createDefaultTeacher } from '../schemas/TeacherSchema.js';
import { createDefaultClassroom } from '../schemas/ClassroomSchema.js';

/**
 * 测试学生Repository
 */
export async function testStudentRepository() {
  console.log('\n===== 测试 StudentRepository =====');
  
  const repo = new StudentRepository();
  
  try {
    // 测试创建
    const student1 = createDefaultStudent({
      name: '测试学生1',
      campus: '新宿校区',
      subject: '数学',
      scheduling: {
        timeConstraints: {
          allowedDays: [1, 2, 3],
          allowedTimeRanges: [
            { day: 1, startSlot: 30, endSlot: 60 },
            { day: 2, startSlot: 30, endSlot: 60 },
            { day: 3, startSlot: 30, endSlot: 60 }
          ],
          excludedTimeRanges: []
        },
        frequencyConstraints: {
          frequency: '2次/周',
          duration: 120,
          isRecurringFixed: true,
          schedulingMode: 'fixed'
        }
      }
    });
    
    const created = await repo.create(student1);
    console.log('✓ 创建学生成功:', created._id);
    
    // 测试查找
    const found = await repo.findById(created._id);
    console.log('✓ 查找学生成功:', found.name);
    
    // 测试更新
    const updated = await repo.updateById(created._id, {
      campus: '涩谷校区'
    });
    console.log('✓ 更新学生成功:', updated.campus);
    
    // 测试查询
    const byCampus = await repo.findByCampus('涩谷校区');
    console.log('✓ 按校区查询成功:', byCampus.length);
    
    // 测试删除
    await repo.deleteById(created._id);
    console.log('✓ 删除学生成功');
    
    const countAfterDelete = await repo.count();
    console.log('✓ 删除后计数:', countAfterDelete);
    
    console.log('✅ StudentRepository 所有测试通过\n');
    return { success: true };
  } catch (error) {
    console.error('❌ StudentRepository 测试失败:', error);
    return { success: false, error };
  }
}

/**
 * 测试教师Repository
 */
export async function testTeacherRepository() {
  console.log('===== 测试 TeacherRepository =====');
  
  const repo = new TeacherRepository();
  
  try {
    const teacher1 = createDefaultTeacher({
      name: '测试教师1',
      teaching: {
        subjects: ['数学', '物理'],
        campuses: ['新宿校区', '涩谷校区'],
        modes: ['online', 'offline'],
        maxHoursPerWeek: 40
      },
      availability: {
        timeSlots: [
          { day: 1, startSlot: 24, endSlot: 72 },
          { day: 2, startSlot: 24, endSlot: 72 }
        ]
      }
    });
    
    const created = await repo.create(teacher1);
    console.log('✓ 创建教师成功:', created._id);
    
    const bySubject = await repo.findBySubject('数学');
    console.log('✓ 按科目查询成功:', bySubject.length);
    
    const byCampus = await repo.findByCampus('新宿校区');
    console.log('✓ 按校区查询成功:', byCampus.length);
    
    await repo.deleteById(created._id);
    console.log('✓ 删除教师成功');
    
    console.log('✅ TeacherRepository 所有测试通过\n');
    return { success: true };
  } catch (error) {
    console.error('❌ TeacherRepository 测试失败:', error);
    return { success: false, error };
  }
}

/**
 * 测试教室Repository
 */
export async function testClassroomRepository() {
  console.log('===== 测试 ClassroomRepository =====');
  
  const repo = new ClassroomRepository();
  
  try {
    const classroom1 = createDefaultClassroom({
      name: '测试教室1',
      campus: '新宿校区',
      type: '1v1教室',
      capacity: 2,
      availability: {
        timeSlots: [
          { day: 1, startSlot: 0, endSlot: 150 },
          { day: 2, startSlot: 0, endSlot: 150 }
        ]
      }
    });
    
    const created = await repo.create(classroom1);
    console.log('✓ 创建教室成功:', created._id);
    
    const byCampus = await repo.findByCampus('新宿校区');
    console.log('✓ 按校区查询成功:', byCampus.length);
    
    const byCapacity = await repo.findByMinCapacity(2);
    console.log('✓ 按容量查询成功:', byCapacity.length);
    
    await repo.deleteById(created._id);
    console.log('✓ 删除教室成功');
    
    console.log('✅ ClassroomRepository 所有测试通过\n');
    return { success: true };
  } catch (error) {
    console.error('❌ ClassroomRepository 测试失败:', error);
    return { success: false, error };
  }
}

/**
 * 运行所有测试
 */
export async function runAllTests() {
  console.log('\n╔═══════════════════════════════════════╗');
  console.log('║  tempFrontEndMongoDB 测试套件        ║');
  console.log('╚═══════════════════════════════════════╝\n');
  
  const results = {
    student: await testStudentRepository(),
    teacher: await testTeacherRepository(),
    classroom: await testClassroomRepository()
  };
  
  const allPassed = Object.values(results).every(r => r.success);
  
  console.log('\n╔═══════════════════════════════════════╗');
  console.log(`║  测试结果: ${allPassed ? '✅ 全部通过' : '❌ 有失败'}          ║`);
  console.log('╚═══════════════════════════════════════╝\n');
  
  return { success: allPassed, results };
}

// 在浏览器控制台中运行：
// import { runAllTests } from './frontend/src/XdfClassArranger/Experiment3/storage/test/testRepository.js';
// runAllTests();

export default {
  testStudentRepository,
  testTeacherRepository,
  testClassroomRepository,
  runAllTests
};
