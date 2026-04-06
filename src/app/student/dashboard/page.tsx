import { redirect } from 'next/navigation';
import { UserRole } from '@/domains/user-management/domain/entities/User';
import { getActorUser } from '@/shared/infrastructure/actor';
import { getStudentDashboardData } from '@/shared/lib/student-dashboard.server';
import StudentDashboardClient from './StudentDashboardClient';

export const dynamic = 'force-dynamic';

export default async function StudentDashboard() {
  const actor = await getActorUser();
  if (!actor) {
    redirect('/auth/signin');
  }

  if (actor.getRole() !== UserRole.STUDENT) {
    redirect('/auth/signin');
  }

  const data = await getStudentDashboardData(actor);
  const firstName = actor.getName().getFirstName() || actor.getName().getFullName().split(' ')[0] || 'Student';

  return (
    <StudentDashboardClient
      initialData={data}
      firstName={firstName}
    />
  );
}
