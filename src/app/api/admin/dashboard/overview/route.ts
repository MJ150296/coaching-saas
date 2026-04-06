import { NextResponse } from 'next/server';
import { UserRole } from '@/domains/user-management/domain/entities/User';
import { getActorUser } from '@/shared/infrastructure/actor';
import { getAdminDashboardOverview } from '@/shared/lib/admin-dashboard.server';

export async function GET() {
  try {
    const actor = await getActorUser();
    if (!actor) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const role = actor.getRole();
    if (
      role !== UserRole.SUPER_ADMIN &&
      role !== UserRole.ORGANIZATION_ADMIN &&
      role !== UserRole.COACHING_ADMIN &&
      role !== UserRole.ADMIN
    ) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { payload, cacheHit } = await getAdminDashboardOverview(actor);
    return NextResponse.json(payload, {
      status: 200,
      headers: {
        'Cache-Control': 'private, max-age=15, stale-while-revalidate=30',
        'X-Cache': cacheHit ? 'HIT' : 'MISS',
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed';
    const status =
      message === 'FORBIDDEN'
        ? 403
        : message.includes('scope')
          ? 400
          : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
