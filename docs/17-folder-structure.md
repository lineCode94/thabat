# Project Folder Structure

Version: 1.0

Status: Approved

---

# Monorepo Structure

```
thabat/

├── backend/
├── frontend/
├── docs/
├── .gitignore
├── README.md
├── package.json
```

---

# Backend

```
backend/

src/

├── config/
├── constants/
├── controllers/
├── middlewares/
├── repositories/
├── services/
├── routes/
├── validators/
├── utils/
├── helpers/
├── jobs/
├── emails/
├── templates/
├── lib/
├── modules/
├── prisma/
├── seed/
├── uploads/
├── logs/
├── tests/

server.js
```

---

# Modules

Each business module follows the same structure.

Example

```
modules/

auth/

controllers/

services/

repositories/

routes/

validators/

index.js
```

Other modules

- users
- mentors
- regions
- worship
- tracking
- reviews
- reports
- dashboard
- notifications
- missions
- badges
- achievements

---

# Frontend

```
frontend/

src/

├── assets/
├── components/
│   ├── common/
│   ├── forms/
│   ├── charts/
│   ├── layout/
│   └── ui/
│
├── features/
│
├── pages/
│
├── layouts/
│
├── hooks/
│
├── services/
│
├── routes/
│
├── contexts/
│
├── store/
│
├── utils/
│
├── constants/
│
├── config/
│
├── lib/
│
├── locales/
│
├── styles/
│
├── App.jsx
└── main.jsx
```

---

# Feature Example

```
features/

tracking/

components/

hooks/

pages/

services/

validation/

utils/

index.js
```

---

# Shared Components

```
components/

AppButton

AppInput

AppCard

AppModal

AppTable

AppChart

AppBadge

AppAvatar

AppLoader

AppSidebar

AppNavbar
```

---

# Naming Conventions

Folders

kebab-case

React Components

PascalCase

Hooks

useSomething

Files

camelCase

Constants

UPPER_CASE

---

# Documentation

```
docs/

01-vision.md

02-prd/

03-business-rules.md

04-user-flows.md

05-database-design.md

06-erd.md

07-ui-ux.md

08-design-system.md

09-backend-architecture.md

10-api-design.md

11-frontend-architecture.md

12-gamification.md

13-notifications.md

14-reports.md

16-rbac.md

17-folder-structure.md
```

---

# General Principles

- One responsibility per file.
- Reusable components.
- Feature-based organization.
- Keep business logic outside UI.
- Keep controllers thin.
- Services contain business logic.
- Repositories communicate with Prisma only.

---

# Future Improvements

- Storybook
- Docker
- CI/CD
- GitHub Actions
- Mobile App
- Shared UI Package

---

END OF DOCUMENT