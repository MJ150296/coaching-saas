# Quick Reference

## Commands

```bash
npm run dev
npm run build
npm run lint
```

## Key Routes

- `/` - Role-based redirect
- `/auth/signin`
- `/auth/register`
- `/auth/superadmin-bootstrap`
- `/admin-roles/superadmin`
- `/admin-roles/organizations`
- `/admin-roles/schools`
- `/admin-roles/users`
- `/admin-roles/admin`
- `/teacher/dashboard`
- `/student/dashboard`
- `/staff/dashboard`
- `/parent/dashboard`

## API Endpoints

- `GET/POST /api/auth/[...nextauth]`
- `POST /api/auth/register` (admin-only)
- `GET /api/auth/superadmin-check`
- `POST /api/auth/superadmin-register`
- `GET /api/users/me`
- `POST /api/admin/organizations`
- `POST /api/admin/schools`
- `POST /api/admin/academic-years`
- `POST /api/admin/class-masters`
- `POST /api/admin/sections`
- `POST /api/admin/subject-allocations`
- `POST /api/admin/fee-types`
- `POST /api/admin/fee-plans`
- `POST /api/admin/fee-plan-assignments`
- `POST /api/admin/student-fee-ledger`
- `POST /api/admin/payments`
- `POST /api/admin/credit-notes`
- `GET /api/admin/users`
- `POST /api/admin/users`
- `POST /api/bootstrap/init`
- `POST /api/dev/seed-test-user`

## Academic & Fee API Examples

### Create Academic Year
`POST /api/admin/academic-years`
```json
{
  "organizationId": "org_123",
  "schoolId": "school_123",
  "name": "2026-2027",
  "startDate": "2026-06-01",
  "endDate": "2027-05-31"
}
```

### Create Class Master
`POST /api/admin/class-masters`
```json
{
  "organizationId": "org_123",
  "schoolId": "school_123",
  "name": "Grade 1",
  "level": "PRIMARY"
}
```

### Create Section
`POST /api/admin/sections`
```json
{
  "organizationId": "org_123",
  "schoolId": "school_123",
  "classMasterId": "class_123",
  "name": "A",
  "capacity": 30,
  "roomNumber": "101",
  "shift": "MORNING",
  "classTeacherId": "teacher_123"
}
```

### Create Subject Allocation
`POST /api/admin/subject-allocations`
```json
{
  "organizationId": "org_123",
  "schoolId": "school_123",
  "academicYearId": "year_123",
  "classMasterId": "class_123",
  "sectionId": "section_123",
  "subjectName": "Mathematics",
  "teacherId": "teacher_123",
  "weeklyPeriods": 5
}
```

### Create Fee Type
`POST /api/admin/fee-types`
```json
{
  "organizationId": "org_123",
  "schoolId": "school_123",
  "name": "Tuition",
  "amount": 3000,
  "frequency": "MONTHLY",
  "isMandatory": true,
  "isTaxable": false
}
```

### Create Fee Plan
`POST /api/admin/fee-plans`
```json
{
  "organizationId": "org_123",
  "schoolId": "school_123",
  "academicYearId": "year_123",
  "name": "Grade 1 Standard",
  "items": [
    { "feeTypeId": "feeType_1", "name": "Tuition", "amount": 3000, "frequency": "MONTHLY" },
    { "feeTypeId": "feeType_2", "name": "Admission", "amount": 5000, "frequency": "ONE_TIME" }
  ]
}
```

### Assign Fee Plan
`POST /api/admin/fee-plan-assignments`
```json
{
  "organizationId": "org_123",
  "schoolId": "school_123",
  "academicYearId": "year_123",
  "feePlanId": "plan_123",
  "classMasterId": "class_123",
  "sectionId": "section_123"
}
```

### Create Student Fee Ledger Entry
`POST /api/admin/student-fee-ledger`
```json
{
  "organizationId": "org_123",
  "schoolId": "school_123",
  "academicYearId": "year_123",
  "studentId": "student_123",
  "feePlanId": "plan_123",
  "feeTypeId": "feeType_1",
  "amount": 3000,
  "dueDate": "2026-07-05"
}
```

### Record Payment
`POST /api/admin/payments`
```json
{
  "organizationId": "org_123",
  "schoolId": "school_123",
  "academicYearId": "year_123",
  "studentId": "student_123",
  "amount": 3000,
  "method": "UPI",
  "reference": "TXN_987",
  "paidAt": "2026-07-02T10:00:00Z"
}
```

### Issue Credit Note
`POST /api/admin/credit-notes`
```json
{
  "organizationId": "org_123",
  "schoolId": "school_123",
  "academicYearId": "year_123",
  "studentId": "student_123",
  "amount": 500,
  "reason": "Scholarship adjustment",
  "createdOn": "2026-07-03T09:00:00Z"
}
```

## Key Files

- `src/shared/infrastructure/auth.ts` - NextAuth config
- `src/shared/infrastructure/auth-utils.ts` - Role helpers and redirects
- `src/shared/bootstrap/AppBootstrap.ts` - Service registration
- `src/domains/user-management/infrastructure/persistence/MongoUserRepository.ts`
- `src/domains/organization-management/infrastructure/persistence/OrganizationSchoolRepository.ts`
- `src/domains/academic-management/infrastructure/persistence/MongoAcademicRepository.ts`
- `src/domains/fee-management/infrastructure/persistence/MongoFeeRepository.ts`
