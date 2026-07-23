# THABAT

A modern spiritual journey platform that helps individuals build consistency in worship through encouragement, mentorship, and measurable progress.

## Monorepo Structure

```
thabat/
├── backend/     # Node.js + Express + Prisma API
├── frontend/    # React 19 + Vite SPA
└── docs/        # Project documentation
```

## Prerequisites

- Node.js >= 20
- PostgreSQL >= 14

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

Update the values in both `.env` files.

### 3. Database (Prisma)

```bash
npm run prisma:generate --workspace=backend
```

### 4. Run development servers

```bash
npm run dev
```

- **Backend API:** http://localhost:5001
- **Frontend:** http://localhost:5173

## Documentation

All product and architecture documentation lives in the [`docs/`](./docs/) directory. Documentation is the source of truth for implementation.

## Tech Stack

| Layer    | Technologies                                      |
| -------- | ------------------------------------------------- |
| Frontend | React 19, Vite, Tailwind CSS, shadcn/ui, Zustand, TanStack Query |
| Backend  | Node.js, Express.js, Prisma, PostgreSQL, Zod    |
