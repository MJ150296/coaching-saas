import { NextRequest, NextResponse } from 'next/server';
import { requireActorWithPermission } from '@/shared/infrastructure/admin-guards';
import { Permission } from '@/shared/infrastructure/rbac';
import { assertTenantScope, resolveTenantScope } from '@/shared/infrastructure/tenant';
import { getFeeServices } from '@/domains/fee-management/bootstrap/getFeeServices';
import { logAuditEvent } from '@/shared/infrastructure/audit-log';
import { UserRole } from '@/domains/user-management/domain/entities/User';
import { getActorUser } from '@/shared/infrastructure/actor';
import { hasPermission } from '@/shared/infrastructure/rbac';
import { parsePositiveIntParam } from '@/shared/lib/utils';
import { invalidateCacheByPrefix } from '@/shared/infrastructure/api-response-cache';
import { FeePlanAssignment } from '@/domains/fee-management/domain/entities/FeePlanAssignment';
import { FeePlanAssignmentModel } from '@/domains/fee-management/infrastructure/persistence/FeeSchema';

export async function GET(request: NextRequest) {
  try {
    const actor = await getActorUser();
    if (!actor) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (
      !hasPermission(actor.getRole(), Permission.ASSIGN_FEE_PLAN) &&
      !hasPermission(actor.getRole(), Permission.CREATE_FEE_TYPE)
    ) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const requestedOrganizationId =
      request.nextUrl.searchParams.get('organizationId') || undefined;
    const requestedCoachingCenterId = request.nextUrl.searchParams.get('coachingCenterId') || undefined;
    const withMeta = request.nextUrl.searchParams.get('withMeta') === 'true';
    const limit = parsePositiveIntParam(request.nextUrl.searchParams.get('limit'), 500) ?? (withMeta ? 100 : 200);
    const offset = parsePositiveIntParam(request.nextUrl.searchParams.get('offset'), 50000) ?? 0;
    const academicYearId = request.nextUrl.searchParams.get('academicYearId') || undefined;
    const tenant = resolveTenantScope(actor, requestedOrganizationId, requestedCoachingCenterId);

    if (actor.getRole() !== UserRole.SUPER_ADMIN) {
      assertTenantScope(actor, tenant.organizationId, tenant.coachingCenterId);
    }

    const { feePlanAssignmentRepository: repo } = await getFeeServices();
    const filtered = await repo.findByTenant(tenant.organizationId, tenant.coachingCenterId, {
      academicYearId,
      limit,
      offset,
    });

    const items = filtered.map((item) => ({
      id: item.getId(),
      feePlanId: item.getFeePlanId(),
      programId: item.getProgramId(),
      batchId: item.getBatchId(),
      academicYearId: item.getAcademicYearId(),
      organizationId: item.getOrganizationId(),
      coachingCenterId: item.getCoachingCenterId(),
      createdAt: item.getCreatedAt(),
    }));

    if (!withMeta) {
      return NextResponse.json(items);
    }

    const total = await repo.countByTenant(tenant.organizationId, tenant.coachingCenterId, { academicYearId });
    return NextResponse.json({
      items,
      total,
      limit,
      offset,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed';
    const status = message === 'UNAUTHORIZED' ? 401 : message === 'FORBIDDEN' ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(request: NextRequest) {
  try {
    const actor = await requireActorWithPermission(Permission.ASSIGN_FEE_PLAN);
    const body = await request.json();
    const tenant = resolveTenantScope(actor, body.organizationId, body.coachingCenterId);
    if (actor.getRole() === UserRole.SUPER_ADMIN && (!tenant.organizationId || !tenant.coachingCenterId)) {
      return NextResponse.json({ error: 'organizationId and coachingCenterId are required' }, { status: 400 });
    }
    assertTenantScope(actor, tenant.organizationId, tenant.coachingCenterId);

    const { feePlanAssignmentRepository: repo } = await getFeeServices();

    const id = crypto.randomUUID();
    const assignment = {
      _id: id,
      ...tenant,
      academicYearId: body.academicYearId,
      feePlanId: body.feePlanId,
      programId: body.programId,
      batchId: body.batchId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await repo.create(assignment);

    await logAuditEvent({
      actorId: actor.getId(),
      actorRole: actor.getRole(),
      action: 'ASSIGN_FEE_PLAN',
      organizationId: tenant.organizationId,
      coachingCenterId: tenant.coachingCenterId,
      ip: request.headers.get('x-forwarded-for') || undefined,
    });

    invalidateCacheByPrefix('api:admin:academic-options:');
    invalidateCacheByPrefix('api:admin:dashboard:overview:');
    return NextResponse.json({ id, ...assignment }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed';
    const status = message === 'UNAUTHORIZED' ? 401 : message === 'FORBIDDEN' ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const actor = await requireActorWithPermission(Permission.ASSIGN_FEE_PLAN);
    const body = await request.json();
    const tenant = resolveTenantScope(actor, body.organizationId, body.coachingCenterId);

    if (!body.id) {
      return NextResponse.json({ error: 'Assignment id is required' }, { status: 400 });
    }

    if (actor.getRole() === UserRole.SUPER_ADMIN && (!tenant.organizationId || !tenant.coachingCenterId)) {
      return NextResponse.json({ error: 'organizationId and coachingCenterId are required' }, { status: 400 });
    }
    assertTenantScope(actor, tenant.organizationId, tenant.coachingCenterId);

    const academicYearId = String(body.academicYearId || '').trim();
    const feePlanId = String(body.feePlanId || '').trim();
    const programId = String(body.programId || '').trim();
    const batchId = String(body.batchId || '').trim() || undefined;

    if (!academicYearId || !feePlanId || !programId) {
      return NextResponse.json({ error: 'Academic year, fee plan and program are required' }, { status: 400 });
    }

    const { feePlanAssignmentRepository: repo } = await getFeeServices();
    const existing = await repo.findById(body.id);

    if (!existing) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 });
    }

    if (
      existing.getOrganizationId() !== tenant.organizationId ||
      existing.getCoachingCenterId() !== tenant.coachingCenterId
    ) {
      return NextResponse.json({ error: 'Assignment does not belong to the selected tenant' }, { status: 403 });
    }

    const duplicateQuery: {
      organizationId: string | undefined;
      coachingCenterId: string | undefined;
      academicYearId: string;
      feePlanId: string;
      programId: string;
      _id: { $ne: string };
      $or?: Array<{ batchId: string } | { batchId: { $exists: false } } | { batchId: null }>;
      batchId?: string;
    } = {
      organizationId: tenant.organizationId,
      coachingCenterId: tenant.coachingCenterId,
      academicYearId,
      feePlanId,
      programId,
      _id: { $ne: body.id },
    };

    if (batchId) {
      duplicateQuery.batchId = batchId;
    } else {
      duplicateQuery.$or = [{ batchId: { $exists: false } }, { batchId: null }];
    }

    const duplicateCount = await FeePlanAssignmentModel.countDocuments(duplicateQuery);

    if (duplicateCount > 0) {
      return NextResponse.json({ error: 'Another assignment already exists with the same fee plan, program and batch.' }, { status: 400 });
    }

    const updated = new FeePlanAssignment(body.id, {
      organizationId: tenant.organizationId,
      coachingCenterId: tenant.coachingCenterId,
      academicYearId,
      feePlanId,
      programId,
      batchId,
    });

    await repo.save(updated);

    await logAuditEvent({
      actorId: actor.getId(),
      actorRole: actor.getRole(),
      action: 'UPDATE_FEE_PLAN_ASSIGNMENT',
      organizationId: tenant.organizationId,
      coachingCenterId: tenant.coachingCenterId,
      ip: request.headers.get('x-forwarded-for') || undefined,
    });

    invalidateCacheByPrefix('api:admin:academic-options:');
    invalidateCacheByPrefix('api:admin:dashboard:overview:');
    return NextResponse.json({
      id: updated.getId(),
      academicYearId: updated.getAcademicYearId(),
      feePlanId: updated.getFeePlanId(),
      programId: updated.getProgramId(),
      batchId: updated.getBatchId(),
      organizationId: updated.getOrganizationId(),
      coachingCenterId: updated.getCoachingCenterId(),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed';
    const status = message === 'UNAUTHORIZED' ? 401 : message === 'FORBIDDEN' ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const actor = await requireActorWithPermission(Permission.ASSIGN_FEE_PLAN);
    const id = request.nextUrl.searchParams.get('id') || undefined;
    const organizationId = request.nextUrl.searchParams.get('organizationId') || undefined;
    const coachingCenterId = request.nextUrl.searchParams.get('coachingCenterId') || undefined;
    const tenant = resolveTenantScope(actor, organizationId, coachingCenterId);

    if (!id) {
      return NextResponse.json({ error: 'Assignment id is required' }, { status: 400 });
    }

    if (actor.getRole() === UserRole.SUPER_ADMIN && (!tenant.organizationId || !tenant.coachingCenterId)) {
      return NextResponse.json({ error: 'organizationId and coachingCenterId are required' }, { status: 400 });
    }
    assertTenantScope(actor, tenant.organizationId, tenant.coachingCenterId);

    const { feePlanAssignmentRepository: repo } = await getFeeServices();
    const existing = await repo.findById(id);

    if (!existing) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 });
    }

    if (
      existing.getOrganizationId() !== tenant.organizationId ||
      existing.getCoachingCenterId() !== tenant.coachingCenterId
    ) {
      return NextResponse.json({ error: 'Assignment does not belong to the selected tenant' }, { status: 403 });
    }

    await repo.delete(id);

    await logAuditEvent({
      actorId: actor.getId(),
      actorRole: actor.getRole(),
      action: 'DELETE_FEE_PLAN_ASSIGNMENT',
      organizationId: tenant.organizationId,
      coachingCenterId: tenant.coachingCenterId,
      ip: request.headers.get('x-forwarded-for') || undefined,
    });

    invalidateCacheByPrefix('api:admin:academic-options:');
    invalidateCacheByPrefix('api:admin:dashboard:overview:');
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed';
    const status = message === 'UNAUTHORIZED' ? 401 : message === 'FORBIDDEN' ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
