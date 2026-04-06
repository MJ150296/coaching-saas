import { NextResponse } from 'next/server';
import { UserRole } from '@/domains/user-management/domain/entities/User';
import { getActorUser } from '@/shared/infrastructure/actor';
import { getParentDashboardData } from '@/shared/lib/parent-dashboard.server';

export async function GET() {
  try {
    const actor = await getActorUser();
    if (!actor) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (actor.getRole() !== UserRole.PARENT) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const payload = await getParentDashboardData(actor);
    return NextResponse.json(payload);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed';
    const status = message === 'FORBIDDEN' ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
