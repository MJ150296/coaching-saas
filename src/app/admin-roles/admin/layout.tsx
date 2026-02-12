import { UserRole } from '@/domains/user-management/domain/entities/User';
import { requireRole } from '@/shared/lib/requireRole';
import { RoleBasedAppShell } from '@/shared/components/navigation/RoleBasedAppShell';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await requireRole([
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN,
    UserRole.ORGANIZATION_ADMIN,
    UserRole.SCHOOL_ADMIN,
  ]);

  return (
    <RoleBasedAppShell role={(session.user as { role: UserRole }).role}>
      {children}
    </RoleBasedAppShell>
  );
}
