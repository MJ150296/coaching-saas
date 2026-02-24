import { NextRequest, NextResponse } from 'next/server';
import { requireActorWithPermission } from '@/shared/infrastructure/admin-guards';
import { Permission } from '@/shared/infrastructure/rbac';
import { assertTenantScope, resolveTenantScope } from '@/shared/infrastructure/tenant';
import { ServiceKeys } from '@/shared/bootstrap/ServiceKeys';
import { initializeAppAndGetService } from '@/shared/bootstrap/init';
import { CreateAcademicYearUseCase } from '@/domains/academic-management/application/use-cases';
import { MongoAcademicYearRepository } from '@/domains/academic-management/infrastructure/persistence/MongoAcademicRepository';
import { logAuditEvent } from '@/shared/infrastructure/audit-log';
import { UserRole } from '@/domains/user-management/domain/entities/User';
import { getActorUser } from '@/shared/infrastructure/actor';
import { hasPermission } from '@/shared/infrastructure/rbac';
import { parsePositiveIntParam } from '@/shared/lib/utils';

export async function GET(request: NextRequest) {
  try {
    const actor = await getActorUser();
    if (!actor) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (
      !hasPermission(actor.getRole(), Permission.CREATE_ACADEMIC_YEAR) &&
      !hasPermission(actor.getRole(), Permission.CREATE_CLASS_MASTER)
    ) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const requestedOrganizationId =
      request.nextUrl.searchParams.get('organizationId') || undefined;
    const requestedSchoolId = request.nextUrl.searchParams.get('schoolId') || undefined;
    const limit = parsePositiveIntParam(request.nextUrl.searchParams.get('limit'));
    const offset = parsePositiveIntParam(request.nextUrl.searchParams.get('offset'));
    const withMeta = request.nextUrl.searchParams.get('withMeta') === 'true';
    const tenant = resolveTenantScope(actor, requestedOrganizationId, requestedSchoolId);

    if (actor.getRole() !== UserRole.SUPER_ADMIN) {
      assertTenantScope(actor, tenant.organizationId, tenant.schoolId);
    }

    const repo = await initializeAppAndGetService<MongoAcademicYearRepository>(
      ServiceKeys.ACADEMIC_YEAR_REPOSITORY
    );
    const filtered = await repo.findByFilters({
      organizationId: tenant.organizationId,
      schoolId: tenant.schoolId,
      limit,
      offset,
    });

    const items = filtered.map((year) => ({
      id: year.getId(),
      name: year.getName(),
      startDate: year.getStartDate(),
      endDate: year.getEndDate(),
      organizationId: year.getOrganizationId(),
      schoolId: year.getSchoolId(),
    }));

    if (!withMeta) {
      return NextResponse.json(items);
    }

    const total = await repo.countByFilters({
      organizationId: tenant.organizationId,
      schoolId: tenant.schoolId,
    });
    return NextResponse.json({
      items,
      total,
      limit: limit ?? null,
      offset: offset ?? 0,
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
    const tenant = resolveTenantScope(actor, body.organizationId, body.schoolId);
    if (actor.getRole() === UserRole.SUPER_ADMIN && (!tenant.organizationId || !tenant.schoolId)) {
      return NextResponse.json({ error: 'organizationId and schoolId are required' }, { status: 400 });
    }
    assertTenantScope(actor, tenant.organizationId, tenant.schoolId);

    const useCase = await initializeAppAndGetService<CreateAcademicYearUseCase>(
      ServiceKeys.CREATE_ACADEMIC_YEAR_USE_CASE
    );
    const result = await useCase.execute({ ...body, ...tenant });

    if (result.getIsFailure()) {
      return NextResponse.json({ error: result.getError() }, { status: 400 });
    }

    await logAuditEvent({
      actorId: actor.getId(),
      actorRole: actor.getRole(),
      action: 'CREATE_ACADEMIC_YEAR',
      organizationId: tenant.organizationId,
      schoolId: tenant.schoolId,
      ip: request.headers.get('x-forwarded-for') || undefined,
    });

    return NextResponse.json(result.getValue(), { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed';
    const status = message === 'UNAUTHORIZED' ? 401 : message === 'FORBIDDEN' ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
