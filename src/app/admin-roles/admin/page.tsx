import { redirect } from 'next/navigation';
import { UserRole } from '@/domains/user-management/domain/entities/User';
import { getActorUser } from '@/shared/infrastructure/actor';
import { getAdminDashboardOverview } from '@/shared/lib/admin-dashboard.server';
import AdminDashboardClient from './AdminDashboardClient';

export const dynamic = 'force-dynamic';

function getRoleTitle(role: UserRole): string {
  const labels: Record<UserRole, string> = {
    [UserRole.SUPER_ADMIN]: 'Superadmin Workspace',
    [UserRole.ORGANIZATION_ADMIN]: 'Organization Admin Workspace',
    [UserRole.COACHING_ADMIN]: 'Coaching Admin Workspace',
    [UserRole.ADMIN]: 'Admin Workspace',
    [UserRole.TEACHER]: 'Teacher Workspace',
    [UserRole.STUDENT]: 'Student Workspace',
    [UserRole.PARENT]: 'Parent Workspace',
    [UserRole.STAFF]: 'Staff Workspace',
  };
  return labels[role] ?? 'Admin Workspace';
}

export default async function AdminPage() {
  const actor = await getActorUser();
  if (!actor) {
    redirect('/auth/signin');
  }

  const role = actor.getRole();
  if (
    role !== UserRole.SUPER_ADMIN &&
    role !== UserRole.ORGANIZATION_ADMIN &&
    role !== UserRole.COACHING_ADMIN &&
    role !== UserRole.ADMIN
  ) {
    redirect('/auth/signin');
  }

  const { payload } = await getAdminDashboardOverview(actor);

  return (
    <AdminDashboardClient
      initialStats={payload.summary}
      initialRecentUsers={payload.recentUsers}
      roleTitle={getRoleTitle(role)}
      actorRole={role}
      actorOrganizationId={actor.getOrganizationId()}
      actorCoachingCenterId={actor.getCoachingCenterId()}
    />
  );
}
