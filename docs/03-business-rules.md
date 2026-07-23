# Business Rules

Version: 1.0

---

# Overview

This document defines all business rules used by THABAT.

Business rules must never exist only inside the source code.

Any future changes should be applied here first.

---

# User Assignment

Every User must belong to:

- One Region
- One Mentor
- One Worship Level

A Mentor may have many Users.

A Region may contain many Mentors.

Self-registered normal User accounts start in `PENDING_SETUP` when trusted region setup is not complete.

Public registration must not accept role, permission, region, mentor, or Worship Level assignment fields.

Every normal User must have exactly one active Worship Level assignment. The default assignment is the lowest active Worship Level by `order`.

Worship Level is separate from XP-based Gamification Level. XP never determines the user's active Worship Level.

Mentor assignment does not block account creation. When no active mentor exists, the user remains in a pending mentor assignment state for assignment workflows.

---

# Daily Tracking

Each user can create only one tracking record per day.

Users may edit records until the current week is closed.

After a week is closed, records become read-only.

Today's Worship must be resolved from the user's active Worship Level requirements and personalized requirements when available.

If Today's Worship cannot be generated, the backend must return a stable readiness reason:

- `ONBOARDING_INCOMPLETE`
- `NO_ACTIVE_WORSHIP_LEVEL`
- `NO_LEVEL_REQUIREMENTS`
- `NO_WORSHIP_ITEMS_CONFIGURED`

---

# Week Closing

The week closes automatically every Saturday at 11:59 PM.

The application week starts Sunday at 00:00 and ends Saturday at 23:59:59.999.

After closing:

- Tracking is locked.
- Weekly reports are generated.
- Weekly review becomes available.

Only Super Admin can reopen a closed week.

---

# XP Rules

Every worship item has a fixed XP value.

Example

Fajr = 20 XP

Morning Azkar = 10 XP

Quran = 2 XP per page

XP is always added.

XP is never deducted.

Changing XP values affects future records only.

---

# Score Rules

Each worship item also has a Score.

Score is used for reports and consistency.

XP is used only for Gamification.

XP and Score are independent.

---

# Streak Rules

A streak increases when the user records activity for the day.

Missing one day resets the current streak.

Longest streak is preserved forever.

---

# Consistency Rules

Consistency is calculated based on completed assigned worship.

Formula:

Completed Score / Total Assigned Score × 100

Result:

0% → 100%

Consistency is calculated:

- Daily
- Weekly
- Monthly

---

# Promotion Rules

Users cannot promote themselves.

Only Mentors can promote users.

Promotion is based on observation, not automatic calculations.

The system may suggest promotion, but the final decision belongs to the Mentor.

Worship Level promotion is separate from XP-based Gamification Level progression.

XP never controls Worship Level promotion.

Promotion readiness criteria are configurable. The initial development defaults are:

- Minimum consistency: 80%
- Minimum weeks at current Worship Level: 4
- Minimum completed weekly reviews: 2

These values are pending final business validation.

Declined promotion recommendations remain internal.

Approved Worship Level promotions create a Journey milestone.

---

# Weekly Review Rules

Weekly reviews follow this lifecycle:

- PENDING
- DRAFT
- COMPLETED

PENDING means the weekly review context exists but the mentor has not started writing the review.

DRAFT means the mentor has started editing or saved review content.

COMPLETED means the mentor finalized the review.

Completed weekly reviews are immutable.

Users may only view their own completed weekly reviews.

Private mentor notes are mentor/internal content and must never be exposed to users.

---

# Archive Rules

Users, Levels, Worship Items, and Regions are never permanently deleted.

Archived records remain available in historical reports.

---

# Audit Rules

Every important action must be logged.

Examples:

- Login
- Logout
- Promotion
- Transfer
- Level Change
- User Assignment

Audit logs cannot be edited.

---

# Notification Rules

Daily reminders are sent only if no tracking exists for today.

Achievement notifications are sent immediately after unlocking.

Weekly reminders are sent after week closing.

---

# Report Rules

Reports are generated automatically.

Weekly reports become read-only after generation.

Historical reports never change.

---

# Security Rules

All permissions are validated on the backend.

Frontend validation is for UX only.

---

END OF DOCUMENT
