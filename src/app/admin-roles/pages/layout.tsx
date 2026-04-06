import { UserRole } from '@/domains/user-management/domain/entities/User';
import { requireRole } from '@/shared/lib/requireRole';

export default async function AnalyticsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireRole([
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN,
    UserRole.ORGANIZATION_ADMIN,
    UserRole.COACHING_ADMIN,
    // add other roles if necessary, e.g. UserRole.ACADEMIC_ADMIN
  ]);

  return <>{children}</>;
}
