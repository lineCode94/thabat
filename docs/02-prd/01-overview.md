# Product Requirements Document (PRD)

# 01 - Product Overview

---

# Project Name

THABAT

---

# Version

1.0

---

# Status

Draft

---

# Document Owner

Software Architecture Team

---

# Purpose

THABAT is a mentorship platform that helps individuals build consistency in worship through encouragement, accountability, measurable progress, and personalized mentoring.

The application is not designed to judge users.

Instead, it focuses on creating sustainable habits using positive reinforcement, gamification, and structured mentorship.

---

# Problem Statement

Many mentorship groups currently rely on:

- Paper forms
- Excel sheets
- WhatsApp messages
- Manual reports

These approaches suffer from several issues:

- Difficult to follow progress.
- No historical records.
- No analytics.
- Weak motivation.
- Time-consuming weekly reviews.
- Difficult mentor management.
- No automatic reminders.
- No long-term consistency tracking.

THABAT solves these problems through a centralized digital platform.

---

# Product Vision

Create the most flexible mentorship platform that allows organizations to monitor spiritual growth while maintaining encouragement, privacy, and simplicity.

The system should adapt to different organizations instead of forcing organizations to adapt to the system.

Everything should be configurable.

---

# Primary Objectives

The application should help users:

- Build consistent worship habits.
- Maintain long-term motivation.
- Track personal progress.
- Receive mentor feedback.
- Celebrate achievements.
- Develop discipline.

The application should help mentors:

- Track assigned users.
- Identify struggling users.
- Review reports.
- Promote users.
- Assign personalized missions.
- Encourage users.

The application should help administrators:

- Manage the entire organization.
- Create templates.
- Create worship items.
- Manage levels.
- Configure gamification.
- View analytics.
- Manage permissions.

---

# Core Features

## Authentication

- Login
- Register
- Forgot Password
- Email Verification
- JWT Authentication

---

## User Management

- Users
- Mentors
- Region Admins
- Super Admins

---

## Region Management

- Multiple Regions
- Region Administrators
- Mentor Assignment

---

## Mentorship

- Assign Mentor
- Transfer User
- Weekly Reviews
- Private Notes
- User History

---

## Levels

Dynamic level system.

Administrators can:

- Create levels.
- Edit levels.
- Remove levels.
- Duplicate levels.
- Reorder levels.

Each level contains configurable worship requirements.

---

## Worship System

Dynamic worship builder.

Each worship item can define:

- Name
- Description
- Category
- Input Type
- Score
- Required
- Active
- Order

No code changes should be required when adding new worship items.

---

## Daily Tracking

Users submit worship daily.

The system records:

- Date
- Worship values
- Completion
- Notes

Editing is allowed until the end of the current week.

---

## Journey

Every user has a personal journey page showing:

- Consistency
- Streak
- XP
- Achievements
- Heatmap
- Weekly reviews
- Charts
- Recent activity

---

## Gamification

The application includes:

- XP
- Levels
- Badges
- Titles
- Achievements
- Streaks
- Weekly Missions

Gamification should encourage users without creating unhealthy competition.

---

## Reports

Automatic reports for:

- Daily
- Weekly
- Monthly

Reports should include:

- Worship completion
- Consistency
- Improvement
- Mentor review
- Charts

---

## Notifications

Support:

- Email
- Push Notifications
- In-App Notifications

Notifications should always use encouraging language.

---

## Analytics

Charts for:

- Worship trends
- Consistency
- Active users
- Region performance
- Mentor performance
- User progress

---

## Audit Logs

Every important action should be logged.

Examples:

- User promoted.
- Level changed.
- Worship edited.
- Mentor changed.
- User transferred.
- Settings updated.

---

## Settings

Global settings should allow administrators to configure:

- Languages
- Scores
- Themes
- Missions
- Badges
- Titles
- Notifications

without changing code.

---

# Supported Languages

- Arabic
- English

RTL and LTR should both be supported.

---

# Supported Platforms

Version 1

- Desktop
- Tablet
- Mobile

Responsive design is mandatory.

---

# User Roles

The system includes four roles:

- Super Admin
- Region Admin
- Mentor
- User

Permissions are documented separately.

---

# Success Criteria

The product is considered successful if it:

- Encourages daily usage.
- Reduces user abandonment.
- Simplifies mentor follow-up.
- Improves long-term consistency.
- Requires less administrative work.
- Provides useful insights.

---

# Design Philosophy

The interface should feel:

- Friendly
- Minimal
- Calm
- Fast
- Modern
- Accessible

Users should feel encouraged after every interaction.

---

# Non Functional Requirements

The application should be:

- Secure
- Fast
- Responsive
- Scalable
- Maintainable
- Modular
- Extensible
- Accessible

---

# Out of Scope (Version 1)

The following features are intentionally excluded:

- Public Leaderboards
- Social Feed
- Real-time Chat
- Video Calls
- AI Recommendations
- Smart Wearable Integration

These may be introduced in future versions.

---

# Future Vision

The architecture should support:

- Multiple organizations
- SaaS subscriptions
- Custom branding
- Mobile applications
- AI-powered insights
- Public API
- Third-party integrations

without major architectural changes.

---

END OF DOCUMENT