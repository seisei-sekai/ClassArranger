/**
 * StudentRepository - 学生数据仓库
 * 
 * 提供学生特定的查询方法
 */

import { BaseRepository } from './BaseRepository.js';

export class StudentRepository extends BaseRepository {
  constructor() {
    super('students');
  }

  /**
   * 根据校区查找学生
   */
  async findByCampus(campus) {
    return this.findMany({ campus });
  }

  /**
   * 根据科目查找学生
   */
  async findBySubject(subject) {
    return this.findMany({ subject });
  }

  /**
   * 根据学管查找学生
   */
  async findByManager(manager) {
    return this.findMany({ manager });
  }

  /**
   * 根据批次查找学生
   */
  async findByBatch(batch) {
    return this.findMany({ batch });
  }

  /**
   * 查找已选中的学生
   */
  async findSelected() {
    const students = await this.findAll();
    return students.filter(s => s._ui?.selected === true);
  }

  /**
   * 查找有剩余课时的学生
   */
  async findWithRemainingHours() {
    const students = await this.findAll();
    return students.filter(s => s.courseHours?.remaining > 0);
  }

  /**
   * 更新学生约束
   */
  async updateConstraints(id, constraints) {
    const student = await this.findById(id);
    if (!student) {
      throw new Error(`Student ${id} not found`);
    }

    return this.updateById(id, {
      scheduling: {
        ...student.scheduling,
        timeConstraints: {
          ...student.scheduling.timeConstraints,
          ...constraints
        }
      }
    });
  }

  /**
   * 更新排课模式
   */
  async updateSchedulingMode(id, mode) {
    const student = await this.findById(id);
    if (!student) {
      throw new Error(`Student ${id} not found`);
    }

    return this.updateById(id, {
      scheduling: {
        ...student.scheduling,
        frequencyConstraints: {
          ...student.scheduling.frequencyConstraints,
          schedulingMode: mode
        }
      }
    });
  }

  /**
   * 批量更新UI状态
   */
  async updateUIState(id, uiState) {
    const student = await this.findById(id);
    if (!student) {
      throw new Error(`Student ${id} not found`);
    }

    return this.updateById(id, {
      _ui: {
        ...student._ui,
        ...uiState
      }
    });
  }
}

export default StudentRepository;
