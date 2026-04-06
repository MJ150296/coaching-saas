/**
 * Admin Users Layout
 * SUPER_ADMIN + ORGANIZATION_ADMIN + ADMIN + COACHING_ADMIN
 */

import { UserRole } from "@/domains/user-management/domain/entities/User";
import { requireRole } from "@/shared/lib/requireRole";
import { RoleBasedAppShell } from "@/shared/components/navigation/RoleBasedAppShell";

export default async function AdminUsersLayout({
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
