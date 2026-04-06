import { redirect } from 'next/navigation';
import { UserRole } from '@/domains/user-management/domain/entities/User';
import { getActorUser } from '@/shared/infrastructure/actor';
import { getAdminDashboardOverview } from '@/shared/lib/admin-dashboard.server';
import OrganizationAdminDashboardClient from './OrganizationAdminDashboardClient';

export const dynamic = 'force-dynamic';

export default async function OrganizationAdminDashboardPage() {
  const actor = await getActorUser();
  if (!actor) {
    redirect('/auth/signin');
  }

  const role = actor.getRole();
  if (role !== UserRole.ORGANIZATION_ADMIN) {
    redirect('/auth/signin');
  }

  const { payload } = await getAdminDashboardOverview(actor);

  return (
    <OrganizationAdminDashboardClient
      initialStats={payload.summary}
      initialRecentUsers={payload.recentUsers}
    />
  );
}
