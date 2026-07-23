# Coding Standards

Version: 1.0

Status: Approved

---

# General Principles

Write code that is:

- Readable
- Maintainable
- Reusable
- Predictable

Always prioritize clarity over cleverness.

---

# Naming

Variables

camelCase

Functions

camelCase

React Components

PascalCase

Folders

kebab-case

Constants

UPPER_CASE

Enums

UPPER_CASE

---

# File Rules

One responsibility per file.

One React component per file.

Avoid files larger than 300 lines whenever possible.

Extract reusable logic into hooks or utilities.

---

# Functions

Functions should:

- Do one thing.
- Have descriptive names.
- Return early when possible.
- Avoid deep nesting.

---

# Components

Components should:

- Be presentational whenever possible.
- Receive data through props.
- Avoid direct API calls.
- Avoid business logic.

---

# Services

Business logic belongs in services.

Never place business rules in controllers or UI components.

---

# Repositories

Repositories communicate only with Prisma.

No calculations or business logic.

---

# Error Handling

Use centralized error handling.

Return consistent API responses.

Never expose internal server details.

Backend controllers must use ApiResponse for success responses:

- success: { success: true, data }
- created: HTTP 201 with data and an explicit message only when needed
- noContent: HTTP 204 with no body
- paginated: { success: true, data: [], meta: { pagination } }

Backend errors must use ApiError and the centralized error handler:

{
  success: false,
  message: "",
  error: {
    code: "",
    details: []
  }
}

Do not return root-level errors arrays.

Frontend feature services must unwrap response.data.data instead of passing backend envelopes into UI components.

---

# Onboarding Invariants

Normal USER registration must be atomic.

Public registration must reject assignment and privilege fields:

- role
- roleId
- permission
- levelId
- worshipLevelId
- mentorId
- regionId

Registration must assign the USER role server-side and create exactly one active Worship Level using the lowest active Worship Level order.

Worship Level and XP-based Gamification Level must remain separate domains.

Today's Worship must return a readiness reason instead of a generic empty checklist when setup is incomplete.

---

# Validation

All input must be validated with Zod.

Frontend validation improves UX.

Backend validation is mandatory.

---

# Comments

Comment "why", not "what".

Avoid obvious comments.

---

# Imports

Prefer absolute imports.

Group imports:

1. External packages
2. Internal modules
3. Relative files

---

# Formatting

Use Prettier.

Use ESLint.

No unused variables.

No console.log in production.

---

# Git

Commit messages should be meaningful.

Examples

feat: add tracking module

fix: resolve streak calculation

refactor: simplify review service

docs: update API design

---

END OF DOCUMENT
