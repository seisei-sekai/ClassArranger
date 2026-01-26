# Dark Mode Implementation Guide

**Created:** 2026-01-26  
**Last Updated:** 2026-01-26  
**Purpose:** Document the implementation of dark mode for XdfClassArranger

---

## Overview

This document describes the implementation of a comprehensive dark mode theme for the XdfClassArranger application. The dark mode is fully togglable and persists across sessions using localStorage.

## Architecture

### 1. Theme Management System

#### ThemeContext (`frontend/src/XdfClassArranger/ThemeContext.jsx`)

- **Purpose**: Centralized theme state management
- **Features**:
  - Theme state management (bright/dark)
  - LocalStorage persistence
  - Document-level theme attribute management
  - Theme toggle functionality

```javascript
export const useTheme = () => {
  const { theme, toggleTheme, isDark } = useContext(ThemeContext);
  // Returns current theme state and toggle function
};
```

### 2. Theme Toggle UI

#### Location: Sidebar Footer

- **Position**: Below the sidebar length, above the test data toggle
- **Icon**: 
  - Sun icon for bright mode
  - Moon icon for dark mode
- **Behavior**:
  - Persists selection to localStorage
  - Immediately applies theme changes
  - Works in both expanded and collapsed sidebar states

### 3. CSS Architecture

#### CSS Variables System

All theme-specific colors are defined as CSS variables in `XdfLayout.css`:

**Bright Mode Variables:**
```css
:root[data-theme="bright"], :root {
  --bg-primary: #FAFAFA;
  --bg-secondary: #FFFFFF;
  --bg-tertiary: #F5F5F0;
  --text-primary: #2D3748;
  --text-secondary: #718096;
  --border-primary: #E8E8E8;
  --accent-primary: #3A4750;
  --accent-secondary: #5A6C7D;
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.03);
  --shadow-md: 0 2px 8px rgba(0, 0, 0, 0.04);
}
```

**Dark Mode Variables:**
```css
:root[data-theme="dark"] {
  --bg-primary: #1A1D1F;
  --bg-secondary: #232629;
  --bg-tertiary: #2A2D31;
  --text-primary: #E2E8F0;
  --text-secondary: #A0AEC0;
  --border-primary: #3A3F45;
  --accent-primary: #5A6C7D;
  --accent-secondary: #6B7C8D;
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.2);
  --shadow-md: 0 2px 8px rgba(0, 0, 0, 0.3);
}
```

## Modified Files

### Core Files
1. **ThemeContext.jsx** (NEW)
   - Theme state management
   - localStorage integration
   - Theme provider component

2. **XdfLayout.jsx** (MODIFIED)
   - Integrated ThemeProvider
   - Added theme toggle button
   - Connected theme state to UI

### CSS Files Modified

1. **XdfLayout.css**
   - Added CSS variables for theming
   - Converted all hardcoded colors to variables
   - Added dark mode styles for:
     - Sidebar
     - Navigation items
     - Mobile header
     - User info section
     - Theme toggle button
     - Scrollbars

2. **Dashboard.css**
   - Converted to CSS variables
   - Dark mode support for:
     - Page header
     - Statistics cards
     - Course list
     - Quick actions
     - Empty states

3. **MyPage.css**
   - CSS variables integration
   - Dark mode for:
     - User profile card
     - User details grid
     - Statistics section
     - Activity feed
     - Empty states

4. **FinalSchedule.css**
   - Theme variable support
   - Dark mode styling for:
     - Schedule container
     - View mode selector
     - Filter sidebar
     - Weekly schedule grid
     - Course cards

5. **Function.css**
   - Variable integration for main elements
   - Comprehensive dark mode override section
   - Covers:
     - Data input panels
     - Tutorial system
     - AI scheduling panel
     - Tables and forms
     - Time slots
     - Constraint cards
     - All interactive elements

## Coverage

The dark mode implementation covers:

### UI Components
- ✅ Sidebar (navigation, user info, toggles)
- ✅ Mobile header
- ✅ Page headers and titles
- ✅ All text elements
- ✅ All buttons (primary, secondary, action)
- ✅ Form inputs (text, textarea, select)
- ✅ Tables and data grids
- ✅ Cards and panels
- ✅ Statistics displays
- ✅ Status badges and tags
- ✅ Empty states
- ✅ Loading indicators
- ✅ Tooltips and hints
- ✅ Modals and dialogs
- ✅ Tabs and navigation
- ✅ Dropdown menus
- ✅ Checkboxes and radio buttons
- ✅ Scrollbars
- ✅ Borders and dividers
- ✅ Shadows and elevations
- ✅ Icons (SVG)
- ✅ Links
- ✅ Error/warning/success messages

### All Four Pages
1. ✅ Dashboard
2. ✅ Function (排课功能)
3. ✅ FinalSchedule (最终课表)
4. ✅ MyPage (我的主页)

## Implementation Details

### Theme Persistence

Theme preference is saved to `localStorage` with key `xdf-theme`:
```javascript
localStorage.setItem('xdf-theme', theme); // 'bright' or 'dark'
```

### Theme Application

The theme is applied via data attribute on the document root:
```javascript
document.documentElement.setAttribute('data-theme', theme);
```

This allows CSS selectors like:
```css
:root[data-theme="dark"] .element {
  /* dark mode styles */
}
```

### Transition Smoothness

All color transitions are smooth with a 0.3s ease timing:
```css
transition: background 0.3s ease, color 0.3s ease, border-color 0.3s ease;
```

## Color Palette

### Dark Mode Specific Colors

**Backgrounds:**
- Primary: `#1A1D1F` (Main background)
- Secondary: `#232629` (Cards, panels)
- Tertiary: `#2A2D31` (Hover states, inputs)
- Hover: `#2F3438` (Interactive hover)
- Active: `#4A5568` (Active/selected state)

**Text:**
- Primary: `#E2E8F0` (Main text)
- Secondary: `#A0AEC0` (Secondary text)
- Tertiary: `#94A3B8` (Muted text)

**Borders:**
- Primary: `#3A3F45`
- Secondary: `#4A5059`

**Accents:**
- Primary: `#5A6C7D`
- Secondary: `#6B7C8D`
- Tertiary: `#7C8D9E`

### Special State Colors

**Success (Dark):**
- Background: `#2D4A3B`
- Text: `#7CBA9E`

**Warning (Dark):**
- Background: `#4A3D2D`
- Text: `#D4B87A`

**Error (Dark):**
- Background: `rgba(158, 118, 118, 0.2)`
- Text: `#D47A7A`

**Info (Dark):**
- Background: `#2A3A4A`
- Text: `#7A8C9D`

## Testing Checklist

To verify the dark mode implementation:

### Visual Testing
- [ ] Toggle between bright and dark modes
- [ ] Verify all text is readable
- [ ] Check all buttons are visible and clickable
- [ ] Verify form inputs are accessible
- [ ] Test all four pages (Dashboard, Function, FinalSchedule, MyPage)
- [ ] Check sidebar in both expanded and collapsed states
- [ ] Verify mobile responsive behavior
- [ ] Test with test data enabled/disabled

### Functional Testing
- [ ] Theme persists after page reload
- [ ] Theme toggle works in all states
- [ ] No console errors when switching themes
- [ ] All interactive elements respond correctly
- [ ] Tooltips and modals display properly
- [ ] Table sorting and filtering work
- [ ] Form submission works
- [ ] AI scheduling features function correctly

### Accessibility Testing
- [ ] Color contrast ratios meet WCAG AA standards
- [ ] Focus indicators are visible in both modes
- [ ] Keyboard navigation works
- [ ] Screen reader compatibility (if applicable)

## Browser Compatibility

The implementation uses standard CSS features:
- CSS Custom Properties (CSS Variables)
- Data attributes
- LocalStorage API
- Standard color functions

**Supported browsers:**
- Chrome/Edge 88+
- Firefox 85+
- Safari 14+
- Mobile browsers (iOS Safari 14+, Chrome Android)

## Future Enhancements

Potential improvements:
1. System theme preference detection (`prefers-color-scheme`)
2. Additional theme variants (e.g., high contrast, blue theme)
3. Per-user theme preferences (if user auth is added)
4. Animated theme transitions
5. Theme preview before applying
6. Customizable accent colors

## Maintenance

When adding new components or styles:

1. **Always use CSS variables** instead of hardcoded colors
2. **Test in both themes** before committing
3. **Use semantic variable names** (e.g., `--bg-primary` not `--dark-gray`)
4. **Add dark mode overrides** if needed in Function.css dark mode section
5. **Document any new color usage** in this file

## Troubleshooting

### Theme doesn't persist
- Check localStorage is not disabled
- Verify `xdf-theme` key exists in localStorage
- Check browser console for errors

### Some elements don't change
- Verify CSS specificity
- Check if hardcoded colors are used
- Add override in dark mode section if needed

### Poor color contrast
- Use browser DevTools to check contrast ratio
- Adjust CSS variable values
- Test with different screen brightness settings

## References

- [MDN: CSS Custom Properties](https://developer.mozilla.org/en-US/docs/Web/CSS/--*)
- [MDN: Data attributes](https://developer.mozilla.org/en-US/docs/Learn/HTML/Howto/Use_data_attributes)
- [WCAG Color Contrast](https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html)

---

## Change Log

### 2026-01-26 - Initial Implementation
- Created ThemeContext for state management
- Added theme toggle button in sidebar
- Converted all CSS files to use CSS variables
- Implemented dark mode for all four pages
- Added comprehensive documentation
