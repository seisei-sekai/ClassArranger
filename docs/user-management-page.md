# User Management Page - Admin CRUD Interface

**Created:** 2026-02-02
**Purpose:** Complete user management interface for non-technical administrators

---

## Overview

Added a comprehensive user management page that allows administrators to perform all CRUD operations on user accounts through an intuitive interface.

## Features

### 1. View All Users
- **Table view** with sortable columns
- Shows: Username, Email, Role, Description, Creation date
- **Color-coded role badges**:
  - 管理员 (Admin) - Dark gray
  - 教师 (Teacher) - Green
  - 学管 (Staff) - Blue
  - 学生 (Student) - Light gray

### 2. Create New User
- Modal form with validation
- Required fields:
  - Email (unique)
  - Username
  - Password (min 8 characters)
  - Role selection
- Optional description field
- Instant feedback on errors

### 3. View User Details
- Complete user information display
- Shows all database fields:
  - User ID
  - Email
  - Username
  - Role
  - Description
  - Creation timestamp

### 4. Edit User
- Update username
- Change role
- Modify description
- **Email cannot be changed** (immutable)
- Form pre-filled with current values

### 5. Delete User
- Confirmation dialog before deletion
- **Cannot delete own account** (safety feature)
- Permanent deletion from database

## Access

### URL
`/user_management`

### Menu Location
- Sidebar menu item: **"管理用户"**
- Only visible to administrators
- Icon: Multiple users

### Permissions
- **Admin only** - Protected by AdminRoute
- Non-admin users see "Access Denied" message

## User Interface

### Design Style
- Matches XDF Japanese minimalist aesthetic
- Uses consistent color palette:
  - Background: `#FAFAFA`
  - Cards: `#FFFFFF`
  - Borders: `#E8E8E8`
  - Primary: `#3A4750`

### Components
1. **Table** - Responsive, hover effects
2. **Action Buttons** - View, Edit, Delete with icons
3. **Modals** - Create, Edit, View dialogs
4. **Form Validation** - Client-side checks

### Responsive
- Desktop: Full table layout
- Tablet: Horizontal scroll for table
- Mobile: Stacked form fields

## API Integration

### Endpoints Used

```javascript
// List users
GET /users/

// View user
GET /users/{id}

// Create user
POST /auth/register

// Update user
PUT /users/{id}

// Delete user
DELETE /users/{id}
```

### Authentication
All requests include JWT token in Authorization header:
```
Authorization: Bearer <token>
```

## Usage Examples

### Creating a New Teacher
1. Click "创建新用户" button
2. Fill in form:
   - Email: teacher@xdf.com
   - Username: 张老师
   - Password: TeacherPass123
   - Role: 教师 (Teacher)
   - Description: 数学专业教师
3. Click "创建用户"
4. Success toast appears
5. User added to table

### Editing a Student
1. Find student in table
2. Click edit icon (pencil)
3. Update fields:
   - Username: 李明 → 李明同学
   - Description: Add class information
4. Click "保存更改"
5. Changes reflected immediately

### Deleting a User
1. Click delete icon (trash)
2. Confirm in dialog
3. User removed from database
4. Table refreshes automatically

## Security Features

### Protection Mechanisms
- ✅ Admin-only access (route protection)
- ✅ Cannot delete own account
- ✅ Email immutability (prevents conflicts)
- ✅ Password minimum length (8 chars)
- ✅ JWT authentication required
- ✅ Confirmation dialogs for destructive actions

### Validation
- **Client-side**: Form validation before submit
- **Server-side**: Backend validates all data
- **Error handling**: User-friendly error messages

## Files Created

### Component
```
frontend/src/XdfClassArranger/Admin/UserManagement.jsx
frontend/src/XdfClassArranger/Admin/UserManagement.css
```

### Routes Updated
```
frontend/src/App.jsx - Added /user_management route
frontend/src/XdfClassArranger/XdfLayout.jsx - Added menu item
```

## Technical Details

### State Management
```javascript
- users[] - List of all users
- selectedUser - Currently viewing/editing user
- formData - Form state for create/edit
- showCreateModal - Create modal visibility
- showEditModal - Edit modal visibility
- showViewModal - View modal visibility
```

### Key Functions
```javascript
loadUsers() - Fetch all users from API
handleCreateUser() - Create new user
handleUpdateUser() - Update existing user
handleDeleteUser() - Delete user with confirmation
```

## Troubleshooting

### Cannot see "管理用户" menu
- **Cause**: Not logged in as admin
- **Solution**: Login with admin credentials

### Cannot delete user
- **Cause**: Trying to delete own account
- **Solution**: Use another admin account

### Create user fails
- **Cause**: Email already exists
- **Solution**: Use different email address

### Edit user - email greyed out
- **Expected**: Email cannot be changed (by design)

## Future Enhancements

Potential improvements:
- [ ] Bulk operations (delete multiple users)
- [ ] Search and filter functionality
- [ ] Export user list to CSV
- [ ] User activity logs
- [ ] Password reset function
- [ ] Pagination for large user lists
- [ ] Advanced filtering by role/date

## Summary

The User Management page provides a complete, non-technical-friendly interface for administrators to manage all user accounts. It follows the same design principles as the rest of the application and includes proper validation, error handling, and security measures.

**Location**: `/user_management` (Admin only)
**Menu**: 管理用户
**Access**: Administrators only
