# Authentication and Backup System Setup Guide

**Created:** 2026-02-02
**Last Updated:** 2026-02-02
**Purpose:** Complete guide for setting up and using the authentication and backup system

---

## Overview

The XDF ClassArranger now includes a complete authentication system with role-based access control and an automated backup system for MongoDB.

## Features

### Authentication System
- JWT-based authentication
- Role-based access control (Admin, Teacher, Staff, Student)
- Protected routes
- User management
- Admin-only registration page

### Backup System
- Manual backup creation
- Automatic weekly backups (configurable)
- Backup download
- 30-day retention policy
- JSON format exports

## Quick Start

### 1. Environment Setup

Create or update your `.env` file in the project root:

```bash
# Admin Account
ADMIN_EMAIL=admin@xdf.com
ADMIN_PASSWORD=your_secure_admin_password
ADMIN_USERNAME=Administrator

# JWT Secret (CHANGE IN PRODUCTION!)
JWT_SECRET_KEY=your-very-long-random-secret-key-here

# Backup Settings
BACKUP_ENABLED=false
BACKUP_PATH=./backend/backups

# MongoDB
MONGODB_URL=mongodb://mongodb:27017
MONGODB_DB_NAME=xdf_class_arranger
```

**IMPORTANT**: Change the `ADMIN_PASSWORD` and `JWT_SECRET_KEY` to secure values in production!

### 2. Start the Application

```bash
# Start all services
docker-compose up -d

# Or without Docker
# Terminal 1: Start MongoDB
mongod

# Terminal 2: Start backend
cd backend
pip install -r requirements.txt
python -m app.main

# Terminal 3: Start frontend
cd frontend
npm install
npm run dev
```

### 3. First Login

1. Navigate to `http://localhost:5173/login`
2. Use admin credentials:
   - Email: `admin@xdf.com` (or your configured email)
   - Password: Your configured password
3. You'll be redirected to the dashboard

## User Roles

### Admin
- Full system access
- Can register new users
- Can manage backups
- Access to all features

### Teacher
- Can view schedules
- Can manage assigned classes
- Limited administrative access

### Staff (学管)
- Can create schedules
- Can manage students
- Can coordinate with teachers

### Student
- Can view their own schedule
- Can view their courses
- Read-only access

## Using the System

### Admin: Registering New Users

1. Log in as admin
2. Navigate to "注册账户" in the sidebar
3. Fill in user details:
   - Email (required)
   - Username (required)
   - Password (min 8 characters, required)
   - Role (Teacher/Staff/Student)
   - Description (optional)
4. Click "Create Account"

### Admin: Managing Backups

1. Log in as admin
2. Go to "我的主页" (My Page)
3. Scroll to "Database Backup" section
4. Options:
   - **Create Manual Backup**: Click button to create immediate backup
   - **Toggle Auto Backup**: Enable/disable weekly automatic backups
   - **Download Backup**: Click download icon on any backup
   - **Delete Backup**: Click delete icon to remove a backup

### Backup Schedule

When enabled, automatic backups run:
- **Frequency**: Weekly
- **Day**: Sunday
- **Time**: 2:00 AM
- **Retention**: 30 days

## API Endpoints

### Authentication

```
POST /auth/login
POST /auth/register (Admin only)
GET  /auth/me
POST /auth/logout
```

### Users

```
GET    /users/           (Admin only)
GET    /users/{id}       (Self or Admin)
PUT    /users/{id}       (Self or Admin)
DELETE /users/{id}       (Admin only)
```

### Backup

```
POST   /backup/create    (Admin only)
GET    /backup/list      (Admin only)
GET    /backup/download/{id} (Admin only)
DELETE /backup/{id}      (Admin only)
POST   /backup/toggle    (Admin only)
GET    /backup/status    (Admin only)
```

## Security Best Practices

### Production Deployment

1. **Change Default Credentials**
   ```bash
   ADMIN_EMAIL=your-admin@company.com
   ADMIN_PASSWORD=StrongPassword123!@#
   ```

2. **Use Strong JWT Secret**
   ```bash
   # Generate a random secret:
   openssl rand -hex 32
   # Use output as JWT_SECRET_KEY
   ```

3. **Enable HTTPS**
   - Use a reverse proxy (Nginx, Caddy)
   - Obtain SSL certificate (Let's Encrypt)

4. **Backup Security**
   - Store backups in secure location
   - Consider encrypting backup files
   - Limit backup access to admins only

5. **Password Policy**
   - Minimum 8 characters (enforced)
   - Consider requiring special characters
   - Implement password expiration if needed

## Troubleshooting

### Cannot Log In

**Problem**: "Incorrect email or password"

**Solutions**:
1. Verify admin credentials in `.env`
2. Check if MongoDB is running: `docker-compose ps`
3. Check backend logs: `docker-compose logs backend`
4. Restart services: `docker-compose restart`

### Admin User Not Created

**Problem**: Admin user doesn't exist

**Solutions**:
1. Check backend startup logs for admin creation message
2. Manually create admin via MongoDB:
   ```javascript
   use xdf_class_arranger
   db.users.find({role: "admin"})
   ```
3. Restart backend to trigger admin creation

### Backup Fails

**Problem**: "Failed to create backup"

**Solutions**:
1. Check backup directory permissions
2. Ensure MongoDB connection is active
3. Check disk space
4. Review backend logs for errors

### Token Expired

**Problem**: Automatically logged out

**Solution**: This is normal. Token expires after 7 days. Just log in again.

## Database Schema

### Users Collection

```javascript
{
  _id: ObjectId,
  email: String (unique),
  username: String,
  hashed_password: String,
  role: String (enum: admin/teacher/staff/student),
  description: String (optional),
  created_at: DateTime,
  updated_at: DateTime
}
```

## Backup File Format

```json
{
  "created_at": "2026-02-02T10:30:00.000Z",
  "collection": "users",
  "count": 15,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "email": "user@example.com",
      "username": "John Doe",
      "role": "teacher",
      ...
    }
  ]
}
```

## Maintenance

### Regular Tasks

1. **Weekly**: Check backup logs
2. **Monthly**: Review user accounts
3. **Quarterly**: Update dependencies
4. **Yearly**: Rotate JWT secret key

### Monitoring

Check these logs regularly:
```bash
# Backend logs
docker-compose logs -f backend

# MongoDB logs
docker-compose logs -f mongodb

# All logs
docker-compose logs -f
```

## Future Enhancements

Planned features:
- Password reset via email
- Two-factor authentication
- Backup encryption
- Cloud backup storage (GCP)
- Audit logging
- Role permission customization

## Support

For issues or questions:
1. Check this documentation
2. Review backend logs
3. Check MongoDB connection
4. Verify environment variables

## References

- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [MongoDB Documentation](https://docs.mongodb.com/)
- [JWT.io](https://jwt.io/)
- [APScheduler Docs](https://apscheduler.readthedocs.io/)
