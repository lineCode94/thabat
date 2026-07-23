# Product Requirements Document

# 02 - User Roles

---

# Overview

The system uses a hierarchical Role-Based Access Control (RBAC) model.

Each authenticated user belongs to exactly one primary role.

Some users may also have additional responsibilities (e.g. a Mentor who is also followed by another Mentor), but authorization is always determined by their assigned role.

---

# Role Hierarchy

Super Admin

↓

Region Admin

↓

Mentor

↓

User

Each higher role inherits visibility over the roles below it, according to the business rules.

---

# Role Definitions

## Super Admin

The highest authority in the system.

Responsibilities:

- Manage the entire platform.
- Create regions.
- Manage Region Admins.
- Create global worship templates.
- Configure system settings.
- Configure scoring.
- Configure badges.
- Configure achievements.
- Configure notifications.
- View all analytics.
- View all reports.
- View audit logs.
- Manage permissions.
- Activate or deactivate users.
- Transfer users between regions.
- Manage translations.
- Manage system configuration.

Restrictions:

None.

---

## Region Admin

Responsible for a single region.

Responsibilities:

- Manage mentors inside the region.
- Create users.
- Import users.
- Assign mentors.
- Transfer users inside the region.
- View region analytics.
- Review mentor performance.
- Review user reports.
- Configure region settings.
- Create region missions.
- Promote mentors (if allowed).

Restrictions:

Cannot access other regions.

Cannot modify global settings.

Cannot create Super Admins.

Cannot change system permissions.

---

## Mentor

Responsible for assigned users.

Responsibilities:

- View assigned users.
- Edit assigned users.
- Review daily logs.
- Add weekly reviews.
- Add private mentor notes.
- Promote users to another level.
- Assign personal missions.
- View charts.
- View consistency.
- View streaks.
- View reports.
- Receive inactivity alerts.

Restrictions:

Cannot manage users outside assigned list.

Cannot edit system settings.

Cannot edit worship templates.

Cannot manage regions.

Cannot manage permissions.

---

## User

The lowest role.

Responsibilities:

- Complete daily worship.
- View journey.
- View achievements.
- View badges.
- View charts.
- View consistency.
- View weekly feedback.
- Edit profile.
- Receive notifications.

Restrictions:

Cannot view other users.

Cannot change levels.

Cannot edit templates.

Cannot access administration.

---

# Special Cases

## Mentor is also a User

A Mentor may also have his own Mentor.

Example:

Ahmed is a Mentor.

Ahmed follows 15 users.

Ahmed is also followed by Khaled.

The system must support this relationship.

---

## Region Admin is also a Mentor

Optional.

The system should allow this if enabled by Super Admin.

---

# Visibility Rules

## Super Admin

Can view:

All Regions

All Mentors

All Users

All Reports

All Analytics

---

## Region Admin

Can view:

Own Region

Mentors inside region

Users inside region

Region reports

Region analytics

---

## Mentor

Can view:

Assigned Users

Assigned User Reports

Assigned User Journey

Assigned User Charts

Assigned User Weekly Reviews

---

## User

Can view:

Own profile

Own journey

Own reports

Own achievements

Own reviews

---

# Assignment Rules

Each User must have one Mentor.

Each Mentor can have many Users.

Each Region contains many Mentors.

Each Region contains many Users.

Each Region has one or more Region Admins.

There is only one Super Admin role type, but multiple Super Admin accounts are allowed.

---

# Promotion Rules

Users never promote themselves.

Promotion is decided manually by the Mentor.

Promotion history must be stored.

Promotion date must be stored.

Promotion reason is optional.

---

# Transfer Rules

Users can be transferred:

Between Mentors.

Between Regions.

Transfer history must be stored.

Previous mentor should remain in history.

---

# User Status

A user may have one of the following statuses:

Active

Inactive

Pending

Suspended

Archived

Status changes must be logged.

---

# Account Creation

Accounts may be created by:

Super Admin

Region Admin

Self Registration (if enabled)

When self-registration is enabled, the account remains Pending until assigned to a Region and Mentor.

---

# Authentication

Login using:

Email

Password

Future support:

Google

Apple

Microsoft

OTP

---

# Authorization

Authorization must always be handled by permissions.

Never trust frontend validation.

Backend is the source of truth.

---

# Audit Requirements

The following events must be logged:

User created

User updated

Role changed

Mentor changed

Region changed

Status changed

Promotion

Transfer

Login

Logout

Password reset

---

# Future Expansion

The RBAC system should support adding new roles in future without major architectural changes.

Examples:

Organization Admin

Teacher

Parent

Volunteer

Coach

---

END OF DOCUMENT