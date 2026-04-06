import { User, UserRole } from '@/domains/user-management/domain/entities/User';
import { CoachingCenterModel } from '@/domains/organization-management/infrastructure/persistence/OrganizationCoachingCenterSchema';
import { connectDB } from '@/shared/infrastructure/database';
import { getAdminDashboardOverview } from './admin-dashboard.server';

export type CoachingAdminDashboardData = {
  overview: Awaited<ReturnType<typeof getAdminDashboardOverview>>['payload'];
  coachingCenterName: string | null;
};

export async function getCoachingAdminDashboardData(actor: User): Promise<CoachingAdminDashboardData> {
  if (actor.getRole() !== UserRole.COACHING_ADMIN) {
    throw new Error('FORBIDDEN');
  }

  const coachingCenterId = actor.getCoachingCenterId();
  if (!coachingCenterId) {
    throw new Error('Actor coaching center scope missing');
  }

  const overview = await getAdminDashboardOverview(actor);

  await connectDB();
  const center = await CoachingCenterModel.findById(coachingCenterId)
    .select('_id coachingCenterName')
    .lean<{ _id: string; coachingCenterName: string } | null>();

  return {
    overview: overview.payload,
    coachingCenterName: center?.coachingCenterName ?? null,
  };
}
