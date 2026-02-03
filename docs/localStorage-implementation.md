# LocalStorage Implementation

**Created:** 2026-01-27
**Last Updated:** 2026-01-27
**Purpose:** Document the implementation of localStorage persistence for all application data

---

## Overview

The XDF ClassArranger application now automatically saves all data to localStorage, providing data persistence across browser sessions. All data added through the frontend (students, teachers, classrooms, schedules, events) is automatically saved and restored.

## Architecture

### 1. LocalStorage Service (`services/localStorageService.js`)

A centralized service that manages all localStorage operations:

- **Storage Keys**: Defines consistent keys for all data types
- **Generic Operations**: Save, load, remove, and clear operations
- **Type-Specific Accessors**: Dedicated storage objects for each data type
  - `studentsStorage`
  - `teachersStorage`
  - `classroomsStorage`
  - `scheduledCoursesStorage`
  - `schedulingMetadataStorage`
  - `eventsStorage`
  - `aiResultStorage`
  - `countersStorage`

### 2. ScheduleContext Updates

Enhanced to automatically persist global state:

- **Initial Load**: Loads data from localStorage on mount
- **Auto-Save**: Uses `useEffect` hooks to save data whenever state changes
- **Clear Functionality**: `clearSchedule()` now clears both state and localStorage

**Persisted Data:**
- Scheduled courses
- All students
- All teachers
- All classrooms
- Scheduling metadata

### 3. Function Component Updates

Updated to persist local state:

**Persisted Data:**
- Students list and counter
- Teachers list and counter
- Classrooms list
- Calendar events
- AI scheduling results

**Key Changes:**
- State initialization from localStorage using lazy initialization pattern
- `useEffect` hooks for auto-saving on state changes
- Synchronization with ScheduleContext
- Enhanced clear button functionality

## Features

### Auto-Save
All data is automatically saved to localStorage whenever it changes:
- Adding/removing students, teachers, or classrooms
- Creating/deleting scheduled courses
- Generating AI schedules
- Manual calendar events

### Auto-Load
Data is automatically restored when the application loads:
- Page refresh preserves all data
- Browser restart preserves all data
- Works across browser tabs

### Clear All Data
The clear button (清空) in the Function component now:
- Clears all local state
- Clears ScheduleContext
- Clears all localStorage data
- Shows confirmation dialog with clear warning message

## Storage Keys

```javascript
const STORAGE_KEYS = {
  STUDENTS: 'xdf_students',
  TEACHERS: 'xdf_teachers',
  CLASSROOMS: 'xdf_classrooms',
  SCHEDULED_COURSES: 'xdf_scheduled_courses',
  SCHEDULING_METADATA: 'xdf_scheduling_metadata',
  EVENTS: 'xdf_events',
  AI_RESULT: 'xdf_ai_result',
  STUDENT_COUNTER: 'xdf_student_counter',
  TEACHER_COUNTER: 'xdf_teacher_counter',
};
```

## Usage Examples

### Programmatic Access

```javascript
import { 
  studentsStorage, 
  clearAllLocalStorage 
} from './services/localStorageService';

// Load students
const students = studentsStorage.load();

// Save students
studentsStorage.save(updatedStudents);

// Clear all data
clearAllLocalStorage();
```

### Component Integration

```javascript
// Initialize state from localStorage
const [students, setStudents] = useState(() => studentsStorage.load());

// Auto-save when state changes
useEffect(() => {
  studentsStorage.save(students);
}, [students]);
```

## Error Handling

All localStorage operations include try-catch blocks:
- Failed saves log errors but don't crash the app
- Failed loads return default values
- Parse errors return default values

## Browser Compatibility

localStorage is supported in all modern browsers:
- Chrome 4+
- Firefox 3.5+
- Safari 4+
- IE 8+
- Edge (all versions)

## Storage Limits

- Most browsers allow 5-10MB per domain
- The application uses JSON serialization
- Monitor usage if datasets become very large

## Future Enhancements

Potential improvements:
1. Add data versioning for migrations
2. Implement compression for large datasets
3. Add IndexedDB support for larger storage needs
4. Implement data export/import functionality
5. Add cloud sync capabilities

## Testing

To test localStorage functionality:

1. **Add Data**: Add students, teachers, classrooms
2. **Refresh**: Reload the page - data should persist
3. **Browser Restart**: Close and reopen browser - data should persist
4. **Clear**: Click clear button - all data should be removed
5. **Verify**: Check browser DevTools > Application > Local Storage

## Migration from Previous Version

For users upgrading from a version without localStorage:
- No migration needed
- Previous data is not preserved (was not stored)
- Users start with a clean slate
- First data entry creates localStorage entries

## Troubleshooting

### Data Not Persisting
- Check browser localStorage is enabled
- Check for localStorage quota exceeded errors
- Clear browser cache and try again

### Performance Issues
- If saving large datasets causes lag, consider debouncing saves
- Monitor browser DevTools Console for errors

### Clearing Stuck Data
```javascript
// In browser console
localStorage.clear();
```

## Code Locations

- **Service**: `/frontend/src/XdfClassArranger/services/localStorageService.js`
- **Context**: `/frontend/src/XdfClassArranger/ScheduleContext.jsx`
- **Component**: `/frontend/src/XdfClassArranger/Function/Function.jsx`
