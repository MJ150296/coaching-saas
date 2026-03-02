import { UserRole } from '@/domains/user-management/domain/entities/User';
import { requireRole } from '@/shared/lib/requireRole';
import { RoleBasedAppShell } from '@/shared/components/navigation/RoleBasedAppShell';

export default async function AnalyticsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireRole([
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN,
    UserRole.ORGANIZATION_ADMIN,
    UserRole.COACHING_ADMIN,
    // add other roles if necessary, e.g. UserRole.ACADEMIC_ADMIN
  ]);

  return (
    <RoleBasedAppShell role={(session.user as { role: UserRole }).role}>
      {children}
    </RoleBasedAppShell>
  );
}
