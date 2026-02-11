/**
 * Storage Module - 统一数据访问层
 * 
 * 提供Repository和Schema的统一导出
 */

// Core
export { getTempFrontEndMongoDB, resetTempFrontEndMongoDB } from './tempFrontEndMongoDB.js';

// Repositories
export { StudentRepository } from './repositories/StudentRepository.js';
export { TeacherRepository } from './repositories/TeacherRepository.js';
export { ClassroomRepository } from './repositories/ClassroomRepository.js';
export { CourseRepository } from './repositories/CourseRepository.js';
export { BaseRepository } from './repositories/BaseRepository.js';

// Schemas
export * as StudentSchema from './schemas/StudentSchema.js';
export * as TeacherSchema from './schemas/TeacherSchema.js';
export * as ClassroomSchema from './schemas/ClassroomSchema.js';

// Migrations
export { migrateToV4, hasMigrated, restoreBackup } from './migrations/migrateToV4.js';

// Adapters
export { LegacyStorageAdapter } from './adapters/LegacyStorageAdapter.js';

/**
 * 初始化存储系统
 */
export async function initializeStorage(options = {}) {
  const { autoMigrate = true } = options;
  
  console.log('[Storage] Initializing storage system...');
  
  // 检查是否需要迁移
  const { hasMigrated } = await import('./migrations/migrateToV4.js');
  
  if (autoMigrate && !hasMigrated()) {
    console.log('[Storage] Running auto-migration...');
    const { migrateToV4 } = await import('./migrations/migrateToV4.js');
    const result = await migrateToV4({ backup: true });
    
    if (result.success) {
      console.log('[Storage] Auto-migration completed:', result.stats);
    } else {
      console.error('[Storage] Auto-migration failed:', result.message);
    }
  } else {
    console.log('[Storage] Storage already initialized');
  }
  
  return { success: true };
}

/**
 * 获取所有Repository实例
 */
export function getRepositories() {
  return {
    students: new StudentRepository(),
    teachers: new TeacherRepository(),
    classrooms: new ClassroomRepository(),
    courses: new CourseRepository()
  };
}

export default {
  getTempFrontEndMongoDB,
  StudentRepository,
  TeacherRepository,
  ClassroomRepository,
  CourseRepository,
  StudentSchema,
  TeacherSchema,
  ClassroomSchema,
  migrateToV4,
  hasMigrated,
  restoreBackup,
  initializeStorage,
  getRepositories
};
