import { NextRequest, NextResponse } from 'next/server';
import { requireActorWithPermission } from '@/shared/infrastructure/admin-guards';
import { Permission } from '@/shared/infrastructure/rbac';
import { assertTenantScope, resolveTenantScope } from '@/shared/infrastructure/tenant';
import { ServiceKeys } from '@/shared/bootstrap/ServiceKeys';
import { initializeAppAndGetService } from '@/shared/bootstrap/init';
import { CreateStudentFeeLedgerUseCase } from '@/domains/fee-management/application/use-cases';
import { logAuditEvent } from '@/shared/infrastructure/audit-log';
import { UserRole } from '@/domains/user-management/domain/entities/User';

export async function POST(request: NextRequest) {
  try {
    const actor = await requireActorWithPermission(Permission.CREATE_STUDENT_FEE_LEDGER);
    const body = await request.json();
    const tenant = resolveTenantScope(actor, body.organizationId, body.coachingCenterId);
    if (actor.getRole() === UserRole.SUPER_ADMIN && (!tenant.organizationId || !tenant.coachingCenterId)) {
      return NextResponse.json({ error: 'organizationId and coachingCenterId are required' }, { status: 400 });
    }
    assertTenantScope(actor, tenant.organizationId, tenant.coachingCenterId);

    const useCase = await initializeAppAndGetService<CreateStudentFeeLedgerUseCase>(
      ServiceKeys.CREATE_STUDENT_FEE_LEDGER_USE_CASE
    );
    const result = await useCase.execute({ ...body, ...tenant });

    if (result.getIsFailure()) {
      return NextResponse.json({ error: result.getError() }, { status: 400 });
    }

    await logAuditEvent({
      actorId: actor.getId(),
      actorRole: actor.getRole(),
      action: 'CREATE_STUDENT_FEE_LEDGER',
      organizationId: tenant.organizationId,
      coachingCenterId: tenant.coachingCenterId,
      ip: request.headers.get('x-forwarded-for') || undefined,
    });

    return NextResponse.json(result.getValue(), { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed';
    const status = message === 'UNAUTHORIZED' ? 401 : message === 'FORBIDDEN' ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
