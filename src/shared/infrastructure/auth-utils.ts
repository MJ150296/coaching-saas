/**
 * Authentication and Authorization Utilities
 */

import { Session } from "next-auth";
import { UserRole } from "@/domains/user-management/domain/entities/User";

/**
 * Get the user's role from the session
 */
export function getUserRole(session: Session | null): UserRole | null {
  if (!session?.user) return null;
  return session.user.role || null;
}

/**
 * Check if user has a specific role
 */
export function hasRole(session: Session | null, role: UserRole): boolean {
  return getUserRole(session) === role;
}

/**
 * Check if user has any of the specified roles
 */
export function hasAnyRole(
  session: Session | null,
  roles: UserRole[],
): boolean {
  const userRole = getUserRole(session);
  return userRole !== null && roles.includes(userRole);
}

/**
 * Check if user is a superadmin
 */
export function isSuperAdmin(session: Session | null): boolean {
  return hasRole(session, UserRole.SUPER_ADMIN);
}

/**
 * Check if user is an admin (superadmin, org admin, school admin or admin)
 */
export function isAdmin(session: Session | null): boolean {
  return hasAnyRole(session, [
    UserRole.SUPER_ADMIN,
    UserRole.ORGANIZATION_ADMIN,
    UserRole.SCHOOL_ADMIN,
    UserRole.ADMIN,
  ]);
}

/**
 * Get redirect path based on user role
 */
export function getRoleBasedRedirectPath(role: UserRole | null): string {
  if (!role) return "/auth/signin";

  switch (role) {
    case UserRole.SUPER_ADMIN:
      return "/admin-roles/superadmin";
    case UserRole.ORGANIZATION_ADMIN:
      return "/admin-roles/organization-admin";
    case UserRole.SCHOOL_ADMIN:
      return "/admin-roles/school-admin";
    case UserRole.ADMIN:
      return "/admin-roles/admin";
    case UserRole.TEACHER:
      return "/teacher/dashboard";
    case UserRole.STUDENT:
      return "/student/dashboard";
    case UserRole.PARENT:
      return "/parent/dashboard";
    case UserRole.STAFF:
      return "/staff/dashboard";
    default:
      return "/auth/signin";
  }
}

/**
 * Get role display name
 */
export function getRoleDisplayName(role: UserRole): string {
  const displayNames: Record<UserRole, string> = {
    [UserRole.SUPER_ADMIN]: "Super Administrator",
    [UserRole.ORGANIZATION_ADMIN]: "Organization Administrator",
    [UserRole.SCHOOL_ADMIN]: "School Administrator",
    [UserRole.ADMIN]: "Administrator",
    [UserRole.TEACHER]: "Teacher",
    [UserRole.STUDENT]: "Student",
    [UserRole.PARENT]: "Parent",
    [UserRole.STAFF]: "Staff",
  };
  return displayNames[role] || role;
}
