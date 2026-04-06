import { redirect } from 'next/navigation';
import { UserRole } from '@/domains/user-management/domain/entities/User';
import { getActorUser } from '@/shared/infrastructure/actor';
import { getCoachingAdminDashboardData } from '@/shared/lib/coaching-admin-dashboard.server';
import CoachingAdminDashboardClient from './CoachingAdminDashboardClient';

export const dynamic = 'force-dynamic';

export default async function CoachingAdminDashboardPage() {
  const actor = await getActorUser();
  if (!actor) {
    redirect('/auth/signin');
  }

  if (actor.getRole() !== UserRole.COACHING_ADMIN) {
    redirect('/auth/signin');
  }

  const coachingCenterId = actor.getCoachingCenterId();
  const organizationId = actor.getOrganizationId();
  if (!coachingCenterId || !organizationId) {
    redirect('/auth/signin');
  }

  const data = await getCoachingAdminDashboardData(actor);

  return (
    <CoachingAdminDashboardClient
      initialStats={data.overview.summary}
      initialRecentUsers={data.overview.recentUsers}
      organizationId={organizationId}
      coachingCenterId={coachingCenterId}
      coachingCenterName={data.coachingCenterName}
    />
  );
}
