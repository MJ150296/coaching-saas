# Coaching Management System - Comprehensive Documentation

A modern, enterprise-grade coaching management application built with Next.js App Router, TypeScript, and Domain-Driven Design (DDD).

## Table of Contents

1. [Quick Start](#quick-start)
2. [Architecture Overview](#architecture-overview)
3. [Project Structure](#project-structure)
4. [Domain-Driven Design](#domain-driven-design)
5. [Authentication & Authorization](#authentication--authorization)
6. [Bootstrap & Dependency Injection](#bootstrap--dependency-injection)
7. [API Reference](#api-reference)
8. [Operations Guide](#operations-guide)
9. [Troubleshooting](#troubleshooting)

---

## Quick Start

### Prerequisites

- Node.js 18+
- MongoDB (local or Atlas)

### Environment Setup

```bash
# Clone and install dependencies
npm install

# Copy environment file
cp .env.example .env.local
```

### Configure Environment

Update `.env.local`:

```env
MONGODB_URI=mongodb://localhost:27017/coaching-saas
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=generate-a-secure-secret-key
```

Generate `NEXTAUTH_SECRET`:
```bash
openssl rand -hex 32
```

### Run Development Server

```bash
npm run dev
```

Visit `http://localhost:3000`.

### First-Time Setup

1. Visit `/auth/superadmin-bootstrap` to create the first superadmin
2. Sign in and access the superadmin dashboard
3. Create organizations and coaching centers

---

## Architecture Overview

### DDD (Domain-Driven Design) Architecture

This project follows Domain-Driven Design principles with clear separation of concerns:

```
src/
├── domains/                          # Business domains
│   ├── user-management/              # User management
│   ├── organization-management/      # Organizations & coaching centers
│   ├── academic-management/          # Academic years, classes, sections
│   ├── fee-management/               # Fee types, plans, ledger, payments
│   └── coaching-management/          # Programs, batches, sessions, attendance
├── shared/                           # Shared code across domains
│   ├── domain/                       # Base DDD classes
│   ├── infrastructure/               # Auth, database, RBAC
│   └── lib/                          # Utility functions
└── app/                              # Next.js App Router
    ├── api/                          # API routes
    └── [role]/dashboard/             # Role-based dashboards
```

### Layer Breakdown

#### 1. Domain Layer (`domains/*/domain/`)
Pure business logic independent of frameworks:
- **Entities**: Objects with identity (User, CoachingBatch, etc.)
- **Value Objects**: Immutable objects (Email, Password, etc.)
- **Aggregate Roots**: Entry points to aggregates
- **Domain Events**: Significant business events
- **Repositories**: Interface definitions for data persistence

#### 2. Application Layer (`domains/*/application/`)
Orchestrates domain objects:
- **Use Cases**: Business scenarios (CreateUser, AssignFeePlan, etc.)
- **DTOs**: Data transfer objects
- **Mappers**: Domain to DTO converters

#### 3. Infrastructure Layer (`domains/*/infrastructure/`)
Technical implementations:
- **Persistence**: MongoDB repository implementations
- **External Services**: Password encryption, email services

---

## Project Structure

### Complete Directory Map

```
coaching-saas/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── admin/
│   │   │   │   ├── organizations/route.ts
│   │   │   │   ├── coaching-centers/route.ts
│   │   │   │   ├── academic-years/route.ts
│   │   │   │   ├── class-masters/route.ts
│   │   │   │   ├── sections/route.ts
│   │   │   │   ├── subject-allocations/route.ts
│   │   │   │   ├── fee-types/route.ts
│   │   │   │   ├── fee-plans/route.ts
│   │   │   │   ├── fee-plan-assignments/route.ts
│   │   │   │   ├── student-fee-ledger/route.ts
│   │   │   │   ├── payments/route.ts
│   │   │   │   ├── credit-notes/route.ts
│   │   │   │   ├── users/route.ts
│   │   │   │   ├── coaching-programs/route.ts
│   │   │   │   ├── coaching-batches/route.ts
│   │   │   │   ├── coaching-enrollments/route.ts
│   │   │   │   ├── coaching-sessions/route.ts
│   │   │   │   ├── coaching-attendance/route.ts
│   │   │   │   ├── dashboard/overview/route.ts
│   │   │   │   └── generate-recurring-fees/route.ts
│   │   │   ├── auth/
│   │   │   │   ├── [...nextauth]/route.ts
│   │   │   │   ├── register/route.ts
│   │   │   │   ├── superadmin-check/route.ts
│   │   │   │   └── superadmin-register/route.ts
│   │   │   ├── analytics/
│   │   │   │   ├── academic/route.ts
│   │   │   │   ├── fees/route.ts
│   │   │   │   └── users/route.ts
│   │   │   ├── bootstrap/init/route.ts
│   │   │   ├── dev/seed-test-user/route.ts
│   │   │   ├── users/me/route.ts
│   │   │   └── [role]/
│   │   │       ├── coaching-sessions/route.ts
│   │   │       └── coaching-attendance/route.ts
│   │   ├── admin-roles/
│   │   │   ├── admin/
│   │   │   │   ├── page.tsx
│   │   │   │   ├── AdminDashboardClient.tsx
│   │   │   │   └── onboarding/
│   │   │   ├── superadmin/
│   │   │   ├── organization-admin/
│   │   │   ├── coaching-admin/
│   │   │   ├── coaching-centers/
│   │   │   ├── organizations/
│   │   │   ├── users/
│   │   │   └── manage-setting/
│   │   │       ├── academic/
│   │   │       ├── coaching/
│   │   │       ├── enrollments/
│   │   │       ├── fees/
│   │   │       └── users/
│   │   ├── auth/
│   │   │   ├── signin/page.tsx
│   │   │   ├── register/page.tsx
│   │   │   └── superadmin-bootstrap/page.tsx
│   │   ├── [role]/dashboard/
│   │   │   ├── teacher/
│   │   │   ├── student/
│   │   │   ├── parent/
│   │   │   └── staff/
│   │   ├── profile/
│   │   └── layout.tsx
│   ├── domains/
│   │   ├── user-management/
│   │   │   ├── domain/
│   │   │   │   ├── entities/User.ts
│   │   │   │   ├── value-objects/index.ts
│   │   │   │   ├── repositories/UserRepository.ts
│   │   │   │   └── domain-events/
│   │   │   ├── application/
│   │   │   │   ├── use-cases/
│   │   │   │   ├── dtos/
│   │   │   │   └── mappers/UserMapper.ts
│   │   │   └── infrastructure/
│   │   │       ├── persistence/
│   │   │       │   ├── UserSchema.ts
│   │   │       │   ├── ParentStudentLinkSchema.ts
│   │   │       │   └── MongoUserRepository.ts
│   │   │       └── external-services/
│   │   ├── organization-management/
│   │   │   ├── domain/
│   │   │   │   ├── entities/Organization.ts
│   │   │   │   ├── entities/CoachingCenter.ts
│   │   │   │   ├── value-objects/
│   │   │   │   └── repositories/
│   │   │   ├── application/
│   │   │   │   └── use-cases/
│   │   │   └── infrastructure/
│   │   │       └── persistence/
│   │   ├── academic-management/
│   │   │   ├── domain/
│   │   │   │   ├── entities/
│   │   │   │   ├── repositories/
│   │   │   │   └── value-objects/
│   │   │   ├── application/
│   │   │   │   └── use-cases/
│   │   │   └── infrastructure/
│   │   │       └── persistence/
│   │   ├── fee-management/
│   │   │   ├── domain/
│   │   │   │   ├── entities/
│   │   │   │   ├── repositories/
│   │   │   │   └── value-objects/
│   │   │   ├── application/
│   │   │   │   └── use-cases/
│   │   │   └── infrastructure/
│   │   │       └── persistence/
│   │   └── coaching-management/
│   │       ├── domain/
│   │       │   ├── entities/
│   │       │   │   ├── CoachingProgram.ts
│   │       │   │   ├── CoachingBatch.ts
│   │       │   │   ├── CoachingEnrollment.ts
│   │       │   │   ├── CoachingSession.ts
│   │       │   │   └── CoachingAttendance.ts
│   │       │   ├── repositories/
│   │       │   └── value-objects/
│   │       ├── application/
│   │       │   └── use-cases/
│   │       └── infrastructure/
│   │           └── persistence/
│   ├── shared/
│   │   ├── bootstrap/
│   │   │   ├── AppBootstrap.ts
│   │   │   ├── Container.ts
│   │   │   ├── ServiceKeys.ts
│   │   │   └── init.ts
│   │   ├── domain/
│   │   │   ├── AggregateRoot.ts
│   │   │   ├── Entity.ts
│   │   │   ├── ValueObject.ts
│   │   │   ├── Repository.ts
│   │   │   ├── DomainEvent.ts
│   │   │   ├── Result.ts
│   │   │   └── Specification.ts
│   │   ├── infrastructure/
│   │   │   ├── auth.ts
│   │   │   ├── auth-utils.ts
│   │   │   ├── database.ts
│   │   │   ├── rbac.ts
│   │   │   ├── role-policy.ts
│   │   │   ├── tenant.ts
│   │   │   ├── audit-log.ts
│   │   │   ├── errors.ts
│   │   │   └── logger.ts
│   │   └── lib/
│   │       ├── analytics.server.ts
│   │       ├── admin-dashboard.server.ts
│   │       ├── coaching-admin-dashboard.server.ts
│   │       ├── student-dashboard.server.ts
│   │       ├── parent-dashboard.server.ts
│   │       ├── teacher-dashboard.server.ts
│   │       └── requireRole.ts
│   └── types/
│       └── next-auth.d.ts
├── docs/
├── public/
├── scripts/
├── package.json
├── tsconfig.json
└── next.config.ts
```

---

## Domain-Driven Design

### Core Concepts

#### Entity
Objects with unique identity that persist over time:

```typescript
class User extends AggregateRoot<UserProps> {
  private readonly id: string;
  private email: Email;
  private password: Password;
  
  // Equality based on ID
  equals(other: User): boolean {
    return this.id === other.id;
  }
}
```

#### Value Object
Immutable objects without identity:

```typescript
class Email extends ValueObject {
  private readonly value: string;
  
  static create(email: string): Result<Email> {
    if (!this.isValidEmail(email)) {
      return Result.fail('Invalid email');
    }
    return Result.ok(new Email(email.toLowerCase().trim()));
  }
  
  getValue(): string {
    return this.value;
  }
}
```

#### Aggregate Root
Entity that manages consistency of an aggregate:

```typescript
class User extends AggregateRoot<UserProps> {
  changeRole(newRole: UserRole): void {
    this.props.role = newRole;
    this.addDomainEvent(new UserRoleChangedEvent(this.id, newRole));
  }
}
```

#### Repository Pattern
Abstraction for data persistence:

```typescript
interface UserRepository extends Repository<User> {
  save(user: User): Promise<void>;
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  emailExists(email: string): Promise<boolean>;
}
```

#### Use Case Pattern
Orchestrates domain logic for business scenarios:

```typescript
class CreateUserUseCase {
  constructor(private userRepository: UserRepository) {}
  
  async execute(request: CreateUserRequest): Promise<Result<User>> {
    // 1. Validate input
    // 2. Check business rules
    // 3. Create domain entity
    // 4. Persist to database
    // 5. Return result
  }
}
```

#### Result Pattern
Functional error handling without exceptions:

```typescript
const result = await useCase.execute(request);

if (result.getIsSuccess()) {
  const user = result.getValue();
} else {
  const error = result.getError();
}
```

### Implemented Domains

| Domain | Description | Key Entities |
|--------|-------------|--------------|
| User Management | User accounts, roles, authentication | User, UserRole |
| Organization Management | Organizations and coaching centers | Organization, CoachingCenter |
| Academic Management | Academic years, classes, sections | AcademicYear, ClassMaster, Section |
| Fee Management | Fee types, plans, ledger, payments | FeeType, FeePlan, Payment, CreditNote |
| Coaching Management | Programs, batches, sessions, attendance | CoachingProgram, CoachingBatch, CoachingSession |

---

## Authentication & Authorization

### User Roles

| Role | Description | Dashboard |
|------|-------------|-----------|
| `SUPER_ADMIN` | Platform administrator | `/admin-roles/superadmin` |
| `ORGANIZATION_ADMIN` | Organization administrator | `/admin-roles/organization-admin` |
| `COACHING_ADMIN` | Coaching center administrator | `/admin-roles/coaching-admin` |
| `ADMIN` | Operational admin | `/admin-roles/admin` |
| `TEACHER` | Teacher/Educator | `/teacher/dashboard` |
| `STUDENT` | Student | `/student/dashboard` |
| `PARENT` | Parent/Guardian | `/parent/dashboard` |
| `STAFF` | Support staff | `/staff/dashboard` |

### Role Creation Policy

| Actor Role | Can Create |
|------------|------------|
| `SUPER_ADMIN` | All roles |
| `ORGANIZATION_ADMIN` | COACHING_ADMIN, ADMIN, TEACHER, STAFF, STUDENT, PARENT |
| `COACHING_ADMIN` | ADMIN, TEACHER, STAFF, STUDENT, PARENT |
| `ADMIN` | TEACHER, STAFF, STUDENT, PARENT |

### Authentication Flow

1. **Sign-in**: `/auth/signin` with credentials
2. **NextAuth**: JWT-based sessions (30-day duration)
3. **Session**: Available via `useSession()` hook or `getServerSession()`

### Registration

- `POST /api/auth/register` - Admin-only user registration
- Role creation validated against `RoleCreationPolicy`
- Tenant scope enforced for non-superadmin users

---

## Bootstrap & Dependency Injection

### Container

The `Container` class manages all application dependencies:

```typescript
import { Container, ServiceKeys } from '@/shared/bootstrap';

// Resolve a service
const userRepository = await initializeAppAndGetService(ServiceKeys.USER_REPOSITORY);
```

### Service Keys

Key services available:

```typescript
// User Management
ServiceKeys.USER_REPOSITORY
ServiceKeys.CREATE_USER_USE_CASE
ServiceKeys.GET_USER_BY_EMAIL_USE_CASE

// Organization Management
ServiceKeys.ORGANIZATION_REPOSITORY
ServiceKeys.COACHING_CENTER_REPOSITORY
ServiceKeys.CREATE_ORGANIZATION_USE_CASE
ServiceKeys.CREATE_COACHING_CENTER_USE_CASE

// Academic Management
ServiceKeys.ACADEMIC_YEAR_REPOSITORY
ServiceKeys.CLASS_MASTER_REPOSITORY
ServiceKeys.SECTION_REPOSITORY
ServiceKeys.CREATE_ACADEMIC_YEAR_USE_CASE

// Fee Management
ServiceKeys.FEE_TYPE_REPOSITORY
ServiceKeys.FEE_PLAN_REPOSITORY
ServiceKeys.PAYMENT_REPOSITORY
ServiceKeys.CREATE_FEE_TYPE_USE_CASE
ServiceKeys.CREATE_PAYMENT_USE_CASE

// Coaching Management
ServiceKeys.COACHING_PROGRAM_REPOSITORY
ServiceKeys.COACHING_BATCH_REPOSITORY
ServiceKeys.COACHING_ENROLLMENT_REPOSITORY
ServiceKeys.COACHING_SESSION_REPOSITORY
ServiceKeys.COACHING_ATTENDANCE_REPOSITORY
```

### Usage in API Routes

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { initializeAppAndGetService, ServiceKeys } from '@/shared/bootstrap/init';

export async function GET(request: NextRequest) {
  const userRepository = await initializeAppAndGetService(ServiceKeys.USER_REPOSITORY);
  const users = await userRepository.findAll();
  return NextResponse.json(users);
}
```

---

## API Reference

### Authentication APIs

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/[...nextauth]` | NextAuth handler |
| POST | `/api/auth/register` | Register user (admin-only) |
| GET | `/api/auth/superadmin-check` | Check if superadmin exists |
| POST | `/api/auth/superadmin-register` | Create first superadmin |
| GET | `/api/users/me` | Current user profile |

### Organization APIs

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET/POST | `/api/admin/organizations` | List/Create organizations |
| GET/POST | `/api/admin/coaching-centers` | List/Create coaching centers |

### User Management APIs

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET/POST | `/api/admin/users` | List/Create users |
| GET | `/api/users/me` | Current user profile |

### Academic Management APIs

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET/POST | `/api/admin/academic-years` | List/Create academic years |
| GET/POST | `/api/admin/class-masters` | List/Create class masters |
| GET/POST | `/api/admin/sections` | List/Create sections |
| GET/POST | `/api/admin/subject-allocations` | List/Create subject allocations |
| GET/POST | `/api/admin/timetable` | Get/Create timetable |

### Fee Management APIs

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET/POST | `/api/admin/fee-types` | List/Create fee types |
| GET/POST | `/api/admin/fee-plans` | List/Create fee plans |
| POST | `/api/admin/fee-plan-assignments` | Assign fee plan to class/section |
| GET/POST | `/api/admin/student-fee-ledger` | List/Create ledger entries |
| POST | `/api/admin/payments` | Record payment |
| POST | `/api/admin/credit-notes` | Issue credit note |
| POST | `/api/admin/generate-recurring-fees` | Generate recurring fees |

### Coaching Management APIs

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET/POST | `/api/admin/coaching-programs` | List/Create programs |
| GET/POST | `/api/admin/coaching-batches` | List/Create batches |
| GET/POST | `/api/admin/coaching-enrollments` | List/Create enrollments |
| GET/POST | `/api/admin/coaching-sessions` | List/Create sessions |
| GET/POST | `/api/admin/coaching-attendance` | List/Mark attendance |

### Analytics APIs

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/analytics/academic` | Academic analytics |
| GET | `/api/analytics/fees` | Fee analytics |
| GET | `/api/analytics/users` | User analytics |
| GET | `/api/admin/dashboard/overview` | Dashboard overview |

---

## Operations Guide

### Tenant Model

All core data is scoped by:
1. `organizationId`
2. `coachingCenterId`
3. `academicYearId` (for academic/fees/coaching operations)

### Onboarding Flow

1. **Platform Bootstrap** (one-time)
   - Visit `/auth/superadmin-bootstrap`
   - Create first superadmin

2. **Tenant Setup**
   - Create organization
   - Create coaching center
   - Create admin users

3. **Operational Setup**
   - Academic setup (year, classes, sections)
   - Fee setup (types, plans)
   - Coaching setup (programs, batches)

4. **User Onboarding**
   - Create students and parents
   - Create enrollments
   - Assign fee plans

### Daily Operations

#### For Admins

1. **Start of Day**
   - Open dashboard
   - Confirm tenant selection
   - Check quick stats

2. **Core Tasks**
   - Academic changes: `/admin-roles/manage-setting/academic`
   - Enrollment updates: `/admin-roles/manage-setting/enrollments`
   - Fee operations: `/admin-roles/manage-setting/fees`
   - Coaching delivery: `/admin-roles/manage-setting/coaching`
   - User management: `/admin-roles/users`

3. **End of Day**
   - Verify attendance captured
   - Reconcile payments
   - Review admissions

#### For Teachers

1. Open `/teacher/dashboard`
2. Review today's sessions
3. Conduct sessions
4. Mark attendance

#### For Students & Parents

- Student: `/student/dashboard` - schedule, dues, payment history
- Parent: `/parent/dashboard` - children overview, notices, dues

### Academic vs Coaching Model

| Layer | Purpose | Key Concepts |
|-------|---------|--------------|
| Academic | Institutional grouping, timetable | Class, Section, Roll Number |
| Coaching | Course delivery, operations | Program, Batch, Session, Attendance |

**Recommended Usage:**
- Keep Academic layer minimal and stable
- Run daily teaching through Coaching layer (Program/Batch)
- Students can have one academic enrollment and multiple coaching enrollments

---

## Troubleshooting

### MongoDB Connection Issues

**Error**: `MongoNetworkError: connect ECONNREFUSED`

**Solutions**:
1. Start MongoDB: `mongod`
2. Check connection string in `.env.local`
3. For Atlas: Verify IP whitelist

### NextAuth Issues

**Error**: `NEXTAUTH_SECRET not set`

**Solution**:
```bash
openssl rand -hex 32
# Add to .env.local
NEXTAUTH_SECRET=<generated-secret>
```

### TypeScript Errors

**Error**: `TS1205: Re-exporting a type when the '--isolatedModules' flag is set`

**Solution**: Use `export type` for interface/type exports:
```typescript
export type { UserRepository } from './UserRepository';
```

### Bootstrap Issues

**Error**: `ServiceKey 'X_USE_CASE' not registered`

**Solution**:
1. Check `src/shared/bootstrap/AppBootstrap.ts`
2. Verify service is registered in `registerUseCases()`
3. Use correct `ServiceKeys` enum value

### Port Already in Use

**Error**: `Port 3000 already in use`

**Solution**:
```bash
# Use different port
npm run dev -- -p 3001

# Or kill existing process
lsof -i :3000
kill -9 <PID>
```

---

## Additional Resources

- [Operations Handbook](./operations/coaching-operations-handbook.md) - Detailed operational procedures
- [Architecture Diagrams](./architecture-diagrams.md) - Visual system architecture
- [DDD Patterns Guide](./ddd-patterns-visual-guide.md) - DDD concepts explained
- [GitHub Repository](https://github.com/MJ150296/coaching-saas) - Source code