# Coaching Management System - Enterprise DDD Application

A modern, enterprise-grade coaching management application built with Next.js App Router, TypeScript, and Domain-Driven Design (DDD).

## Architecture

- **DDD Architecture**: domain, application, and infrastructure layers
- **Dependency Injection**: bootstrap system and service container
- **Authentication**: NextAuth.js credentials provider with JWT sessions
- **Database**: MongoDB with Mongoose ODM

See `docs/architecture.md` and `docs/bootstrap.md` for detailed guides.

## Quick Start

### Prerequisites

- Node.js 18+
- MongoDB (local or Atlas)

### 1. Environment Setup

```bash
cp .env.example .env.local
```

Update `.env.local`:

```env
MONGODB_URI=mongodb://localhost:27017/coaching-saas
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=generate-a-secure-secret-key
```

Generate `NEXTAUTH_SECRET`:

```bash
npx auth secret
```

### 2. Run Development Server

```bash
npm run dev
```

Visit `http://localhost:3000`.

## Authentication

- **Sign-in**: `/auth/signin`
- **Register**: `/auth/register`
- **Bootstrap superadmin**: `/auth/superadmin-bootstrap` (first-time setup)
- **Current user**: `GET /api/users/me`

## API Endpoints

- `GET/POST /api/auth/[...nextauth]` - NextAuth handler
- `POST /api/auth/register` - Register user
- `GET /api/auth/superadmin-check` - Check if superadmin exists
- `POST /api/auth/superadmin-register` - Create first superadmin
- `GET /api/users/me` - Current user profile
- `POST /api/admin/organizations` - Create organization
- `POST /api/admin/coaching-centers` - Create coaching center
- `GET /api/admin/users` - List users
- `POST /api/bootstrap/init` - Initialize DI/bootstrap
- `POST /api/dev/seed-test-user` - Seed a test user

## App Routes

- `/` - Home, role-based redirect
- `/auth/signin` - Sign in
- `/auth/register` - Register
- `/auth/superadmin-bootstrap` - First-time superadmin setup
- `/admin-roles/superadmin` - Superadmin dashboard
- `/admin-roles/organizations` - Org admin dashboard
- `/admin-roles/organizations/create` - Create organization
- `/admin-roles/coaching-centers` - Coaching admin dashboard
- `/admin-roles/coaching-centers/create` - Create coaching center
- `/admin-roles/users` - User management view
- `/admin-roles/admin` - Admin dashboard
- `/teacher/dashboard`
- `/student/dashboard`
- `/staff/dashboard`
- `/parent/dashboard`

## Project Structure (High-Level)

```
src/
├── app/                         # Next.js App Router (routes + API)
├── domains/
│   ├── user-management/         # User domain
│   └── organization-management/ # Organization & school domain
├── shared/                      # DDD base, DI, infra utilities
└── types/                       # NextAuth type extensions
```

See `docs/project-structure.md` for the full tree.

## Development

```bash
npm run dev      # Start dev server
npm run build    # Build for production
npm start        # Start production server
npm run lint     # Run ESLint
```

## Learn More

- `docs/architecture.md` - DDD architecture guide
- `docs/bootstrap.md` - DI/bootstrap system
- `docs/project-structure.md` - File map & navigation
- `docs/superadmin-bootstrap.md` - First-time bootstrap flow
