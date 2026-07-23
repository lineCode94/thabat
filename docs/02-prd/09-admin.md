# Product Requirements Document

# 09 - Administration

---

# Overview

The Administration module allows authorized users to configure and manage the THABAT platform.

The administration area should be simple, secure, and scalable.

Every administrative action must be logged.

---

# Objectives

The Administration module should:

- Manage users.
- Manage mentors.
- Manage regions.
- Manage worship templates.
- Manage levels.
- Manage notifications.
- Configure gamification.
- Configure system settings.
- View analytics.

---

# User Management

Administrators can:

- Create User
- Edit User
- Archive User
- Activate User
- Suspend User
- Reset Password
- Assign Region
- Assign Mentor
- Change User Status

Users are never permanently deleted.

Archived users remain in historical reports.

---

# Mentor Management

Administrators can:

- Create Mentor
- Edit Mentor
- Archive Mentor
- Assign Users
- Transfer Users
- View Mentor Statistics

Each mentor has:

- Assigned Users Count
- Average Consistency
- Average Streak
- Pending Weekly Reviews

---

# Region Management

Super Admin can:

- Create Region
- Edit Region
- Archive Region
- Assign Region Admins

Each Region contains:

- Mentors
- Users

Region Admins can only manage their own region.

---

# Worship Management

Administrators can:

- Create Worship Categories
- Create Worship Items
- Edit Worship Items
- Archive Worship Items
- Configure Scores
- Configure Display Order

No code deployment should be required.

---

# Level Management

Administrators can:

- Create Levels
- Edit Levels
- Archive Levels
- Duplicate Levels
- Configure Worship Requirements

Mentors may customize worship requirements for individual users.

---

# Mission Management

Administrators can:

- Create Weekly Missions
- Edit Missions
- Archive Missions
- Assign Missions to Levels

Mentors may assign personal missions to users.

---

# Badge Management

Administrators can:

- Create Badges
- Edit Badges
- Archive Badges
- Configure Unlock Rules

---

# Achievement Management

Administrators can:

- Create Achievements
- Edit Achievements
- Archive Achievements
- Configure Unlock Conditions

---

# Notification Management

Administrators can configure:

- Daily Reminder Time
- Weekly Reminder Time
- Email Notifications
- In-App Notifications
- Notification Templates

---

# Localization

Administrators can:

- Enable Arabic
- Enable English

Future support may include additional languages.

---

# Dashboard

The Administration Dashboard displays:

- Total Users
- Total Mentors
- Total Regions
- Active Users
- Inactive Users
- Daily Tracking Rate
- Weekly Completion Rate
- Promotion Count
- System Health

---

# Search

Administrators should be able to search by:

- User Name
- Email
- Region
- Mentor
- Level
- Status

---

# Filters

Support filtering by:

- Region
- Mentor
- User Status
- Worship Level
- Date Range

---

# Bulk Actions

Support bulk operations:

- Assign Mentor
- Change Region
- Archive Users
- Activate Users
- Send Notification

Bulk actions should display confirmation dialogs.

---

# Audit Log

Every administrative action should be logged.

Examples:

- User Created
- User Updated
- User Archived
- Level Updated
- Worship Edited
- Mission Assigned
- Notification Sent
- Region Created

Audit records cannot be edited.

---

# Security

Only authorized users may access administration pages.

Every request must be validated on the backend.

Frontend validation alone is not sufficient.

---

# Acceptance Criteria

✓ User management available.

✓ Mentor management available.

✓ Region management available.

✓ Worship management available.

✓ Level management available.

✓ Mission management available.

✓ Badge management available.

✓ Achievement management available.

✓ Notification settings available.

✓ Dashboard available.

✓ Audit Log available.

✓ Bulk actions supported.

---

END OF DOCUMENT