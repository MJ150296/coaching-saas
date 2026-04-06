import { NextRequest, NextResponse } from 'next/server';
import { requireActorWithPermission } from '@/shared/infrastructure/admin-guards';
import { Permission, hasPermission } from '@/shared/infrastructure/rbac';
import { assertTenantScope, resolveTenantScope } from '@/shared/infrastructure/tenant';
import { getCoachingServices } from '@/domains/coaching-management/bootstrap/getCoachingServices';
import { CreateCoachingEnrollmentUseCase } from '@/domains/coaching-management/application/use-cases';
import { getFeeServices } from '@/domains/fee-management/bootstrap/getFeeServices';
import { logAuditEvent } from '@/shared/infrastructure/audit-log';
import { UserRole } from '@/domains/user-management/domain/entities/User';
import { getActorUser } from '@/shared/infrastructure/actor';
import { parsePositiveIntParam } from '@/shared/lib/utils';

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
    const requestedStudentId = request.nextUrl.searchParams.get('studentId') || undefined;
    const withMeta = request.nextUrl.searchParams.get('withMeta') === 'true';
    const limit = parsePositiveIntParam(request.nextUrl.searchParams.get('limit'), 500) ?? (withMeta ? 100 : 200);
    const offset = parsePositiveIntParam(request.nextUrl.searchParams.get('offset'), 50000) ?? 0;

    const tenant = resolveTenantScope(actor, requestedOrganizationId, requestedCoachingCenterId);
    if (actor.getRole() !== UserRole.SUPER_ADMIN) {
      assertTenantScope(actor, tenant.organizationId, tenant.coachingCenterId);
    }

    const { coachingEnrollmentRepository: repo } = await getCoachingServices();

    const filtered = await repo.findByFilters({
      organizationId: tenant.organizationId,
      coachingCenterId: tenant.coachingCenterId,
      programId: requestedProgramId,
      batchId: requestedBatchId,
      studentId: requestedStudentId,
      limit,
      offset,
    });

    const items = filtered.map((enrollment) => ({
      id: enrollment.getId(),
      organizationId: enrollment.getOrganizationId(),
      coachingCenterId: enrollment.getCoachingCenterId(),
      programId: enrollment.getProgramId(),
      batchId: enrollment.getBatchId(),
      studentId: enrollment.getStudentId(),
      enrolledOn: enrollment.getEnrolledOn(),
      status: enrollment.getStatus(),
      createdAt: enrollment.getCreatedAt(),
      updatedAt: enrollment.getUpdatedAt(),
    }));

    if (!withMeta) {
      return NextResponse.json(items);
    }

    const total = await repo.countByFilters({
      organizationId: tenant.organizationId,
      coachingCenterId: tenant.coachingCenterId,
      programId: requestedProgramId,
      batchId: requestedBatchId,
      studentId: requestedStudentId,
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

    // Initialize all required repositories
    const { coachingEnrollmentRepository: enrollmentRepo } = await getCoachingServices();
    const {
      feePlanAssignmentRepository: feePlanAssignmentRepo,
      feePlanRepository: feePlanRepo,
      feeTypeRepository: feeTypeRepo,
      studentFeeLedgerRepository: ledgerRepo,
    } = await getFeeServices();

    // Create use case with dependencies
    const useCase = new CreateCoachingEnrollmentUseCase({
      enrollmentRepo,
      feePlanAssignmentRepo,
      feePlanRepo,
      feeTypeRepo,
      ledgerRepo,
    });

    const result = await useCase.execute({
      ...body,
      ...tenant,
    });

    if (result.getIsFailure()) {
      return NextResponse.json({ error: result.getError() }, { status: 400 });
    }

    const created = result.getValue();
    await logAuditEvent({
      actorId: actor.getId(),
      actorRole: actor.getRole(),
      action: 'CREATE_COACHING_ENROLLMENT',
      targetId: created.getId(),
      organizationId: tenant.organizationId,
      coachingCenterId: tenant.coachingCenterId,
      ip: request.headers.get('x-forwarded-for') || undefined,
      metadata: {
        batchId: created.getBatchId(),
        studentId: created.getStudentId(),
      },
    });

    return NextResponse.json(
      {
        id: created.getId(),
        organizationId: created.getOrganizationId(),
        coachingCenterId: created.getCoachingCenterId(),
        programId: created.getProgramId(),
        batchId: created.getBatchId(),
        studentId: created.getStudentId(),
        enrolledOn: created.getEnrolledOn(),
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
