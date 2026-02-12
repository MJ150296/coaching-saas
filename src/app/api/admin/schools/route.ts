import { NextRequest, NextResponse } from 'next/server';
import { ServiceKeys } from '@/shared/bootstrap';
import { initializeAppAndGetService } from '@/shared/bootstrap/init';
import { CreateSchoolUseCase } from '@/domains/organization-management/application/use-cases';
import { UserRole } from '@/domains/user-management/domain/entities/User';
import { Permission } from '@/shared/infrastructure/rbac';
import { requireActorWithPermission } from '@/shared/infrastructure/admin-guards';
import { logAuditEvent } from '@/shared/infrastructure/audit-log';

export async function POST(request: NextRequest) {
  try {
    const actor = await requireActorWithPermission(Permission.CREATE_SCHOOL);
    const body = await request.json();
    const organizationId = body.organizationId ?? actor.getOrganizationId();

    if (!organizationId) {
      return NextResponse.json({ error: 'organizationId is required' }, { status: 400 });
    }

    if (actor.getRole() !== UserRole.SUPER_ADMIN && organizationId !== actor.getOrganizationId()) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const useCase = await initializeAppAndGetService<CreateSchoolUseCase>(
      ServiceKeys.CREATE_SCHOOL_USE_CASE
    );
    const result = await useCase.execute({ ...body, organizationId });

    if (result.getIsFailure()) {
      return NextResponse.json({ error: result.getError() }, { status: 400 });
    }

    await logAuditEvent({
      actorId: actor.getId(),
      actorRole: actor.getRole(),
      action: 'CREATE_SCHOOL',
      targetId: result.getValue().schoolId,
      organizationId,
      schoolId: result.getValue().schoolId,
      ip: request.headers.get('x-forwarded-for') || undefined,
    });

    return NextResponse.json(result.getValue(), { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed';
    const status = message === 'UNAUTHORIZED' ? 401 : message === 'FORBIDDEN' ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
