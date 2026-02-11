/**
 * useRepositories Hook
 * 
 * 管理Repository实例和数据加载
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  StudentRepository,
  TeacherRepository,
  ClassroomRepository,
  CourseRepository,
  initializeStorage
} from '../storage/index.js';

export function useRepositories() {
  const [repositories, setRepositories] = useState(null);
  const [initialized, setInitialized] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // 使用ref避免重复初始化
  const initRef = useRef(false);
  
  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;
    
    const init = async () => {
      try {
        console.log('[useRepositories] Initializing repositories...');
        
        // 初始化存储系统（包含自动迁移）
        await initializeStorage({ autoMigrate: true });
        
        // 创建Repository实例
        const repos = {
          students: new StudentRepository(),
          teachers: new TeacherRepository(),
          classrooms: new ClassroomRepository(),
          courses: new CourseRepository()
        };
        
        setRepositories(repos);
        setInitialized(true);
        setLoading(false);
        
        console.log('[useRepositories] Repositories initialized successfully');
      } catch (err) {
        console.error('[useRepositories] Initialization failed:', err);
        setError(err.message);
        setLoading(false);
      }
    };
    
    init();
  }, []);
  
  return {
    repositories,
    initialized,
    loading,
    error
  };
}

/**
 * useStudentRepository Hook
 * 
 * 管理学生数据
 */
export function useStudentRepository() {
  const { repositories, initialized, loading } = useRepositories();
  const [students, setStudents] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(true);
  
  // 加载学生数据
  const loadStudents = useCallback(async () => {
    if (!repositories?.students) return;
    
    try {
      const data = await repositories.students.findAll();
      setStudents(data);
      console.log('[useStudentRepository] Loaded students:', data.length);
    } catch (err) {
      console.error('[useStudentRepository] Failed to load students:', err);
    } finally {
      setLoadingStudents(false);
    }
  }, [repositories]);
  
  // 初始化后加载
  useEffect(() => {
    if (initialized && repositories?.students) {
      loadStudents();
    }
  }, [initialized, repositories, loadStudents]);
  
  // 创建学生
  const createStudent = useCallback(async (data) => {
    if (!repositories?.students) {
      throw new Error('Repository not initialized');
    }
    
    const student = await repositories.students.create(data);
    await loadStudents(); // 重新加载
    return student;
  }, [repositories, loadStudents]);
  
  // 更新学生
  const updateStudent = useCallback(async (id, data) => {
    if (!repositories?.students) {
      throw new Error('Repository not initialized');
    }
    
    const student = await repositories.students.updateById(id, data);
    await loadStudents(); // 重新加载
    return student;
  }, [repositories, loadStudents]);
  
  // 删除学生
  const deleteStudent = useCallback(async (id) => {
    if (!repositories?.students) {
      throw new Error('Repository not initialized');
    }
    
    await repositories.students.deleteById(id);
    await loadStudents(); // 重新加载
  }, [repositories, loadStudents]);
  
  // 批量创建
  const createMany = useCallback(async (dataArray) => {
    if (!repositories?.students) {
      throw new Error('Repository not initialized');
    }
    
    const students = await repositories.students.createMany(dataArray);
    await loadStudents(); // 重新加载
    return students;
  }, [repositories, loadStudents]);
  
  return {
    students,
    loading: loading || loadingStudents,
    createStudent,
    updateStudent,
    deleteStudent,
    createMany,
    reload: loadStudents,
    repository: repositories?.students
  };
}

/**
 * useTeacherRepository Hook
 */
export function useTeacherRepository() {
  const { repositories, initialized, loading } = useRepositories();
  const [teachers, setTeachers] = useState([]);
  const [loadingTeachers, setLoadingTeachers] = useState(true);
  
  const loadTeachers = useCallback(async () => {
    if (!repositories?.teachers) return;
    
    try {
      const data = await repositories.teachers.findAll();
      setTeachers(data);
      console.log('[useTeacherRepository] Loaded teachers:', data.length);
    } catch (err) {
      console.error('[useTeacherRepository] Failed to load teachers:', err);
    } finally {
      setLoadingTeachers(false);
    }
  }, [repositories]);
  
  useEffect(() => {
    if (initialized && repositories?.teachers) {
      loadTeachers();
    }
  }, [initialized, repositories, loadTeachers]);
  
  const createTeacher = useCallback(async (data) => {
    if (!repositories?.teachers) {
      throw new Error('Repository not initialized');
    }
    
    const teacher = await repositories.teachers.create(data);
    await loadTeachers();
    return teacher;
  }, [repositories, loadTeachers]);
  
  const updateTeacher = useCallback(async (id, data) => {
    if (!repositories?.teachers) {
      throw new Error('Repository not initialized');
    }
    
    const teacher = await repositories.teachers.updateById(id, data);
    await loadTeachers();
    return teacher;
  }, [repositories, loadTeachers]);
  
  const deleteTeacher = useCallback(async (id) => {
    if (!repositories?.teachers) {
      throw new Error('Repository not initialized');
    }
    
    await repositories.teachers.deleteById(id);
    await loadTeachers();
  }, [repositories, loadTeachers]);
  
  const createMany = useCallback(async (dataArray) => {
    if (!repositories?.teachers) {
      throw new Error('Repository not initialized');
    }
    
    const teachers = await repositories.teachers.createMany(dataArray);
    await loadTeachers();
    return teachers;
  }, [repositories, loadTeachers]);
  
  return {
    teachers,
    loading: loading || loadingTeachers,
    createTeacher,
    updateTeacher,
    deleteTeacher,
    createMany,
    reload: loadTeachers,
    repository: repositories?.teachers
  };
}

/**
 * useClassroomRepository Hook
 */
export function useClassroomRepository() {
  const { repositories, initialized, loading } = useRepositories();
  const [classrooms, setClassrooms] = useState([]);
  const [loadingClassrooms, setLoadingClassrooms] = useState(true);
  
  const loadClassrooms = useCallback(async () => {
    if (!repositories?.classrooms) return;
    
    try {
      const data = await repositories.classrooms.findAll();
      setClassrooms(data);
      console.log('[useClassroomRepository] Loaded classrooms:', data.length);
    } catch (err) {
      console.error('[useClassroomRepository] Failed to load classrooms:', err);
    } finally {
      setLoadingClassrooms(false);
    }
  }, [repositories]);
  
  useEffect(() => {
    if (initialized && repositories?.classrooms) {
      loadClassrooms();
    }
  }, [initialized, repositories, loadClassrooms]);
  
  const createClassroom = useCallback(async (data) => {
    if (!repositories?.classrooms) {
      throw new Error('Repository not initialized');
    }
    
    const classroom = await repositories.classrooms.create(data);
    await loadClassrooms();
    return classroom;
  }, [repositories, loadClassrooms]);
  
  const updateClassroom = useCallback(async (id, data) => {
    if (!repositories?.classrooms) {
      throw new Error('Repository not initialized');
    }
    
    const classroom = await repositories.classrooms.updateById(id, data);
    await loadClassrooms();
    return classroom;
  }, [repositories, loadClassrooms]);
  
  const deleteClassroom = useCallback(async (id) => {
    if (!repositories?.classrooms) {
      throw new Error('Repository not initialized');
    }
    
    await repositories.classrooms.deleteById(id);
    await loadClassrooms();
  }, [repositories, loadClassrooms]);
  
  const createMany = useCallback(async (dataArray) => {
    if (!repositories?.classrooms) {
      throw new Error('Repository not initialized');
    }
    
    const classrooms = await repositories.classrooms.createMany(dataArray);
    await loadClassrooms();
    return classrooms;
  }, [repositories, loadClassrooms]);
  
  return {
    classrooms,
    loading: loading || loadingClassrooms,
    createClassroom,
    updateClassroom,
    deleteClassroom,
    createMany,
    reload: loadClassrooms,
    repository: repositories?.classrooms
  };
}

export default {
  useRepositories,
  useStudentRepository,
  useTeacherRepository,
  useClassroomRepository
};
