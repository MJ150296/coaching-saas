# Coaching Operations Handbook

This handbook explains how the current Coaching SaaS app is expected to run in production: platform model, onboarding, and daily operations.

## 1) How the Project Works

### 1.1 Tenant Model

All core data is scoped by:

1. `organizationId`
2. `coachingCenterId`
3. `academicYearId` (for academic/fees/coaching operations where relevant)

Super admin can work cross-tenant. Other roles are restricted to their tenant scope.

### 1.2 Roles and Ownership

1. `SUPER_ADMIN`
   - Bootstraps the platform.
   - Creates organizations, coaching centers, and top-level users.
   - Has full visibility across tenants.
2. `ORGANIZATION_ADMIN`
   - Manages coaching centers and users inside one organization.
3. `COACHING_ADMIN`
   - Manages one coaching center's users and day-to-day operations.
4. `ADMIN`
   - Operational admin for academic, enrollments, fees, and coaching setup.
5. `TEACHER`
   - Uses teacher dashboard and coaching session/attendance APIs.
6. `STUDENT`
   - Uses student dashboard (schedule + fee due view).
7. `PARENT`
   - Uses parent dashboard (children status, notices, dues).
8. `STAFF`
   - Staff role exists and is tenant-scoped.

### 1.3 Main UI Areas

1. Authentication
   - `/auth/signin`
   - `/auth/register`
   - `/auth/superadmin-bootstrap`
2. Admin Console
   - `/admin-roles/superadmin`
   - `/admin-roles/organization-admin`
   - `/admin-roles/coaching-admin`
   - `/admin-roles/users`
   - `/admin-roles/organizations`
   - `/admin-roles/coaching-centers`
3. Operational Setup
   - `/admin-roles/admin/onboarding` (guided wizard)
   - `/admin-roles/manage-setting/academic`
   - `/admin-roles/manage-setting/enrollments`
   - `/admin-roles/manage-setting/fees`
   - `/admin-roles/manage-setting/coaching`
4. End-user Dashboards
   - `/teacher/dashboard`
   - `/student/dashboard`
   - `/parent/dashboard`
   - `/staff/dashboard`

### 1.4 Academic vs Coaching Model (Important)

This product currently has two active layers:

1. Academic layer (`Class`, `Section`, `Roll Number`, `Timetable`)
   - Purpose: baseline student placement, timetable structure, and institutional reporting.
   - Primary screens:
     - `/admin-roles/manage-setting/academic`
     - `/admin-roles/manage-setting/enrollments`
2. Coaching layer (`Program`, `Batch`, coaching sessions, coaching attendance)
   - Purpose: actual coaching delivery and operations.
   - Primary screen:
     - `/admin-roles/manage-setting/coaching`

Definitions:

1. Program = coaching offering (example: `JEE 2027 Foundation`, `NEET Crash Course`)
2. Batch = delivery group inside a program (example: `Morning A`, `Weekend B`, `Faculty Ravi - Evening`)

Recommended operating choice for this product:

1. Keep Academic layer minimal and stable.
2. Run daily teaching and attendance through Coaching layer (Program/Batch).
3. Allow a student to have:
   - one academic enrollment (class/section), and
   - one or more coaching enrollments (program/batch) as required.

## 2) Onboarding: First-Time Setup

### 2.1 Platform Bootstrap (one time)

Use this when the system has no super admin account.

1. Open `/auth/superadmin-bootstrap`.
2. Create first super admin.
3. Sign in and land on super admin dashboard.

Related APIs:

1. `GET /api/auth/superadmin-check`
2. `POST /api/auth/superadmin-register`
3. `POST /api/auth/[...nextauth]` (login session)

### 2.2 Tenant and Operations Onboarding (recommended path)

Use the guided wizard at `/admin-roles/admin/onboarding`.

Recommended step sequence:

1. Bootstrap check
2. Create organization
3. Create coaching center
4. Create admin accounts
5. Academic setup (academic year + class master)
6. Teacher + class teacher assignment
7. Fees setup (fee type/plan + assignment)
8. Create student + parent
9. Create student ledger entry
10. Parent handover

The wizard already maps to live APIs and tenant selectors. It is the safest path for new centers.

### 2.3 Onboarding Via Manage Pages (manual path)

If not using wizard, use this minimum order:

1. Create organization and coaching center.
2. Create users (`COACHING_ADMIN`, `ADMIN`, `TEACHER`, `STUDENT`, `PARENT`, `STAFF`) with correct tenant scope.
3. Create academic year, class masters, sections, and subject allocations.
4. Enroll students.
5. Configure fee types/plans and assign fee plans.
6. Create initial ledger dues.
7. Configure coaching programs, batches, enrollments, sessions, and attendance.

## 2.4 One-Page SOP (What To Use and How To Use)

Use this sequence for every new center/session cycle:

1. Create academic year.
2. Create only required class/section entries.
3. Enroll students to class/section (assign roll number only if needed by your operations).
4. Create coaching programs (course catalog).
5. Create batches under each program (capacity, faculty, schedule).
6. Enroll students into coaching batches.
7. Run coaching sessions and mark coaching attendance.
8. Configure fee types/plans and assign fee plans.
9. Post ledger dues, collect payments, issue credit notes if needed.

Quick decision guide:

1. Need institutional grouping or timetable? -> Use Academic.
2. Need actual course delivery? -> Use Coaching Program/Batch.
3. Need fee due/payment control? -> Use Fees module.
4. Need student joining/movement? -> Use Enrollments + Coaching Enrollments.

## 3) Daily Activities on the App

### 3.1 Daily Ops for `COACHING_ADMIN` / `ADMIN`

Start of day checklist:

1. Open dashboard (`/admin-roles/coaching-admin` or `/admin-roles/admin`).
2. Confirm tenant selection (organization + coaching center).
3. Check quick stats for users/coaching center health.

Core daily tasks:

1. Academic changes:
   - Use `/admin-roles/manage-setting/academic` for year/class/section updates and timetable refresh.
2. Enrollment updates:
   - Use `/admin-roles/manage-setting/enrollments` for add/edit/remove and CSV imports.
3. Fee operations:
   - Use `/admin-roles/manage-setting/fees` for ledger entries, payments, and credit notes.
4. Coaching delivery:
   - Use `/admin-roles/manage-setting/coaching` for program/batch/session/attendance operations.
5. User lifecycle:
   - Use `/admin-roles/users` for onboarding and access changes.

End of day checklist:

1. Verify attendance captured for all scheduled sessions.
2. Reconcile payments posted vs pending dues.
3. Review new admissions and unresolved enrollment conflicts.
4. Confirm new users can sign in successfully.

### 3.2 Daily Ops for `TEACHER`

1. Open `/teacher/dashboard`.
2. Review today's sessions and pending tasks.
3. Conduct sessions.
4. Mark attendance from teacher coaching attendance flow (`/api/teacher/coaching-attendance`).
5. Review dashboard again for pending queue.

### 3.3 Daily Ops for `PARENT` and `STUDENT`

1. Student checks `/student/dashboard` for schedule, dues, and payment history.
2. Parent checks `/parent/dashboard` for children overview, notices, and dues.
3. Parent follows fee reminders from pending dues shown in dashboard.

## 4) Key APIs Used in Operations

### 4.1 Tenant, Users, and Overview

1. `POST /api/admin/organizations`
2. `GET|POST /api/admin/coaching-centers`
3. `GET|POST /api/admin/users`
4. `GET /api/admin/dashboard/overview`
5. `GET /api/admin/academic/options`

### 4.2 Academic and Enrollments

1. `GET|POST /api/admin/academic-years`
2. `GET|POST /api/admin/class-masters`
3. `GET|POST /api/admin/sections`
4. `GET|POST /api/admin/subject-allocations`
5. `GET|POST /api/admin/timetable`
6. `GET|POST|DELETE /api/admin/enrollments`

### 4.3 Fees

1. `GET|POST /api/admin/fee-types`
2. `GET|POST /api/admin/fee-plans`
3. `POST /api/admin/fee-plan-assignments`
4. `POST /api/admin/student-fee-ledger`
5. `POST /api/admin/payments`
6. `POST /api/admin/credit-notes`

### 4.4 Coaching Management

1. `GET|POST /api/admin/coaching-programs`
2. `GET|POST /api/admin/coaching-batches`
3. `GET|POST /api/admin/coaching-enrollments`
4. `GET|POST /api/admin/coaching-sessions`
5. `GET|POST /api/admin/coaching-attendance`

Teacher APIs:

1. `GET /api/teacher/dashboard`
2. `GET|POST /api/teacher/coaching-sessions`
3. `GET|POST /api/teacher/coaching-attendance`

## 5) Operating Standards

### 5.1 Tenant Discipline

1. Always select `organizationId` and `coachingCenterId` before creating records.
2. Keep users scoped correctly to avoid cross-tenant data confusion.
3. Avoid creating academic/fees/coaching records without active academic year context.

### 5.2 Data Quality

1. Use stable naming conventions for class masters, sections, and programs.
2. Reconcile duplicate student records before posting new ledger entries.
3. Use CSV import in enrollments only after validating class/section IDs.

### 5.3 Access and Security

1. Issue role-appropriate accounts only.
2. Rotate temporary passwords after handover.
3. Disable stale users not attached to active operations.

## 6) Suggested Weekly/Monthly Cadence

Weekly:

1. Review attendance completion per batch.
2. Review unpaid ledgers and posted payments.
3. Validate timetable and teacher allocations for the next week.

Monthly:

1. Audit active users by role and tenant.
2. Validate fee-plan assignment coverage across active classes/sections.
3. Archive or inactivate obsolete batches/programs.

## 7) Common Execution Flows

### New Coaching Center Go-Live

1. Create organization/coaching center.
2. Create `COACHING_ADMIN` and `ADMIN`.
3. Run onboarding wizard end-to-end.
4. Verify dashboards for coaching admin, teacher, student, and parent.
5. Start daily fee and attendance operations.

### Mid-Year Student Admission

1. Create student + parent user.
2. Add enrollment (class + section + academic year).
3. Assign fee plan and post ledger due.
4. Add to coaching program/batch if required.
5. Confirm visibility on student/parent dashboard.

## 8) Enterprise-Grade Operating Model (Reference)

For enterprise coaching SaaS, keep architecture and process in this order:

1. Tenant governance:
   - Organization -> Coaching Center -> Role-based access.
2. Master data:
   - Academic year, classes/sections (minimal), programs, fee catalog.
3. Delivery engine:
   - Batch planning, session calendar, attendance capture, faculty assignment.
4. Revenue engine:
   - Fee plan assignment, ledger generation, payments, credits/refunds, dues aging.
5. Student lifecycle:
   - Admission -> enrollment -> attendance -> performance/retention.
6. Control and audit:
   - Strict tenant scoping, role permissions, data quality checks, periodic reconciliations.

Operational principle:

1. Academic = structure.
2. Coaching = delivery.
3. Fees = monetization and reconciliation.

## 9) Visual Flowcharts

### 9.1 Student Lifecycle (End-to-End)

```text
Lead/Inquiry
   ->
Admission Confirmed
   ->
Create Student + Parent User
   ->
Academic Enrollment (Academic Year + Class + Section)
   ->
Coaching Enrollment (Program + Batch)
   ->
Fee Plan Assignment
   ->
Ledger Due Creation
   ->
Session Delivery + Attendance
   ->
Payment Collection + Credit Notes (if needed)
   ->
Progression / Retention / Renewal
```

### 9.2 What To Use Decision Flow

```text
Need to group students institutionally?
   -> Use Academic (Class/Section/Roll)

Need to run coaching operations?
   -> Use Coaching (Program/Batch/Session/Attendance)

Need dues, payments, discounts, credits?
   -> Use Fees (Fee Types/Plans/Ledger/Payments/Credit Notes)

Need student movement?
   -> Use Enrollments + Coaching Enrollments together
```

### 9.3 Center Go-Live Flow

```text
Super Admin Bootstrap
   ->
Create Organization
   ->
Create Coaching Center
   ->
Create Ops Users (Coaching Admin/Admin/Teacher)
   ->
Academic Setup (Year/Class/Section)
   ->
Program + Batch Setup
   ->
Student/Parent Creation
   ->
Enrollments (Academic + Coaching)
   ->
Fee Setup + Ledger
   ->
Go Live (Sessions + Attendance + Payments)
```
