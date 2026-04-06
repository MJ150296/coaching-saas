import { NextRequest, NextResponse } from 'next/server';
import { requireActorWithPermission } from '@/shared/infrastructure/admin-guards';
import { Permission } from '@/shared/infrastructure/rbac';
import { assertTenantScope, resolveTenantScope } from '@/shared/infrastructure/tenant';
import { getAcademicServices } from '@/domains/academic-management/bootstrap/getAcademicServices';
import { logAuditEvent } from '@/shared/infrastructure/audit-log';
import { UserRole } from '@/domains/user-management/domain/entities/User';
import { getActorUser } from '@/shared/infrastructure/actor';
import { hasPermission } from '@/shared/infrastructure/rbac';
import { parsePositiveIntParam } from '@/shared/lib/utils';
import { invalidateCacheByPrefix } from '@/shared/infrastructure/api-response-cache';
import { AcademicYear } from '@/domains/academic-management/domain/entities/AcademicYear';
import { TimetableEntryModel, StudentEnrollmentModel } from '@/domains/academic-management/infrastructure/persistence/AcademicSchema';
import { CoachingProgramModel } from '@/domains/coaching-management/infrastructure/persistence/CoachingSchema';
import { FeePlanModel, FeePlanAssignmentModel, StudentFeeLedgerModel, PaymentModel, CreditNoteModel } from '@/domains/fee-management/infrastructure/persistence/FeeSchema';

function resolveActorTenant(request: NextRequest, actor: Awaited<ReturnType<typeof getActorUser>>) {
  if (!actor) {
    throw new Error('UNAUTHORIZED');
  }

  const requestedOrganizationId = request.nextUrl.searchParams.get('organizationId') || undefined;
  const requestedCoachingCenterId = request.nextUrl.searchParams.get('coachingCenterId') || undefined;
  const tenant = resolveTenantScope(actor, requestedOrganizationId, requestedCoachingCenterId);

  if (actor.getRole() !== UserRole.SUPER_ADMIN) {
    assertTenantScope(actor, tenant.organizationId, tenant.coachingCenterId);
  }

  return tenant;
}

export async function GET(request: NextRequest) {
  try {
    const actor = await getActorUser();
    if (!actor) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!hasPermission(actor.getRole(), Permission.CREATE_ACADEMIC_YEAR)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const withMeta = request.nextUrl.searchParams.get('withMeta') === 'true';
    const limit = parsePositiveIntParam(request.nextUrl.searchParams.get('limit'), 500) ?? (withMeta ? 100 : 200);
    const offset = parsePositiveIntParam(request.nextUrl.searchParams.get('offset'), 50000) ?? 0;
    const tenant = resolveActorTenant(request, actor);

    const { academicYearRepository: repo } = await getAcademicServices();
    const filtered = await repo.findByFilters({
      organizationId: tenant.organizationId,
      coachingCenterId: tenant.coachingCenterId,
      limit,
      offset,
    });

    const items = filtered.map((year) => ({
      id: year.getId(),
      name: year.getName(),
      startDate: year.getStartDate(),
      endDate: year.getEndDate(),
      organizationId: year.getOrganizationId(),
      coachingCenterId: year.getCoachingCenterId(),
    }));

    if (!withMeta) {
      return NextResponse.json(items);
    }

    const total = await repo.countByFilters({
      organizationId: tenant.organizationId,
      coachingCenterId: tenant.coachingCenterId,
    });
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
    const actor = await requireActorWithPermission(Permission.CREATE_ACADEMIC_YEAR);
    const body = await request.json();
    const tenant = resolveTenantScope(actor, body.organizationId, body.coachingCenterId);
    if (actor.getRole() === UserRole.SUPER_ADMIN && (!tenant.organizationId || !tenant.coachingCenterId)) {
      return NextResponse.json({ error: 'organizationId and coachingCenterId are required' }, { status: 400 });
    }
    assertTenantScope(actor, tenant.organizationId, tenant.coachingCenterId);

    const { createAcademicYearUseCase: useCase } = await getAcademicServices();
    const result = await useCase.execute({ ...body, ...tenant });

    if (result.getIsFailure()) {
      return NextResponse.json({ error: result.getError() }, { status: 400 });
    }

    await logAuditEvent({
      actorId: actor.getId(),
      actorRole: actor.getRole(),
      action: 'CREATE_ACADEMIC_YEAR',
      organizationId: tenant.organizationId,
      coachingCenterId: tenant.coachingCenterId,
      ip: request.headers.get('x-forwarded-for') || undefined,
    });

    invalidateCacheByPrefix('api:admin:academic-options:');
    invalidateCacheByPrefix('api:admin:dashboard:overview:');
    return NextResponse.json(result.getValue(), { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed';
    const status = message === 'UNAUTHORIZED' ? 401 : message === 'FORBIDDEN' ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const actor = await requireActorWithPermission(Permission.CREATE_ACADEMIC_YEAR);
    const body = await request.json();
    const tenant = resolveTenantScope(actor, body.organizationId, body.coachingCenterId);
    if (!body.id) {
      return NextResponse.json({ error: 'Academic year id is required' }, { status: 400 });
    }
    if (actor.getRole() === UserRole.SUPER_ADMIN && (!tenant.organizationId || !tenant.coachingCenterId)) {
      return NextResponse.json({ error: 'organizationId and coachingCenterId are required' }, { status: 400 });
    }
    assertTenantScope(actor, tenant.organizationId, tenant.coachingCenterId);

    const normalizedName = String(body.name || '').trim();
    const startDate = new Date(body.startDate);
    const endDate = new Date(body.endDate);

    if (!normalizedName || Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
      return NextResponse.json({ error: 'Valid name, startDate and endDate are required' }, { status: 400 });
    }

    const { academicYearRepository: repo } = await getAcademicServices();
    const existing = await repo.findById(body.id);

    if (!existing) {
      return NextResponse.json({ error: 'Academic year not found' }, { status: 404 });
    }

    if (
      existing.getOrganizationId() !== tenant.organizationId ||
      existing.getCoachingCenterId() !== tenant.coachingCenterId
    ) {
      return NextResponse.json({ error: 'Academic year does not belong to the selected tenant' }, { status: 403 });
    }

    const duplicateExists = await repo.existsByScopeAndPeriod({
      organizationId: tenant.organizationId,
      coachingCenterId: tenant.coachingCenterId,
      name: normalizedName,
      startDate,
      endDate,
      excludeId: body.id,
    });

    if (duplicateExists) {
      return NextResponse.json(
        { error: 'Another academic year already exists for this coaching center with the same name and dates.' },
        { status: 400 }
      );
    }

    const updated = new AcademicYear(body.id, {
      organizationId: tenant.organizationId,
      coachingCenterId: tenant.coachingCenterId,
      name: normalizedName,
      startDate,
      endDate,
      isActive: existing.isActiveYear(),
    });

    await repo.save(updated);

    await logAuditEvent({
      actorId: actor.getId(),
      actorRole: actor.getRole(),
      action: 'UPDATE_ACADEMIC_YEAR',
      organizationId: tenant.organizationId,
      coachingCenterId: tenant.coachingCenterId,
      ip: request.headers.get('x-forwarded-for') || undefined,
    });

    invalidateCacheByPrefix('api:admin:academic-options:');
    invalidateCacheByPrefix('api:admin:dashboard:overview:');
    return NextResponse.json({
      id: updated.getId(),
      name: updated.getName(),
      startDate: updated.getStartDate(),
      endDate: updated.getEndDate(),
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
    const actor = await requireActorWithPermission(Permission.CREATE_ACADEMIC_YEAR);
    const tenant = resolveActorTenant(request, actor);
    const id = request.nextUrl.searchParams.get('id') || undefined;

    if (!id) {
      return NextResponse.json({ error: 'Academic year id is required' }, { status: 400 });
    }

    const { academicYearRepository: repo } = await getAcademicServices();
    const existing = await repo.findById(id);

    if (!existing) {
      return NextResponse.json({ error: 'Academic year not found' }, { status: 404 });
    }

    if (
      existing.getOrganizationId() !== tenant.organizationId ||
      existing.getCoachingCenterId() !== tenant.coachingCenterId
    ) {
      return NextResponse.json({ error: 'Academic year does not belong to the selected tenant' }, { status: 403 });
    }

    const dependencyQuery = {
      organizationId: tenant.organizationId,
      coachingCenterId: tenant.coachingCenterId,
      academicYearId: id,
    };

    const [programsCount, enrollmentsCount, timetableEntriesCount, feePlansCount, feeAssignmentsCount, ledgerCount, paymentsCount, creditNotesCount] =
      await Promise.all([
        CoachingProgramModel.countDocuments(dependencyQuery),
        StudentEnrollmentModel.countDocuments(dependencyQuery),
        TimetableEntryModel.countDocuments(dependencyQuery),
        FeePlanModel.countDocuments(dependencyQuery),
        FeePlanAssignmentModel.countDocuments(dependencyQuery),
        StudentFeeLedgerModel.countDocuments(dependencyQuery),
        PaymentModel.countDocuments(dependencyQuery),
        CreditNoteModel.countDocuments(dependencyQuery),
      ]);

    const totalReferences =
      programsCount +
      enrollmentsCount +
      timetableEntriesCount +
      feePlansCount +
      feeAssignmentsCount +
      ledgerCount +
      paymentsCount +
      creditNotesCount;

    if (totalReferences > 0) {
      return NextResponse.json(
        {
          error: 'This academic year is already in use and cannot be deleted.',
          references: {
            programs: programsCount,
            enrollments: enrollmentsCount,
            timetableEntries: timetableEntriesCount,
            feePlans: feePlansCount,
            feeAssignments: feeAssignmentsCount,
            studentLedgerEntries: ledgerCount,
            payments: paymentsCount,
            creditNotes: creditNotesCount,
          },
        },
        { status: 400 }
      );
    }

    await repo.delete(id);

    await logAuditEvent({
      actorId: actor.getId(),
      actorRole: actor.getRole(),
      action: 'DELETE_ACADEMIC_YEAR',
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
