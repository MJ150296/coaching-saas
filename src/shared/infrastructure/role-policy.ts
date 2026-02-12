import { UserRole } from '@/domains/user-management/domain/entities/User';

const ROLE_CREATION_MAP: Record<UserRole, UserRole[]> = {
  [UserRole.SUPER_ADMIN]: [
    UserRole.ORGANIZATION_ADMIN,
    UserRole.SCHOOL_ADMIN,
    UserRole.ADMIN,
    UserRole.TEACHER,
    UserRole.STAFF,
    UserRole.STUDENT,
    UserRole.PARENT,
  ],
  [UserRole.ORGANIZATION_ADMIN]: [
    UserRole.SCHOOL_ADMIN,
    UserRole.ADMIN,
    UserRole.TEACHER,
    UserRole.STAFF,
    UserRole.STUDENT,
    UserRole.PARENT,
  ],
  [UserRole.SCHOOL_ADMIN]: [
    UserRole.ADMIN,
    UserRole.TEACHER,
    UserRole.STAFF,
    UserRole.STUDENT,
    UserRole.PARENT,
  ],
  [UserRole.ADMIN]: [
    UserRole.TEACHER,
    UserRole.STAFF,
    UserRole.STUDENT,
    UserRole.PARENT,
  ],
  [UserRole.TEACHER]: [],
  [UserRole.STAFF]: [],
  [UserRole.STUDENT]: [],
  [UserRole.PARENT]: [],
};

export function canCreateRole(actorRole: UserRole, targetRole: UserRole): boolean {
  const allowed = ROLE_CREATION_MAP[actorRole] || [];
  return allowed.includes(targetRole);
}
