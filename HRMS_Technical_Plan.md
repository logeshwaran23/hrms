# HRMS Employee Self-Service Portal — Technical Architecture & Implementation Plan

**Project:** Internal HRMS (HR Management System)
**Stack:** React (Vite) + Node.js (Express) + PostgreSQL
**Scope:** Production-grade internal tool with full page-level RBAC
**Prepared for:** Damodara Smart Tech Pvt Ltd

---

## 1. Objective

Build a secure, internal HRMS ESS (Employee Self-Service) portal that lets employees, managers, HR admins, and super admins manage the employee lifecycle — profile, attendance, leave, payroll visibility, documents, and approvals — through a single web app, with strict role-based access control at both the **page/route level** and the **API level**.

---

## 2. Research Summary — What a Production HRMS Needs

Based on current (2026) industry-standard HRMS/ESS implementations, the must-have modules fall into these buckets:

| Bucket | Modules |
|---|---|
| **Core HR** | Employee master data, org chart, department/designation management |
| **Self-Service (ESS)** | Profile/KYC updates, bank details, document uploads, personal info edits |
| **Time & Attendance** | Check-in/out, regularization, shift management |
| **Leave Management** | Leave application, approval workflow, balance tracking, holiday calendar |
| **Payroll (view-only for employees)** | Payslips, Form-16/tax documents, salary structure |
| **Performance** | Goals, appraisals, feedback (phase 2) |
| **Recruitment/Onboarding** | Candidate → employee conversion, onboarding checklist (phase 2) |
| **Helpdesk** | HR ticketing, grievance, query tracking |
| **Reports & Analytics** | HR dashboards, attendance/leave reports, headcount reports |
| **Admin** | Role & permission management, audit logs, system configuration |

A well-architected ESS typically deflects 60–70% of routine HR queries by giving employees direct, role-scoped access to their own data — this is the primary design goal here.

Given this is an **internal, production-level system**, the plan below prioritizes: strict RBAC, auditability, data integrity, and a clean separation between employee-owned data and HR-managed data — over "nice to have" AI/analytics features, which are marked as Phase 2/3.

---

## 3. Tech Stack

### Frontend
- **React 18 + Vite** — SPA, fast dev/build
- **React Router v6** — routing + route-level guards
- **TypeScript** — type safety (strongly recommended for production)
- **TanStack Query (React Query)** — server-state, caching, retries
- **Zustand** or **Redux Toolkit** — client/auth state
- **React Hook Form + Zod** — forms & validation
- **Tailwind CSS + shadcn/ui** — component system
- **Axios** — HTTP client with interceptors (token refresh, error handling)

### Backend
- **Node.js + Express.js** (or Fastify for perf) — REST API
- **TypeScript** — shared type discipline with frontend
- **PostgreSQL** — relational data (employees, leave, payroll are inherently relational)
- **Prisma ORM** — schema, migrations, type-safe queries
- **Redis** — session/token blacklist, rate-limiting, caching
- **JWT (access + refresh tokens)** — stateless auth, httpOnly cookies for refresh token
- **Zod** — request validation (shared schema patterns with frontend)
- **node-cron** — scheduled jobs (leave accrual, reminders)
- **Winston/Pino** — structured logging
- **Multer + S3-compatible storage (MinIO/AWS S3)** — document uploads (payslips, ID proofs)

### DevOps / Infra
- Docker + docker-compose (local + staging parity)
- Nginx reverse proxy (or internal load balancer)
- CI/CD: GitHub Actions (lint → test → build → deploy)
- Environments: dev → staging → production
- Monitoring: Prometheus + Grafana, or a hosted APM (Sentry for errors)

---

## 4. High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENT (Browser)                       │
│   React + Vite SPA                                            │
│   ├─ Route Guards (RBAC)                                      │
│   ├─ Auth Context (JWT in memory, refresh via httpOnly cookie)│
│   └─ Axios instance (interceptors: auth header, 401 refresh)  │
└───────────────────────────┬────────────────────────────────────┘
                             │ HTTPS (REST/JSON)
┌───────────────────────────▼────────────────────────────────────┐
│                     API GATEWAY / Nginx                         │
│   - TLS termination, rate limiting, gzip                       │
└───────────────────────────┬────────────────────────────────────┘
                             │
┌───────────────────────────▼────────────────────────────────────┐
│                  NODE.JS / EXPRESS BACKEND                      │
│                                                                  │
│  Middleware chain:                                              │
│   requestId → helmet → cors → rateLimiter → authenticate(JWT)  │
│   → authorize(RBAC) → validate(Zod) → controller → errorHandler│
│                                                                  │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌─────────────┐ │
│  │ Auth Module│ │ Employee   │ │ Leave &    │ │ Payroll     │ │
│  │            │ │ Module     │ │ Attendance │ │ Module      │ │
│  └────────────┘ └────────────┘ └────────────┘ └─────────────┘ │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌─────────────┐ │
│  │ Documents  │ │ Helpdesk   │ │ Admin/RBAC │ │ Audit Log   │ │
│  │ Module     │ │ Module     │ │ Module     │ │ Module      │ │
│  └────────────┘ └────────────┘ └────────────┘ └─────────────┘ │
└───────────────────┬──────────────────────┬─────────────────────┘
                     │                      │
        ┌────────────▼─────────┐   ┌────────▼─────────┐
        │   PostgreSQL (Prisma)│   │  Redis (cache/    │
        │   Source of truth    │   │  rate-limit/OTP)  │
        └───────────────────────┘   └────────────────────┘
                     │
        ┌────────────▼─────────┐
        │ S3 / MinIO (file store)│
        │ payslips, ID docs      │
        └─────────────────────────┘
```

**Key architectural principle:** RBAC is enforced in **three layers**, not one — UI hides what's not permitted, the router blocks navigation to unauthorized pages, and the API independently re-validates permission on every request. The frontend check is a UX convenience only; it is never trusted as the security boundary.

---

## 5. Roles & RBAC Design

### 5.1 Roles

| Role | Description |
|---|---|
| **SUPER_ADMIN** | Full system access, manages roles/permissions, sees audit logs |
| **HR_ADMIN** | Manages all employees, payroll, leave policy, approvals, reports |
| **MANAGER** | Views/approves team's leave & attendance, limited team reports |
| **EMPLOYEE** | Access to own profile, leave, attendance, payslips, helpdesk |
| *(optional, phase 2)* **FINANCE** | Payroll processing, salary structure edits |

Roles are stored as data, not hardcoded — a `roles` table + `permissions` table + `role_permissions` join table, so new roles/permissions can be added without a code deploy.

### 5.2 Permission Model (RBAC + resource-action pattern)

Each permission = `resource:action`, e.g.:
```
employee:read:own
employee:read:all
employee:update:own
employee:update:all
leave:apply
leave:approve
payroll:view:own
payroll:view:all
payroll:generate
admin:manage_roles
audit:view
```

`:own` vs `:all` suffix scopes data access — this is what separates "employee sees their own payslip" from "HR sees everyone's."

### 5.3 Database Schema (RBAC core)

```sql
users (id, employee_id FK, email, password_hash, role_id FK, status, last_login, mfa_enabled)
roles (id, name, description, is_system_role)
permissions (id, resource, action, scope)         -- e.g. ('leave','approve','team')
role_permissions (role_id FK, permission_id FK)
employees (id, user_id FK, first_name, last_name, department_id, designation_id,
           manager_id FK -> employees.id, doj, status, ...)
audit_logs (id, user_id, action, resource, resource_id, before, after, ip, created_at)
```

### 5.4 Enforcement — Three Layers

**Layer 1 — Frontend route guard (React Router)**
```tsx
<Route element={<RequireAuth roles={["HR_ADMIN","SUPER_ADMIN"]} />}>
  <Route path="/admin/employees" element={<EmployeeListPage />} />
</Route>
```
A `<ProtectedRoute>` wrapper reads the decoded JWT/user context; unauthorized users are redirected to `/403` or `/login`.

**Layer 2 — Frontend UI-level guards**
Buttons/menu items conditionally render using a `usePermission("leave:approve")` hook backed by the permissions array returned at login — so a Manager never even sees an "Approve Payroll" button.

**Layer 3 — Backend middleware (source of truth)**
```ts
router.get(
  "/employees",
  authenticate,
  authorize("employee:read:all"),
  employeeController.list
);

router.get(
  "/employees/:id",
  authenticate,
  authorize("employee:read:own", "employee:read:all"), // OR logic + scope check inside
  employeeController.getById
);
```
The `authorize` middleware:
1. Confirms the JWT is valid and not expired/blacklisted (Redis).
2. Loads role → permissions (cached in Redis, TTL 5 min).
3. Checks resource:action match.
4. For `:own` scope, additionally checks `req.params.id === req.user.employeeId` or `req.user.managerOf.includes(id)` for manager scope.
5. Denies with `403` and logs the attempt to `audit_logs`.

### 5.5 Page-Level Access Matrix (example)

| Page | SUPER_ADMIN | HR_ADMIN | MANAGER | EMPLOYEE |
|---|---|---|---|---|
| Dashboard | ✅ | ✅ | ✅ | ✅ |
| My Profile | ✅ | ✅ | ✅ | ✅ |
| Employee Directory | ✅ | ✅ | ✅ (team only) | ❌ |
| Employee Master (CRUD) | ✅ | ✅ | ❌ | ❌ |
| Apply Leave | ✅ | ✅ | ✅ | ✅ |
| Approve Leave | ✅ | ✅ | ✅ (team only) | ❌ |
| Attendance (self) | ✅ | ✅ | ✅ | ✅ |
| Attendance (all) | ✅ | ✅ | ✅ (team only) | ❌ |
| Payslips (self) | ✅ | ✅ | ✅ | ✅ |
| Payroll Processing | ✅ | ✅ | ❌ | ❌ |
| Helpdesk (raise) | ✅ | ✅ | ✅ | ✅ |
| Helpdesk (resolve) | ✅ | ✅ | ❌ | ❌ |
| Reports & Analytics | ✅ | ✅ | ✅ (team only) | ❌ |
| Roles & Permissions | ✅ | ❌ | ❌ | ❌ |
| Audit Logs | ✅ | ❌ | ❌ | ❌ |
| System Settings | ✅ | ❌ | ❌ | ❌ |

This matrix drives both the route guard config and the seed data for `role_permissions`.

---

## 6. Authentication Flow

1. `POST /auth/login` — email + password → validate via bcrypt.
2. On success: issue short-lived **access token** (JWT, 15 min) + long-lived **refresh token** (httpOnly, secure cookie, 7 days, stored hashed in DB/Redis for revocation).
3. Access token carries `{ userId, employeeId, roleId, permissions[] }` (permissions embedded to avoid a DB hit on every request, refreshed on login/permission change).
4. `POST /auth/refresh` — rotates refresh token, issues new access token.
5. `POST /auth/logout` — blacklists refresh token in Redis.
6. Optional Phase 2: MFA (TOTP) for HR_ADMIN/SUPER_ADMIN roles; SSO (Google Workspace/Azure AD) since this is an internal tool.

Passwords: bcrypt (cost factor 12), account lockout after 5 failed attempts (Redis counter), forced password reset on first login.

---

## 7. Suggested Folder Structure

### Backend
```
server/
├─ src/
│  ├─ config/            # env, db, redis, s3 config
│  ├─ modules/
│  │  ├─ auth/            (controller, service, routes, validation)
│  │  ├─ employees/
│  │  ├─ leave/
│  │  ├─ attendance/
│  │  ├─ payroll/
│  │  ├─ documents/
│  │  ├─ helpdesk/
│  │  └─ admin/           (roles, permissions, audit)
│  ├─ middleware/
│  │  ├─ authenticate.ts
│  │  ├─ authorize.ts
│  │  ├─ validate.ts
│  │  ├─ errorHandler.ts
│  │  └─ rateLimiter.ts
│  ├─ prisma/
│  │  ├─ schema.prisma
│  │  └─ seed.ts
│  ├─ jobs/               # cron jobs (leave accrual, reminders)
│  ├─ utils/
│  └─ app.ts / server.ts
├─ tests/
└─ Dockerfile
```

### Frontend
```
client/
├─ src/
│  ├─ app/                # router, providers, layout shells
│  ├─ features/
│  │  ├─ auth/
│  │  ├─ employees/
│  │  ├─ leave/
│  │  ├─ attendance/
│  │  ├─ payroll/
│  │  ├─ helpdesk/
│  │  └─ admin/
│  ├─ components/ui/      # shared shadcn-based components
│  ├─ hooks/               # usePermission, useAuth, useDebounce...
│  ├─ lib/                 # axios instance, query client, zod schemas
│  ├─ routes/
│  │  ├─ ProtectedRoute.tsx
│  │  └─ routeConfig.ts    # single source of truth: path → roles/permissions
│  ├─ store/                # zustand auth store
│  └─ main.tsx
├─ vite.config.ts
└─ Dockerfile
```

---

## 8. Core API Design (REST)

```
POST   /api/auth/login
POST   /api/auth/refresh
POST   /api/auth/logout
GET    /api/auth/me

GET    /api/employees              (HR/Admin, paginated, filterable)
GET    /api/employees/:id
POST   /api/employees               (HR/Admin)
PATCH  /api/employees/:id
PATCH  /api/employees/:id/profile   (self-service, scoped)

GET    /api/leave/balance
POST   /api/leave/apply
GET    /api/leave/requests          (own | team | all, scope-based)
PATCH  /api/leave/requests/:id/approve
PATCH  /api/leave/requests/:id/reject

POST   /api/attendance/check-in
POST   /api/attendance/check-out
GET    /api/attendance                (own | team | all)
POST   /api/attendance/regularize

GET    /api/payroll/payslips/:employeeId   (own or HR)
GET    /api/payroll/payslips/:id/download
POST   /api/payroll/process                 (HR only)

POST   /api/documents/upload
GET    /api/documents/:employeeId

POST   /api/helpdesk/tickets
GET    /api/helpdesk/tickets
PATCH  /api/helpdesk/tickets/:id/resolve

GET    /api/admin/roles
POST   /api/admin/roles
PATCH  /api/admin/roles/:id/permissions
GET    /api/admin/audit-logs
```

All list endpoints: pagination (`page`, `limit`), filtering, and sorting as query params. All mutating endpoints write an `audit_logs` entry.

---

## 9. Security Checklist (Production-Internal Grade)

- HTTPS everywhere (even internal), HSTS enabled
- `helmet` for security headers, `cors` locked to known internal origins
- Input validation on every endpoint (Zod schemas shared between FE/BE via a `packages/shared` workspace if using a monorepo)
- Parameterized queries via Prisma (no raw SQL string concat)
- Rate limiting on auth endpoints (brute-force protection)
- httpOnly + Secure + SameSite cookies for refresh tokens
- File upload validation: mime-type whitelist, size limit, virus scan (ClamAV) if feasible
- Least-privilege DB user for the app; separate read-replica for reports (phase 2)
- Secrets in environment variables / secret manager, never committed
- Audit log for every create/update/delete and every permission-denied attempt
- Regular dependency scanning (`npm audit`, Dependabot/Snyk)
- Backup strategy: nightly PostgreSQL dumps + point-in-time recovery
- Data retention/DPDP-style consent capture for personal data fields (relevant for India-based HR data)

---

## 10. Non-Functional Requirements

| Requirement | Target |
|---|---|
| Availability | 99.5% (internal business-hours SLA) |
| Response time | < 300ms p95 for reads, < 800ms for writes |
| Concurrent users | Design for 500–2,000 employees; scale horizontally via stateless API pods |
| Data retention | Payroll/tax docs retained per statutory requirement (typically 7 years, India) |
| Browser support | Latest 2 versions of Chrome/Edge/Firefox |
| Accessibility | WCAG 2.1 AA for core ESS flows |

---

## 11. Suggested Delivery Phases

**Phase 1 — Foundation (Weeks 1–3)**
- Auth (login, JWT, refresh), RBAC engine, role/permission seed data
- Employee master CRUD (HR_ADMIN), employee self-profile view/edit
- Base layout, route guards, audit logging infra

**Phase 2 — Core ESS (Weeks 4–7)**
- Leave management (apply/approve/balance)
- Attendance (check-in/out, regularization)
- Document upload/download (ID proofs, offer letters)
- Helpdesk ticketing

**Phase 3 — Payroll & Reporting (Weeks 8–10)**
- Payslip generation/viewing, payroll processing (HR)
- Manager & HR dashboards, exportable reports (CSV/PDF)

**Phase 4 — Hardening & Launch (Weeks 11–12)**
- Security review, load testing, UAT with real HR workflows
- CI/CD to production, monitoring/alerting setup, admin training

**Phase 5 (Optional, later)** — Performance management, recruitment/onboarding module, AI-based analytics, SSO/MFA.

---

## 12. Open Decisions to Confirm

1. Expected employee count (drives DB sizing / infra choice)
2. Payroll: computed in-house or synced from an external payroll provider?
3. Hosting: on-prem, cloud (AWS/Azure/GCP), or company's existing infra?
4. Do we need multi-department / multi-branch org hierarchy from day 1?
5. SSO requirement (Google Workspace/Azure AD) for internal login?

---

*This plan is intended as the engineering-facing companion to the earlier HRMS ESS presentation for Damodara Smart Tech Pvt Ltd.*
