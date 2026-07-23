# Product Requirements Document

# 04 - Worship System

---

# Overview

The Worship System is the heart of THABAT.

It provides a fully dynamic way to define, organize, and track worship activities without changing the application code.

Every worship activity in the system is configurable.

Administrators and Mentors can customize worship items according to the needs of each level or individual user.

---

# Objectives

The Worship System should:

- Support unlimited worship items.
- Support multiple worship categories.
- Allow flexible configuration.
- Be easy to expand.
- Require zero code changes when adding new worship activities.

---

# Worship Categories

The system groups worship into categories.

Default Categories:

- Prayer
- Quran
- Memorization
- Revision
- Azkar
- Knowledge
- Da'wah
- Personal Development
- Missions

Administrators can:

- Add categories.
- Rename categories.
- Archive categories.

---

# Worship Item

A Worship Item is a single activity the user performs.

Examples:

Prayer

- Fajr
- Dhuhr
- Asr
- Maghrib
- Isha

Prayer Quality

- In Mosque
- In Congregation
- First Row
- Takbeer Al-Ihram
- Sunnah Rawatib

Quran

- Quran Reading (Pages)

Memorization

- Memorized Today

Revision

- Reviewed Today

Azkar

- Morning Azkar
- Evening Azkar
- Istighfar
- Salawat

Knowledge

- Attended Lesson
- Self Study

Da'wah

- Da'wah Activity

Personal

- Read Useful Book
- Exercise
- Charity

---

# Worship Item Properties

Each Worship Item contains:

- Name
- Description
- Category
- Score
- Icon
- Display Order
- Active Status
- Required Flag

---

# Input Types

Version 1 supports the following input types.

## Checkbox

Example:

Morning Azkar

Values:

Completed

Not Completed

---

## Number

Example:

Quran Reading

Value:

Number of Pages

---

Future Versions

The architecture should support adding new input types later without affecting existing records.

Examples:

Minutes

Rating

Text

Counter

Attachments

---

# Scoring

Each Worship Item has a fixed score.

Example

Fajr Prayer

20 Points

Morning Azkar

10 Points

Quran Reading

2 Points per Page

The score is configurable.

Changing the score affects future records only.

Historical records remain unchanged.

---

# Required Items

Some worship items may be marked as Required.

Required items appear highlighted inside the daily checklist.

Optional items remain visible but are not mandatory.

---

# Dynamic Configuration

Administrators can:

- Create worship items.
- Edit worship items.
- Archive worship items.
- Reorder worship items.
- Change scores.
- Move items between categories.

No code deployment should be required.

---

# Level Assignment

Each level contains its own worship configuration.

Example

Level 1

Prayer

Morning Azkar

---

Level 2

Prayer

Morning Azkar

Quran

---

Level 3

Prayer

Morning Azkar

Quran

Qiyam

Knowledge

---

Mentors may customize the assigned worship items for an individual user.

This customization affects only that user.

---

# Archiving

Worship items cannot be permanently deleted if they are referenced by historical records.

Instead they become Archived.

Archived items:

- Do not appear in new checklists.
- Continue appearing in history.
- Continue appearing in reports.

---

# Ordering

Categories have display order.

Worship items inside each category also have display order.

Both are configurable.

---

# Daily Visibility

Users only see worship items assigned to:

- Their current level.
- Their personalized plan (if available).

Users never see worship items outside their level.

---

# Weekly Mission Items

Mission items behave like worship items.

Example

Read a beneficial book.

Visit a relative.

Memorize Surah Al-Mulk.

These appear in the Weekly Mission section.

---

# Validation Rules

Every worship item must belong to one category.

Every worship item must have:

- Name
- Score
- Input Type

Archived items cannot be assigned to new levels.

---

# History

Every modification should be logged.

Examples

Score Changed

Category Changed

Archived

Restored

Renamed

Order Changed

---

# Acceptance Criteria

✓ Unlimited worship items.

✓ Unlimited categories.

✓ Dynamic configuration.

✓ Level-based assignment.

✓ Personalized assignment.

✓ Historical integrity.

✓ Configurable scoring.

✓ No code changes required for future worship additions.

---

END OF DOCUMENT
