# NLP Data Preview Hotfix

**Created:** 2026-01-26
**Purpose:** Fix NLP-parsed student data display issue

---

## Problem

When editing students imported via AI NLP constraint parsing, all data appeared in the "校区" (Campus) field instead of being properly distributed across fields.

**Root Cause:**
- `originalText` (constraint text only) was saved as `rawData`
- When re-editing, `parseStudentRows()` couldn't split non-tab-separated text
- All content ended up in `values[0]` (校区 field)

## Solution

### 1. Pass Full Excel Row
**File:** `ConstraintReviewDialog.jsx`

```javascript
// Before
originalText: item.combinedText,

// After  
originalText: item.combinedText,
originalRow: item.originalRow, // Added
```

### 2. Reconstruct Tab-Separated Data
**File:** `Function.jsx`

```javascript
// Reconstruct from originalRow
if (originalRow) {
  const rowValues = columns.map(col => originalRow[col] || '');
  reconstructedRawData = rowValues.join('\t');
}
```

### 3. Save Structured Data
```javascript
rawData: reconstructedRawData, // Tab-separated format
fromNLP: true // Mark NLP origin
```

## Files Modified

- `Function.jsx` (lines 160-189)
- `ConstraintReviewDialog.jsx` (lines 157-175)

## Tests

**File:** `nlpDataReconstruction.test.js` (6 tests)

```bash
npm run test:unit -- src/XdfClassArranger/Function/utils/__tests__/nlpDataReconstruction.test.js
```

✓ Reconstructs tab-separated data
✓ Handles missing fields  
✓ Preserves field order
✓ NLP integration
✓ Fallback to originalText
✓ parseStudentRows compatibility

## Test Steps

1. Paste Excel data with multiple fields
2. Click "AI智能解析"
3. Approve constraints
4. Edit imported student
5. Verify data appears in correct fields

---

**Status:** ✅ Fixed  
**Tests:** ✅ 6/6 passing
**Linter:** ✅ No errors
