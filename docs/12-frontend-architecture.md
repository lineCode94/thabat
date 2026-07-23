# Frontend Architecture

Version: 1.0

Status: Approved

---

# Overview

The frontend is built using React with a feature-based architecture.

The architecture prioritizes:

- Scalability
- Reusability
- Maintainability
- Performance
- Developer Experience

Business logic should remain outside UI components whenever possible.

---

# Technology Stack

Framework

React 19

Bundler

Vite

Language

JavaScript (ES Modules)

Routing

React Router

Styling

Tailwind CSS

UI Components

shadcn/ui

State Management

Zustand

Server State

TanStack Query

Forms

React Hook Form

Validation

Zod

Charts

ApexCharts

Animations

Framer Motion

Icons

Lucide React

HTTP Client

Axios

Date Library

Day.js

Internationalization

react-i18next

Notifications

Sonner

---

# Folder Structure

frontend/

src/

assets/

components/

features/

layouts/

pages/

hooks/

services/

store/

contexts/

routes/

utils/

constants/

config/

styles/

locales/

types/

lib/

App.jsx

main.jsx

---

# Feature Structure

Every feature should contain:

feature-name/

components/

pages/

hooks/

services/

validation/

utils/

index.js

---

# Shared Components

Examples

AppButton

AppInput

AppCard

AppTable

AppModal

AppAvatar

AppBadge

AppChart

AppSidebar

AppNavbar

AppLoader

AppEmptyState

AppPagination

AppSearch

AppFormField

---

# Layouts

UserLayout

MentorLayout

AdminLayout

AuthLayout

ErrorLayout

---

# Routing

Public Routes

Login

Forgot Password

Reset Password

404

Protected Routes

Dashboard

Journey

Tracking

Reports

Notifications

Settings

Administration

---

# State Management

Use Zustand for:

- Auth
- Theme
- Language
- Sidebar
- User Preferences

Use TanStack Query for:

- API Data
- Caching
- Background Refetch
- Pagination

Avoid storing server data inside Zustand.

---

# API Layer

Axios Instance

↓

Services

↓

TanStack Query

↓

UI Components

Every feature owns its own service.

---

# Forms

All forms should use:

React Hook Form

+

Zod Validation

Validation should exist outside components.

---

# Component Rules

Components should:

- Be reusable.
- Receive data through props.
- Avoid API calls directly.
- Avoid business logic.

---

# Pages

Pages should only:

- Compose components.
- Connect hooks.
- Handle navigation.

---

# Custom Hooks

Examples

useAuth()

useTracking()

useJourney()

useReports()

useNotifications()

useTheme()

useLanguage()

---

# Internationalization

Supported Languages

Arabic

English

RTL supported.

LTR supported.

Language should persist between sessions.

---

# Theme

Support:

Light Mode

Dark Mode

Theme persists per user.

---

# Authentication Flow

Login

↓

Store Access Token

↓

Store Refresh Token

↓

Fetch Current User

↓

Redirect

Token refresh should happen automatically.

---

# Error Handling

Display friendly messages.

Never expose backend errors.

The shared Axios client returns the raw Axios response. Feature services must unwrap API envelopes explicitly:

- Normal responses return response.data.data.
- Paginated responses return { data: response.data.data, meta: response.data.meta }.
- Mutations that need a message return { data: response.data.data, message: response.data.message }.

UI components should consume feature service results, not backend envelopes directly.

Support:

- Error Pages
- Toast Messages
- Retry Buttons

---

# Loading States

Every page should support:

Skeletons

Spinners

Empty States

---

# Permissions

Render UI based on role.

Hide unauthorized pages.

Backend remains the source of truth.

---

# Charts

Supported

Line

Bar

Pie

Heatmap

Progress Rings

Charts should lazy load.

---

# Performance

Lazy Loading

Code Splitting

Route Splitting

Memoization

Image Optimization

Virtualized Tables (Future)

---

# Security

Never store sensitive information in Local Storage.

Validate permissions from backend.

Sanitize displayed HTML.

---

# Coding Standards

One component per file.

Small reusable components.

Meaningful names.

No duplicated logic.

Use absolute imports.

Avoid deeply nested components.

---

# Future Improvements

PWA

Offline Mode

Mobile App

Storybook

Micro Frontends

---

END OF DOCUMENT
