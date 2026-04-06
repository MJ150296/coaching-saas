import { redirect } from 'next/navigation';
import { UserRole } from '@/domains/user-management/domain/entities/User';
import { getActorUser } from '@/shared/infrastructure/actor';
import { getSuperadminDashboardData } from '@/shared/lib/superadmin-dashboard.server';
import SuperadminDashboardClient from './SuperadminDashboardClient';

export const dynamic = 'force-dynamic';

export default async function SuperadminDashboardPage() {
  const actor = await getActorUser();
  if (!actor) {
    redirect('/auth/signin');
  }

  if (actor.getRole() !== UserRole.SUPER_ADMIN) {
    redirect('/auth/signin');
  }

  const data = await getSuperadminDashboardData(actor);

  return (
    <SuperadminDashboardClient
      initialOverview={data.overview}
      initialOrganizations={data.organizations}
      initialCoachingCenters={data.coachingCenters}
      initialLastUpdated={new Date().toLocaleString()}
    />
  );
}
