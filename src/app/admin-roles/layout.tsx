/**
 * Admin Roles Layout
 * This layout provides the RoleBasedAppShell for all admin-roles pages
 */

import { UserRole } from "@/domains/user-management/domain/entities/User";
import { requireRole } from "@/shared/lib/requireRole";
import { RoleBasedAppShell } from "@/shared/components/navigation/RoleBasedAppShell";

export default async function AdminRolesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireRole([
    UserRole.SUPER_ADMIN,
    UserRole.ORGANIZATION_ADMIN,
    UserRole.COACHING_ADMIN,
    UserRole.ADMIN,
  ]);

  return (
    <RoleBasedAppShell role={(session.user as { role: UserRole }).role}>
      {children}
    </RoleBasedAppShell>
  );
}