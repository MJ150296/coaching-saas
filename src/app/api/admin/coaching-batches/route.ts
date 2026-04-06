import { NextRequest, NextResponse } from 'next/server';
import { requireActorWithPermission } from '@/shared/infrastructure/admin-guards';
import { Permission, hasPermission } from '@/shared/infrastructure/rbac';
import { assertTenantScope, resolveTenantScope } from '@/shared/infrastructure/tenant';
import { getCoachingServices } from '@/domains/coaching-management/bootstrap/getCoachingServices';
import { logAuditEvent } from '@/shared/infrastructure/audit-log';
import { UserRole } from '@/domains/user-management/domain/entities/User';
import { getActorUser } from '@/shared/infrastructure/actor';
import { parsePositiveIntParam } from '@/shared/lib/utils';
import { CoachingBatch } from '@/domains/coaching-management/domain/entities/CoachingBatch';

function parseOptionalDate(value: unknown): Date | undefined {
  if (!value || typeof value !== 'string') return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
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
    const withMeta = request.nextUrl.searchParams.get('withMeta') === 'true';
    const limit = parsePositiveIntParam(request.nextUrl.searchParams.get('limit'), 500) ?? (withMeta ? 100 : 200);
    const offset = parsePositiveIntParam(request.nextUrl.searchParams.get('offset'), 50000) ?? 0;

    const tenant = resolveTenantScope(actor, requestedOrganizationId, requestedCoachingCenterId);
    if (actor.getRole() !== UserRole.SUPER_ADMIN) {
      assertTenantScope(actor, tenant.organizationId, tenant.coachingCenterId);
    }

    const { coachingBatchRepository: repo } = await getCoachingServices();

    const filtered = await repo.findByFilters({
      organizationId: tenant.organizationId,
      coachingCenterId: tenant.coachingCenterId,
      programId: requestedProgramId,
      limit,
      offset,
    });

    const items = filtered.map((batch) => ({
      id: batch.getId(),
      organizationId: batch.getOrganizationId(),
      coachingCenterId: batch.getCoachingCenterId(),
      programId: batch.getProgramId(),
      name: batch.getName(),
      facultyId: batch.getFacultyId(),
      capacity: batch.getCapacity(),
      scheduleSummary: batch.getScheduleSummary(),
      startsOn: batch.getStartsOn(),
      endsOn: batch.getEndsOn(),
      isActive: batch.isBatchActive(),
      createdAt: batch.getCreatedAt(),
      updatedAt: batch.getUpdatedAt(),
    }));

    if (!withMeta) {
      return NextResponse.json(items);
    }

    const total = await repo.countByFilters({
      organizationId: tenant.organizationId,
      coachingCenterId: tenant.coachingCenterId,
      programId: requestedProgramId,
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

    const { createCoachingBatchUseCase: useCase } = await getCoachingServices();

    const result = await useCase.execute({
      ...body,
      ...tenant,
      startsOn: parseOptionalDate(body.startsOn),
      endsOn: parseOptionalDate(body.endsOn),
    });

    if (result.getIsFailure()) {
      return NextResponse.json({ error: result.getError() }, { status: 400 });
    }

    const created = result.getValue();
    await logAuditEvent({
      actorId: actor.getId(),
      actorRole: actor.getRole(),
      action: 'CREATE_COACHING_BATCH',
      targetId: created.getId(),
      organizationId: tenant.organizationId,
      coachingCenterId: tenant.coachingCenterId,
      ip: request.headers.get('x-forwarded-for') || undefined,
      metadata: {
        programId: created.getProgramId(),
      },
    });

    return NextResponse.json(
      {
        id: created.getId(),
        organizationId: created.getOrganizationId(),
        coachingCenterId: created.getCoachingCenterId(),
        programId: created.getProgramId(),
        name: created.getName(),
        facultyId: created.getFacultyId(),
        capacity: created.getCapacity(),
        scheduleSummary: created.getScheduleSummary(),
        startsOn: created.getStartsOn(),
        endsOn: created.getEndsOn(),
        isActive: created.isBatchActive(),
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

export async function PUT(request: NextRequest) {
  try {
    const actor = await requireActorWithPermission(Permission.MANAGE_COACHING);
    const body = await request.json();
    const tenant = resolveTenantScope(actor, body.organizationId, body.coachingCenterId);
    const id = typeof body.id === 'string' ? body.id : '';

    if (!id) {
      return NextResponse.json({ error: 'Batch id is required' }, { status: 400 });
    }

    if (actor.getRole() === UserRole.SUPER_ADMIN && (!tenant.organizationId || !tenant.coachingCenterId)) {
      return NextResponse.json({ error: 'organizationId and coachingCenterId are required' }, { status: 400 });
    }

    assertTenantScope(actor, tenant.organizationId, tenant.coachingCenterId);

    const { coachingBatchRepository: repo } = await getCoachingServices();
    const existing = await repo.findById(id);

    if (!existing) {
      return NextResponse.json({ error: 'Batch not found' }, { status: 404 });
    }

    if (
      existing.getOrganizationId() !== tenant.organizationId ||
      existing.getCoachingCenterId() !== tenant.coachingCenterId
    ) {
      return NextResponse.json({ error: 'Batch does not belong to the selected tenant' }, { status: 403 });
    }

    const name = typeof body.name === 'string' ? body.name.trim() : existing.getName();
    const capacity =
      typeof body.capacity === 'number'
        ? body.capacity
        : typeof body.capacity === 'string' && body.capacity.trim()
          ? Number(body.capacity)
          : existing.getCapacity();

    if (!name) {
      return NextResponse.json({ error: 'Batch name is required' }, { status: 400 });
    }

    if (!Number.isFinite(capacity) || capacity <= 0) {
      return NextResponse.json({ error: 'Batch capacity must be greater than 0' }, { status: 400 });
    }

    const startsOn = body.startsOn !== undefined ? parseOptionalDate(body.startsOn) : existing.getStartsOn();
    const endsOn = body.endsOn !== undefined ? parseOptionalDate(body.endsOn) : existing.getEndsOn();

    if (startsOn && endsOn && startsOn > endsOn) {
      return NextResponse.json({ error: 'Batch start date must be before end date' }, { status: 400 });
    }

    const updated = new CoachingBatch(existing.getId(), {
      organizationId: existing.getOrganizationId(),
      coachingCenterId: existing.getCoachingCenterId(),
      programId: existing.getProgramId(),
      name,
      facultyId: typeof body.facultyId === 'string' && body.facultyId.trim() ? body.facultyId.trim() : undefined,
      capacity,
      scheduleSummary:
        typeof body.scheduleSummary === 'string'
          ? body.scheduleSummary.trim() || undefined
          : existing.getScheduleSummary(),
      startsOn,
      endsOn,
      isActive: typeof body.isActive === 'boolean' ? body.isActive : existing.isBatchActive(),
    });

    await repo.save(updated);

    await logAuditEvent({
      actorId: actor.getId(),
      actorRole: actor.getRole(),
      action: 'UPDATE_COACHING_BATCH',
      targetId: id,
      organizationId: tenant.organizationId,
      coachingCenterId: tenant.coachingCenterId,
      ip: request.headers.get('x-forwarded-for') || undefined,
      metadata: {
        programId: existing.getProgramId(),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed';
    const status = message === 'UNAUTHORIZED' ? 401 : message === 'FORBIDDEN' ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
