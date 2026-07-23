# Product Requirements Document

# 03 - Levels System

---

# Overview

The Levels System is the foundation of the user journey.

Levels represent different stages of commitment and consistency.

Each level contains a configurable set of worship requirements.

The system must be fully dynamic.

Administrators and mentors should be able to modify levels without writing code.

---

# Objectives

The Levels System should:

- Guide users gradually.
- Avoid overwhelming beginners.
- Support personalized growth.
- Allow mentors to manually promote users.
- Encourage consistency rather than perfection.

---

# Level Structure

Each level contains:

- Name
- Description
- Order
- Active Status
- Worship Requirements
- Minimum Suggested Duration
- Created By
- Created At

---

# Default Levels

The application ships with 5 default levels.

Administrators may modify them.

Administrators may create additional levels.

Administrators may delete levels.

Administrators may reorder levels.

---

# Example Levels

## Level 1

Focus:

Daily Prayers

Requirements:

- Fajr
- Dhuhr
- Asr
- Maghrib
- Isha

---

## Level 2

Focus:

Prayer Consistency

Requirements:

- Daily Prayers
- Congregation Prayer
- Morning Azkar
- Evening Azkar

---

## Level 3

Focus:

Building Habits

Requirements:

- Daily Prayers
- Congregation Prayer
- Quran Reading
- Morning Azkar
- Evening Azkar
- Istighfar

---

## Level 4

Focus:

Commitment

Requirements:

- Daily Prayers
- First Row
- Takbirat Al Ihram
- Quran Reading
- Quran Memorization
- Night Prayer

---

## Level 5

Focus:

Leadership and Consistency

Requirements:

- Full Worship Program
- Quran
- Memorization
- Revision
- Knowledge Seeking
- Dawah Activities

---

# Level Assignment

Every user must belong to one level.

Users cannot belong to multiple levels simultaneously.

---

# Promotion

Promotion is always manual.

Only mentors can promote users.

Region Admins may also promote users.

Users cannot promote themselves.

---

# Promotion Criteria

The application may suggest promotion.

However, final promotion decision belongs to the mentor.

Examples:

- High consistency.
- Long streak.
- Positive weekly reviews.

These are recommendations only.

---

# Demotion

Demotion should be supported.

Only mentors and administrators may demote users.

Demotion reason should be stored.

---

# Promotion History

The system must store:

- Previous Level
- New Level
- Date
- Mentor
- Optional Note

Promotion history should remain permanent.

---

# Level Customization

Mentors and Administrators can:

- Add worship items
- Remove worship items
- Change order
- Change requirements

without code changes.

---

# Personal Plans

A mentor may customize a user's level requirements.

Example:

A user is in Level 3.

The mentor removes Night Prayer temporarily.

Only that user is affected.

The original level remains unchanged.

---

# Suggested Duration

Each level may have a suggested duration.

Example:

Level 1

Suggested Duration:

30 Days

The system may remind mentors when the duration is completed.

Promotion remains manual.

---

# Level Analytics

The system should track:

- Number of users per level
- Promotions
- Demotions
- Average consistency
- Average streak

---

# User Experience

Users should clearly understand:

- Their current level
- Level requirements
- Progress toward consistency
- Recent promotions

The application should never display:

"You failed the level."

Instead use encouraging language.

Example:

"Continue your consistency journey."

---

# Future Expansion

Future versions may include:

- Automatic promotion recommendations
- AI mentor suggestions
- Level templates marketplace

Version 1 does not include these features.

---

END OF DOCUMENT