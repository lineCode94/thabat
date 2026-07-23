# Entity Relationship Diagram (ERD)

Version: 1.0

---

# Overview

This document describes the relationships between the main entities in THABAT.

The diagram represents the conceptual database design.

---

```mermaid
erDiagram

    User {
        uuid id
        string fullName
        string email
        string password
        enum role
        uuid regionId
        uuid levelId
    }

    Region {
        uuid id
        string name
    }

    MentorAssignment {
        uuid id
        uuid mentorId
        uuid userId
        date assignedAt
        boolean isActive
    }

    WorshipLevel {
        uuid id
        string name
        int order
    }

    PromotionRecommendation {
        uuid id
        uuid userId
        uuid recommendedById
        uuid previousLevelId
        uuid nextLevelId
        enum status
    }

    WorshipCategory {
        uuid id
        string name
    }

    WorshipItem {
        uuid id
        string name
        string inputType
        int score
        int xp
    }

    LevelWorshipItem {
        uuid id
        uuid levelId
        uuid worshipItemId
    }

    DailyTracking {
        uuid id
        uuid userId
        date trackingDate
        string status
    }

    DailyTrackingItem {
        uuid id
        uuid dailyTrackingId
        uuid worshipItemId
        string value
    }

    WeeklyReview {
        uuid id
        uuid mentorId
        uuid userId
    }

    Mission {
        uuid id
        string title
        int bonusXP
    }

    UserMission {
        uuid id
        uuid missionId
        uuid userId
        boolean completed
    }

    Badge {
        uuid id
        string name
    }

    UserBadge {
        uuid id
        uuid badgeId
        uuid userId
    }

    Achievement {
        uuid id
        string name
    }

    UserAchievement {
        uuid id
        uuid achievementId
        uuid userId
    }

    Notification {
        uuid id
        uuid userId
        string type
    }

    AuditLog {
        uuid id
        uuid userId
        string action
    }

    Region ||--o{ User : contains

    User ||--o{ UserLevel : has_history
    WorshipLevel ||--o{ UserLevel : assigned_as

    User ||--o{ MentorAssignment : mentor

    User ||--o{ MentorAssignment : student

    WorshipLevel ||--o{ LevelWorshipItem : has

    WorshipItem ||--o{ LevelWorshipItem : assigned
    User ||--o{ PromotionRecommendation : receives
    WorshipLevel ||--o{ PromotionRecommendation : previous
    WorshipLevel ||--o{ PromotionRecommendation : next

    WorshipCategory ||--o{ WorshipItem : contains

    User ||--o{ DailyTracking : creates

    DailyTracking ||--o{ DailyTrackingItem : contains

    WorshipItem ||--o{ DailyTrackingItem : tracked

    User ||--o{ WeeklyReview : receives

    User ||--o{ UserMission : has

    Mission ||--o{ UserMission : assigned

    User ||--o{ UserBadge : earns

    Badge ||--o{ UserBadge : awarded

    User ||--o{ UserAchievement : unlocks

    Achievement ||--o{ UserAchievement : earned

    User ||--o{ Notification : receives

    User ||--o{ AuditLog : performs
```

---

# Notes

## Mentor Assignment

A Mentor is also a User.

The MentorAssignment table links:

Mentor User

↓

Student User

This allows:

- Mentor transfers
- Assignment history
- Multiple historical mentors

---

## Daily Tracking

Each user has one DailyTracking per day.

Each DailyTracking contains many DailyTrackingItems.

---

## Worship System

Levels do not own worship items directly.

The LevelWorshipItem table allows:

Many Levels

↓

Many Worship Items

---

## Missions

A Mission may be assigned to many users.

Each user has independent progress.

---

## Badges

Badges are templates.

UserBadge stores earned badges.

---

## Achievements

Achievements are templates.

UserAchievement stores unlocked achievements.

---

# Database Design Principles

- UUID Primary Keys
- Soft Delete
- Immutable History
- Normalized Structure
- Foreign Key Constraints
- No Cascading Delete for Historical Data

---

END OF DOCUMENT
