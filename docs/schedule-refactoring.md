# Schedule Data Structure Refactoring

**Created:** 2026-01-26
**Last Updated:** 2026-01-26
**Purpose:** Document the schedule data structure refactoring for improved clarity and maintainability

---

## Overview

Refactored schedule-related data structures and logic from a monolithic 2783-line component into modular, testable units.

## File Structure

```
Function/
├── models/
│   ├── scheduleTypes.js              # Type definitions & factory functions
│   └── __tests__/
│       └── scheduleTypes.test.js     # Unit tests for types
├── hooks/
│   └── useScheduleState.js           # Centralized state management
├── services/
│   ├── scheduleService.js            # Core scheduling logic
│   └── __tests__/
│       └── scheduleService.test.js   # Unit tests for service
```

## Key Data Structures

### ScheduledCourse
```javascript
{
  id: string,
  student: { id, name, color },
  teacher: { id, name },
  room: { id, name, campus },
  timeSlot: { day, startSlot, duration, start, end },
  subject: string,
  score: number
}
```

### ScheduleResult
```javascript
{
  successCount: number,
  failedCount: number,
  totalHoursScheduled: number,
  conflictsDetected: number,
  scheduledCourses: ScheduledCourse[],
  errors: string[]
}
```

### TimeSlot
```javascript
{
  day: string,              // '周一', '周二', etc.
  startSlot: number,        // 0-based slot index
  duration: number,         // in slots (12 slots = 1 hour)
  start: string,            // '09:00'
  end: string               // '10:00'
}
```

## Core Functions

### scheduleTypes.js
- `createEmptyScheduleResult()` - Initialize result object
- `createScheduledCourse()` - Factory for course objects
- `createTimeSlot()` - Factory for time slots
- `addCourseToResult()` - Add course to result
- `isValidScheduledCourse()` - Validation

### scheduleService.js
- `calculateHoursConsumed()` - Convert slots to hours
- `markSlotsOccupied()` - Track occupied slots
- `isSlotAvailable()` - Check availability
- `createCourseFromMatch()` - Convert match to course
- `scheduleStudent()` - Schedule single student
- `batchScheduleStudents()` - Schedule multiple students

### useScheduleState.js
- `initializeScheduling()` - Start session
- `completeScheduling()` - Finish session
- `updateProgress()` - Update progress
- `addScheduledCoursesToEvents()` - Add to calendar
- `clearAllSchedules()` - Clear data

## Migration Guide

### Before
```javascript
// In Function.jsx (line 73)
const [scheduleResultData, setScheduleResultData] = useState(null);

// In handleOneClickSchedule (line 425-432)
const results = {
  successCount: 0,
  failedCount: 0,
  // ... more fields
};
```

### After
```javascript
// Import
import { useScheduleState } from './hooks/useScheduleState';
import { batchScheduleStudents } from './services/scheduleService';
import { createEmptyScheduleResult } from './models/scheduleTypes';

// In component
const scheduleState = useScheduleState();

// Usage
scheduleState.initializeScheduling();
const result = await batchScheduleStudents({ ... });
scheduleState.completeScheduling(result);
```

## Test Coverage

### scheduleTypes.test.js (14 tests)
- ✓ Empty result creation
- ✓ Scheduled course creation
- ✓ Time slot creation
- ✓ Adding courses to result
- ✓ Error handling
- ✓ Validation

### scheduleService.test.js (15 tests)
- ✓ Hours calculation
- ✓ Slot occupancy tracking
- ✓ Availability checking
- ✓ Course creation from match

### Running Tests
```bash
# All schedule tests
npm run test:unit -- src/XdfClassArranger/Function/**/__tests__/*.test.js

# Specific module
npm run test:unit -- src/XdfClassArranger/Function/models/__tests__/scheduleTypes.test.js
```

**Total:** 29 unit tests, all passing ✓

## Benefits

1. **Clarity**: Clear type definitions with JSDoc
2. **Testability**: Pure functions, easy to test
3. **Maintainability**: Modular structure
4. **Reusability**: Shared logic extracted
5. **Type Safety**: Better IDE support with JSDoc

## Next Steps

1. Integrate into Function.jsx
2. Run full integration tests
3. Remove old code
4. Update documentation

---

## Summary

**Files Created:** 7 files
- 3 source files (types, hooks, services)
- 2 test files (29 tests)
- 2 documentation files

**Test Results:** 29/29 passing ✓  
**Lines Extracted:** ~300 lines from Function.jsx  
**Maintainability:** Significantly improved
