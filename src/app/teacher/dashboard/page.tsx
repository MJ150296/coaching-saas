import { redirect } from 'next/navigation';
import { UserRole } from '@/domains/user-management/domain/entities/User';
import { getActorUser } from '@/shared/infrastructure/actor';
import { getTeacherDashboardData } from '@/shared/lib/teacher-dashboard.server';
import TeacherDashboardClient from './TeacherDashboardClient';

export const dynamic = 'force-dynamic';

export default async function TeacherDashboardPage() {
  const actor = await getActorUser();
  if (!actor) {
    redirect('/auth/signin');
  }

  if (actor.getRole() !== UserRole.TEACHER) {
    redirect('/auth/signin');
  }

  const data = await getTeacherDashboardData(actor);
  const firstName = actor.getName().getFirstName() || actor.getName().getFullName().split(' ')[0] || 'Teacher';

  return (
    <TeacherDashboardClient
      initialData={data}
      firstName={firstName}
    />
  );
}
