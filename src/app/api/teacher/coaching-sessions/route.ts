import { NextRequest, NextResponse } from 'next/server';
import { getCoachingServices } from '@/domains/coaching-management/bootstrap/getCoachingServices';
import { UserRole } from '@/domains/user-management/domain/entities/User';
import { getActorUser } from '@/shared/infrastructure/actor';
import { parsePositiveIntParam } from '@/shared/lib/utils';

function parseDateParam(value: string | null): Date | undefined {
  if (!value) return undefined;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}

export async function GET(request: NextRequest) {
  try {
    const actor = await getActorUser();
    if (!actor) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (actor.getRole() !== UserRole.TEACHER) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const organizationId = actor.getOrganizationId();
    const coachingCenterId = actor.getCoachingCenterId();
    if (!organizationId || !coachingCenterId) {
      return NextResponse.json({ items: [], total: 0, limit: 0, offset: 0 });
    }

    const withMeta = request.nextUrl.searchParams.get('withMeta') === 'true';
    const requestedProgramId = request.nextUrl.searchParams.get('programId') || undefined;
    const requestedBatchId = request.nextUrl.searchParams.get('batchId') || undefined;
    const sessionDateFrom = parseDateParam(request.nextUrl.searchParams.get('sessionDateFrom'));
    const sessionDateTo = parseDateParam(request.nextUrl.searchParams.get('sessionDateTo'));
    const limit =
      parsePositiveIntParam(request.nextUrl.searchParams.get('limit'), 500) ??
      (withMeta ? 100 : 200);
    const offset = parsePositiveIntParam(request.nextUrl.searchParams.get('offset'), 50000) ?? 0;

    const { coachingSessionRepository: repo } = await getCoachingServices();

    const filtered = await repo.findByFilters({
      organizationId,
      coachingCenterId,
      programId: requestedProgramId,
      batchId: requestedBatchId,
      facultyId: actor.getId(),
      sessionDateFrom,
      sessionDateTo,
      limit,
      offset,
    });

    const items = filtered.map((session) => ({
      id: session.getId(),
      organizationId: session.getOrganizationId(),
      coachingCenterId: session.getCoachingCenterId(),
      programId: session.getProgramId(),
      batchId: session.getBatchId(),
      topic: session.getTopic(),
      sessionDate: session.getSessionDate(),
      startsAt: session.getStartsAt(),
      endsAt: session.getEndsAt(),
      facultyId: session.getFacultyId(),
      status: session.getStatus(),
      createdAt: session.getCreatedAt(),
      updatedAt: session.getUpdatedAt(),
    }));

    if (!withMeta) {
      return NextResponse.json(items);
    }

    const total = await repo.countByFilters({
      organizationId,
      coachingCenterId,
      programId: requestedProgramId,
      batchId: requestedBatchId,
      facultyId: actor.getId(),
      sessionDateFrom,
      sessionDateTo,
    });

    return NextResponse.json({ items, total, limit, offset });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
