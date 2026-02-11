/**
 * CourseRepository - 课程数据仓库
 * 
 * 提供课程特定的查询方法
 */

import { BaseRepository } from './BaseRepository.js';

export class CourseRepository extends BaseRepository {
  constructor() {
    super('courses');
  }

  /**
   * 根据学生ID查找课程
   */
  async findByStudentId(studentId) {
    const courses = await this.findAll();
    return courses.filter(c => c.studentId === studentId);
  }

  /**
   * 根据教师ID查找课程
   */
  async findByTeacherId(teacherId) {
    const courses = await this.findAll();
    return courses.filter(c => c.teacherId === teacherId);
  }

  /**
   * 根据教室ID查找课程
   */
  async findByClassroomId(classroomId) {
    const courses = await this.findAll();
    return courses.filter(c => c.classroomId === classroomId);
  }

  /**
   * 根据校区查找课程
   */
  async findByCampus(campus) {
    const courses = await this.findAll();
    return courses.filter(c => c.campus === campus);
  }

  /**
   * 根据科目查找课程
   */
  async findBySubject(subject) {
    const courses = await this.findAll();
    return courses.filter(c => c.subject === subject);
  }

  /**
   * 查找固定时间课程
   */
  async findRecurringCourses() {
    const courses = await this.findAll();
    return courses.filter(c => c.isRecurring === true);
  }

  /**
   * 查找灵活时间课程
   */
  async findFlexibleCourses() {
    const courses = await this.findAll();
    return courses.filter(c => c.schedulingMode === 'flexible');
  }

  /**
   * 批量删除学生的所有课程
   */
  async deleteByStudentId(studentId) {
    return this.deleteMany({ studentId });
  }

  /**
   * 批量删除教师的所有课程
   */
  async deleteByTeacherId(teacherId) {
    return this.deleteMany({ teacherId });
  }

  /**
   * 批量删除教室的所有课程
   */
  async deleteByClassroomId(classroomId) {
    return this.deleteMany({ classroomId });
  }
}

export default CourseRepository;
