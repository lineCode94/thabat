# Role Based Access Control (RBAC)

Version: 1.0

Status: Approved

---

# Overview

THABAT uses a Role-Based Access Control (RBAC) system to secure resources and ensure that each user can only access features appropriate to their role.

All authorization decisions must be validated on the backend.

The frontend only hides unavailable UI for a better user experience.

---

# Roles

1. Super Admin
2. Region Admin
3. Mentor
4. User

---

# Super Admin

Full system access.

Permissions

- Manage all users
- Manage all regions
- Manage all mentors
- Manage all levels
- Manage worship categories
- Manage worship items
- Manage missions
- Manage badges
- Manage achievements
- View all reports
- View audit logs
- Configure system settings
- Reopen closed weeks
- Transfer users between regions
- Assign Region Admins

---

# Region Admin

Access only to assigned region.

Permissions

- View region statistics
- Manage mentors
- Create users
- Assign users to mentors
- Transfer users between mentors
- View region reports
- Manage region settings
- View weekly reports

Cannot access other regions.

---

# Mentor

Access only to assigned users.

Permissions

- View assigned users
- Review daily tracking
- Write weekly reviews
- Assign missions
- Promote users
- Add mentor notes
- View user reports
- Send encouragement
- View consistency

Cannot edit system configuration.

---

# User

Permissions

- Complete daily tracking
- Edit current week's tracking
- View journey
- View reports
- Read mentor feedback
- View badges
- View achievements
- Update profile
- Manage notification preferences

Cannot access other users' data.

---

# Permission Matrix

| Feature | Super Admin | Region Admin | Mentor | User |
|----------|-------------|--------------|---------|------|
| Dashboard | ✅ | ✅ | ✅ | ✅ |
| Users | ✅ | ✅ | View Assigned | Self |
| Regions | ✅ | View Own | ❌ | ❌ |
| Mentors | ✅ | ✅ | ❌ | ❌ |
| Levels | ✅ | View | View | View Current |

Promotion approval uses the `levels.promote` permission.

- SUPER_ADMIN receives `levels.promote`.
- REGION_ADMIN receives `levels.promote` with region scope.
- MENTOR receives `levels.promote` with assigned-user scope.
- USER must not receive `levels.promote`.
| Worship Items | ✅ | View | View | View Assigned |
| Daily Tracking | All | Region | Assigned | Self |
| Reviews | All | Region | Assigned | Own |
| Missions | All | Region | Assigned | Own |
| Reports | All | Region | Assigned | Own |
| Notifications | All | Region | Assigned | Own |
| Audit Logs | ✅ | ❌ | ❌ | ❌ |
| Settings | ✅ | Region | ❌ | Profile Only |

---

# Authorization Rules

Every protected request must verify:

1. Authentication
2. User Role
3. Ownership (when applicable)
4. Region Scope (when applicable)

---

# Ownership Rules

Users may only access their own resources.

Mentors may only access users assigned to them.

Region Admins may only access resources inside their region.

Super Admin has unrestricted access.

---

# Security Principles

- Never trust frontend permissions.
- Validate every request.
- Log unauthorized access attempts.
- Return appropriate HTTP status codes (401 / 403).

---

END OF DOCUMENT
