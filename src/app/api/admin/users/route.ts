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
import { SubjectAllocationModel, TimetableEntryModel, StudentEnrollmentModel } from '@/domains/academic-management/infrastructure/persistence/AcademicSchema';
import { CoachingBatchModel, CoachingSessionModel, CoachingEnrollmentModel, CoachingAttendanceModel } from '@/domains/coaching-management/infrastructure/persistence/CoachingSchema';
import { StudentFeeLedgerModel, PaymentModel, CreditNoteModel } from '@/domains/fee-management/infrastructure/persistence/FeeSchema';

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
  const requestedCoachingCenterId = request.nextUrl.searchParams.get('coachingCenterId') || undefined;
  const withMeta = request.nextUrl.searchParams.get('withMeta') === 'true';
  const search = request.nextUrl.searchParams.get('search') || undefined;
  const limit = parsePositiveIntParam(request.nextUrl.searchParams.get('limit'), 500) ?? (withMeta ? 100 : 200);
  const offset = parsePositiveIntParam(request.nextUrl.searchParams.get('offset'), 50000) ?? 0;

  const tenant = resolveTenantScope(actor, requestedOrganizationId, requestedCoachingCenterId);
  if (actor.getRole() !== UserRole.SUPER_ADMIN) {
    assertTenantScope(actor, tenant.organizationId, tenant.coachingCenterId);
  }

  await connectDB();
  const query: {
    role?: string;
    organizationId?: string;
    coachingCenterId?: string;
    $or?: Array<{
      firstName?: { $regex: string; $options: string };
      lastName?: { $regex: string; $options: string };
      email?: { $regex: string; $options: string };
      role?: { $regex: string; $options: string };
      phone?: { $regex: string; $options: string };
    }>;
  } = {};
  if (requestedRole) query.role = requestedRole;
  if (tenant.organizationId) query.organizationId = tenant.organizationId;
  if (tenant.coachingCenterId) query.coachingCenterId = tenant.coachingCenterId;
  
  // Add search functionality
  if (search && search.trim()) {
    const searchRegex = { $regex: search.trim(), $options: 'i' };
    query.$or = [
      { firstName: searchRegex },
      { lastName: searchRegex },
      { email: searchRegex },
      { role: searchRegex },
      { phone: searchRegex },
    ];
  }

  const items = await UserModel.find(query)
    .sort({ createdAt: -1 })
    .skip(offset)
    .limit(limit)
    .select('_id email firstName lastName role phone organizationId coachingCenterId isActive emailVerified createdAt updatedAt')
    .lean<
      Array<{
        _id: string;
        email: string;
        firstName: string;
        lastName: string;
        role: UserRole;
        phone?: string;
        organizationId?: string;
        coachingCenterId?: string;
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
        coachingCenterId: row.coachingCenterId,
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

  const tenant = resolveTenantScope(actor, body.organizationId, body.coachingCenterId);
  if (actor.getRole() === UserRole.SUPER_ADMIN && targetRole !== UserRole.SUPER_ADMIN) {
    if (!tenant.organizationId || !tenant.coachingCenterId) {
      return NextResponse.json({ error: 'organizationId and coachingCenterId are required' }, { status: 400 });
    }
  }
  assertTenantScope(actor, tenant.organizationId, tenant.coachingCenterId);

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
    coachingCenterId: tenant.coachingCenterId,
    schoolGrade: targetRole === UserRole.STUDENT ? body.schoolGrade : undefined,
    schoolName: targetRole === UserRole.STUDENT ? body.schoolName : undefined,
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
        existingParent.getCoachingCenterId() !== tenant.coachingCenterId
      ) {
        await repo.delete(result.getValue().user.id).catch(() => undefined);
        return NextResponse.json(
          { error: 'Parent email exists outside selected organization/coaching-center scope.' },
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
        coachingCenterId: tenant.coachingCenterId,
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
          coachingCenterId: tenant.coachingCenterId,
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
        coachingCenterId: tenant.coachingCenterId,
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
    coachingCenterId: tenant.coachingCenterId,
    ip: request.headers.get('x-forwarded-for') || undefined,
  });

  invalidateCacheByPrefix('api:admin:dashboard:overview:');
  invalidateCacheByPrefix('api:admin:academic-options:');
  return NextResponse.json(result.getValue(), { status: 201 });
}

export async function PUT(request: NextRequest) {
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
  const id = typeof body.id === 'string' ? body.id : '';
  if (!id) {
    return NextResponse.json({ error: 'User id is required' }, { status: 400 });
  }

  const existing = await UserModel.findById(id).lean<{
    _id: string;
    role: UserRole;
    organizationId?: string;
    coachingCenterId?: string;
    password: string;
    emailVerified: boolean;
    schoolGrade?: string;
    schoolName?: string;
  } | null>();

  if (!existing) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  if (actor.getId() === id && typeof body.isActive === 'boolean' && body.isActive === false) {
    return NextResponse.json({ error: 'You cannot deactivate your own account.' }, { status: 400 });
  }

  const tenant = resolveTenantScope(actor, body.organizationId ?? existing.organizationId, body.coachingCenterId ?? existing.coachingCenterId);
  assertTenantScope(actor, tenant.organizationId, tenant.coachingCenterId);

  if (
    existing.organizationId !== tenant.organizationId ||
    existing.coachingCenterId !== tenant.coachingCenterId
  ) {
    return NextResponse.json({ error: 'Teacher does not belong to the selected tenant.' }, { status: 403 });
  }

  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  const firstName = typeof body.firstName === 'string' ? body.firstName.trim() : '';
  const lastName = typeof body.lastName === 'string' ? body.lastName.trim() : '';
  const phone = typeof body.phone === 'string' ? body.phone.trim() : '';
  const isActive = typeof body.isActive === 'boolean' ? body.isActive : true;

  if (!email || !firstName || !lastName) {
    return NextResponse.json({ error: 'email, firstName and lastName are required' }, { status: 400 });
  }

  const duplicate = await UserModel.findOne({ email, _id: { $ne: id } }).lean<{ _id: string } | null>();
  if (duplicate) {
    return NextResponse.json({ error: 'Another user already exists with this email.' }, { status: 400 });
  }

  await UserModel.findByIdAndUpdate(id, {
    email,
    firstName,
    lastName,
    phone: phone || undefined,
    isActive,
  });

  await logAuditEvent({
    actorId: actor.getId(),
    actorRole: actor.getRole(),
    action: 'UPDATE_USER',
    targetId: id,
    targetRole: existing.role,
    organizationId: tenant.organizationId,
    coachingCenterId: tenant.coachingCenterId,
    ip: request.headers.get('x-forwarded-for') || undefined,
  });

  invalidateCacheByPrefix('api:admin:dashboard:overview:');
  invalidateCacheByPrefix('api:admin:academic-options:');

  return NextResponse.json({
    id,
    email,
    firstName,
    lastName,
    phone: phone || undefined,
    role: existing.role,
    organizationId: tenant.organizationId,
    coachingCenterId: tenant.coachingCenterId,
    isActive,
    emailVerified: existing.emailVerified,
    schoolGrade: existing.schoolGrade,
    schoolName: existing.schoolName,
  });
}

export async function DELETE(request: NextRequest) {
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

  const id = request.nextUrl.searchParams.get('id') || '';
  const requestedOrganizationId = request.nextUrl.searchParams.get('organizationId') || undefined;
  const requestedCoachingCenterId = request.nextUrl.searchParams.get('coachingCenterId') || undefined;

  if (!id) {
    return NextResponse.json({ error: 'User id is required' }, { status: 400 });
  }

  const existing = await UserModel.findById(id).lean<{
    _id: string;
    role: UserRole;
    organizationId?: string;
    coachingCenterId?: string;
  } | null>();

  if (!existing) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  if (actor.getId() === id) {
    return NextResponse.json({ error: 'You cannot delete your own account.' }, { status: 400 });
  }

  const tenant = resolveTenantScope(actor, requestedOrganizationId ?? existing.organizationId, requestedCoachingCenterId ?? existing.coachingCenterId);
  assertTenantScope(actor, tenant.organizationId, tenant.coachingCenterId);

  if (
    existing.organizationId !== tenant.organizationId ||
    existing.coachingCenterId !== tenant.coachingCenterId
  ) {
    return NextResponse.json({ error: 'Teacher does not belong to the selected tenant.' }, { status: 403 });
  }

  if (existing.role === UserRole.TEACHER) {
    const [subjectAllocations, timetableEntries, coachingBatches, coachingSessions] = await Promise.all([
      SubjectAllocationModel.countDocuments({ organizationId: tenant.organizationId, coachingCenterId: tenant.coachingCenterId, teacherId: id }),
      TimetableEntryModel.countDocuments({ organizationId: tenant.organizationId, coachingCenterId: tenant.coachingCenterId, teacherId: id }),
      CoachingBatchModel.countDocuments({ organizationId: tenant.organizationId, coachingCenterId: tenant.coachingCenterId, facultyId: id }),
      CoachingSessionModel.countDocuments({ organizationId: tenant.organizationId, coachingCenterId: tenant.coachingCenterId, facultyId: id }),
    ]);

    if (subjectAllocations + timetableEntries + coachingBatches + coachingSessions > 0) {
      return NextResponse.json(
        {
          error: 'Teacher is already assigned in academic or coaching records and cannot be deleted.',
          references: {
            subjectAllocations,
            timetableEntries,
            coachingBatches,
            coachingSessions,
          },
        },
        { status: 400 }
      );
    }
  }

  if (existing.role === UserRole.STUDENT) {
    const [parentLinks, academicEnrollments, coachingEnrollments, coachingAttendance, ledgerEntries, payments, creditNotes] = await Promise.all([
      ParentStudentLinkModel.countDocuments({ organizationId: tenant.organizationId, coachingCenterId: tenant.coachingCenterId, studentId: id }),
      StudentEnrollmentModel.countDocuments({ organizationId: tenant.organizationId, coachingCenterId: tenant.coachingCenterId, studentId: id }),
      CoachingEnrollmentModel.countDocuments({ organizationId: tenant.organizationId, coachingCenterId: tenant.coachingCenterId, studentId: id }),
      CoachingAttendanceModel.countDocuments({ organizationId: tenant.organizationId, coachingCenterId: tenant.coachingCenterId, studentId: id }),
      StudentFeeLedgerModel.countDocuments({ organizationId: tenant.organizationId, coachingCenterId: tenant.coachingCenterId, studentId: id }),
      PaymentModel.countDocuments({ organizationId: tenant.organizationId, coachingCenterId: tenant.coachingCenterId, studentId: id }),
      CreditNoteModel.countDocuments({ organizationId: tenant.organizationId, coachingCenterId: tenant.coachingCenterId, studentId: id }),
    ]);

    if (parentLinks + academicEnrollments + coachingEnrollments + coachingAttendance + ledgerEntries + payments + creditNotes > 0) {
      return NextResponse.json(
        {
          error: 'Student is already used in enrollment, attendance, parent-link, or fee records and cannot be deleted.',
          references: {
            parentLinks,
            academicEnrollments,
            coachingEnrollments,
            coachingAttendance,
            ledgerEntries,
            payments,
            creditNotes,
          },
        },
        { status: 400 }
      );
    }
  }

  if (existing.role === UserRole.PARENT) {
    const childLinks = await ParentStudentLinkModel.countDocuments({
      organizationId: tenant.organizationId,
      coachingCenterId: tenant.coachingCenterId,
      parentId: id,
    });

    if (childLinks > 0) {
      return NextResponse.json(
        {
          error: 'Parent is linked to student records and cannot be deleted.',
          references: { childLinks },
        },
        { status: 400 }
      );
    }
  }

  await UserModel.findByIdAndDelete(id);

  await logAuditEvent({
    actorId: actor.getId(),
    actorRole: actor.getRole(),
    action: 'DELETE_USER',
    targetId: id,
    targetRole: existing.role,
    organizationId: tenant.organizationId,
    coachingCenterId: tenant.coachingCenterId,
    ip: request.headers.get('x-forwarded-for') || undefined,
  });

  invalidateCacheByPrefix('api:admin:dashboard:overview:');
  invalidateCacheByPrefix('api:admin:academic-options:');

  return NextResponse.json({ success: true });
}
