import { NextRequest, NextResponse } from 'next/server';
import { ServiceKeys } from '@/shared/bootstrap';
import { initializeAppAndGetService } from '@/shared/bootstrap/init';
import { CreateSchoolUseCase } from '@/domains/organization-management/application/use-cases';
import { School } from '@/domains/organization-management/domain/entities/School';
import { MongoSchoolRepository } from '@/domains/organization-management/infrastructure/persistence';
import { UserRole } from '@/domains/user-management/domain/entities/User';
import { Permission } from '@/shared/infrastructure/rbac';
import { requireActorWithPermission } from '@/shared/infrastructure/admin-guards';
import { logAuditEvent } from '@/shared/infrastructure/audit-log';
import { getActorUser } from '@/shared/infrastructure/actor';

export async function GET(request: NextRequest) {
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

    const repo = await initializeAppAndGetService<MongoSchoolRepository>(
      ServiceKeys.SCHOOL_REPOSITORY
    );

    const requestedOrganizationId = request.nextUrl.searchParams.get('organizationId') || undefined;

    let schools: School[] = [];
    if (role === UserRole.SUPER_ADMIN) {
      if (requestedOrganizationId) {
        schools = await repo.findByOrganizationId(requestedOrganizationId);
      } else {
        schools = await repo.findAll();
      }
    } else if (role === UserRole.ORGANIZATION_ADMIN || role === UserRole.ADMIN) {
      if (!actor.getOrganizationId()) {
        return NextResponse.json([], { status: 200 });
      }
      schools = await repo.findByOrganizationId(actor.getOrganizationId());
    } else if (role === UserRole.SCHOOL_ADMIN) {
      if (!actor.getSchoolId()) {
        return NextResponse.json([], { status: 200 });
      }
      const school = await repo.findById(actor.getSchoolId());
      schools = school ? [school] : [];
    }

    const data = schools.map((school) => ({
      id: school.getId(),
      organizationId: school.getOrganizationId(),
      name: school.getSchoolName().getValue(),
      code: school.getSchoolCode().getValue(),
      status: school.getStatus(),
    }));

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

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
