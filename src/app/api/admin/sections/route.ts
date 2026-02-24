import { NextRequest, NextResponse } from 'next/server';
import { requireActorWithPermission } from '@/shared/infrastructure/admin-guards';
import { Permission, hasPermission } from '@/shared/infrastructure/rbac';
import { assertTenantScope, resolveTenantScope } from '@/shared/infrastructure/tenant';
import { ServiceKeys } from '@/shared/bootstrap/ServiceKeys';
import { initializeAppAndGetService } from '@/shared/bootstrap/init';
import { CreateSectionUseCase } from '@/domains/academic-management/application/use-cases';
import { MongoSectionRepository } from '@/domains/academic-management/infrastructure/persistence/MongoAcademicRepository';
import { logAuditEvent } from '@/shared/infrastructure/audit-log';
import { UserRole } from '@/domains/user-management/domain/entities/User';
import { getActorUser } from '@/shared/infrastructure/actor';
import { parsePositiveIntParam } from '@/shared/lib/utils';
import { invalidateCacheByPrefix } from '@/shared/infrastructure/api-response-cache';

export async function GET(request: NextRequest) {
  try {
    const actor = await getActorUser();
    if (!actor) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (
      !hasPermission(actor.getRole(), Permission.CREATE_SECTION) &&
      !hasPermission(actor.getRole(), Permission.CREATE_CLASS_MASTER)
    ) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const requestedOrganizationId =
      request.nextUrl.searchParams.get('organizationId') || undefined;
    const requestedSchoolId = request.nextUrl.searchParams.get('schoolId') || undefined;
    const requestedClassMasterId = request.nextUrl.searchParams.get('classMasterId') || undefined;
    const withMeta = request.nextUrl.searchParams.get('withMeta') === 'true';
    const limit = parsePositiveIntParam(request.nextUrl.searchParams.get('limit'), 500) ?? (withMeta ? 100 : 200);
    const offset = parsePositiveIntParam(request.nextUrl.searchParams.get('offset'), 50000) ?? 0;

    const tenant = resolveTenantScope(actor, requestedOrganizationId, requestedSchoolId);
    if (actor.getRole() !== UserRole.SUPER_ADMIN) {
      assertTenantScope(actor, tenant.organizationId, tenant.schoolId);
    }

    const repo = await initializeAppAndGetService<MongoSectionRepository>(
      ServiceKeys.SECTION_REPOSITORY
    );
    const filtered = await repo.findByFilters({
      organizationId: tenant.organizationId,
      schoolId: tenant.schoolId,
      classMasterId: requestedClassMasterId,
      limit,
      offset,
    });

    const items = filtered.map((item) => ({
      id: item.getId(),
      name: item.getName(),
      classMasterId: item.getClassMasterId(),
      classTeacherId: item.getClassTeacherId(),
      organizationId: item.getOrganizationId(),
      schoolId: item.getSchoolId(),
    }));

    if (!withMeta) {
      return NextResponse.json(items);
    }

    const total = await repo.countByFilters({
      organizationId: tenant.organizationId,
      schoolId: tenant.schoolId,
      classMasterId: requestedClassMasterId,
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
    const actor = await requireActorWithPermission(Permission.CREATE_SECTION);
    const body = await request.json();
    const tenant = resolveTenantScope(actor, body.organizationId, body.schoolId);
    if (actor.getRole() === UserRole.SUPER_ADMIN && (!tenant.organizationId || !tenant.schoolId)) {
      return NextResponse.json({ error: 'organizationId and schoolId are required' }, { status: 400 });
    }
    assertTenantScope(actor, tenant.organizationId, tenant.schoolId);

    const useCase = await initializeAppAndGetService<CreateSectionUseCase>(
      ServiceKeys.CREATE_SECTION_USE_CASE
    );
    const result = await useCase.execute({ ...body, ...tenant });

    if (result.getIsFailure()) {
      return NextResponse.json({ error: result.getError() }, { status: 400 });
    }

    await logAuditEvent({
      actorId: actor.getId(),
      actorRole: actor.getRole(),
      action: 'CREATE_SECTION',
      organizationId: tenant.organizationId,
      schoolId: tenant.schoolId,
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
