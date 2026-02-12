# Project Structure & Navigation Guide

## Directory Map

```
school-saas/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── admin/
│   │   │   │   ├── organizations/route.ts
│   │   │   │   ├── schools/route.ts
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
│   │   │   │   └── users/route.ts
│   │   │   ├── auth/
│   │   │   │   ├── [...nextauth]/route.ts
│   │   │   │   ├── register/route.ts
│   │   │   │   ├── superadmin-check/route.ts
│   │   │   │   └── superadmin-register/route.ts
│   │   │   ├── bootstrap/init/route.ts
│   │   │   ├── dev/seed-test-user/route.ts
│   │   │   └── users/me/route.ts
│   │   ├── admin-roles/
│   │   │   ├── admin/page.tsx
│   │   │   ├── organizations/page.tsx
│   │   │   ├── organizations/create/page.tsx
│   │   │   ├── schools/page.tsx
│   │   │   ├── schools/create/page.tsx
│   │   │   ├── superadmin/page.tsx
│   │   │   └── users/page.tsx
│   │   ├── auth/
│   │   │   ├── signin/page.tsx
│   │   │   ├── register/page.tsx
│   │   │   └── superadmin-bootstrap/page.tsx
│   │   ├── parent/dashboard/page.tsx
│   │   ├── staff/dashboard/page.tsx
│   │   ├── student/dashboard/page.tsx
│   │   ├── teacher/dashboard/page.tsx
│   │   ├── layout.tsx
│   │   ├── providers.tsx
│   │   ├── globals.css
│   │   └── page.tsx
│   ├── domains/
│   │   ├── user-management/
│   │   │   ├── domain/
│   │   │   │   ├── entities/User.ts
│   │   │   │   ├── value-objects/index.ts
│   │   │   │   ├── domain-events/index.ts
│   │   │   │   └── repositories/UserRepository.ts
│   │   │   ├── application/
│   │   │   │   ├── dtos/index.ts
│   │   │   │   ├── mappers/UserMapper.ts
│   │   │   │   └── use-cases/
│   │   │   │       ├── CreateUserUseCase.ts
│   │   │   │       ├── GetUserByEmailUseCase.ts
│   │   │   │       ├── VerifyUserEmailUseCase.ts
│   │   │   │       └── index.ts
│   │   │   └── infrastructure/
│   │   │       ├── external-services/PasswordEncryption.ts
│   │   │       └── persistence/
│   │   │           ├── UserSchema.ts
│   │   │           ├── ParentStudentLinkSchema.ts
│   │   │           └── MongoUserRepository.ts
│   │   ├── organization-management/
│   │       ├── domain/
│   │       │   ├── entities/Organization.ts
│   │       │   ├── entities/School.ts
│   │       │   ├── value-objects/index.ts
│   │       │   └── repositories/index.ts
│   │       ├── application/
│   │       │   └── use-cases/
│   │       │       ├── CreateOrganizationUseCase.ts
│   │       │       ├── CreateSchoolUseCase.ts
│   │       │       └── index.ts
│   │       └── infrastructure/
│   │           └── persistence/
│   │               ├── OrganizationSchoolSchema.ts
│   │               ├── OrganizationSchoolRepository.ts
│   │               └── index.ts
│   │   ├── academic-management/
│   │   │   ├── domain/
│   │   │   │   ├── entities/AcademicYear.ts
│   │   │   │   ├── entities/ClassMaster.ts
│   │   │   │   ├── entities/Section.ts
│   │   │   │   ├── entities/SubjectAllocation.ts
│   │   │   │   └── repositories/index.ts
│   │   │   ├── application/
│   │   │   │   └── use-cases/
│   │   │   │       ├── CreateAcademicYearUseCase.ts
│   │   │   │       ├── CreateClassMasterUseCase.ts
│   │   │   │       ├── CreateSectionUseCase.ts
│   │   │   │       ├── CreateSubjectAllocationUseCase.ts
│   │   │   │       └── index.ts
│   │   │   └── infrastructure/
│   │   │       └── persistence/
│   │   │           ├── AcademicSchema.ts
│   │   │           └── MongoAcademicRepository.ts
│   │   └── fee-management/
│   │   │   ├── domain/
│   │   │   │   ├── entities/FeeType.ts
│   │   │   │   ├── entities/FeePlan.ts
│   │   │   │   ├── entities/FeePlanAssignment.ts
│   │   │   │   ├── entities/StudentFeeLedgerEntry.ts
│   │   │   │   ├── entities/Payment.ts
│   │   │   │   ├── entities/CreditNote.ts
│   │   │   │   └── repositories/index.ts
│   │   │   ├── application/
│   │   │   │   └── use-cases/
│   │   │   │       ├── CreateFeeTypeUseCase.ts
│   │   │   │       ├── CreateFeePlanUseCase.ts
│   │   │   │       ├── AssignFeePlanUseCase.ts
│   │   │   │       ├── CreateStudentFeeLedgerUseCase.ts
│   │   │   │       ├── CreatePaymentUseCase.ts
│   │   │   │       ├── CreateCreditNoteUseCase.ts
│   │   │   │       └── index.ts
│   │   │   └── infrastructure/
│   │   │       └── persistence/
│   │   │           ├── FeeSchema.ts
│   │   │           └── MongoFeeRepository.ts
│   ├── shared/
│   │   ├── bootstrap/
│   │   │   ├── AppBootstrap.ts
│   │   │   ├── Container.ts
│   │   │   ├── init.ts
│   │   │   └── index.ts
│   │   ├── domain/
│   │   │   ├── AggregateRoot.ts
│   │   │   ├── DomainEvent.ts
│   │   │   ├── Entity.ts
│   │   │   ├── Repository.ts
│   │   │   ├── Result.ts
│   │   │   ├── Specification.ts
│   │   │   ├── ValueObject.ts
│   │   │   └── index.ts
│   │   ├── infrastructure/
│   │   │   ├── auth.ts
│   │   │   ├── auth-utils.ts
│   │   │   ├── actor.ts
│   │   │   ├── admin-guards.ts
│   │   │   ├── audit-log.ts
│   │   │   ├── database.ts
│   │   │   ├── errors.ts
│   │   │   ├── rbac.ts
│   │   │   ├── role-policy.ts
│   │   │   ├── tenant.ts
│   │   │   └── logger.ts
│   │   └── lib/
│   │       ├── requireRole.ts
│   │       └── utils.ts
│   └── types/
│       └── next-auth.d.ts
├── public/
├── package.json
├── tsconfig.json
└── docs/*.md
```

## Navigation by Task

### Authentication

- `src/app/auth/signin/page.tsx`
- `src/app/auth/register/page.tsx`
- `src/app/auth/superadmin-bootstrap/page.tsx`
- `src/app/api/auth/[...nextauth]/route.ts`
- `src/shared/infrastructure/auth.ts`
- `src/shared/infrastructure/auth-utils.ts`

### User Domain

- `src/domains/user-management/domain/entities/User.ts`
- `src/domains/user-management/application/use-cases/CreateUserUseCase.ts`
- `src/domains/user-management/infrastructure/persistence/MongoUserRepository.ts`

### Organization & School Domain

- `src/domains/organization-management/domain/entities/Organization.ts`
- `src/domains/organization-management/domain/entities/School.ts`
- `src/domains/organization-management/application/use-cases/CreateOrganizationUseCase.ts`
- `src/domains/organization-management/application/use-cases/CreateSchoolUseCase.ts`

### Academic Management Domain

- `src/domains/academic-management/domain/entities/AcademicYear.ts`
- `src/domains/academic-management/domain/entities/ClassMaster.ts`
- `src/domains/academic-management/domain/entities/Section.ts`
- `src/domains/academic-management/domain/entities/SubjectAllocation.ts`
- `src/domains/academic-management/application/use-cases/CreateAcademicYearUseCase.ts`
- `src/domains/academic-management/application/use-cases/CreateClassMasterUseCase.ts`
- `src/domains/academic-management/application/use-cases/CreateSectionUseCase.ts`
- `src/domains/academic-management/application/use-cases/CreateSubjectAllocationUseCase.ts`

### Fee Management Domain

- `src/domains/fee-management/domain/entities/FeeType.ts`
- `src/domains/fee-management/domain/entities/FeePlan.ts`
- `src/domains/fee-management/domain/entities/FeePlanAssignment.ts`
- `src/domains/fee-management/domain/entities/StudentFeeLedgerEntry.ts`
- `src/domains/fee-management/domain/entities/Payment.ts`
- `src/domains/fee-management/domain/entities/CreditNote.ts`
- `src/domains/fee-management/application/use-cases/CreateFeeTypeUseCase.ts`
- `src/domains/fee-management/application/use-cases/CreateFeePlanUseCase.ts`
- `src/domains/fee-management/application/use-cases/AssignFeePlanUseCase.ts`
- `src/domains/fee-management/application/use-cases/CreateStudentFeeLedgerUseCase.ts`
- `src/domains/fee-management/application/use-cases/CreatePaymentUseCase.ts`
- `src/domains/fee-management/application/use-cases/CreateCreditNoteUseCase.ts`

### Admin Pages

- `src/app/admin-roles/superadmin/page.tsx`
- `src/app/admin-roles/organizations/page.tsx`
- `src/app/admin-roles/schools/page.tsx`
- `src/app/admin-roles/users/page.tsx`
- `src/app/admin-roles/admin/page.tsx`

### API Routes

- `src/app/api/admin/organizations/route.ts`
- `src/app/api/admin/schools/route.ts`
- `src/app/api/admin/academic-years/route.ts`
- `src/app/api/admin/class-masters/route.ts`
- `src/app/api/admin/sections/route.ts`
- `src/app/api/admin/subject-allocations/route.ts`
- `src/app/api/admin/fee-types/route.ts`
- `src/app/api/admin/fee-plans/route.ts`
- `src/app/api/admin/fee-plan-assignments/route.ts`
- `src/app/api/admin/student-fee-ledger/route.ts`
- `src/app/api/admin/payments/route.ts`
- `src/app/api/admin/credit-notes/route.ts`
- `src/app/api/admin/users/route.ts`
- `src/app/api/users/me/route.ts`
- `src/app/api/bootstrap/init/route.ts`

## Service Keys

Current service keys in `src/shared/bootstrap/AppBootstrap.ts`:

- `USER_REPOSITORY`
- `ORGANIZATION_REPOSITORY`
- `SCHOOL_REPOSITORY`
- `CREATE_USER_USE_CASE`
- `GET_USER_BY_EMAIL_USE_CASE`
- `VERIFY_USER_EMAIL_USE_CASE`
- `CREATE_ORGANIZATION_USE_CASE`
- `CREATE_SCHOOL_USE_CASE`
- `ACADEMIC_YEAR_REPOSITORY`
- `CLASS_MASTER_REPOSITORY`
- `SECTION_REPOSITORY`
- `SUBJECT_ALLOCATION_REPOSITORY`
- `FEE_TYPE_REPOSITORY`
- `FEE_PLAN_REPOSITORY`
- `FEE_PLAN_ASSIGNMENT_REPOSITORY`
- `STUDENT_FEE_LEDGER_REPOSITORY`
- `PAYMENT_REPOSITORY`
- `CREDIT_NOTE_REPOSITORY`
- `CREATE_ACADEMIC_YEAR_USE_CASE`
- `CREATE_CLASS_MASTER_USE_CASE`
- `CREATE_SECTION_USE_CASE`
- `CREATE_SUBJECT_ALLOCATION_USE_CASE`
- `CREATE_FEE_TYPE_USE_CASE`
- `CREATE_FEE_PLAN_USE_CASE`
- `ASSIGN_FEE_PLAN_USE_CASE`
- `CREATE_STUDENT_FEE_LEDGER_USE_CASE`
- `CREATE_PAYMENT_USE_CASE`
- `CREATE_CREDIT_NOTE_USE_CASE`
