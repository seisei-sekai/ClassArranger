# Dark Mode Testing Checklist

**Created:** 2026-01-26  
**Purpose:** Comprehensive checklist for testing dark mode functionality

---

## Quick Test Steps

### 1. Basic Functionality Test

- [ ] Open the application
- [ ] Navigate to any page
- [ ] Click the theme toggle button in the sidebar (bottom, above test data toggle)
- [ ] Verify theme changes immediately
- [ ] Reload the page
- [ ] Verify theme persists after reload

### 2. Visual Inspection - All Pages

#### Dashboard Page
- [ ] Page header and subtitle are readable
- [ ] Refresh button has proper styling
- [ ] Statistics cards display correctly
- [ ] Course list items are visible
- [ ] Quick action cards are accessible
- [ ] Empty state displays properly (if no test data)

#### Function Page (排课功能)
- [ ] Page header is visible
- [ ] All buttons (Tutorial, AI Schedule, Clear All) display correctly
- [ ] Tutorial panel (if visible) has proper styling
- [ ] Data input panels are readable
- [ ] Tables display correctly
- [ ] Form inputs are accessible
- [ ] Time slot cards are visible
- [ ] AI panel displays properly

#### FinalSchedule Page (最终课表)
- [ ] Page header and export button work
- [ ] View mode selector cards display correctly
- [ ] Filter sidebar is readable
- [ ] Weekly schedule grid is visible
- [ ] Course cards show proper colors
- [ ] Day headers are clearly visible

#### MyPage Page (我的主页)
- [ ] Page header is readable
- [ ] User profile card displays correctly
- [ ] User details grid is accessible
- [ ] Statistics cards show properly
- [ ] Activity feed is readable
- [ ] Empty states work correctly

### 3. Interactive Elements Test

#### Sidebar
- [ ] Navigation items highlight on hover
- [ ] Active page indicator is visible
- [ ] Logo and text are readable
- [ ] Theme toggle button works and shows correct icon
- [ ] Test data toggle works
- [ ] User info section is visible
- [ ] Sidebar toggle button works
- [ ] Collapsed sidebar shows correct styling

#### Mobile View
- [ ] Mobile header displays correctly
- [ ] Mobile menu toggle works
- [ ] Sidebar slides in from left
- [ ] Mobile overlay has proper opacity
- [ ] Theme toggle works in mobile view

### 4. Form Elements Test

- [ ] Text inputs are visible and accessible
- [ ] Textareas display properly
- [ ] Select dropdowns work correctly
- [ ] Checkboxes are visible
- [ ] Radio buttons work
- [ ] Buttons have proper hover states
- [ ] Focus indicators are visible

### 5. Color Contrast Test

Use browser DevTools to check:
- [ ] Primary text on primary background >= 7:1 (AAA)
- [ ] Secondary text on primary background >= 4.5:1 (AA)
- [ ] Button text on button background >= 4.5:1 (AA)
- [ ] Active navigation text >= 4.5:1 (AA)

### 6. Edge Cases

- [ ] Test with test data enabled
- [ ] Test with test data disabled
- [ ] Test with sidebar expanded
- [ ] Test with sidebar collapsed
- [ ] Test on different screen sizes (mobile, tablet, desktop)
- [ ] Test with browser zoom at 150%
- [ ] Test with browser zoom at 50%

### 7. Browser Compatibility

Test on:
- [ ] Chrome/Edge (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Mobile Safari (iOS)
- [ ] Chrome Android

---

## Detailed Element Checklist

### Colors to Verify in Dark Mode

#### Backgrounds
- [ ] Primary background: `#1A1D1F`
- [ ] Secondary background (cards): `#232629`
- [ ] Tertiary background (inputs): `#2A2D31`
- [ ] Hover background: `#2F3438`

#### Text
- [ ] Primary text: `#E2E8F0` (light gray)
- [ ] Secondary text: `#A0AEC0` (muted gray)
- [ ] All text is readable

#### Borders
- [ ] Primary borders: `#3A3F45` (visible but subtle)
- [ ] All borders are visible

#### Interactive Elements
- [ ] Buttons change on hover
- [ ] Links are distinguishable
- [ ] Active states are visible
- [ ] Focus indicators are clear

---

## Common Issues and Solutions

### Issue: Theme doesn't switch
**Solution:**
1. Check browser console for errors
2. Verify localStorage is not disabled
3. Clear localStorage and try again
4. Check if JavaScript is enabled

### Issue: Some elements don't change color
**Solution:**
1. Hard refresh the page (Ctrl/Cmd + Shift + R)
2. Clear browser cache
3. Check if CSS files are loaded correctly

### Issue: Colors have poor contrast
**Solution:**
1. Report the specific element
2. Include screenshot
3. Mention which page and section

### Issue: Theme doesn't persist
**Solution:**
1. Check if cookies/localStorage are allowed
2. Try incognito/private mode
3. Check browser console for storage errors

---

## Automated Testing (Future)

### Unit Tests
```javascript
// Test theme context
describe('ThemeContext', () => {
  it('should toggle theme');
  it('should persist theme to localStorage');
  it('should apply theme to document');
});
```

### Integration Tests
```javascript
// Test theme toggle button
describe('Theme Toggle', () => {
  it('should switch between themes');
  it('should update icon');
  it('should apply CSS changes');
});
```

### Visual Regression Tests
- Capture screenshots in both modes
- Compare against baseline
- Detect unintended visual changes

---

## Reporting Issues

When reporting a dark mode issue, please include:

1. **Page/Component**: Which page or component has the issue
2. **Screenshot**: Visual evidence of the problem
3. **Browser**: Browser name and version
4. **Steps to Reproduce**: How to trigger the issue
5. **Expected vs Actual**: What you expected vs what happened
6. **Console Errors**: Any JavaScript errors

**Example Report:**
```
Page: Dashboard
Issue: Statistics card text is not visible
Browser: Chrome 120
Steps: 
1. Switch to dark mode
2. Navigate to Dashboard
3. Observe statistics cards
Expected: Text should be light colored (#E2E8F0)
Actual: Text is dark and hard to read
Console: No errors
```

---

## Success Criteria

The dark mode implementation is considered successful if:

- ✅ All text is readable with proper contrast
- ✅ All interactive elements are clearly visible
- ✅ Theme persists across page reloads
- ✅ No visual glitches or flickering
- ✅ Performance is not degraded
- ✅ All four pages are fully covered
- ✅ Mobile experience is smooth
- ✅ No console errors
- ✅ Accessibility standards are met

---

## Performance Checklist

- [ ] Theme switch happens instantly (< 100ms perceived)
- [ ] No layout shift when switching themes
- [ ] No flickering during transition
- [ ] Smooth color transitions (0.3s)
- [ ] No memory leaks
- [ ] LocalStorage writes are efficient

---

**Tested By:** _____________  
**Date:** _____________  
**Result:** ☐ Pass ☐ Fail  
**Notes:** ___________________________________
