# API Design

Version: 1.0

Status: Approved

---

# Overview

The THABAT backend exposes a RESTful API.

The API is consumed by:

- Web Application
- Future Mobile Applications
- Future Third-party Integrations

All endpoints return JSON.

---

# API Versioning

Base URL

/api/v1

Future versions

/api/v2

---

# Authentication

Authentication uses JWT.

Protected endpoints require:

Authorization

Bearer <token>

---

# Standard Response

Success

Message is optional and should only be included when the endpoint intentionally returns a user-facing message.

{
    "success": true,
    "data": {}
}

Created

{
    "success": true,
    "message": "Created successfully.",
    "data": {}
}

Paginated

{
    "success": true,
    "data": [],
    "meta": {
        "pagination": {
            "page": 1,
            "limit": 20,
            "total": 100,
            "totalPages": 5
        }
    }
}

Failure

{
    "success": false,
    "message": "Validation failed.",
    "error": {
        "code": "VALIDATION_ERROR",
        "details": []
    }
}

204 No Content responses return no body.

---

# HTTP Status Codes

200 OK

201 Created

204 No Content

400 Bad Request

401 Unauthorized

403 Forbidden

404 Not Found

409 Conflict

422 Validation Error

500 Internal Server Error

---

# Pagination

Query Parameters

?page=1

&limit=20

Response

meta

pagination.page

pagination.limit

pagination.total

pagination.totalPages

---

# Filtering

Supported Query Parameters

search

sort

order

status

region

mentor

level

dateFrom

dateTo

---

# Authentication APIs

POST

/auth/login

POST

/auth/logout

POST

/auth/refresh-token

POST

/auth/forgot-password

POST

/auth/reset-password

GET

/auth/me

Authenticated user payloads include minimal onboarding context:

{
    "success": true,
    "data": {
        "id": "uuid",
        "fullName": "Name",
        "email": "user@example.com",
        "onboardingStatus": "PENDING_SETUP",
        "worshipLevel": {
            "id": "uuid",
            "name": "Level One",
            "order": 1
        },
        "mentorAssignmentStatus": "PENDING"
    }
}

The token must not be treated as the source of mutable onboarding state.

---

# User APIs

GET

/users

GET

/users/:id

POST

/users

PUT

/users/:id

PATCH

/users/:id/status

DELETE

/users/:id

---

# Region APIs

GET

/regions

POST

/regions

PUT

/regions/:id

DELETE

/regions/:id

---

# Mentor APIs

GET

/mentors

GET

/mentors/:id

POST

/mentors

PUT

/mentors/:id

DELETE

/mentors/:id

POST

/mentors/:id/assign-user

POST

/mentors/:id/transfer-user

---

# Level APIs

GET

/levels

GET

/levels/:id

POST

/levels

PUT

/levels/:id

DELETE

/levels/:id

---

# Worship Category APIs

GET

/worship/categories

POST

/worship/categories

PUT

/worship/categories/:id

DELETE

/worship/categories/:id

---

# Worship Item APIs

GET

/worship/items

GET

/worship/items/:id

POST

/worship/items

PUT

/worship/items/:id

DELETE

/worship/items/:id

---

# Daily Tracking APIs

GET

/tracking/today

When ready:

{
    "success": true,
    "data": {
        "ready": true,
        "reason": "READY",
        "worshipLevel": {
            "id": "uuid",
            "name": "Level One",
            "order": 1
        },
        "items": [],
        "trackingDay": {},
        "summary": {
            "completedItems": 0,
            "totalItems": 5,
            "progressPercentage": 0
        }
    }
}

When not ready:

{
    "success": true,
    "data": {
        "ready": false,
        "reason": "NO_LEVEL_REQUIREMENTS",
        "worshipLevel": {},
        "items": [],
        "trackingDay": null,
        "summary": {
            "completedItems": 0,
            "totalItems": 0,
            "progressPercentage": 0
        }
    }
}

Supported readiness reasons:

- `ONBOARDING_INCOMPLETE`
- `NO_ACTIVE_WORSHIP_LEVEL`
- `NO_LEVEL_REQUIREMENTS`
- `NO_WORSHIP_ITEMS_CONFIGURED`

GET

/tracking/history

POST

/tracking

PUT

/tracking/:id

GET

/tracking/calendar

---

# Weekly Review APIs

GET

/reviews

POST

/users/:userId/weekly-reviews

GET

/users/:userId/weekly-review/current

PATCH

/weekly-reviews/:id

POST

/weekly-reviews/:id/complete

GET

/reviews/:id

Weekly review status values:

- PENDING
- DRAFT
- COMPLETED

Users may only retrieve their own completed reviews. Private mentor notes are never returned in user-facing review responses.

---

# Mission APIs

GET

/missions

POST

/missions

PUT

/missions/:id

DELETE

/missions/:id

POST

/missions/:id/assign

POST

/missions/:id/complete

---

# Journey APIs

GET

/journey

GET

/journey/timeline

GET

/journey/heatmap

GET

/journey/statistics

---

# Report APIs

GET

/reports/user

GET

/reports/mentor

GET

/reports/region

GET

/reports/system

GET

/reports/weekly

GET

/reports/monthly

GET

/reports/export

---

# Badge APIs

GET

/badges

GET

/users/:id/badges

---

# Achievement APIs

GET

/achievements

GET

/users/:id/achievements

---

# Notification APIs

GET

/notifications

PATCH

/notifications/:id/read

PATCH

/notifications/read-all

DELETE

/notifications/:id

---

# Dashboard APIs

GET

/dashboard/user

GET

/dashboard/mentor

GET

/dashboard/region

GET

/dashboard/admin

---

# Search APIs

GET

/search/users

GET

/search/mentors

GET

/search/regions

---

# Admin APIs

GET

/admin/statistics

GET

/admin/audit-log

GET

/admin/system-health

POST

/admin/send-notification

---

# Validation

Every request should be validated using Zod.

Validation errors should always return HTTP 422.

---

# Authorization

Every endpoint checks:

Authentication

Role

Ownership

Permission

---

# Rate Limiting

Authentication Endpoints

Strict

Search Endpoints

Moderate

Read APIs

Relaxed

---

# Security

Helmet

CORS

Rate Limiting

JWT Verification

Input Validation

Input Sanitization

Password Hashing

---

# Naming Conventions

Resources

Plural

Examples

/users

/regions

/levels

Use nouns instead of verbs.

---

# Future APIs

Push Notifications

WhatsApp

AI Assistant

Public API

GraphQL

---

END OF DOCUMENT
