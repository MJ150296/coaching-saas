import { redirect } from 'next/navigation';
import { UserRole } from '@/domains/user-management/domain/entities/User';
import { getActorUser } from '@/shared/infrastructure/actor';
import { getParentDashboardData } from '@/shared/lib/parent-dashboard.server';
import ParentDashboardClient from './ParentDashboardClient';

export const dynamic = 'force-dynamic';

export default async function ParentDashboardPage() {
  const actor = await getActorUser();
  if (!actor) {
    redirect('/auth/signin');
  }

  if (actor.getRole() !== UserRole.PARENT) {
    redirect('/auth/signin');
  }

  const data = await getParentDashboardData(actor);
  const firstName = actor.getName().getFirstName() || actor.getName().getFullName().split(' ')[0] || 'Parent';

  return (
    <ParentDashboardClient
      initialData={data}
      firstName={firstName}
    />
  );
}
