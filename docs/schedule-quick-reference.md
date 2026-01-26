# Schedule Module Quick Reference

**Created:** 2026-01-26
**Purpose:** Quick reference for schedule data structures and APIs

---

## Import Paths

```javascript
// Types & Factories
import { 
  createEmptyScheduleResult,
  createScheduledCourse,
  createTimeSlot,
  addCourseToResult,
  isValidScheduledCourse 
} from './models/scheduleTypes';

// State Management
import { useScheduleState } from './hooks/useScheduleState';

// Business Logic
import { 
  batchScheduleStudents,
  scheduleStudent,
  calculateHoursConsumed,
  markSlotsOccupied,
  isSlotAvailable 
} from './services/scheduleService';
```

## Data Structures

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

## Common Operations

### Create a Course
```javascript
const course = createScheduledCourse({
  student: { id: 's1', name: '张三', color: '#ff0000' },
  teacher: { id: 't1', name: '李老师' },
  room: { id: 'r1', name: '教室101', campus: '主校区' },
  timeSlot: createTimeSlot({
    day: '周一',
    startSlot: 0,
    duration: 12,
    slotToTime
  }),
  subject: '数学',
  score: 95
});
```

### Validate a Course
```javascript
if (isValidScheduledCourse(course)) {
  // Course is valid
}
```

### Calculate Hours
```javascript
const hours = calculateHoursConsumed(24); // 24 slots = 2 hours
```

### Check Availability
```javascript
const available = isSlotAvailable(
  occupiedSlots,
  '周一',
  0,
  12,
  'teacher-1',
  'room-1'
);
```

## Hook Usage

```javascript
function MyComponent() {
  const schedule = useScheduleState();
  
  // Initialize
  schedule.initializeScheduling();
  
  // Update progress
  schedule.updateProgress(50, 'Student Name');
  
  // Complete
  schedule.completeScheduling(result);
  
  // Access state
  const { isScheduling, scheduleProgress, scheduleResultData } = schedule;
}
```

## Constants

- `SLOTS_PER_HOUR = 12` (12 slots = 1 hour)
- Each slot = 5 minutes
- Slot 0 = 09:00
- Slot 12 = 10:00

## Testing

```bash
# Run all tests
npm run test:unit -- src/XdfClassArranger/Function/**/__tests__/*.test.js

# Run schedule tests only
npm run test:unit -- src/XdfClassArranger/Function/models/__tests__/scheduleTypes.test.js
npm run test:unit -- src/XdfClassArranger/Function/services/__tests__/scheduleService.test.js
```

---

**See Also:** [schedule-refactoring.md](./schedule-refactoring.md) for full documentation
