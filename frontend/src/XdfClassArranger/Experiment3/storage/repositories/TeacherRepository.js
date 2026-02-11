/**
 * TeacherRepository - 教师数据仓库
 * 
 * 提供教师特定的查询方法
 */

import { BaseRepository } from './BaseRepository.js';

export class TeacherRepository extends BaseRepository {
  constructor() {
    super('teachers');
  }

  /**
   * 根据科目查找教师
   */
  async findBySubject(subject) {
    const teachers = await this.findAll();
    return teachers.filter(t => t.teaching?.subjects?.includes(subject));
  }

  /**
   * 根据校区查找教师
   */
  async findByCampus(campus) {
    const teachers = await this.findAll();
    return teachers.filter(t => t.teaching?.campuses?.includes(campus));
  }

  /**
   * 根据科目和校区查找教师
   */
  async findBySubjectAndCampus(subject, campus) {
    const teachers = await this.findAll();
    return teachers.filter(t => 
      t.teaching?.subjects?.includes(subject) &&
      t.teaching?.campuses?.includes(campus)
    );
  }

  /**
   * 查找支持线上的教师
   */
  async findOnlineTeachers() {
    const teachers = await this.findAll();
    return teachers.filter(t => t.teaching?.modes?.includes('online'));
  }

  /**
   * 查找支持线下的教师
   */
  async findOfflineTeachers() {
    const teachers = await this.findAll();
    return teachers.filter(t => t.teaching?.modes?.includes('offline'));
  }

  /**
   * 更新教师可用性
   */
  async updateAvailability(id, timeSlots) {
    const teacher = await this.findById(id);
    if (!teacher) {
      throw new Error(`Teacher ${id} not found`);
    }

    return this.updateById(id, {
      availability: {
        timeSlots
      }
    });
  }

  /**
   * 更新教师教学能力
   */
  async updateTeachingAbility(id, teaching) {
    const teacher = await this.findById(id);
    if (!teacher) {
      throw new Error(`Teacher ${id} not found`);
    }

    return this.updateById(id, {
      teaching: {
        ...teacher.teaching,
        ...teaching
      }
    });
  }
}

export default TeacherRepository;
