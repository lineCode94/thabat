# Product Requirements Document

# 05 - Daily Tracking

---

# Overview

The Daily Tracking module allows users to record their worship activities every day.

The experience should be fast, simple, and encouraging.

A user should be able to complete the daily check in less than one minute.

The application should never overwhelm the user with long forms.

---

# Objectives

The Daily Tracking module should:

- Encourage daily consistency.
- Reduce friction.
- Support historical tracking.
- Generate accurate reports.
- Feed the Gamification Engine.

---

# Daily Workflow

Every day the user opens the Daily Check page.

The application loads all worship items assigned to:

- User Level
- Personalized Plan (if available)

The user completes today's activities.

The system saves all changes automatically.

---

# Editing Rules

Users may edit today's record at any time.

Users may edit previous days until the current week ends.

Once the week is closed:

The week's records become locked.

No further editing is allowed.

Only Super Admin may unlock a closed week.

---

# Auto Save

The system should automatically save changes.

The user should not lose data when:

- Refreshing the page.
- Closing the browser accidentally.
- Internet interruption.

Pending changes should sync automatically when the connection returns.

---

# Daily Status

Each day has one of the following states:

- Empty
- In Progress
- Completed
- Locked

---

# Daily Notes

Users may optionally write a daily note.

Examples:

- Travel
- Sick
- Busy at work
- Family visit

Notes are visible to:

- User
- Assigned Mentor

---

# Mentor Notes

Mentors may also add notes.

Mentor notes are private.

Users cannot see mentor notes.

Examples:

- Needs encouragement.
- Called today.
- Showing improvement.
- Discuss promotion next week.

---

# Daily Checklist

The checklist is grouped by category.

Example

Prayer

- Fajr
- Dhuhr
- Asr
- Maghrib
- Isha

Quran

- Reading

Azkar

- Morning
- Evening

Knowledge

- Lesson

This makes the page easier to navigate.

---

# Progress Indicator

The page displays progress while filling.

Example

Completed

8 / 12 Activities

The progress bar should encourage completion.

---

# Validation

Required worship items should be highlighted.

Optional items remain available.

Incomplete required items should not block saving.

The system encourages rather than forces completion.

---

# Missed Days

If a user skips a day:

The application displays an encouraging reminder.

No punishment.

No negative messages.

Examples:

"Every new day is a fresh start."

"You can continue your journey today."

---

# Offline Support

If internet is unavailable:

Changes should be stored locally.

Once internet returns:

Changes sync automatically.

The user should not notice the synchronization process.

---

# Notifications

If today's checklist is still empty:

The system sends a friendly reminder.

Example:

"Don't forget to record today's journey."

Notification timing should be configurable.

---

# Weekly Lock

Every week ends automatically.

After closing:

- Records become read-only.
- Reports become final.
- Weekly Review becomes available.

---

# Daily History

Users can browse previous days.

Each day displays:

- Worship completion
- Score
- Consistency
- Notes
- Mentor feedback (if available)

---

# Calendar View

Users can switch to Calendar View.

Each day displays a color.

Green

Completed

Yellow

Partial

Gray

No Record

Locked days display a lock icon.

---

# Acceptance Criteria

✓ Daily tracking works in less than one minute.

✓ Auto Save is enabled.

✓ Weekly Lock prevents editing.

✓ Daily Notes are supported.

✓ Mentor Notes remain private.

✓ Calendar View is available.

✓ Offline support is considered.

✓ Daily history is preserved.

---

END OF DOCUMENT