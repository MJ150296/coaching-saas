import { NextRequest, NextResponse } from 'next/server';
import { ServiceKeys } from '@/shared/bootstrap';
import { initializeAppAndGetService } from '@/shared/bootstrap/init';
import { CreateOrganizationUseCase } from '@/domains/organization-management/application/use-cases';
import { Organization } from '@/domains/organization-management/domain/entities/Organization';
import { MongoOrganizationRepository } from '@/domains/organization-management/infrastructure/persistence';
import { UserRole } from '@/domains/user-management/domain/entities/User';
import { Permission } from '@/shared/infrastructure/rbac';
import { requireActorWithPermission } from '@/shared/infrastructure/admin-guards';
import { logAuditEvent } from '@/shared/infrastructure/audit-log';
import { getActorUser } from '@/shared/infrastructure/actor';

export async function GET() {
  try {
    const actor = await getActorUser();
    if (!actor) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const role = actor.getRole();
    if (
      role !== UserRole.SUPER_ADMIN &&
      role !== UserRole.ORGANIZATION_ADMIN &&
      role !== UserRole.SCHOOL_ADMIN &&
      role !== UserRole.ADMIN
    ) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const repo = await initializeAppAndGetService<MongoOrganizationRepository>(
      ServiceKeys.ORGANIZATION_REPOSITORY
    );
    let organizations: Organization[] = [];
    if (role === UserRole.SUPER_ADMIN) {
      organizations = await repo.findAll();
    } else if (actor.getOrganizationId()) {
      const org = await repo.findById(actor.getOrganizationId());
      organizations = org ? [org] : [];
    }

    const data = organizations.map((org) => ({
      id: org.getId(),
      name: org.getOrganizationName().getValue(),
      type: org.getType(),
      status: org.getStatus(),
    }));

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const actor = await requireActorWithPermission(Permission.CREATE_ORGANIZATION);
    if (actor.getRole() !== UserRole.SUPER_ADMIN) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const useCase = await initializeAppAndGetService<CreateOrganizationUseCase>(
      ServiceKeys.CREATE_ORGANIZATION_USE_CASE
    );
    const result = await useCase.execute(body);

    if (result.getIsFailure()) {
      return NextResponse.json({ error: result.getError() }, { status: 400 });
    }

    await logAuditEvent({
      actorId: actor.getId(),
      actorRole: actor.getRole(),
      action: 'CREATE_ORGANIZATION',
      targetId: result.getValue().organizationId,
      organizationId: result.getValue().organizationId,
      ip: request.headers.get('x-forwarded-for') || undefined,
    });

    return NextResponse.json(result.getValue(), { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed';
    const status = message === 'UNAUTHORIZED' ? 401 : message === 'FORBIDDEN' ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
