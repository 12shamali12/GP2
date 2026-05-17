# DentyHub — Dental Clinic Management Platform

DentyHub is our graduation project: a full-stack web platform that runs a university dental clinic end-to-end. It coordinates **patients**, **student doctors**, **supervisors**, and an **admin** through one role-based system that handles registration approval, clinic rotation planning, appointment scheduling, case reporting, ratings, group/partner workflows, profile reports, notifications, and chat.

The codebase is split into a **NestJS + Prisma + PostgreSQL** backend and a **Next.js 16 (App Router) + React 19 + Tailwind v4** frontend, managed with **pnpm**.

---

## Table of contents

1. [What the platform does](#what-the-platform-does)
2. [The four roles](#the-four-roles)
3. [Feature catalogue](#feature-catalogue)
4. [Tech stack](#tech-stack)
5. [Repository layout](#repository-layout)
6. [Backend architecture](#backend-architecture)
7. [Frontend architecture](#frontend-architecture)
8. [Database model](#database-model)
9. [Local setup](#local-setup)
10. [Environment variables](#environment-variables)
11. [API surface (cheat sheet)](#api-surface-cheat-sheet)
12. [Status of the project](#status-of-the-project)

---

## What the platform does

A university dental clinic has more moving parts than a normal booking app: students rotate through clinics on a fixed plan, supervisors grade case reports, students must complete a required set of cases per semester, and the same person may need to be both a service provider (treating patients) and a student being evaluated. DentyHub models all of that:

- An **admin** seeds the academic structure (semesters, clinics, shift templates, rotation plans, semester-specific required cases, doctor groups).
- **Supervisors** and **doctors** (students) register and wait for approval.
- The admin assigns groups to plans and clinics on specific days; the system auto-generates appointment slots from those rotation assignments.
- **Patients** browse generated slots filtered by clinic/case, and request a booking.
- The treating doctor (and their assigned partner) approve/decline, complete the visit, file a structured **case report**, and the supervisor on duty reviews it (mark, rating, feedback, accept/needs-edit/reject).
- Throughout, the platform tracks **performance events**, **per-case progress**, **clinic-task progress**, **exams**, **ratings** in three directions, and a **profile-report / moderation** flow.
- Direct chats, audience-targeted **rooms** (group, students+supervisors, supervisors-only, all users), notifications, and profile pages tie the social side together.

---

## The four roles

| Role | Lands on | What they do |
| --- | --- | --- |
| **PATIENT** | `/patient` | Browse generated slots, filter by clinic/case/date, request a booking, cancel, view upcoming + history, rate the doctor after a visit, chat, report a profile. |
| **DOCTOR** (student) | `/doctor` | See their group, partner, rotation plan, the slots auto-generated for them, approve/reject patient requests, mark complete or no-show, submit a structured case report, see their per-case progress, exams, performance counters, ratings, partners, group community feed, chat. |
| **SUPERVISOR** | `/supervisor` | See the clinic they are on duty in for the day, review the doctors and reports under them, mark/rate/give feedback, freeze a doctor, schedule and grade clinic exams, create supervisor tasks, chat, profile reports. |
| **ADMIN** | `/admin` | Approve doctor and supervisor accounts, manage every user, run the **planning studio** (semesters, clinics, shifts, rotation plans, vacation days, group↔plan↔clinic↔shift assignments, supervisor↔clinic links), create and curate **doctor groups** (members, supervisors, partner pairs, join requests), moderate **profile reports**, view a **leaderboard**, and access an admin chat surface. |

There is one seeded admin: `prof.shamali` (see `backend/src/seed.service.ts`).

---

## Feature catalogue

### Authentication & approval
- Username + password login; identifier can also be email, phone, or doctor ID.
- Patient registration is instant; **doctor** and **supervisor** registrations create a `DoctorRequest` / `SupervisorRequest` and wait for admin approval.
- Doctors must supply a unique `doctorIdNumber` and pick a **semester** at registration.
- Re-apply when rejected (`/auth/resend-doctor-request`, `/auth/resend-supervisor-request`).
- Password change and profile update endpoints; passwords stored with bcrypt.
- Admin-protected endpoints require `x-actor-username` / `x-actor-password` headers.

### Academic structure (admin)
- **Semesters** with `label`, `sortOrder`, optional `endsOn`, `active` flag — students are linked to a semester.
- **Clinics** with name + description.
- **Semester clinic cases** — for each (semester, clinic) the admin defines required case titles, descriptions, and `requiredCount`. Doctor progress is tracked per case (`OPEN` → `ASSISTED` → `COMPLETED`).
- **Shift templates** — named time windows with appointment capacity.
- **Rotation plans** — labelled plans with start/end, an attached shift template, day-by-day clinic assignments and vacation days (`RotationPlanDay`).
- **Group↔plan↔clinic↔shift assignments** (`ClinicRotationAssignment`) — drives auto-generation of slots.
- **Supervisor↔clinic links** (`ClinicSupervisorLink`) and per-day supervisor assignments (`ClinicSupervisorAssignment`).
- **Semester progression** endpoint that surfaces students eligible to advance + a one-click `advance` action.

### Doctor groups & partnerships
- Admin can create groups per semester, add/remove doctors and supervisors, delete groups.
- Doctors can post a `GroupJoinRequest`; admin/supervisor reviews it.
- Doctors send `PartnerRequest`s within the same group; on admin approval a `PartnerPair` is created. Partners share appointments (`partnerDoctorId`) and can co-author `CaseReport`s as `PRIMARY` / `ASSISTANT`.
- Group **posts** form a small community feed per group.
- Each group automatically gets a chat **room**.

### Appointments
- `AvailabilitySlot` is `OPEN`, `BOOKED`, `PAIR_BLOCKED`, or `CANCELLED`. Slots may be `autoGenerated` from a rotation assignment, or manually created.
- Patients filter by `clinicId`, `clinicCaseId`, date range, doctor, and book a slot tied to a specific `SemesterClinicCase`.
- The doctor decides (`PENDING` → `APPROVED`/`REJECTED`); approval may include a partner doctor whose paired slot is auto-blocked.
- Lifecycle: `PENDING` → `APPROVED` → `COMPLETED` (with completion notes) → `report submitted`. Also handles `CANCELLED` (by doctor or patient) and `noShow`.
- `AppointmentEvent` rows record `REPORT_SUBMITTED`, `NO_SHOW`, `CANCEL_DOCTOR`, `CANCEL_PATIENT`, `REJECTED` for performance counters (`/appointments/performance?weekStart=…&weekEnd=…`).
- Three-way ratings (`AppointmentRating` with kind `PATIENT_TO_DOCTOR`, `SUPERVISOR_TO_DOCTOR`, `DOCTOR_TO_PATIENT`), unique per (appointment, rater, kind), half-star precision.

### Case reports
- Structured `CaseReport` per appointment with `formData` JSON (chief complaint, medical/dental/social history, extra/intra-oral findings, radiographic views & findings, diagnosis lines, treatment visits, faculty notes — see `frontend/src/app/doctor/page.tsx`).
- Linked to clinic tasks via `CaseReportTask` (`PRIMARY` / `ASSISTANT`).
- Supervisor reviews: `SUBMITTED` → `REVIEWED` / `NEEDS_EDIT` / `CASE_REJECTED`, with `mark`, `rating`, `feedback`.
- Reviewing a report drives `DoctorClinicTaskProgress` and `DoctorClinicCaseProgress` updates.

### Exams
- Supervisors schedule `ClinicExam`s for a student in a clinic, optionally tied to a shift/plan.
- Lifecycle `SCHEDULED` → `COMPLETED` / `CANCELLED`, with `mark` and notes.

### Supervisor freeze & tasks
- A supervisor can `freezeDoctor` (sets `blockedUntil` + reason on the user, recorded in `DoctorFreeze`) and `unfreezeDoctor`.
- `SupervisorTask` lets a supervisor create work items pointed at a single doctor or a whole group.

### Profile pages, leaderboard, moderation
- Public profile route (`/profiles/[id]`) backed by `GET /profiles/:id`.
- `/profiles/leaderboard` aggregates ratings + activity for ranking.
- Any signed-in user can file a `UserProfileReport` against another user; admin (or a privileged reviewer) lists, dismisses, or takes action (`PENDING` → `DISMISSED` / `ACTION_TAKEN`) with a resolution note.

### Notifications
- `Notification` records persisted per recipient for approvals, rejections, bookings, decisions, etc.
- Endpoints to list, mark read, delete one, and delete all per identifier.

### Chat
- `Conversation.kind` is `DIRECT` or `ROOM`. Rooms target an `audience` (`GROUP`, `ALL_USERS`, `STUDENTS_SUPERVISORS`, `SUPERVISORS_ONLY`) and group rooms are 1:1 with a `DoctorGroup`.
- Search users by name, phone, doctor ID, or username.
- Per-conversation unread counts, `lastReadAt` per participant.
- Image attachments uploaded via `multer` to `backend/uploads/chat/` (2 MB cap, images only) and served from `/uploads/...`.

### UI / UX
- Frozen Lake visual system in `frontend/src/app/globals.css` — ivory/teal palette, glass panels, soft motion, shared brand mark.
- Bilingual auth screen (English / Arabic) with a slideshow showcase (`auth-showcase` assets in `frontend/public/auth-showcase/`).
- Per-role shells (`*/ui/*-side-rail.tsx`) with surface switching: overview, profile, notifications, chat, and role-specific workspaces.
- Reusable `ComingSoonModal` flags work-in-progress sections without breaking the visual flow.
- `ToastProvider` for inline feedback on save / error.

---

## Tech stack

**Backend**
- NestJS 11 (Express adapter)
- Prisma 5 + PostgreSQL 16
- `class-validator` / `class-transformer` global `ValidationPipe` (whitelist + transform)
- `bcryptjs` for password hashing
- `multer` for chat image uploads
- `@nestjs/swagger` (installed; OpenAPI surface available to wire up)

**Frontend**
- Next.js 16.1 with the App Router (running on the **webpack** dev server, not Turbopack)
- React 19.2
- Tailwind CSS v4 via `@tailwindcss/postcss`
- TypeScript 5

**Tooling**
- `pnpm` workspaces (root `package.json`, plus `frontend/pnpm-workspace.yaml`)
- Docker Compose for the Postgres dev DB (`docker-compose.yml`)
- ESLint + Prettier on both sides
- Jest + Supertest for backend tests

---

## Repository layout

```
.
├── backend/                     NestJS API
│   ├── prisma/
│   │   ├── schema.prisma        Single source of truth for the data model
│   │   └── migrations/          8 migrations — see "Database model"
│   ├── src/
│   │   ├── main.ts              Bootstrap, CORS, global pipes, /uploads static
│   │   ├── app.module.ts        Wires every feature module
│   │   ├── prisma.service.ts    Shared Prisma client
│   │   ├── seed.service.ts      Seeds the admin user on startup
│   │   ├── auth/                Register / login / profile / password
│   │   ├── supervisor/          Admin + supervisor surface (split into 5 services)
│   │   ├── appointments/        Slots, bookings, reports, ratings, performance
│   │   ├── chat/                Direct + room conversations, messages, uploads
│   │   ├── notifications/       Per-user notification CRUD
│   │   └── profiles/            Public profile, leaderboard, profile-report moderation
│   └── uploads/chat/            Persisted chat images
│
├── frontend/                    Next.js app
│   └── src/
│       ├── app/
│       │   ├── layout.tsx       Root layout + ToastProvider
│       │   ├── page.tsx         Auth portal (login / register, EN/AR)
│       │   ├── hooks/           Auth-portal hook
│       │   ├── ui/              Auth screen pieces
│       │   ├── admin/           Admin dashboard + supervisor-requests / doctor-requests / users / groups / planning / leaderboard / user-reports / chat / notifications / group-moderation
│       │   ├── doctor/          Doctor dashboard + 8 surfaces (approvals, chat, dashboard summary, global, legacy ops, notifications, profile, report workspace)
│       │   ├── patient/         Patient dashboard (care desk, slot/appointment modals, chat, notifications, profile)
│       │   ├── supervisor/      Supervisor dashboard (calendar, chat, global, notifications, profile)
│       │   └── profiles/[id]/   Public profile route
│       ├── features/
│       │   ├── admin/           AdminShell, admin-api, types, lib
│       │   ├── chat/            Chat services + types
│       │   ├── doctor/          Doctor-specific shared components
│       │   ├── notifications/   Notifications client
│       │   ├── profiles/        Profile API + hooks (incl. usePublicProfile)
│       │   ├── supervision/     Supervisor & doctor workspace panels (hero, live, students, reviews, plan, tasks, community)
│       │   └── ui/              Shared visual system (auth-showcase, brand-mark, coming-soon-modal, dashboard-icon, toast-provider)
│       └── lib/api/http.ts      Tiny fetch wrapper used across services
│
├── docker-compose.yml           Postgres 16 dev container (mydb / shamali / 5658040 — change before deploying)
├── package.json                 Root convenience scripts
├── scripts/start-dev.mjs        `pnpm start:dev` entry point
└── project_des.md               Older free-form description (kept for the report)
```

---

## Backend architecture

`AppModule` imports six feature modules:

- **AuthModule** — `auth.controller.ts` exposes `register-options`, `register`, `login`, `profile`, `change-password`, `update-profile`, and the two `resend-*-request` endpoints. `auth.service.ts` resolves users by id/email/phone/username/doctorId, hashes passwords with bcrypt, blocks unapproved doctors/supervisors from logging in until the admin decides, and validates that a chosen semester exists and is active.
- **SupervisorModule** — the largest surface. The single `SupervisorController` (~650 lines) is a façade in front of five specialised services:
  - `SupervisorService` — top-level glue
  - `SupervisorAdminService` — request approvals, user management
  - `SupervisorGroupsService` — groups, partner pairs, join requests, posts
  - `SupervisorPlanningService` — semesters, clinics, shifts, rotation plans, plan days, assignments, clinic supervisors
  - `SupervisorWorkspaceService` — the workspace endpoints surfaced to supervisor and doctor dashboards (reports queue, doctor workspace, exams, freezes, tasks)
  - DTOs are organised under `supervisor/dto/` (`common`, `groups`, `planning`, `workspace`).
- **AppointmentsModule** — slot CRUD, booking, decisions, completion, report-submitted flag, three-way ratings, performance window, list-by-role.
- **ChatModule** — conversation listing, unread count, user search, start, list messages, mark read, send (with multipart image upload).
- **NotificationsModule** — list, mark-read, delete, delete-all.
- **ProfilesModule** — public profile, leaderboard, file/list/decide profile reports.

Cross-cutting:
- `ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true })` on every endpoint.
- CORS open (`*`) for local dev.
- Static `/uploads` served from disk for chat images.
- Admin-protected supervisor endpoints check `x-actor-username` / `x-actor-password` headers — see `frontend-refactor-notes.md`.
- `SeedService.onModuleInit` upserts the `prof.shamali` admin on every boot.

## Frontend architecture

- **App Router** with `"use client"` page components per role. The auth screen routes signed-in users to `/admin`, `/supervisor`, `/doctor`, or `/patient` based on role.
- Each role page is a shell that hosts surface views from `*/ui/` and pulls behavior from `*/hooks/` (e.g. `use-doctor-bootstrap`, `use-doctor-chat`, `use-patient-booking-actions`, `use-supervisor-notifications`).
- Shared, role-agnostic logic lives in `src/features/*`:
  - `features/admin` — admin shell + REST client.
  - `features/supervision` — the rich supervisor and doctor **workspace panels** (live view, students, reviews, plan, tasks, community).
  - `features/profiles` — `usePublicProfile`, profile API.
  - `features/chat`, `features/notifications` — clients for each surface.
  - `features/ui` — design-system pieces (brand mark, dashboard icons, toast provider, coming-soon modal, auth showcase background).
- `src/lib/api/http.ts` is the single fetch wrapper used by all services.
- Visual design lives in `src/app/globals.css` — the **Frozen Lake** palette (ivory/teal) with glass panels and soft motion. The `ComingSoonModal` is used wherever a surface is intentionally not finished yet.

---

## Database model

Defined in `backend/prisma/schema.prisma` (~820 lines, ~30 models, ~14 enums). The migration history captures the project's growth:

| Migration | What it added |
| --- | --- |
| `20260106140034_shamalifirst` | Initial schema — users, supervisor/doctor requests, notifications, slots, appointments, performance events, conversations, messages. |
| `20260331231934_supervision_groups` | `DoctorGroup`, members, supervisors, posts, group join requests, partner requests, partner pairs, supervisor freezes, supervision assignments, supervisor tasks. |
| `20260401014118_clinic_planning` | `Clinic`, `ShiftTemplate`, `RotationPlan`, `RotationPlanDay`, `ClinicRotationAssignment`, `ClinicTask`, `DoctorClinicTaskProgress`. |
| `20260401031917_plan_templates` | Plan-template polish on top of the planning models. |
| `20260401195500_plan_vacation_days` | `RotationPlanDay.isVacation` + `vacationReason`. |
| `20260402120000_clinic_supervisor_links` | `ClinicSupervisorLink` and per-day `ClinicSupervisorAssignment`. |
| `20260409004022_semester_case_reservations` | `Semester`, `SemesterClinicCase`, `DoctorClinicCaseProgress`, `CaseReport` + `CaseReportTask`, `ClinicExam`, `AppointmentRating`, `AppointmentEvent` enrichments. |
| `20260409073000_profile_reports_chat_rooms` | `UserProfileReport`, room-flavoured `Conversation` (kind, code, audience, group link), bio fields. |

Key model groups:

- **Identity** — `User`, `Semester`.
- **Approvals** — `SupervisorRequest`, `DoctorRequest`, `GroupJoinRequest`, `PartnerRequest`, `UserProfileReport`.
- **Academic structure** — `Clinic`, `ShiftTemplate`, `RotationPlan`, `RotationPlanDay`, `ClinicRotationAssignment`, `ClinicSupervisorAssignment`, `ClinicSupervisorLink`, `SemesterClinicCase`, `ClinicTask`.
- **Cohort** — `DoctorGroup`, `DoctorGroupMember`, `DoctorGroupSupervisor`, `PartnerPair`, `SupervisionAssignment`, `DoctorFreeze`.
- **Workflow** — `AvailabilitySlot`, `Appointment`, `AppointmentEvent`, `CaseReport`, `CaseReportTask`, `DoctorClinicCaseProgress`, `DoctorClinicTaskProgress`, `ClinicExam`, `AppointmentRating`, `SupervisorTask`, `GroupPost`.
- **Comms** — `Conversation`, `ConversationParticipant`, `Message`, `Notification`.

---

## Local setup

### Prerequisites
- Node.js 18+ (LTS)
- pnpm
- PostgreSQL 16 — easiest path is `docker compose up -d` from the repo root (uses `docker-compose.yml`).

### Backend
```bash
cd backend
pnpm install
pnpm prisma migrate deploy        # or `migrate dev` while iterating
pnpm prisma generate
pnpm run start:dev                # http://localhost:3000
```

### Frontend
```bash
cd frontend
pnpm install
pnpm run dev                      # http://localhost:3000 by default — pass --port if needed
```

> The frontend dev script uses `next dev --webpack` on purpose. Turbopack was disabled because of a Tailwind v4 + Next 16 + Windows resolution issue (see `frontend/frontend-refactor-notes.md`, step 04).

### One-shot (root)
```bash
pnpm run start:dev                # runs scripts/start-dev.mjs
```

---

## Environment variables

`backend/.env`
```env
DATABASE_URL="postgresql://shamali:5658040@localhost:5432/mydb"
PORT=3000
```

`frontend/.env.local`
```env
NEXT_PUBLIC_API_URL=http://localhost:3000
```

The seeded admin credentials live in `backend/src/seed.service.ts` (`prof.shamali` / `Shamali5658040@`). Change them before any non-local deployment.

---

## API surface (cheat sheet)

All routes are prefixed with the controller name. Admin-only routes additionally require headers `x-actor-username` and `x-actor-password`.

**Auth** (`/auth`)
- `GET /register-options` · `POST /register` · `POST /login`
- `GET /profile?identifier=…`
- `POST /change-password` · `POST /update-profile`
- `POST /resend-supervisor-request` · `POST /resend-doctor-request`

**Supervisor / Admin** (`/supervisor`)
- Approvals: `GET /requests`, `POST /requests/:id/decision`, `GET /doctor-requests`, `POST /doctor-requests/:id/decision`, `POST /users/:id/reapprove(-doctor)`
- Users: `GET /users`, `POST /users/:id/block`, `POST /users/:id/delete`, `POST /users/:id/semester`
- Groups: `GET /groups`, `POST /groups`, `POST /groups/:id/update|delete`, `POST /groups/:id/doctors`, `POST /groups/:id/doctors/:doctorId/remove`, `POST /groups/:id/supervisors[...]`, `GET|POST /group-requests[/:id/decision]`, `POST /groups/:id/posts`
- Planning: `POST /clinics`, `POST /clinics/:id/update|delete`, `POST /shifts[...]`, `POST /plans[...]`, `POST /plans/:id/days`, `POST /plans/assign-group`, `POST /plans/assignments`, `POST /clinics/supervisors`, `POST /clinic-tasks`, `POST /semesters[...]`, `POST /clinic-cases[...]`, `GET /semesters/progression`, `POST /semesters/advance`
- Workspaces: `GET /workspace?identifier=…`, `GET /doctor-workspace?identifier=…`, `GET /planning`, `GET /doctor-search?identifier=…&q=…`
- Supervision: `POST /assignments`, `POST /assignments/:id/remove`, `POST /doctors/:id/freeze|unfreeze`, `POST /tasks`
- Reports: `GET /reports`, `POST /reports/:id/review`
- Partnerships: `POST /partner-requests`, `POST /partner-requests/:id/decision`, `POST /partner-pairs/:id/remove`
- Exams: `POST /exams`, `POST /exams/:id/grade`

**Appointments** (`/appointments`)
- `POST /slots`, `GET /slots?…`, `DELETE /slots/:id`, `POST /slots/batch-delete`
- `POST /book`, `POST /:id/decision`, `POST /:id/cancel`, `POST /:id/cancel-patient`
- `POST /:id/report-submitted`, `POST /:id/complete`
- `POST /:id/patient-feedback`, `POST /:id/doctor-feedback`
- `GET /performance?doctorIdentifier=…&weekStart=…&weekEnd=…`
- `GET /mine?role=doctor|patient&identifier=…`

**Chat** (`/chat`)
- `GET /conversations?identifier=…` · `GET /unread-count?identifier=…`
- `GET /search?q=…&identifier=…`
- `POST /start`
- `GET /:id/messages?identifier=…` · `PATCH /:id/read`
- `POST /:id/messages` (multipart, optional `image`)

**Notifications** (`/notifications`)
- `GET /?identifier=…`
- `PATCH /:id/read?identifier=…` · `PATCH /:id/delete?identifier=…` · `PATCH /delete/all?identifier=…`

**Profiles** (`/profiles`)
- `GET /leaderboard`
- `GET /:id?viewerIdentifier=…`
- `POST /:id/report`
- `GET /reports?identifier=…` · `POST /reports/:id/decision`

---

## Status of the project

**Implemented end-to-end**
- Authentication, role-based dashboards, admin approval flow, re-apply on rejection.
- Full academic-structure admin: semesters, clinics, shifts, rotation plans, plan days, group↔plan↔clinic assignments, supervisor↔clinic links, semester clinic cases.
- Doctor groups: members, supervisors, join requests, partner requests, partner pairs, group posts, group chat rooms.
- Slot generation tied to rotation assignments + manual slot management.
- Appointment lifecycle including partner doctors, completion notes, no-show, both-side cancellation, three-way ratings.
- Structured case reports with form data, supervisor review states, and progress propagation to clinic-task and clinic-case progress.
- Clinic exams (schedule + grade), supervisor freezes, supervisor tasks.
- Notifications + persistent storage.
- Direct chat, group rooms, audience rooms, image attachments, unread counts.
- Public profile pages, leaderboard, profile-report moderation.
- Frozen Lake design system applied across all role shells, with bilingual auth.

**Intentional placeholders** (surfaced via `ComingSoonModal`)
- Game / gamification surface, settings panel, parts of the leaderboard, and a few coordination views — all visible from the dashboards but flagged as in-progress.

**Known caveats**
- Auth is identifier+password header based for admin routes; no JWT/session yet.
- Frontend dev runs on the webpack server (not Turbopack) due to a Tailwind v4 / Next 16 / Windows resolution issue documented in `frontend/frontend-refactor-notes.md`.
- Default DB credentials and the seeded admin password are in source — rotate them before any non-local use.

---

_Older long-form description (used as raw material for the university report) lives at [project_des.md](project_des.md)._
