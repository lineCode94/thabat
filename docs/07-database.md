# Database Design

Version: 1.0

Status: Approved

---

# Overview

The THABAT database is designed around flexibility.

Administrators should be able to configure worship levels, worship items, missions, and scoring without requiring database changes.

The database follows normalization principles while remaining simple to maintain.

Soft Delete is used instead of permanent deletion.

---

# Database Engine

PostgreSQL

ORM

Prisma ORM

Primary Keys

UUID

Timezone

UTC

---

# Core Entities

Authentication

- User
- Role
- RefreshToken

Organization

- Region
- MentorAssignment

Worship

- Level
- WorshipCategory
- WorshipItem
- LevelWorshipItem
- DailyTracking
- DailyTrackingItem

Gamification

- Badge
- Achievement
- UserBadge
- UserAchievement

Journey

- WeeklyReview
- Mission
- UserMission

Notifications

- Notification

System

- AuditLog

---

# User

Stores all application users.

Includes:

- Authentication
- Profile
- Role
- Region
- Current Level
- Assigned Mentor

Every user belongs to exactly one region.

Every normal user has one mentor.

Self-registered users that cannot yet be assigned to a trusted region are attached to the system `Pending Setup` region and marked `PENDING_SETUP`.

Normal users must have exactly one active `UserLevel` record. Historical inactive `UserLevel` rows are preserved.

`onboardingStatus` values:

- `PENDING_SETUP`
- `ACTIVE`

---

# Region

Represents an organizational region.

Contains:

- Users
- Mentors

Region Admins manage only one region.

---

# Mentor Assignment

Stores mentor-user relationships.

Purpose:

Track assignment history.

Allow mentor transfers.

Never lose previous assignments.

---

# Worship Level

Represents a worship level.

Contains:

- Name
- Order
- Description
- Active Status

Worship Levels are configurable.

Worship Levels are mentor-managed and separate from XP-based Gamification Levels.

New normal users are assigned the lowest active Worship Level by `order` during registration.

Promotion history is persistent and must not be stored only as notifications.

---

# Promotion Recommendation

Stores the Worship Level promotion workflow.

Contains:

- User
- Recommended By
- Previous Worship Level
- Next Worship Level
- Status
- Readiness Snapshot
- Recommendation Reason
- Decision Notes
- Approved By
- Approved At
- Declined By
- Declined At

Status values:

- PENDING
- APPROVED
- DECLINED

Declines remain internal.

---

# Worship Category

Groups worship items.

Examples:

Prayer

Quran

Azkar

Knowledge

Da'wah

Personal Development

---

# Worship Item

Represents one configurable worship activity.

Examples:

Fajr

Morning Azkar

Quran Reading

Lesson

Reading Book

Each item defines:

- Category
- Score
- XP
- Input Type

---

# Level Worship Item

Many-to-many table.

Connects:

Worship Level

↓

Worship Item

Allows every level to define its own worship requirements.

---

# Daily Tracking

Represents one user's day.

Contains:

- Date
- User
- Status
- Notes

One record per user per day.

---

# Daily Tracking Item

Stores submitted worship values.

Examples:

Fajr = Completed

Quran Pages = 12

Morning Azkar = Completed

Each row belongs to one Daily Tracking record.

---

# Weekly Review

Written by Mentor.

Contains:

- Status
- Comment
- Private Mentor Notes
- Rating
- Recommendation
- Promotion Suggestion
- Completed At

Status values:

- PENDING
- DRAFT
- COMPLETED

Completed reviews are immutable.

Visible to:

Mentor

User, only after completion

Private Mentor Notes remain hidden.

---

# Mission

Represents weekly missions.

Examples:

Read 40 Pages

Attend Lesson

Read Useful Book

---

# User Mission

Tracks mission completion.

Contains:

Progress

Completion Date

Bonus XP

---

# Badge

Defines available badges.

Example:

Consistent

Knowledge Seeker

Early Bird

---

# Achievement

Defines achievements.

Example:

100 Prayers

30 Day Streak

First Promotion

---

# User Badge

Stores earned badges.

History never deleted.

---

# User Achievement

Stores earned achievements.

History never deleted.

---

# Notification

Stores all notifications.

Fields include:

Title

Message

Type

Read Status

Created At

Read At

---

# Audit Log

Stores every important action.

Examples:

Login

Promotion

Transfer

User Update

Level Change

Mission Assignment

Audit records are immutable.

Implementation note:

Audit logging is documented as required, but the current implementation does not yet include an AuditLog model or audit service. This remains pending technical debt and must not be replaced by a duplicate logging system.

---

# Soft Delete

The following entities use soft delete:

Users

Regions

Levels

Worship Items

Categories

Missions

Badges

Achievements

Records remain available in reports.

---

# Standard Columns

Every table should include:

id

createdAt

updatedAt

createdBy

updatedBy

deletedAt (if soft delete enabled)

---

# Database Principles

Use UUIDs.

Avoid duplicate data.

Use foreign keys.

Never delete historical records.

Keep history whenever possible.

---

END OF DOCUMENT
