import { redirect } from 'next/navigation';
import { UserRole } from '@/domains/user-management/domain/entities/User';
import { getActorUser } from '@/shared/infrastructure/actor';
import AdminCoachingCentersClient from './AdminCoachingCentersClient';

export const dynamic = 'force-dynamic';

export default async function CoachingCentersPage() {
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

  return (
    <AdminCoachingCentersClient
      initialOrganizationId={actor.getOrganizationId() ?? ''}
    />
  );
}
