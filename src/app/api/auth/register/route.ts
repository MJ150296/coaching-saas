import { NextRequest, NextResponse } from 'next/server';
import { ServiceKeys } from '@/shared/bootstrap/ServiceKeys';
import { initializeAppAndGetService } from '@/shared/bootstrap/init';
import { CreateUserUseCase } from '@/domains/user-management/application/use-cases';
import { UserRole } from '@/domains/user-management/domain/entities/User';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/shared/infrastructure/auth';
import { canCreateRole } from '@/shared/infrastructure/role-policy';
import { getActorUser } from '@/shared/infrastructure/actor';
import { assertTenantScope, resolveTenantScope } from '@/shared/infrastructure/tenant';
import { Permission, hasPermission } from '@/shared/infrastructure/rbac';
import { logAuditEvent } from '@/shared/infrastructure/audit-log';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const actor = await getActorUser();
    if (!actor) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!hasPermission(actor.getRole(), Permission.CREATE_USER)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const useCase = await initializeAppAndGetService<CreateUserUseCase>(
      ServiceKeys.CREATE_USER_USE_CASE
    );

    const targetRole: UserRole = body.role ?? UserRole.STUDENT;
    if (!canCreateRole(actor.getRole(), targetRole)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const tenant = resolveTenantScope(actor, body.organizationId, body.coachingCenterId);
    if (actor.getRole() === UserRole.SUPER_ADMIN && targetRole !== UserRole.SUPER_ADMIN) {
      if (!tenant.organizationId || !tenant.coachingCenterId) {
        return NextResponse.json({ error: 'organizationId and coachingCenterId are required' }, { status: 400 });
      }
    }
    assertTenantScope(actor, tenant.organizationId, tenant.coachingCenterId);

    const result = await useCase.execute({
      email: body.email,
      password: body.password,
      firstName: body.firstName,
      lastName: body.lastName,
      phone: body.phone,
      role: targetRole,
      organizationId: tenant.organizationId,
      coachingCenterId: tenant.coachingCenterId,
      coachingCenterId: tenant.coachingCenterId,
    });

    if (result.getIsFailure()) {
      return NextResponse.json({ error: result.getError() }, { status: 400 });
    }

    await logAuditEvent({
      actorId: actor.getId(),
      actorRole: actor.getRole(),
      action: 'CREATE_USER',
      targetId: result.getValue().user.id,
      targetRole: result.getValue().user.role,
      organizationId: tenant.organizationId,
      coachingCenterId: tenant.coachingCenterId,
      ip: request.headers.get('x-forwarded-for') || undefined,
    });

    return NextResponse.json(result.getValue(), { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Registration failed' },
      { status: 500 }
    );
  }
}
