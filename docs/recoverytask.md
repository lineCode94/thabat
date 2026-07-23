# Recovery Task R3 — User, Region & Mentor Assignment Management

> Paste this file into Codex as-is. It follows the same conventions as `docs/20-master-prompt.md` and is designed to be executed in this repo (THABAT), not a fresh project.

---

## 0. Context — read this first

You are continuing work on an **existing, partially-built** codebase. Do not scaffold a new project and do not restructure existing files. Before writing any code:

1. Read `docs/20-master-prompt.md`, `docs/18-coding-standards.md`, `docs/16-rbac.md`, and `docs/02-prd/02-roles.md`.
2. Read these existing files as your pattern reference — your new code must look like it was written by the same person:
   - `backend/src/controllers/worship.controller.js`
   - `backend/src/routes/worship.routes.js`
   - `backend/src/validators/worship.validator.js`
   - `backend/src/services/worship.service.js`
   - `backend/src/repositories/user.repository.js`
   - `backend/src/services/authorization.service.js`
   - `backend/src/utils/resourceAuthorization.js`
   - `backend/src/utils/apiResponse.js` and `backend/src/utils/apiError.js`
   - `backend/src/constants/permissionRegistry.js` (**do not add new permission codes** — everything this task needs already exists there. If you think you need a new one, stop and ask instead of inventing it.)
3. Confirm you understand `req.hasPermission()`, `requirePermission()`, `requireAnyPermission()`, and the `canAccessUserResource()` helper before using them.

This is **Recovery Task R3** out of an 8-task Recovery Sprint. R1 (API contracts) and R2 (onboarding invariants) are already done — you can see R2's migration at `backend/prisma/migrations/20260711190000_user_onboarding_invariants/`. **Do not touch onboarding/registration logic** — that is R2, already closed.

**Explicitly out of scope for this task** (do not implement, even partially): week closure/tracking history (R4), reports/analytics (R5), notification jobs (R6), audit log infrastructure (R7), admin dashboards/analytics widgets (that's Sprint 7). If you notice a real dependency on one of these while working, stop and flag it instead of building around it.

---

## 1. Objective

Build the missing admin capability for **Super Admin** and **Region Admin** to actually operate the platform:
- Manage Regions (Super Admin only).
- Create, view, update, and deactivate Users (any role) — scoped by permission.
- Assign/transfer a User to a Mentor, and transfer a User between Regions.
- Do all of this from real UI screens, not just API endpoints.

This unblocks R4, R5, and R8, which all assume real Users/Regions/Mentors exist to operate on.

---

## 2. Known schema/doc mismatch — do not silently resolve this

`docs/02-prd/02-roles.md` describes a rich status enum (`Active / Inactive / Pending / Suspended / Archived`), but `User` in `schema.prisma` currently only has `isActive Boolean` and `onboardingStatus` (`PENDING_SETUP` / `ACTIVE`). 

**For this task: use the existing `isActive` boolean only** (deactivate = `isActive: false`, reactivate = `isActive: true`). Do not add a new status enum or migration for this — that's a bigger decision than this task should make silently. If it becomes a blocker, stop and ask.

---

## 3. Data model — no new models needed

Everything required already exists in `schema.prisma`: `User`, `Region`, `Role`, `MentorAssignment`. 

Assignment history rule from `docs/02-prd/02-roles.md` ("previous mentor should remain in history"): when reassigning a user to a new mentor, **do not delete or overwrite** the old `MentorAssignment` row — set its `isActive: false` and create a new row with `isActive: true`. Same pattern already used elsewhere in this codebase for `UserLevel` (check `promotion.service.js` for the exact pattern to mirror).

---

## 4. Backend — endpoints to build

All routes go under `#routes/`, registered in `backend/src/routes/index.js` exactly like the existing entries. Follow the `authenticate` → `requirePermission`/`requireAnyPermission` → `validateRequest` → `asyncHandler(Controller.method)` chain used in `worship.routes.js`.

### 4.1 Regions — `region.routes.js` → `/api/v1/regions`

| Method | Path | Permission | Notes |
|---|---|---|---|
| GET | `/regions` | `REGIONS_MANAGE` or `REGIONS_VIEW_OWN` | Super Admin sees all; Region Admin sees only their own region (filter server-side using `req.user.regionId`, mirror `canViewInactiveWorship`-style helper in `authorization.service.js`) |
| GET | `/regions/:id` | same as above, plus self-region check for Region Admin | |
| POST | `/regions` | `REGIONS_MANAGE` | Super Admin only |
| PUT | `/regions/:id` | `REGIONS_MANAGE` | Super Admin only |
| DELETE | `/regions/:id` | `REGIONS_MANAGE` | Soft delete via `deletedAt` (field already exists on `Region`) — never hard-delete a region that still has users |

### 4.2 Admin Users — `admin-user.routes.js` → `/api/v1/admin/users`

Keep this separate from `/profile` and `/me` (those are self-service; this is admin-on-others). Reuse `UserRepository` where sensible but extend it — it currently only has `findByEmail`, `findById`, `create`, `update`. You will likely need a `findMany` with filters (region, role, mentor, isActive, search by name/email) and pagination (`ApiResponse.paginated`, `PAGINATION` constants already exist in `constants/index.js`).

| Method | Path | Permission | Notes |
|---|---|---|---|
| GET | `/admin/users` | `USERS_MANAGE_ALL` or `USERS_MANAGE_REGION` | Region Admin implicitly filtered to `req.user.regionId`. Support query filters: `regionId`, `role`, `mentorId`, `isActive`, `search`, pagination |
| GET | `/admin/users/:id` | resolve via `canAccessUserResource()` from `resourceAuthorization.js` | |
| POST | `/admin/users` | `USERS_CREATE` | Admin-created users are **not** public self-registration — they should be created directly with `onboardingStatus: 'ACTIVE'`, an explicit `roleId` and `regionId` chosen by the admin, and (if role is USER) an initial `UserLevel` the same way `OnboardingService.createNormalUserOnboarding` does it — reuse that method rather than duplicating its logic. A Region Admin creating a user must be restricted to their own `regionId` (reject otherwise with `ApiError.forbidden`); Super Admin can set any region. |
| PUT | `/admin/users/:id` | same resolution as GET `:id`, but restrict role/region changes: only `USERS_MANAGE_ALL` may change `roleId` to `REGION_ADMIN` or `SUPER_ADMIN` (gate this specifically with `REGION_ADMINS_ASSIGN` per the existing permission, not just `USERS_MANAGE_ALL`) | |
| PATCH | `/admin/users/:id/deactivate` | same as PUT | Sets `isActive: false` |
| PATCH | `/admin/users/:id/reactivate` | same as PUT | Sets `isActive: true` |
| POST | `/admin/users/:id/transfer-region` | `USERS_TRANSFER_REGION` | body: `{ regionId }` |

### 4.3 Mentor Assignment — `mentor-assignment.routes.js` → `/api/v1/admin/mentor-assignments`

| Method | Path | Permission | Notes |
|---|---|---|---|
| GET | `/admin/mentor-assignments?mentorId=&userId=&regionId=` | `USERS_MANAGE_ALL` or `USERS_MANAGE_REGION` | Returns active assignments by default; `?includeInactive=true` for history |
| POST | `/admin/mentor-assignments` | `USERS_ASSIGN` | body: `{ userId, mentorId }`. Must validate: target user has role `USER`, target mentor has role `MENTOR` or `REGION_ADMIN`, both are in the same region as the acting Region Admin (Super Admin exempt). Deactivate any existing active assignment for that `userId` first (see §3 history rule) inside a Prisma transaction. |
| POST | `/admin/mentor-assignments/:userId/transfer` | `USERS_TRANSFER_MENTOR` | Same transactional reassignment logic as above, explicit endpoint per the PRD's distinct "transfer" wording |

---

## 5. Validators (Zod, `#validators/`)

Follow `worship.validator.js` exactly — `z.object({ body, params, query })` shape consumed by `validateRequest`. You need:
- `region.validator.js` (create/update)
- `admin-user.validator.js` (create/update/transfer-region — reject any attempt to set `onboardingStatus` directly, same spirit as the public registration guard from R2)
- `mentor-assignment.validator.js` (assign/transfer)

---

## 6. Frontend — `frontend/src/features/admin/`

New feature folder, same shape as `frontend/src/features/worship/` (components/pages/services split).

- `services/region.service.js`, `services/admin-user.service.js`, `services/mentor-assignment.service.js` — same `apiClient` + `response.data.data` unwrap pattern as every other service in this repo (see `worship.service.js`).
- `pages/RegionsPage.jsx` — table + create/edit dialog. Gate the whole route behind `regions.manage` (Super Admin only).
- `pages/UsersPage.jsx` — filterable/paginated table (region, role, mentor, active status), create-user dialog, edit-user dialog, deactivate/reactivate action, "assign mentor" and "transfer region" actions inline.
- Reuse existing `components/ui/*` primitives (`button.jsx`, `card.jsx`, `form.jsx`, `input.jsx`, `label.jsx`) — do not introduce a new UI kit.
- Wrap both routes in `<PermissionGuard>` in `AppRoutes.jsx`, same pattern as the existing `/promotions` route.
- Add both to `appNavigation.js` under a new `admin` nav group, gated with `permissions: ['regions.manage']` / `permissions: ['users.manage_all', 'users.manage_region']` + `permissionMode: 'any'` where relevant — mirror the `mentor-reviews` entry exactly.
- Add `frontend/src/locales/ar/admin.json` and `frontend/src/locales/en/admin.json`, register the namespace in `frontend/src/i18n/index.js` the same way `reviews.json` is registered.

---

## 7. Explicitly do not build in this task

- Any dashboard/analytics/chart for admins (Sprint 7).
- Audit logging of these actions (R7 — but structure your service methods so a future audit hook is easy to add, e.g. one clear service method per mutation, not inline logic scattered in controllers).
- Bulk import of users (mentioned in PRD as future scope, not this task).
- Region Admin management of who *is* a Region Admin beyond the single `REGION_ADMINS_ASSIGN`-gated role change described in §4.2 — a dedicated "Region Admins" screen is not required here.

---

## 8. Working process

Follow the process already defined in `docs/20-master-prompt.md`:
1. State your implementation plan briefly before generating code (repositories → services → validators → controllers → routes → wire into `routes/index.js`, then frontend).
2. Do backend first, stop, and let me test the endpoints with real requests before starting frontend.
3. Within backend, do Regions first (smallest surface), then Admin Users, then Mentor Assignment — stop between each if a sub-part raises a question.
4. Do not modify `onboarding.service.js`, `auth.service.js`, or the public `/auth/register` flow — R2 already closed that.

## 9. Acceptance checklist

- [ ] Region Admin cannot see, create, or modify users/regions outside their own `regionId` (test by calling endpoints as a Region Admin token against a different region's IDs — must get 403, not empty results).
- [ ] Creating a user via `/admin/users` produces a fully onboarded, `ACTIVE` user with a valid initial `UserLevel` — not a `PENDING_SETUP` one.
- [ ] Reassigning a user to a new mentor never deletes the old `MentorAssignment` row.
- [ ] Only `REGION_ADMINS_ASSIGN`-holding roles can promote a user to `REGION_ADMIN`.
- [ ] All new endpoints return the standard `ApiResponse`/`ApiError` envelope — no ad-hoc response shapes.
- [ ] `UsersPage` and `RegionsPage` are unreachable (route-guarded, nav-hidden) for a `MENTOR` or `USER` role account.