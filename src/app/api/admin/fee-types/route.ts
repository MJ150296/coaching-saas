import { NextRequest, NextResponse } from 'next/server';
import { requireActorWithPermission } from '@/shared/infrastructure/admin-guards';
import { Permission } from '@/shared/infrastructure/rbac';
import { assertTenantScope, resolveTenantScope } from '@/shared/infrastructure/tenant';
import { ServiceKeys } from '@/shared/bootstrap';
import { initializeAppAndGetService } from '@/shared/bootstrap/init';
import { CreateFeeTypeUseCase } from '@/domains/fee-management/application/use-cases';
import { MongoFeeTypeRepository } from '@/domains/fee-management/infrastructure/persistence/MongoFeeRepository';
import { logAuditEvent } from '@/shared/infrastructure/audit-log';
import { UserRole } from '@/domains/user-management/domain/entities/User';
import { getActorUser } from '@/shared/infrastructure/actor';
import { hasPermission } from '@/shared/infrastructure/rbac';

export async function GET(request: NextRequest) {
  try {
    const actor = await getActorUser();
    if (!actor) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (
      !hasPermission(actor.getRole(), Permission.CREATE_FEE_TYPE) &&
      !hasPermission(actor.getRole(), Permission.CREATE_STUDENT_FEE_LEDGER)
    ) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const requestedOrganizationId =
      request.nextUrl.searchParams.get('organizationId') || undefined;
    const requestedSchoolId = request.nextUrl.searchParams.get('schoolId') || undefined;
    const tenant = resolveTenantScope(actor, requestedOrganizationId, requestedSchoolId);

    if (actor.getRole() !== UserRole.SUPER_ADMIN) {
      assertTenantScope(actor, tenant.organizationId, tenant.schoolId);
    }

    const repo = await initializeAppAndGetService<MongoFeeTypeRepository>(
      ServiceKeys.FEE_TYPE_REPOSITORY
    );
    const feeTypes = await repo.findAll();
    const filtered = feeTypes.filter((item) => {
      if (tenant.organizationId && item.getOrganizationId() !== tenant.organizationId) return false;
      if (tenant.schoolId && item.getSchoolId() !== tenant.schoolId) return false;
      return true;
    });

    return NextResponse.json(
      filtered.map((item) => ({
        id: item.getId(),
        name: item.getName(),
        amount: item.getAmount(),
        frequency: item.getFrequency(),
        organizationId: item.getOrganizationId(),
        schoolId: item.getSchoolId(),
      }))
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed';
    const status = message === 'UNAUTHORIZED' ? 401 : message === 'FORBIDDEN' ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(request: NextRequest) {
  try {
    const actor = await requireActorWithPermission(Permission.CREATE_FEE_TYPE);
    const body = await request.json();
    const tenant = resolveTenantScope(actor, body.organizationId, body.schoolId);
    if (actor.getRole() === UserRole.SUPER_ADMIN && (!tenant.organizationId || !tenant.schoolId)) {
      return NextResponse.json({ error: 'organizationId and schoolId are required' }, { status: 400 });
    }
    assertTenantScope(actor, tenant.organizationId, tenant.schoolId);

    const useCase = await initializeAppAndGetService<CreateFeeTypeUseCase>(
      ServiceKeys.CREATE_FEE_TYPE_USE_CASE
    );
    const result = await useCase.execute({ ...body, ...tenant });

    if (result.getIsFailure()) {
      return NextResponse.json({ error: result.getError() }, { status: 400 });
    }

    await logAuditEvent({
      actorId: actor.getId(),
      actorRole: actor.getRole(),
      action: 'CREATE_FEE_TYPE',
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
