# Project Summary

## Status

The application compiles and runs with the current `src` structure, DI bootstrap, and authenticated flows.

## Implemented Domains

- User Management
- Organization Management
- Academic Management
- Fee Management

## Implemented Flows

- Credentials auth with JWT (NextAuth)
- Superadmin bootstrap
- Admin-only registration with role-creation policy
- RBAC permission checks and audit logs
- Multi-tenant enforcement (organizationId + schoolId)
- Parent auto-creation on student onboarding
- Role-based redirects
- Admin organization and school creation APIs
- Academic/class master APIs
- Fee structure, plan, ledger, and payment APIs

## Where to Start

- `README.md` for quick start
- `project-structure.md` for navigation
- `superadmin-bootstrap.md` for first-time setup
