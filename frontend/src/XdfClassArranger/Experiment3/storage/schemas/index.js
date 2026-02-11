/**
 * Schemas Export
 * 
 * 统一导出所有Schema
 */

export * as StudentSchema from './StudentSchema.js';
export * as TeacherSchema from './TeacherSchema.js';
export * as ClassroomSchema from './ClassroomSchema.js';

export { createDefaultStudent, validateStudent, extractConstraintsForScheduling } from './StudentSchema.js';
export { createDefaultTeacher, validateTeacher, canTeachSubject, worksAtCampus, supportsMode } from './TeacherSchema.js';
export { createDefaultClassroom, validateClassroom, hasCapacity, isAtCampus } from './ClassroomSchema.js';

export default {
  StudentSchema: require('./StudentSchema.js'),
  TeacherSchema: require('./TeacherSchema.js'),
  ClassroomSchema: require('./ClassroomSchema.js')
};
