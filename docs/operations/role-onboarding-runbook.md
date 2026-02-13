# Role Onboarding Runbook

This document is the execution checklist for setting up:
- Super Admin
- Organization and School
- Admin hierarchy
- Teacher + class teacher assignment
- Student + fee assignment
- Parent login handover

Use this in the exact order below.

## 0. Preconditions

- App is running (`npm run dev`)
- Database is connected
- `.env.local` has:
  - `MONGODB_URI`
  - `NEXTAUTH_URL`
  - `NEXTAUTH_SECRET`

---

## 1. Bootstrap Super Admin (first time only)

1. Open `/`
2. If no superadmin exists, app redirects to `/auth/superadmin-bootstrap`
3. Create superadmin account
4. Sign in at `/auth/signin`

Quick verification:
- `GET /api/auth/superadmin-check` should return `superadminExists: true`

---

## 2. Create Organization and School

### 2.1 Create Organization
Endpoint: `POST /api/admin/organizations`

Example payload:
```json
{
  "organizationName": "Acme Education Group",
  "address": {
    "street": "12 Main Street",
    "city": "Boston",
    "state": "MA",
    "zipCode": "02110",
    "country": "INDIA"
  }
}
```

Save:
- `organizationId` (from response)

### 2.2 Create School
Endpoint: `POST /api/admin/schools`

Example payload:
```json
{
  "organizationId": "org_123",
  "schoolName": "Acme Public School",
  "schoolCode": "ACME-PS-01",
  "address": {
    "street": "50 School Ave",
    "city": "Boston",
    "state": "MA",
    "zipCode": "02111",
    "country": "INDIA"
  }
}
```

Save:
- `schoolId` (from response)

---

## 3. Create Admin Accounts

Use `/admin-roles/users` page or `POST /api/admin/users`.

Create in this order:
1. `ORGANIZATION_ADMIN`
2. `SCHOOL_ADMIN`
3. `ADMIN` (optional but recommended)

Example payload:
```json
{
  "email": "schooladmin@acme.edu",
  "password": "StrongPass#123",
  "firstName": "School",
  "lastName": "Admin",
  "phone": "+15550001111",
  "role": "SCHOOL_ADMIN",
  "organizationId": "org_123",
  "schoolId": "school_123"
}
```

---

## 4. Academic Setup (required before class teacher mapping)

### 4.1 Create Academic Year
Endpoint: `POST /api/admin/academic-years`
```json
{
  "organizationId": "org_123",
  "schoolId": "school_123",
  "name": "2026-2027",
  "startDate": "2026-06-01",
  "endDate": "2027-05-31"
}
```
Save: `academicYearId`

### 4.2 Create Class Master
Endpoint: `POST /api/admin/class-masters`
```json
{
  "organizationId": "org_123",
  "schoolId": "school_123",
  "name": "Grade 8",
  "level": "MIDDLE"
}
```
Save: `classMasterId`

### 4.3 Create Section
Endpoint: `POST /api/admin/sections`
```json
{
  "organizationId": "org_123",
  "schoolId": "school_123",
  "classMasterId": "class_123",
  "name": "A",
  "capacity": 35,
  "roomNumber": "208",
  "shift": "MORNING"
}
```
Save: `sectionId`

---

## 5. Create Teacher and Assign Class Teacher

## 5.1 Create Teacher user
Endpoint: `POST /api/admin/users`
```json
{
  "email": "teacher.math@acme.edu",
  "password": "StrongPass#123",
  "firstName": "Rita",
  "lastName": "Thomas",
  "phone": "+15550002222",
  "role": "TEACHER",
  "organizationId": "org_123",
  "schoolId": "school_123"
}
```
Save: `teacherId`

## 5.2 Assign as class teacher
Create/update section using `classTeacherId`:
Endpoint: `POST /api/admin/sections`
```json
{
  "organizationId": "org_123",
  "schoolId": "school_123",
  "classMasterId": "class_123",
  "name": "A",
  "capacity": 35,
  "roomNumber": "208",
  "shift": "MORNING",
  "classTeacherId": "teacher_123"
}
```

Optional: subject allocation
Endpoint: `POST /api/admin/subject-allocations`
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

Note:
- Current system does not use a separate `CLASS_TEACHER` role.
- Class teacher is an assignment (`classTeacherId`), not a role enum.

---

## 6. Fees Setup and Student Fee Assignment

### 6.1 Create Fee Type
Endpoint: `POST /api/admin/fee-types`
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
Save: `feeTypeId`

### 6.2 Create Fee Plan
Endpoint: `POST /api/admin/fee-plans`
```json
{
  "organizationId": "org_123",
  "schoolId": "school_123",
  "academicYearId": "year_123",
  "name": "Grade 8 Standard Plan",
  "items": [
    {
      "feeTypeId": "feeType_1",
      "name": "Tuition",
      "amount": 3000,
      "frequency": "MONTHLY"
    }
  ]
}
```
Save: `feePlanId`

### 6.3 Assign fee plan to class/section
Endpoint: `POST /api/admin/fee-plan-assignments`
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

---

## 7. Create Student (Parent auto-created) and Assign Student Ledger

### 7.1 Create Student user
Endpoint: `POST /api/admin/users`

Important:
- In your current API, when role is `STUDENT`, `parent` block is mandatory.
- Parent account is auto-created and linked.

```json
{
  "email": "student.riya@acme.edu",
  "password": "StrongPass#123",
  "firstName": "Riya",
  "lastName": "Patel",
  "phone": "+15550003333",
  "role": "STUDENT",
  "organizationId": "org_123",
  "schoolId": "school_123",
  "parent": {
    "email": "parent.riya@acme.com",
    "password": "StrongPass#123",
    "firstName": "Neha",
    "lastName": "Patel",
    "phone": "+15550004444"
  }
}
```

Save:
- `studentId`
- Parent login credentials

### 7.2 Create student fee ledger
Endpoint: `POST /api/admin/student-fee-ledger`
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

---

## 8. Parent Login Handover

1. Share parent credentials created in student onboarding.
2. Parent logs in from `/auth/signin`.
3. Parent is redirected to `/parent/dashboard`.

Current parent dashboard route exists: `/parent/dashboard`.

---

## 9. Fillable Execution Checklist

- [ ] Superadmin bootstrap completed
- [ ] Organization created (`organizationId: __________`)
- [ ] School created (`schoolId: __________`)
- [ ] Organization admin created
- [ ] School admin created
- [ ] Admin created (optional)
- [ ] Academic year created (`academicYearId: __________`)
- [ ] Class master created (`classMasterId: __________`)
- [ ] Section created (`sectionId: __________`)
- [ ] Teacher created (`teacherId: __________`)
- [ ] Class teacher assigned to section
- [ ] Subject allocation created (optional)
- [ ] Fee type created (`feeTypeId: __________`)
- [ ] Fee plan created (`feePlanId: __________`)
- [ ] Fee plan assigned to class/section
- [ ] Student created (`studentId: __________`)
- [ ] Parent auto-created and linked
- [ ] Student ledger entry created
- [ ] Parent login validated

---

## 10. Notes for Operators

- For non-superadmin actors, tenant scope is enforced by `organizationId` + `schoolId`.
- Superadmin must supply tenant IDs for non-superadmin user creation.
- Keep an internal sheet mapping:
  - Organization → School → Class → Section
  - Teacher IDs
  - Student IDs
  - Fee Plan IDs

