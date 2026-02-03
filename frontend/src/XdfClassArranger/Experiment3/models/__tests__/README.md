# Schedule Module Tests

## Running Tests

```bash
# Run all schedule-related tests
npm run test:unit -- src/XdfClassArranger/Function/**/__tests__/*.test.js

# Run specific test file
npm run test:unit -- src/XdfClassArranger/Function/models/__tests__/scheduleTypes.test.js

# Watch mode (auto-rerun on changes)
npm run test:watch -- src/XdfClassArranger/Function/models/__tests__/

# Coverage report
npm run test:coverage
```

## Test Coverage

- **scheduleTypes.test.js**: 14 tests - Type definitions & factories
- **scheduleService.test.js**: 15 tests - Core scheduling logic

Total: 29 tests for schedule module

## Test Structure

```
models/
├── scheduleTypes.js              # Type definitions
└── __tests__/
    └── scheduleTypes.test.js     # Type tests

services/
├── scheduleService.js            # Business logic
└── __tests__/
    └── scheduleService.test.js   # Service tests
```

## Key Test Cases

### scheduleTypes
- Empty result creation
- Scheduled course creation with defaults
- Unique ID generation
- Time slot calculation
- Course validation
- Error tracking

### scheduleService
- Hours calculation (12 slots = 1 hour)
- Slot occupancy tracking
- Availability checking
- Conflict detection
- Course creation from match results
