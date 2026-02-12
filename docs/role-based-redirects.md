# Role-Based Redirects

## Current Redirect Mapping

| Role | Path |
|------|------|
| SUPER_ADMIN | `/admin-roles/superadmin` |
| ORGANIZATION_ADMIN | `/admin-roles/organizations` |
| SCHOOL_ADMIN | `/admin-roles/schools` |
| ADMIN | `/admin-roles/admin` |
| TEACHER | `/teacher/dashboard` |
| STUDENT | `/student/dashboard` |
| PARENT | `/parent/dashboard` |
| STAFF | `/staff/dashboard` |

## Source of Truth

- `src/shared/infrastructure/auth-utils.ts` for `getRoleBasedRedirectPath`
- `src/app/page.tsx` for root routing behavior
