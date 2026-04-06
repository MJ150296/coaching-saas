import { UserRole } from '@/domains/user-management/domain/entities/User';
import { requireRole } from '@/shared/lib/requireRole';

export default async function EnrollmentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireRole([
    UserRole.SUPER_ADMIN,
    UserRole.ORGANIZATION_ADMIN,
    UserRole.COACHING_ADMIN,
    UserRole.ADMIN,
  ]);

  return <>{children}</>;
}
