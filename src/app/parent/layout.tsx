import { UserRole } from '@/domains/user-management/domain/entities/User';
import { requireRole } from '@/shared/lib/requireRole';
import { RoleBasedAppShell } from '@/shared/components/navigation/RoleBasedAppShell';

export default async function ParentLayout({ children }: { children: React.ReactNode }) {
  const session = await requireRole([UserRole.PARENT]);
  return (
    <RoleBasedAppShell role={(session.user as { role: UserRole }).role}>
      {children}
    </RoleBasedAppShell>
  );
}
