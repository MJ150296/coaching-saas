import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/shared/infrastructure/auth';
import { ServiceKeys } from '@/shared/bootstrap/ServiceKeys';
import { initializeAppAndGetService } from '@/shared/bootstrap/init';
import { MongoUserRepository } from '@/domains/user-management/infrastructure/persistence/MongoUserRepository';
import { UserModel } from '@/domains/user-management/infrastructure/persistence/UserSchema';
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
import { invalidateCacheByPrefix } from '@/shared/infrastructure/api-response-cache';
import { getLogger } from '@/shared/infrastructure/logger';

export async function GET(request: NextRequest) {
  const logger = getLogger();
  const start = Date.now();
  const session = await getServerSession(authOptions);
  const role = session?.user?.role;
  if (
    !session ||
    (role !== UserRole.SUPER_ADMIN &&
      role !== UserRole.ORGANIZATION_ADMIN &&
      role !== UserRole.COACHING_ADMIN &&
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
  const withMeta = request.nextUrl.searchParams.get('withMeta') === 'true';
  const limit = parsePositiveIntParam(request.nextUrl.searchParams.get('limit'), 500) ?? (withMeta ? 100 : 200);
  const offset = parsePositiveIntParam(request.nextUrl.searchParams.get('offset'), 50000) ?? 0;

  const tenant = resolveTenantScope(actor, requestedOrganizationId, requestedSchoolId);
  if (actor.getRole() !== UserRole.SUPER_ADMIN) {
    assertTenantScope(actor, tenant.organizationId, tenant.schoolId);
  }

  await connectDB();
  const query: {
    role?: string;
    organizationId?: string;
    schoolId?: string;
  } = {};
  if (requestedRole) query.role = requestedRole;
  if (tenant.organizationId) query.organizationId = tenant.organizationId;
  if (tenant.schoolId) query.schoolId = tenant.schoolId;

  const items = await UserModel.find(query)
    .sort({ createdAt: -1 })
    .skip(offset)
    .limit(limit)
    .select('_id email firstName lastName role phone organizationId schoolId isActive emailVerified createdAt updatedAt')
    .lean<
      Array<{
        _id: string;
        email: string;
        firstName: string;
        lastName: string;
        role: UserRole;
        phone?: string;
        organizationId?: string;
        schoolId?: string;
        isActive: boolean;
        emailVerified: boolean;
        createdAt: Date;
        updatedAt: Date;
      }>
    >()
    .then((rows) =>
      rows.map((row) => ({
        id: row._id,
        email: row.email,
        firstName: row.firstName,
        lastName: row.lastName,
        role: row.role,
        phone: row.phone,
        organizationId: row.organizationId,
        schoolId: row.schoolId,
        isActive: row.isActive,
        emailVerified: row.emailVerified,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      }))
    );
  if (!withMeta) {
    logger.debug('GET /api/admin/users', {
      durationMs: Date.now() - start,
      count: items.length,
      withMeta,
      role: requestedRole ?? null,
      limit,
      offset,
    });
    return NextResponse.json(items);
  }

  const total = await UserModel.countDocuments(query);
  return NextResponse.json({
    items,
    total,
    limit,
    offset,
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
    if (typeof parent?.email !== 'string' || !parent.email.trim()) {
      return NextResponse.json({ error: 'Parent email is required for student creation' }, { status: 400 });
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
    const parentEmail = typeof parent?.email === 'string' ? parent.email.trim().toLowerCase() : '';
    let parentId = '';
    let createdParentId: string | null = null;
    let parentCreated = false;

    const existingParent = await repo.findByEmail(parentEmail);
    if (existingParent) {
      if (existingParent.getRole() !== UserRole.PARENT) {
        await repo.delete(result.getValue().user.id).catch(() => undefined);
        return NextResponse.json(
          { error: 'Parent email belongs to a non-parent user. Use a different email.' },
          { status: 400 }
        );
      }
      if (
        existingParent.getOrganizationId() !== tenant.organizationId ||
        existingParent.getSchoolId() !== tenant.schoolId
      ) {
        await repo.delete(result.getValue().user.id).catch(() => undefined);
        return NextResponse.json(
          { error: 'Parent email exists outside selected organization/school scope.' },
          { status: 400 }
        );
      }
      parentId = existingParent.getId();
    } else {
      if (!parent?.password || !parent?.firstName || !parent?.lastName) {
        await repo.delete(result.getValue().user.id).catch(() => undefined);
        return NextResponse.json(
          { error: 'Parent password, first name and last name are required when creating a new parent.' },
          { status: 400 }
        );
      }
      const parentResult = await useCase.execute({
        email: parentEmail,
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
      parentId = parentResult.getValue().user.id;
      createdParentId = parentId;
      parentCreated = true;
    }

    try {
      await connectDB();
      const existingLink = await ParentStudentLinkModel.findOne({
        parentId,
        studentId: result.getValue().user.id,
      }).lean<{ _id: string } | null>();

      if (!existingLink) {
        const linkId = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
        await ParentStudentLinkModel.create({
          _id: linkId,
          parentId,
          studentId: result.getValue().user.id,
          organizationId: tenant.organizationId,
          schoolId: tenant.schoolId,
        });
      }
    } catch {
      if (createdParentId) {
        await repo.delete(createdParentId).catch(() => undefined);
      }
      await repo.delete(result.getValue().user.id).catch(() => undefined);
      return NextResponse.json(
        { error: 'Failed to link parent and student. Rolled back user creation.' },
        { status: 500 }
      );
    }

    if (parentCreated && createdParentId) {
      await logAuditEvent({
        actorId: actor.getId(),
        actorRole: actor.getRole(),
        action: 'CREATE_USER',
        targetId: createdParentId,
        targetRole: UserRole.PARENT,
        organizationId: tenant.organizationId,
        schoolId: tenant.schoolId,
        ip: request.headers.get('x-forwarded-for') || undefined,
      });
    }
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

  invalidateCacheByPrefix('api:admin:dashboard:overview:');
  invalidateCacheByPrefix('api:admin:academic-options:');
  return NextResponse.json(result.getValue(), { status: 201 });
}
