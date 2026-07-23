# Backend Architecture

Version: 1.0

Status: Approved

---

# Overview

The backend follows a layered architecture to keep the codebase clean, maintainable, and scalable.

Each layer has a single responsibility.

Business logic should never exist inside controllers.

Database access should only happen through Prisma.

---

# Technology Stack

Runtime

Node.js

Framework

Express.js

Language

JavaScript (ES Modules)

Database

PostgreSQL

ORM

Prisma ORM

Authentication

JWT

Password Hashing

bcrypt

Validation

Zod

File Storage

Local Storage (Version 1)

Email

Nodemailer

Environment Variables

dotenv

Logging

Pino

API Documentation

Swagger (Future)

Testing

Jest (Future)

---

# Architecture

Client

↓

Routes

↓

Middleware

↓

Controllers

↓

Services

↓

Repositories

↓

Prisma ORM

↓

PostgreSQL

---

# Folder Structure

backend/

src/

config/

controllers/

services/

repositories/

routes/

middlewares/

validators/

utils/

constants/

lib/

jobs/

emails/

templates/

prisma/

seed/

uploads/

logs/

tests/

server.js

---

# Layer Responsibilities

## Routes

Define API endpoints.

No business logic.

---

## Controllers

Receive requests.

Validate request format.

Call services.

Return responses.

Controllers should remain thin.

---

## Services

Contain all business logic.

Examples:

- Calculate XP
- Generate Weekly Review
- Promote User
- Calculate Consistency
- Assign Missions

---

## Repositories

Only communicate with Prisma.

No business rules.

---

## Prisma

Responsible for database communication.

No business logic.

---

# Authentication

JWT Access Token.

Refresh Tokens stored in database.

Password hashing using bcrypt.

Protected routes require authentication middleware.

---

# Authorization

Role-based access control.

Roles

- Super Admin
- Region Admin
- Mentor
- User

Every protected endpoint validates permissions.

---

# Validation

Every request should be validated.

Use Zod schemas.

Controllers should never trust request data.

---

# Error Handling

Global Error Middleware.

Standard API response.

Example

Success

{
    success: true,
    data: {}
}

Paginated

{
    success: true,
    data: [],
    meta: {
        pagination: {
            page: 1,
            limit: 20,
            total: 100,
            totalPages: 5
        }
    }
}

Failure

{
    success: false,
    message: "",
    error: {
        code: "",
        details: []
    }
}

Use ApiResponse for successful responses and ApiError for operational errors. Validation errors must use ApiError.validation and the global error middleware.

---

# Logging

Log:

Requests

Errors

Authentication

Promotions

Weekly Reviews

Audit Events

Never log passwords or tokens.

---

# Environment Variables

DATABASE_URL

JWT_SECRET

JWT_EXPIRES

REFRESH_SECRET

EMAIL_HOST

EMAIL_PORT

EMAIL_USER

EMAIL_PASSWORD

CLIENT_URL

SERVER_PORT

NODE_ENV

---

# File Uploads

Version 1

Local Storage

Future

AWS S3

Cloudinary

---

# Scheduled Jobs

Daily Reminder

Weekly Lock

Weekly Reports

Mission Expiration

Notification Delivery

Future:

BullMQ

Redis

---

# Security

Helmet

CORS

Rate Limiting

Request Validation

Input Sanitization

Secure Password Hashing

JWT Verification

---

# API Versioning

/api/v1/

Future

/api/v2/

---

# Naming Conventions

Folders

lowercase

Files

camelCase

Functions

camelCase

Classes

PascalCase

Constants

UPPER_CASE

Enums

UPPER_CASE

---

# Response Format

Every API returns

success

message

data

errors

meta (optional)

---

# Pagination

Standard Query

?page=1

&limit=20

Response

total

page

pages

limit

---

# Filtering

Support

Search

Sort

Date Range

Status

Region

Mentor

Level

---

# Performance

Pagination

Indexes

Lazy Queries

Select Required Fields Only

Avoid N+1 Queries

---

# Soft Delete

Supported Entities

Users

Levels

Regions

Missions

Badges

Achievements

Categories

Worship Items

Deleted records remain in history.

---

# Audit Log

Every critical action is stored.

Examples

Login

Promotion

Transfer

Assignment

Level Update

Mission Update

---

# Future Improvements

Redis

BullMQ

Microservices

Docker

Kubernetes

GraphQL

Realtime Notifications

---

END OF DOCUMENT
