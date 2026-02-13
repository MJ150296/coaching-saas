import { UserRole } from '@/domains/user-management/domain/entities/User';

export enum Permission {
  CREATE_USER = 'CREATE_USER',
  CREATE_ORGANIZATION = 'CREATE_ORGANIZATION',
  CREATE_SCHOOL = 'CREATE_SCHOOL',
  CREATE_ACADEMIC_YEAR = 'CREATE_ACADEMIC_YEAR',
  CREATE_CLASS_MASTER = 'CREATE_CLASS_MASTER',
  CREATE_SECTION = 'CREATE_SECTION',
  CREATE_SUBJECT_ALLOCATION = 'CREATE_SUBJECT_ALLOCATION',
  CREATE_FEE_TYPE = 'CREATE_FEE_TYPE',
  CREATE_FEE_PLAN = 'CREATE_FEE_PLAN',
  ASSIGN_FEE_PLAN = 'ASSIGN_FEE_PLAN',
  CREATE_STUDENT_FEE_LEDGER = 'CREATE_STUDENT_FEE_LEDGER',
  CREATE_PAYMENT = 'CREATE_PAYMENT',
  CREATE_CREDIT_NOTE = 'CREATE_CREDIT_NOTE',
  MANAGE_STUDENT_ENROLLMENT = 'MANAGE_STUDENT_ENROLLMENT',
}

const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  [UserRole.SUPER_ADMIN]: Object.values(Permission),
  [UserRole.ORGANIZATION_ADMIN]: [
    Permission.CREATE_USER,
    Permission.CREATE_SCHOOL,
    Permission.CREATE_ACADEMIC_YEAR,
    Permission.CREATE_CLASS_MASTER,
    Permission.CREATE_SECTION,
    Permission.CREATE_SUBJECT_ALLOCATION,
    Permission.CREATE_FEE_TYPE,
    Permission.CREATE_FEE_PLAN,
    Permission.ASSIGN_FEE_PLAN,
    Permission.CREATE_STUDENT_FEE_LEDGER,
    Permission.CREATE_PAYMENT,
    Permission.CREATE_CREDIT_NOTE,
    Permission.MANAGE_STUDENT_ENROLLMENT,
  ],
  [UserRole.SCHOOL_ADMIN]: [
    Permission.CREATE_USER,
    Permission.CREATE_ACADEMIC_YEAR,
    Permission.CREATE_CLASS_MASTER,
    Permission.CREATE_SECTION,
    Permission.CREATE_SUBJECT_ALLOCATION,
    Permission.CREATE_FEE_TYPE,
    Permission.CREATE_FEE_PLAN,
    Permission.ASSIGN_FEE_PLAN,
    Permission.CREATE_STUDENT_FEE_LEDGER,
    Permission.CREATE_PAYMENT,
    Permission.CREATE_CREDIT_NOTE,
    Permission.MANAGE_STUDENT_ENROLLMENT,
  ],
  [UserRole.ADMIN]: [
    Permission.CREATE_USER,
    Permission.CREATE_ACADEMIC_YEAR,
    Permission.CREATE_CLASS_MASTER,
    Permission.CREATE_SECTION,
    Permission.CREATE_SUBJECT_ALLOCATION,
    Permission.CREATE_FEE_TYPE,
    Permission.CREATE_FEE_PLAN,
    Permission.ASSIGN_FEE_PLAN,
    Permission.CREATE_STUDENT_FEE_LEDGER,
    Permission.CREATE_PAYMENT,
    Permission.MANAGE_STUDENT_ENROLLMENT,
  ],
  [UserRole.TEACHER]: [],
  [UserRole.STAFF]: [],
  [UserRole.STUDENT]: [],
  [UserRole.PARENT]: [],
};

export function hasPermission(role: UserRole, permission: Permission): boolean {
  const perms = ROLE_PERMISSIONS[role] || [];
  return perms.includes(permission);
}
