import { UserRole } from '@/domains/user-management/domain/entities/User';
import { RoleBasedAppShell } from '@/shared/components/navigation/RoleBasedAppShell';
import { requireRole } from '@/shared/lib/requireRole';

export default async function ProfileLayout({ children }: { children: React.ReactNode }) {
  const session = await requireRole([
    UserRole.SUPER_ADMIN,
    UserRole.ORGANIZATION_ADMIN,
    UserRole.COACHING_ADMIN,
    UserRole.ADMIN,
    UserRole.TEACHER,
    UserRole.STUDENT,
    UserRole.PARENT,
    UserRole.STAFF,
  ]);

  return (
    <RoleBasedAppShell role={(session.user as { role: UserRole }).role}>
      {children}
    </RoleBasedAppShell>
  );
}
