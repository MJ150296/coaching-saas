# Coaching Center Refactoring Plan

## Overview
This plan details the refactoring to remove school-specific entities and make the app coaching-focused.

## Changes Summary

### 1. Entities to REMOVE
- `ClassMaster` - No longer needed (school grade structure)
- `Section` - Not needed for coaching centers
- `SubjectAllocation` - Overkill; programs define subjects

### 2. Entities to MODIFY
- `User` (Student) - Add `schoolGrade?: string` field
- `FeePlanAssignment` - Change from `classMasterId/sectionId` to `programId/batchId`

### 3. New Fee Structure
- Fee plans assigned by: **Program + Batch** (not Class + Section)
- This aligns with coaching center operations

---

## Detailed File Changes

### Phase 1: Domain Entities

#### 1.1 User Entity (`src/domains/user-management/domain/entities/User.ts`)
**ADD:**
- `schoolGrade?: string` property to `UserProps`
- `getSchoolGrade()` method

#### 1.2 FeePlanAssignment Entity (`src/domains/fee-management/domain/entities/FeePlanAssignment.ts`)
**REMOVE:**
- `classMasterId` property
- `sectionId` property
- `getClassMasterId()` method
- `getSectionId()` method

**ADD:**
- `programId: string` property
- `batchId?: string` property (optional - batch-specific fees)
- `getProgramId()` method
- `getBatchId()` method

#### 1.3 DELETE Entity Files
- `src/domains/academic-management/domain/entities/ClassMaster.ts`
- `src/domains/academic-management/domain/entities/Section.ts`
- `src/domains/academic-management/domain/entities/SubjectAllocation.ts`

---

### Phase 2: Infrastructure (MongoDB Schemas)

#### 2.1 User Schema (`src/domains/user-management/infrastructure/persistence/UserSchema.ts`)
**ADD:**
- `schoolGrade?: string` field

#### 2.2 Fee Schema (`src/domains/fee-management/infrastructure/persistence/FeeSchema.ts`)
**MODIFY `FeePlanAssignment` schema:**
- Remove: `classMasterId`, `sectionId`
- Add: `programId`, `batchId?`

#### 2.3 Academic Schema (`src/domains/academic-management/infrastructure/persistence/AcademicSchema.ts`)
**REMOVE:**
- `ClassMasterModel` and `classMasterSchema`
- `SectionModel` and `sectionSchema`
- `SubjectAllocationModel` and `subjectAllocationSchema`

**KEEP:**
- `AcademicYearModel`
- `TimetableEntryModel` (if still needed)
- `StudentEnrollmentModel` (if still needed)

---

### Phase 3: API Routes

#### 3.1 DELETE Routes
- `src/app/api/admin/class-masters/route.ts`
- `src/app/api/admin/sections/route.ts`
- `src/app/api/admin/subject-allocations/route.ts`

#### 3.2 MODIFY Routes

**`src/app/api/admin/fee-plan-assignments/route.ts`:**
- Change request body from `classMasterId/sectionId` to `programId/batchId`
- Update queries accordingly

**`src/app/api/admin/academic/options/route.ts`:**
- Remove `classMasters` from response
- Remove `sections` from response
- Keep `academicYears`, `students`, `feeTypes`, `feePlans`
- Add `programs` and `batches` to response

**`src/app/api/admin/users/route.ts` (POST for student creation):**
- Add `schoolGrade` field support

---

### Phase 4: UI Components

#### 4.1 DELETE Onboarding Steps
- Remove `AcademicSetupStep` class/section portions
- Remove `TeacherClassTeacherStep` section creation

#### 4.2 MODIFY Onboarding (`src/app/admin-roles/admin/onboarding/`)

**`OnboardingClient.tsx`:**
- Remove `classMasterId`, `sectionId` state
- Remove `classForm`, `sectionForm` state
- Remove `classMasters`, `sections` data loading
- Update step completion logic

**`lib/onboardingData.ts`:**
- Remove `CLASS_LEVEL_OPTIONS`
- Remove `inferClassLevelFromName` function
- Remove `ClassOption` type
- Remove `fetchClassMasters` function

**`components/OnboardingSteps.tsx`:**
- Remove or simplify `AcademicSetupStep`
- Remove section-related fields from `TeacherClassTeacherStep`

#### 4.3 MODIFY Fee Management (`src/app/admin-roles/manage-setting/fees/FeesManagementClient.tsx`)
- Change fee plan assignment from class/section to program/batch
- Remove class master and section selectors
- Add program and batch selectors

#### 4.4 MODIFY Academic Management (`src/app/admin-roles/manage-setting/academic/AcademicManagementClient.tsx`)
- Remove class master creation
- Remove section creation
- Remove subject allocation
- Keep academic year management
- Keep timetable management (if needed)

---

### Phase 5: Shared Libraries

#### 5.1 Dashboard Libraries
Update any references to `classMasterId` or `sectionId`:
- `src/shared/lib/student-dashboard.server.ts`
- `src/shared/lib/teacher-dashboard.server.ts`
- `src/shared/lib/coaching-admin-dashboard.server.ts`

#### 5.2 Bootstrap (`src/shared/bootstrap/AppBootstrap.ts`)
- Remove registration of deleted repositories/use cases

---

### Phase 6: Type Definitions

#### 6.1 NextAuth Types (`src/types/next-auth.d.ts`)
- Add `schoolGrade?: string` to User type if needed

---

## Implementation Order

1. **Domain Entities** (User, FeePlanAssignment)
2. **Delete Old Entities** (ClassMaster, Section, SubjectAllocation)
3. **MongoDB Schemas** (Update UserSchema, FeeSchema, AcademicSchema)
4. **Delete API Routes** (class-masters, sections, subject-allocations)
5. **Update API Routes** (fee-plan-assignments, academic/options, users)
6. **Update UI Components** (Onboarding, Fee Management, Academic Management)
7. **Update Shared Libraries** (Dashboard servers)
8. **Update Bootstrap** (Remove old registrations)
9. **Test & Verify**

---

## Fee Plan Assignment - New Structure

### Before:
```typescript
interface FeePlanAssignmentProps {
  organizationId: string;
  coachingCenterId: string;
  academicYearId: string;
  feePlanId: string;
  classMasterId: string;  // REMOVE
  sectionId?: string;     // REMOVE
}
```

### After:
```typescript
interface FeePlanAssignmentProps {
  organizationId: string;
  coachingCenterId: string;
  academicYearId: string;
  feePlanId: string;
  programId: string;      // NEW - Required
  batchId?: string;       // NEW - Optional (batch-specific)
}
```

---

## Student Registration - New Field

### Before:
- Student created with basic info
- Class reference via ClassMaster

### After:
```typescript
interface CreateUserRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: UserRole;
  organizationId: string;
  coachingCenterId: string;
  schoolGrade?: string;  // NEW - Simple text field
}
```

---

## Testing Checklist

- [ ] Student registration with schoolGrade
- [ ] Fee plan assignment by program
- [ ] Fee plan assignment by program + batch
- [ ] Onboarding flow works without class/section
- [ ] Dashboard queries work correctly
- [ ] No TypeScript errors
- [ ] No runtime errors

---

## Files to DELETE

1. `src/domains/academic-management/domain/entities/ClassMaster.ts`
2. `src/domains/academic-management/domain/entities/Section.ts`
3. `src/domains/academic-management/domain/entities/SubjectAllocation.ts`
4. `src/app/api/admin/class-masters/route.ts`
5. `src/app/api/admin/sections/route.ts`
6. `src/app/api/admin/subject-allocations/route.ts`
7. `src/app/admin-roles/pages/classes/page.tsx` (class management page no longer needed)

---

## Files to MODIFY

### Domain Layer:
1. `src/domains/user-management/domain/entities/User.ts` - Add `schoolGrade?: string`
2. `src/domains/fee-management/domain/entities/FeePlanAssignment.ts` - Change to programId/batchId
3. `src/domains/academic-management/domain/repositories/index.ts` - Remove ClassMaster/Section/SubjectAllocation repository types

### Application Layer (Use Cases):
4. `src/domains/academic-management/application/use-cases/CreateClassMasterUseCase.ts` - DELETE
5. `src/domains/academic-management/application/use-cases/CreateSectionUseCase.ts` - DELETE
6. `src/domains/academic-management/application/use-cases/CreateSubjectAllocationUseCase.ts` - DELETE
7. `src/domains/academic-management/application/use-cases/index.ts` - Remove exports
8. `src/domains/fee-management/application/use-cases/AssignFeePlanUseCase.ts` - Update to use programId/batchId

### Infrastructure Layer:
9. `src/domains/user-management/infrastructure/persistence/UserSchema.ts` - Add `schoolGrade?: string`
10. `src/domains/fee-management/infrastructure/persistence/FeeSchema.ts` - Update FeePlanAssignment schema
11. `src/domains/academic-management/infrastructure/persistence/AcademicSchema.ts` - Remove ClassMaster/Section/SubjectAllocation models
12. `src/domains/academic-management/infrastructure/persistence/MongoAcademicRepository.ts` - Remove MongoClassMasterRepository, MongoSectionRepository, MongoSubjectAllocationRepository
13. `src/domains/fee-management/infrastructure/persistence/MongoFeeRepository.ts` - Update FeePlanAssignment mapping

### API Layer:
14. `src/app/api/admin/fee-plan-assignments/route.ts` - Update to use programId/batchId
15. `src/app/api/admin/academic/options/route.ts` - Remove classMasters/sections, add programs/batches
16. `src/app/api/admin/users/route.ts` - Add schoolGrade support for student creation
17. `src/app/api/admin/enrollments/route.ts` - Update to use programId/batchId instead of classMasterId/sectionId
18. `src/app/api/admin/timetable/route.ts` - Update to use programId/batchId instead of classMasterId/sectionId

### UI Layer:
19. `src/app/admin-roles/admin/onboarding/OnboardingClient.tsx` - Remove classMasterId/sectionId state and forms
20. `src/app/admin-roles/admin/onboarding/lib/onboardingData.ts` - Remove CLASS_LEVEL_OPTIONS, inferClassLevelFromName, ClassOption, fetchClassMasters
21. `src/app/admin-roles/admin/onboarding/components/OnboardingSteps.tsx` - Remove AcademicSetupStep class/section, TeacherClassTeacherStep section
22. `src/app/admin-roles/manage-setting/fees/FeesManagementClient.tsx` - Update fee plan assignment to program/batch
23. `src/app/admin-roles/manage-setting/academic/AcademicManagementClient.tsx` - Remove class master/section/subject allocation UI
24. `src/app/admin-roles/manage-setting/enrollments/EnrollmentsManagementClient.tsx` - Update to use programId/batchId
25. `src/app/admin-roles/pages/classes/page.tsx` - DELETE (class management page no longer needed)

### Shared Layer:
26. `src/shared/bootstrap/AppBootstrap.ts` - Remove ClassMaster/Section/SubjectAllocation registrations
27. `src/shared/lib/student-dashboard.server.ts` - Remove ClassMaster/Section references
28. `src/shared/lib/teacher-dashboard.server.ts` - Remove ClassMaster/Section references
29. `src/shared/lib/coaching-admin-dashboard.server.ts` - Remove ClassMaster/Section references
30. `src/shared/lib/parent-dashboard.server.ts` - Remove ClassMaster/Section references
31. `src/shared/lib/enterprise-analytics.server.ts` - Remove ClassMaster/Section references

---

## Estimated Impact

- **Files to delete:** 7 (6 original + classes page)
- **Files to modify:** 31 (updated from ~18)
- **New files:** 0 (modifications only)
- **Breaking changes:** Yes (database schema changes)

## Database Migration Required

After code changes, existing data needs migration:
1. FeePlanAssignment documents: Add `programId`, remove `classMasterId/sectionId`
2. User documents (students): Add `schoolGrade` field
3. StudentEnrollment documents: Update to use programId/batchId
4. TimetableEntry documents: Update to use programId/batchId
5. Drop ClassMaster, Section, SubjectAllocation collections
6. Drop CreateClassMasterUseCase, CreateSectionUseCase, CreateSubjectAllocationUseCase tables/collections
