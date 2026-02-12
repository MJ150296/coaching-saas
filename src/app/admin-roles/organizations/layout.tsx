/**
 * Admin Organizations Layout
 * Only SUPER_ADMIN and ORGANIZATION_ADMIN
 */

import { UserRole } from "@/domains/user-management/domain/entities/User";
import { requireRole } from "@/shared/lib/requireRole";
import { RoleBasedAppShell } from "@/shared/components/navigation/RoleBasedAppShell";

export default async function AdminOrganizationsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireRole([
    UserRole.SUPER_ADMIN,
    UserRole.ORGANIZATION_ADMIN,
  ]);

  return (
    <RoleBasedAppShell role={(session.user as { role: UserRole }).role}>
      {children}
    </RoleBasedAppShell>
  );
}
