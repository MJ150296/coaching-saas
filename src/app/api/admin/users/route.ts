import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/shared/infrastructure/auth';
import { ServiceKeys } from '@/shared/bootstrap/ServiceKeys';
import { initializeAppAndGetService } from '@/shared/bootstrap/init';
import { MongoUserRepository } from '@/domains/user-management/infrastructure/persistence/MongoUserRepository';
import { UserMapper } from '@/domains/user-management/application/mappers/UserMapper';
import { UserRole } from '@/domains/user-management/domain/entities/User';
import { CreateUserUseCase } from '@/domains/user-management/application/use-cases';
import { canCreateRole } from '@/shared/infrastructure/role-policy';
import { assertTenantScope, resolveTenantScope } from '@/shared/infrastructure/tenant';
import { Permission, hasPermission } from '@/shared/infrastructure/rbac';
import { logAuditEvent } from '@/shared/infrastructure/audit-log';
import { ParentStudentLinkModel } from '@/domains/user-management/infrastructure/persistence/ParentStudentLinkSchema';
import { connectDB } from '@/shared/infrastructure/database';
import { getActorUser } from '@/shared/infrastructure/actor';
import { parsePositiveIntParam } from '@/shared/lib/utils';

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  const role = session?.user?.role;
  if (
    !session ||
    (role !== UserRole.SUPER_ADMIN &&
      role !== UserRole.ORGANIZATION_ADMIN &&
      role !== UserRole.SCHOOL_ADMIN &&
      role !== UserRole.ADMIN)
  ) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const actor = await getActorUser();
  if (!actor) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const requestedRole = request.nextUrl.searchParams.get('role') || undefined;
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

  const repo = await initializeAppAndGetService<MongoUserRepository>(ServiceKeys.USER_REPOSITORY);
  const users = await repo.findByFilters({
    role: requestedRole,
    organizationId: tenant.organizationId,
    schoolId: tenant.schoolId,
    limit,
    offset,
  });
  const items = users.map(UserMapper.toDTO);
  if (!withMeta) {
    return NextResponse.json(items);
  }

  const total = await repo.countByFilters({
    role: requestedRole,
    organizationId: tenant.organizationId,
    schoolId: tenant.schoolId,
  });
  return NextResponse.json({
    items,
    total,
    limit: limit ?? null,
    offset: offset ?? 0,
  });
}

export async function POST(request: NextRequest) {
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
  const targetRole: UserRole = body.role ?? UserRole.STUDENT;
  if (!canCreateRole(actor.getRole(), targetRole)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const tenant = resolveTenantScope(actor, body.organizationId, body.schoolId);
  if (actor.getRole() === UserRole.SUPER_ADMIN && targetRole !== UserRole.SUPER_ADMIN) {
    if (!tenant.organizationId || !tenant.schoolId) {
      return NextResponse.json({ error: 'organizationId and schoolId are required' }, { status: 400 });
    }
  }
  assertTenantScope(actor, tenant.organizationId, tenant.schoolId);

  const useCase = await initializeAppAndGetService<CreateUserUseCase>(
    ServiceKeys.CREATE_USER_USE_CASE
  );
  const repo = await initializeAppAndGetService<MongoUserRepository>(ServiceKeys.USER_REPOSITORY);

  if (targetRole === UserRole.STUDENT) {
    const parent = body.parent;
    if (!parent?.email || !parent?.password || !parent?.firstName || !parent?.lastName) {
      return NextResponse.json({ error: 'Parent details are required for student creation' }, { status: 400 });
    }
  }

  const result = await useCase.execute({
    email: body.email,
    password: body.password,
    firstName: body.firstName,
    lastName: body.lastName,
    phone: body.phone,
    role: targetRole,
    organizationId: tenant.organizationId,
    schoolId: tenant.schoolId,
  });

  if (result.getIsFailure()) {
    return NextResponse.json({ error: result.getError() }, { status: 400 });
  }

  // Auto-create parent when student is created
  if (targetRole === UserRole.STUDENT) {
    const parent = body.parent;

    const parentResult = await useCase.execute({
      email: parent.email,
      password: parent.password,
      firstName: parent.firstName,
      lastName: parent.lastName,
      phone: parent.phone,
      role: UserRole.PARENT,
      organizationId: tenant.organizationId,
      schoolId: tenant.schoolId,
    });

    if (parentResult.getIsFailure()) {
      await repo.delete(result.getValue().user.id).catch(() => undefined);
      return NextResponse.json({ error: parentResult.getError() }, { status: 400 });
    }

    const linkId = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    try {
      await connectDB();
      await ParentStudentLinkModel.create({
        _id: linkId,
        parentId: parentResult.getValue().user.id,
        studentId: result.getValue().user.id,
        organizationId: tenant.organizationId,
        schoolId: tenant.schoolId,
      });
    } catch {
      await repo.delete(parentResult.getValue().user.id).catch(() => undefined);
      await repo.delete(result.getValue().user.id).catch(() => undefined);
      return NextResponse.json(
        { error: 'Failed to link parent and student. Rolled back user creation.' },
        { status: 500 }
      );
    }

    await logAuditEvent({
      actorId: actor.getId(),
      actorRole: actor.getRole(),
      action: 'CREATE_USER',
      targetId: parentResult.getValue().user.id,
      targetRole: parentResult.getValue().user.role,
      organizationId: tenant.organizationId,
      schoolId: tenant.schoolId,
      ip: request.headers.get('x-forwarded-for') || undefined,
    });
  }

  await logAuditEvent({
    actorId: actor.getId(),
    actorRole: actor.getRole(),
    action: 'CREATE_USER',
    targetId: result.getValue().user.id,
    targetRole: result.getValue().user.role,
    organizationId: tenant.organizationId,
    schoolId: tenant.schoolId,
    ip: request.headers.get('x-forwarded-for') || undefined,
  });

  return NextResponse.json(result.getValue(), { status: 201 });
}
