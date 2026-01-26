/**
 * Schedule State Management Hook
 * 
 * Manages all schedule-related state in a centralized, clean way.
 * Separates schedule state from UI components.
 */

import { useState, useCallback } from 'react';
import { createEmptyScheduleResult } from '../models/scheduleTypes';

/**
 * Custom hook for managing schedule state
 * @returns {Object} Schedule state and actions
 */
export function useScheduleState() {
  // Schedule result state
  const [scheduleResultData, setScheduleResultData] = useState(null);
  const [showScheduleResult, setShowScheduleResult] = useState(false);

  // Scheduling progress state
  const [isScheduling, setIsScheduling] = useState(false);
  const [scheduleProgress, setScheduleProgress] = useState(0);
  const [currentSchedulingStudent, setCurrentSchedulingStudent] = useState('');

  // Calendar events state
  const [events, setEvents] = useState([]);
  const [availabilityEvents, setAvailabilityEvents] = useState([]);

  /**
   * Initialize a new scheduling session
   */
  const initializeScheduling = useCallback(() => {
    setIsScheduling(true);
    setScheduleProgress(0);
    setCurrentSchedulingStudent('');
    setScheduleResultData(null);
  }, []);

  /**
   * Complete the scheduling session
   * @param {ScheduleResult} result - Final scheduling result
   */
  const completeScheduling = useCallback((result) => {
    setScheduleResultData(result);
    setShowScheduleResult(true);
    setIsScheduling(false);
    setScheduleProgress(100);
    setCurrentSchedulingStudent('');
  }, []);

  /**
   * Cancel/abort the scheduling session
   */
  const cancelScheduling = useCallback(() => {
    setIsScheduling(false);
    setScheduleProgress(0);
    setCurrentSchedulingStudent('');
  }, []);

  /**
   * Update scheduling progress
   * @param {number} progress - Progress percentage (0-100)
   * @param {string} studentName - Current student being scheduled
   */
  const updateProgress = useCallback((progress, studentName = '') => {
    setScheduleProgress(Math.min(100, Math.max(0, progress)));
    if (studentName) {
      setCurrentSchedulingStudent(studentName);
    }
  }, []);

  /**
   * Close the result modal
   */
  const closeResultModal = useCallback(() => {
    setShowScheduleResult(false);
  }, []);

  /**
   * Clear all schedule data
   */
  const clearAllSchedules = useCallback(() => {
    setEvents([]);
    setScheduleResultData(null);
    setShowScheduleResult(false);
  }, []);

  /**
   * Add scheduled courses to events
   * @param {ScheduledCourse[]} courses
   */
  const addScheduledCoursesToEvents = useCallback((courses) => {
    // Convert scheduled courses to calendar events
    const newEvents = courses.map(course => ({
      id: course.id,
      title: `${course.student.name} - ${course.teacher.name}`,
      start: course.timeSlot.start,
      end: course.timeSlot.end,
      backgroundColor: course.student.color,
      extendedProps: {
        studentName: course.student.name,
        teacherName: course.teacher.name,
        roomName: course.room.name,
        subject: course.subject
      }
    }));

    setEvents(prev => [...prev, ...newEvents]);
  }, []);

  /**
   * Update availability events
   * @param {Array} newAvailabilityEvents
   */
  const updateAvailabilityEvents = useCallback((newAvailabilityEvents) => {
    setAvailabilityEvents(newAvailabilityEvents);
  }, []);

  /**
   * Delete a specific event
   * @param {string} eventId
   */
  const deleteEvent = useCallback((eventId) => {
    setEvents(prev => prev.filter(e => e.id !== eventId));
  }, []);

  /**
   * Update an existing event
   * @param {string} eventId
   * @param {Object} updates
   */
  const updateEvent = useCallback((eventId, updates) => {
    setEvents(prev => prev.map(e => 
      e.id === eventId ? { ...e, ...updates } : e
    ));
  }, []);

  return {
    // State
    scheduleResultData,
    showScheduleResult,
    isScheduling,
    scheduleProgress,
    currentSchedulingStudent,
    events,
    availabilityEvents,

    // Actions
    initializeScheduling,
    completeScheduling,
    cancelScheduling,
    updateProgress,
    closeResultModal,
    clearAllSchedules,
    addScheduledCoursesToEvents,
    updateAvailabilityEvents,
    deleteEvent,
    updateEvent,

    // Raw setters (for backward compatibility)
    setEvents,
    setAvailabilityEvents
  };
}
