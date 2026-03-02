import { NextRequest, NextResponse } from 'next/server';
import { requireActorWithPermission } from '@/shared/infrastructure/admin-guards';
import { Permission, hasPermission } from '@/shared/infrastructure/rbac';
import { assertTenantScope, resolveTenantScope } from '@/shared/infrastructure/tenant';
import { ServiceKeys } from '@/shared/bootstrap/ServiceKeys';
import { initializeAppAndGetService } from '@/shared/bootstrap/init';
import { CreateCoachingProgramUseCase } from '@/domains/coaching-management/application/use-cases';
import { MongoCoachingProgramRepository } from '@/domains/coaching-management/infrastructure/persistence/MongoCoachingRepository';
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
    const requestedSchoolId = request.nextUrl.searchParams.get('schoolId') || undefined;
    const requestedAcademicYearId = request.nextUrl.searchParams.get('academicYearId') || undefined;
    const withMeta = request.nextUrl.searchParams.get('withMeta') === 'true';
    const limit = parsePositiveIntParam(request.nextUrl.searchParams.get('limit'), 500) ?? (withMeta ? 100 : 200);
    const offset = parsePositiveIntParam(request.nextUrl.searchParams.get('offset'), 50000) ?? 0;

    const tenant = resolveTenantScope(actor, requestedOrganizationId, requestedSchoolId);
    if (actor.getRole() !== UserRole.SUPER_ADMIN) {
      assertTenantScope(actor, tenant.organizationId, tenant.schoolId);
    }

    const repo = await initializeAppAndGetService<MongoCoachingProgramRepository>(
      ServiceKeys.COACHING_PROGRAM_REPOSITORY
    );

    const filtered = await repo.findByFilters({
      organizationId: tenant.organizationId,
      schoolId: tenant.schoolId,
      academicYearId: requestedAcademicYearId,
      limit,
      offset,
    });

    const items = filtered.map((program) => ({
      id: program.getId(),
      organizationId: program.getOrganizationId(),
      schoolId: program.getSchoolId(),
      academicYearId: program.getAcademicYearId(),
      name: program.getName(),
      code: program.getCode(),
      classLevel: program.getClassLevel(),
      board: program.getBoard(),
      description: program.getDescription(),
      status: program.getStatus(),
      createdAt: program.getCreatedAt(),
      updatedAt: program.getUpdatedAt(),
    }));

    if (!withMeta) {
      return NextResponse.json(items);
    }

    const total = await repo.countByFilters({
      organizationId: tenant.organizationId,
      schoolId: tenant.schoolId,
      academicYearId: requestedAcademicYearId,
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
    const tenant = resolveTenantScope(actor, body.organizationId, body.schoolId);

    if (actor.getRole() === UserRole.SUPER_ADMIN && (!tenant.organizationId || !tenant.schoolId)) {
      return NextResponse.json({ error: 'organizationId and schoolId are required' }, { status: 400 });
    }

    assertTenantScope(actor, tenant.organizationId, tenant.schoolId);

    const useCase = await initializeAppAndGetService<CreateCoachingProgramUseCase>(
      ServiceKeys.CREATE_COACHING_PROGRAM_USE_CASE
    );

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
      action: 'CREATE_COACHING_PROGRAM',
      targetId: created.getId(),
      organizationId: tenant.organizationId,
      schoolId: tenant.schoolId,
      ip: request.headers.get('x-forwarded-for') || undefined,
    });

    return NextResponse.json(
      {
        id: created.getId(),
        organizationId: created.getOrganizationId(),
        schoolId: created.getSchoolId(),
        academicYearId: created.getAcademicYearId(),
        name: created.getName(),
        code: created.getCode(),
        classLevel: created.getClassLevel(),
        board: created.getBoard(),
        description: created.getDescription(),
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
