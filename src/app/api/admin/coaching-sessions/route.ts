import { NextRequest, NextResponse } from 'next/server';
import { requireActorWithPermission } from '@/shared/infrastructure/admin-guards';
import { Permission, hasPermission } from '@/shared/infrastructure/rbac';
import { assertTenantScope, resolveTenantScope } from '@/shared/infrastructure/tenant';
import { ServiceKeys } from '@/shared/bootstrap/ServiceKeys';
import { initializeAppAndGetService } from '@/shared/bootstrap/init';
import { CreateCoachingSessionUseCase } from '@/domains/coaching-management/application/use-cases';
import { MongoCoachingSessionRepository } from '@/domains/coaching-management/infrastructure/persistence/MongoCoachingRepository';
import { logAuditEvent } from '@/shared/infrastructure/audit-log';
import { UserRole } from '@/domains/user-management/domain/entities/User';
import { getActorUser } from '@/shared/infrastructure/actor';
import { parsePositiveIntParam } from '@/shared/lib/utils';

function parseDate(value: unknown): Date | undefined {
  if (typeof value !== 'string') return undefined;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}

export async function GET(request: NextRequest) {
  try {
    const actor = await getActorUser();
    if (!actor) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!hasPermission(actor.getRole(), Permission.MANAGE_COACHING)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const requestedOrganizationId = request.nextUrl.searchParams.get('organizationId') || undefined;
    const requestedCoachingCenterId = request.nextUrl.searchParams.get('coachingCenterId') || undefined;
    const requestedProgramId = request.nextUrl.searchParams.get('programId') || undefined;
    const requestedBatchId = request.nextUrl.searchParams.get('batchId') || undefined;
    const sessionDateFrom = parseDate(request.nextUrl.searchParams.get('sessionDateFrom'));
    const sessionDateTo = parseDate(request.nextUrl.searchParams.get('sessionDateTo'));
    const withMeta = request.nextUrl.searchParams.get('withMeta') === 'true';
    const limit = parsePositiveIntParam(request.nextUrl.searchParams.get('limit'), 500) ?? (withMeta ? 100 : 200);
    const offset = parsePositiveIntParam(request.nextUrl.searchParams.get('offset'), 50000) ?? 0;

    const tenant = resolveTenantScope(actor, requestedOrganizationId, requestedCoachingCenterId);
    if (actor.getRole() !== UserRole.SUPER_ADMIN) {
      assertTenantScope(actor, tenant.organizationId, tenant.coachingCenterId);
    }

    const repo = await initializeAppAndGetService<MongoCoachingSessionRepository>(
      ServiceKeys.COACHING_SESSION_REPOSITORY
    );

    const filtered = await repo.findByFilters({
      organizationId: tenant.organizationId,
      coachingCenterId: tenant.coachingCenterId,
      programId: requestedProgramId,
      batchId: requestedBatchId,
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
      organizationId: tenant.organizationId,
      coachingCenterId: tenant.coachingCenterId,
      programId: requestedProgramId,
      batchId: requestedBatchId,
      sessionDateFrom,
      sessionDateTo,
    });

    return NextResponse.json({ items, total, limit, offset });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed';
    const status = message === 'UNAUTHORIZED' ? 401 : message === 'FORBIDDEN' ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(request: NextRequest) {
  try {
    const actor = await requireActorWithPermission(Permission.MANAGE_COACHING);
    const body = await request.json();
    const tenant = resolveTenantScope(actor, body.organizationId, body.coachingCenterId);

    if (actor.getRole() === UserRole.SUPER_ADMIN && (!tenant.organizationId || !tenant.coachingCenterId)) {
      return NextResponse.json({ error: 'organizationId and coachingCenterId are required' }, { status: 400 });
    }

    assertTenantScope(actor, tenant.organizationId, tenant.coachingCenterId);

    const sessionDate = parseDate(body.sessionDate);
    if (!sessionDate) {
      return NextResponse.json({ error: 'Valid sessionDate is required' }, { status: 400 });
    }

    const useCase = await initializeAppAndGetService<CreateCoachingSessionUseCase>(
      ServiceKeys.CREATE_COACHING_SESSION_USE_CASE
    );

    const result = await useCase.execute({
      ...body,
      ...tenant,
      sessionDate,
    });

    if (result.getIsFailure()) {
      return NextResponse.json({ error: result.getError() }, { status: 400 });
    }

    const created = result.getValue();
    await logAuditEvent({
      actorId: actor.getId(),
      actorRole: actor.getRole(),
      action: 'CREATE_COACHING_SESSION',
      targetId: created.getId(),
      organizationId: tenant.organizationId,
      coachingCenterId: tenant.coachingCenterId,
      ip: request.headers.get('x-forwarded-for') || undefined,
      metadata: {
        programId: created.getProgramId(),
        batchId: created.getBatchId(),
      },
    });

    return NextResponse.json(
      {
        id: created.getId(),
        organizationId: created.getOrganizationId(),
        coachingCenterId: created.getCoachingCenterId(),
        programId: created.getProgramId(),
        batchId: created.getBatchId(),
        topic: created.getTopic(),
        sessionDate: created.getSessionDate(),
        startsAt: created.getStartsAt(),
        endsAt: created.getEndsAt(),
        facultyId: created.getFacultyId(),
        status: created.getStatus(),
        createdAt: created.getCreatedAt(),
        updatedAt: created.getUpdatedAt(),
      },
      { status: 201 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed';
    const status = message === 'UNAUTHORIZED' ? 401 : message === 'FORBIDDEN' ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
