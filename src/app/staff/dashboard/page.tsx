import { redirect } from 'next/navigation';
import { UserRole } from '@/domains/user-management/domain/entities/User';
import { getActorUser } from '@/shared/infrastructure/actor';
import { getStaffDashboardData } from '@/shared/lib/staff-dashboard.server';
import StaffDashboardClient from './StaffDashboardClient';

export const dynamic = 'force-dynamic';

export default async function StaffDashboardPage() {
  const actor = await getActorUser();
  if (!actor) {
    redirect('/auth/signin');
  }

  if (actor.getRole() !== UserRole.STAFF) {
    redirect('/auth/signin');
  }

  const data = await getStaffDashboardData(actor);
  const firstName = actor.getName().getFirstName() || actor.getName().getFullName().split(' ')[0] || 'Staff';

  return (
    <StaffDashboardClient
      initialData={data}
      firstName={firstName}
    />
  );
}
