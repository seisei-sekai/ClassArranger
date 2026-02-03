/**
 * Schedule Module Integration Example
 * 
 * This example shows how to integrate the refactored schedule modules
 * into your React components.
 */

import React from 'react';
import { useScheduleState } from '../hooks/useScheduleState';
import { batchScheduleStudents } from '../services/scheduleService';
import { createEmptyScheduleResult } from '../models/scheduleTypes';

/**
 * Example: Using the schedule hook in a component
 */
function ScheduleComponent() {
  const scheduleState = useScheduleState();

  const handleSchedule = async () => {
    // 1. Initialize scheduling
    scheduleState.initializeScheduling();

    try {
      // 2. Run the scheduling algorithm
      const result = await batchScheduleStudents({
        students: getSelectedStudents(),
        teachers: teachers,
        classrooms: classrooms,
        matchingEngine: new TripleMatchingEngine(),
        constraintEngine: constraintEngine,
        slotToTime: slotToTime,
        hoursManager: scheduleContext.hoursManager,
        onProgress: (progress, studentName) => {
          scheduleState.updateProgress(progress, studentName);
        }
      });

      // 3. Complete and show results
      scheduleState.completeScheduling(result);

      // 4. Add to global context
      if (result.scheduledCourses.length > 0) {
        scheduleContext.addScheduledCourses(result.scheduledCourses);
      }

    } catch (error) {
      console.error('Scheduling failed:', error);
      scheduleState.cancelScheduling();
      alert(`排课失败: ${error.message}`);
    }
  };

  return (
    <div>
      <button 
        onClick={handleSchedule}
        disabled={scheduleState.isScheduling}
      >
        {scheduleState.isScheduling ? '排课中...' : '开始排课'}
      </button>

      {scheduleState.isScheduling && (
        <div>
          进度: {scheduleState.scheduleProgress}%
          <br />
          当前: {scheduleState.currentSchedulingStudent}
        </div>
      )}

      {scheduleState.showScheduleResult && (
        <div>
          <h3>排课完成</h3>
          <p>成功: {scheduleState.scheduleResultData.successCount}</p>
          <p>失败: {scheduleState.scheduleResultData.failedCount}</p>
          <p>课时: {scheduleState.scheduleResultData.totalHoursScheduled}</p>
          <button onClick={scheduleState.closeResultModal}>关闭</button>
        </div>
      )}
    </div>
  );
}

/**
 * Example: Creating a scheduled course manually
 */
function createManualCourse() {
  const course = createScheduledCourse({
    student: { id: 's1', name: '张三', color: '#ff0000' },
    teacher: { id: 't1', name: '李老师' },
    room: { id: 'r1', name: '教室101', campus: '主校区' },
    timeSlot: createTimeSlot({
      day: '周一',
      startSlot: 0,
      duration: 12,
      slotToTime: (slot) => {
        const hours = Math.floor(slot / 12) + 9;
        const minutes = (slot % 12) * 5;
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
      }
    }),
    subject: '数学',
    score: 95
  });

  return course;
}

/**
 * Example: Validating schedule data before saving
 */
function validateAndSave(course) {
  if (!isValidScheduledCourse(course)) {
    console.error('Invalid course data:', course);
    return false;
  }

  // Save to database or context
  scheduleContext.addScheduledCourses([course]);
  return true;
}

/**
 * Example: Building a schedule result from multiple operations
 */
function buildScheduleResult() {
  const result = createEmptyScheduleResult();

  // Process students...
  students.forEach(student => {
    const course = scheduleForStudent(student);
    
    if (course) {
      const hoursConsumed = calculateHoursConsumed(course.timeSlot.duration);
      addCourseToResult(result, course, hoursConsumed);
      result.successCount++;
    } else {
      addSchedulingError(result, student.name, 'No available slot');
    }
  });

  return result;
}

export {
  ScheduleComponent,
  createManualCourse,
  validateAndSave,
  buildScheduleResult
};
