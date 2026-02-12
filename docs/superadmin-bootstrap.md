# Superadmin Bootstrap Guide

## Flow Summary

1. User visits `/`
2. App calls `GET /api/auth/superadmin-check`
3. If no superadmin exists, redirect to `/auth/superadmin-bootstrap`
4. User submits bootstrap form
5. Backend calls `POST /api/auth/superadmin-register`
6. User is auto-signed in and redirected to `/admin-roles/superadmin`

## Files

- `src/app/auth/superadmin-bootstrap/page.tsx`
- `src/app/api/auth/superadmin-check/route.ts`
- `src/app/api/auth/superadmin-register/route.ts`
- `src/app/admin-roles/superadmin/page.tsx`
- `src/app/page.tsx`

## API Contracts

### `GET /api/auth/superadmin-check`

```json
{ "superadminExists": boolean, "requiresBootstrap": boolean }
```

### `POST /api/auth/superadmin-register`

```json
{
  "firstName": "string",
  "lastName": "string",
  "email": "string",
  "password": "string",
  "confirmPassword": "string",
  "phone": "string (optional)"
}
```

## Testing

```bash
curl http://localhost:3000/api/auth/superadmin-check
```
