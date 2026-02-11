/**
 * ClassroomRepository - 教室数据仓库
 * 
 * 提供教室特定的查询方法
 */

import { BaseRepository } from './BaseRepository.js';

export class ClassroomRepository extends BaseRepository {
  constructor() {
    super('classrooms');
  }

  /**
   * 根据校区查找教室
   */
  async findByCampus(campus) {
    return this.findMany({ campus });
  }

  /**
   * 根据类型查找教室
   */
  async findByType(type) {
    return this.findMany({ type });
  }

  /**
   * 根据区域查找教室
   */
  async findByArea(area) {
    return this.findMany({ area });
  }

  /**
   * 查找满足容量要求的教室
   */
  async findByMinCapacity(minCapacity) {
    const classrooms = await this.findAll();
    return classrooms.filter(c => c.capacity >= minCapacity);
  }

  /**
   * 根据校区和容量查找教室
   */
  async findByCampusAndCapacity(campus, minCapacity) {
    const classrooms = await this.findByCampus(campus);
    return classrooms.filter(c => c.capacity >= minCapacity);
  }

  /**
   * 更新教室可用性
   */
  async updateAvailability(id, timeSlots) {
    const classroom = await this.findById(id);
    if (!classroom) {
      throw new Error(`Classroom ${id} not found`);
    }

    return this.updateById(id, {
      availability: {
        timeSlots
      }
    });
  }

  /**
   * 更新教室容量
   */
  async updateCapacity(id, capacity) {
    return this.updateById(id, { capacity });
  }

  /**
   * 按优先级排序教室
   */
  async findAllSortedByPriority() {
    return this.findMany({}, { sort: { priority: -1 } });
  }
}

export default ClassroomRepository;
