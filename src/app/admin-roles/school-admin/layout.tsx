import { UserRole } from '@/domains/user-management/domain/entities/User';
import { RoleBasedAppShell } from '@/shared/components/navigation/RoleBasedAppShell';
import { requireRole } from '@/shared/lib/requireRole';

export default async function SchoolAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireRole([UserRole.SCHOOL_ADMIN, UserRole.SUPER_ADMIN]);

  return (
    <RoleBasedAppShell role={(session.user as { role: UserRole }).role}>
      {children}
    </RoleBasedAppShell>
  );
}
