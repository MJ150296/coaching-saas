import { NextRequest, NextResponse } from 'next/server';
import { requireActorWithPermission } from '@/shared/infrastructure/admin-guards';
import { Permission, hasPermission } from '@/shared/infrastructure/rbac';
import { assertTenantScope, resolveTenantScope } from '@/shared/infrastructure/tenant';
import { getActorUser } from '@/shared/infrastructure/actor';
import { UserRole } from '@/domains/user-management/domain/entities/User';
import { initializeApp } from '@/shared/bootstrap/init';
import {
  AcademicYearModel,
  ClassMasterModel,
  SectionModel,
  StudentEnrollmentModel,
} from '@/domains/academic-management/infrastructure/persistence/AcademicSchema';
import { UserModel } from '@/domains/user-management/infrastructure/persistence/UserSchema';
import { logAuditEvent } from '@/shared/infrastructure/audit-log';
import { parsePositiveIntParam } from '@/shared/lib/utils';

function normalizeId(value?: string): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function makeId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function serializeEnrollment(item: {
  _id: string;
  organizationId: string;
  coachingCenterId: string;
  academicYearId: string;
  studentId: string;
  classMasterId: string;
  sectionId?: string;
  rollNumber?: string;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: item._id,
    organizationId: item.organizationId,
    coachingCenterId: item.coachingCenterId,
    academicYearId: item.academicYearId,
    studentId: item.studentId,
    classMasterId: item.classMasterId,
    sectionId: item.sectionId,
    rollNumber: item.rollNumber,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  };
}

export async function GET(request: NextRequest) {
  try {
    const actor = await getActorUser();
    if (!actor) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!hasPermission(actor.getRole(), Permission.MANAGE_STUDENT_ENROLLMENT)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const requestedOrganizationId = normalizeId(request.nextUrl.searchParams.get('organizationId') || undefined);
    const requestedCoachingCenterId = normalizeId(request.nextUrl.searchParams.get('coachingCenterId') || undefined);
    const academicYearId = normalizeId(request.nextUrl.searchParams.get('academicYearId') || undefined);
    const classMasterId = normalizeId(request.nextUrl.searchParams.get('classMasterId') || undefined);
    const sectionId = normalizeId(request.nextUrl.searchParams.get('sectionId') || undefined);
    const studentId = normalizeId(request.nextUrl.searchParams.get('studentId') || undefined);
    const limit = parsePositiveIntParam(request.nextUrl.searchParams.get('limit'));
    const offset = parsePositiveIntParam(request.nextUrl.searchParams.get('offset'));

    const tenant = resolveTenantScope(actor, requestedOrganizationId, requestedCoachingCenterId);
    if (actor.getRole() !== UserRole.SUPER_ADMIN) {
      assertTenantScope(actor, tenant.organizationId, tenant.coachingCenterId);
    }

    if (!tenant.organizationId || !tenant.coachingCenterId) {
      return NextResponse.json({ error: 'organizationId and coachingCenterId are required' }, { status: 400 });
    }

    await initializeApp();

    const query: Record<string, string> = {
      organizationId: tenant.organizationId,
      coachingCenterId: tenant.coachingCenterId,
    };
    if (academicYearId) query.academicYearId = academicYearId;
    if (classMasterId) query.classMasterId = classMasterId;
    if (sectionId) query.sectionId = sectionId;
    if (studentId) query.studentId = studentId;

    let findQuery = StudentEnrollmentModel.find(query).sort({ createdAt: -1 });
    if (typeof offset === 'number' && offset > 0) {
      findQuery = findQuery.skip(offset);
    }
    if (typeof limit === 'number' && limit > 0) {
      findQuery = findQuery.limit(limit);
    }

    const [enrollments, total] = await Promise.all([
      findQuery,
      StudentEnrollmentModel.countDocuments(query),
    ]);
    return NextResponse.json({
      enrollments: enrollments.map((item) => serializeEnrollment(item)),
      total,
      limit: limit ?? null,
      offset: offset ?? 0,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed';
    const status = message === 'UNAUTHORIZED' ? 401 : message === 'FORBIDDEN' ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(request: NextRequest) {
  try {
    const actor = await requireActorWithPermission(Permission.MANAGE_STUDENT_ENROLLMENT);
    const body = await request.json();

    const tenant = resolveTenantScope(actor, body.organizationId, body.coachingCenterId);
    if (actor.getRole() === UserRole.SUPER_ADMIN && (!tenant.organizationId || !tenant.coachingCenterId)) {
      return NextResponse.json({ error: 'organizationId and coachingCenterId are required' }, { status: 400 });
    }
    assertTenantScope(actor, tenant.organizationId, tenant.coachingCenterId);

    const academicYearId = normalizeId(body.academicYearId);
    const studentId = normalizeId(body.studentId);
    const classMasterId = normalizeId(body.classMasterId);
    const sectionId = normalizeId(body.sectionId);
    const rollNumber = typeof body.rollNumber === 'string' ? body.rollNumber.trim() || undefined : undefined;

    if (!tenant.organizationId || !tenant.coachingCenterId || !academicYearId || !studentId || !classMasterId) {
      return NextResponse.json(
        { error: 'organizationId, coachingCenterId, academicYearId, studentId and classMasterId are required' },
        { status: 400 }
      );
    }

    await initializeApp();

    const [year, student, classMaster, section] = await Promise.all([
      AcademicYearModel.findById(academicYearId),
      UserModel.findById(studentId),
      ClassMasterModel.findById(classMasterId),
      sectionId ? SectionModel.findById(sectionId) : Promise.resolve(null),
    ]);

    if (!year || year.organizationId !== tenant.organizationId || year.coachingCenterId !== tenant.coachingCenterId) {
      return NextResponse.json({ error: 'Academic year not found in tenant scope' }, { status: 400 });
    }
    if (!student || student.role !== UserRole.STUDENT || student.organizationId !== tenant.organizationId || student.coachingCenterId !== tenant.coachingCenterId) {
      return NextResponse.json({ error: 'Student not found in tenant scope' }, { status: 400 });
    }
    if (!classMaster || classMaster.organizationId !== tenant.organizationId || classMaster.coachingCenterId !== tenant.coachingCenterId) {
      return NextResponse.json({ error: 'Class master not found in tenant scope' }, { status: 400 });
    }
    if (sectionId && (!section || section.organizationId !== tenant.organizationId || section.coachingCenterId !== tenant.coachingCenterId)) {
      return NextResponse.json({ error: 'Section not found in tenant scope' }, { status: 400 });
    }
    if (sectionId && section && section.classMasterId !== classMasterId) {
      return NextResponse.json({ error: 'Selected section does not belong to selected class' }, { status: 400 });
    }

    const updateSet: Record<string, string> = { classMasterId };
    if (sectionId) updateSet.sectionId = sectionId;
    if (rollNumber) updateSet.rollNumber = rollNumber;

    const updateUnset: Record<string, number> = {};
    if (!sectionId) updateUnset.sectionId = 1;
    if (!rollNumber) updateUnset.rollNumber = 1;

    const saved = await StudentEnrollmentModel.findOneAndUpdate(
      {
        organizationId: tenant.organizationId,
        coachingCenterId: tenant.coachingCenterId,
        academicYearId,
        studentId,
      },
      {
        $set: updateSet,
        ...(Object.keys(updateUnset).length > 0 ? { $unset: updateUnset } : {}),
        $setOnInsert: {
          _id: makeId('enrollment'),
          organizationId: tenant.organizationId,
          coachingCenterId: tenant.coachingCenterId,
          academicYearId,
          studentId,
        },
      },
      { upsert: true, new: true }
    );

    await logAuditEvent({
      actorId: actor.getId(),
      actorRole: actor.getRole(),
      action: 'MANAGE_STUDENT_ENROLLMENT',
      targetId: saved._id,
      organizationId: tenant.organizationId,
      coachingCenterId: tenant.coachingCenterId,
      ip: request.headers.get('x-forwarded-for') || undefined,
    });

    return NextResponse.json(serializeEnrollment(saved));
  } catch (error) {
    const duplicateKeyError =
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      (error as { code?: unknown }).code === 11000;
    if (duplicateKeyError) {
      return NextResponse.json(
        { error: 'Enrollment already exists for this student in the selected academic year.' },
        { status: 409 }
      );
    }
    const message = error instanceof Error ? error.message : 'Failed';
    const status = message === 'UNAUTHORIZED' ? 401 : message === 'FORBIDDEN' ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const actor = await requireActorWithPermission(Permission.MANAGE_STUDENT_ENROLLMENT);
    const body = await request.json();

    const id = normalizeId(body.id);
    const tenant = resolveTenantScope(actor, body.organizationId, body.coachingCenterId);
    if (actor.getRole() === UserRole.SUPER_ADMIN && (!tenant.organizationId || !tenant.coachingCenterId)) {
      return NextResponse.json({ error: 'organizationId and coachingCenterId are required' }, { status: 400 });
    }
    assertTenantScope(actor, tenant.organizationId, tenant.coachingCenterId);

    const academicYearId = normalizeId(body.academicYearId);
    const studentId = normalizeId(body.studentId);
    const classMasterId = normalizeId(body.classMasterId);
    const sectionId = normalizeId(body.sectionId);
    const rollNumber = typeof body.rollNumber === 'string' ? body.rollNumber.trim() || undefined : undefined;

    if (!id || !tenant.organizationId || !tenant.coachingCenterId || !academicYearId || !studentId || !classMasterId) {
      return NextResponse.json(
        { error: 'id, organizationId, coachingCenterId, academicYearId, studentId and classMasterId are required' },
        { status: 400 }
      );
    }

    await initializeApp();

    const existing = await StudentEnrollmentModel.findOne({
      _id: id,
      organizationId: tenant.organizationId,
      coachingCenterId: tenant.coachingCenterId,
    });
    if (!existing) {
      return NextResponse.json({ error: 'Enrollment not found' }, { status: 404 });
    }

    const [year, student, classMaster, section] = await Promise.all([
      AcademicYearModel.findById(academicYearId),
      UserModel.findById(studentId),
      ClassMasterModel.findById(classMasterId),
      sectionId ? SectionModel.findById(sectionId) : Promise.resolve(null),
    ]);

    if (!year || year.organizationId !== tenant.organizationId || year.coachingCenterId !== tenant.coachingCenterId) {
      return NextResponse.json({ error: 'Academic year not found in tenant scope' }, { status: 400 });
    }
    if (!student || student.role !== UserRole.STUDENT || student.organizationId !== tenant.organizationId || student.coachingCenterId !== tenant.coachingCenterId) {
      return NextResponse.json({ error: 'Student not found in tenant scope' }, { status: 400 });
    }
    if (!classMaster || classMaster.organizationId !== tenant.organizationId || classMaster.coachingCenterId !== tenant.coachingCenterId) {
      return NextResponse.json({ error: 'Class master not found in tenant scope' }, { status: 400 });
    }
    if (sectionId && (!section || section.organizationId !== tenant.organizationId || section.coachingCenterId !== tenant.coachingCenterId)) {
      return NextResponse.json({ error: 'Section not found in tenant scope' }, { status: 400 });
    }
    if (sectionId && section && section.classMasterId !== classMasterId) {
      return NextResponse.json({ error: 'Selected section does not belong to selected class' }, { status: 400 });
    }

    const duplicate = await StudentEnrollmentModel.findOne({
      organizationId: tenant.organizationId,
      coachingCenterId: tenant.coachingCenterId,
      academicYearId,
      studentId,
      _id: { $ne: id },
    });
    if (duplicate) {
      return NextResponse.json(
        { error: 'Enrollment already exists for this student in the selected academic year.' },
        { status: 409 }
      );
    }

    const updateSet: Record<string, string> = {
      academicYearId,
      studentId,
      classMasterId,
    };
    if (sectionId) updateSet.sectionId = sectionId;
    if (rollNumber) updateSet.rollNumber = rollNumber;

    const updateUnset: Record<string, number> = {};
    if (!sectionId) updateUnset.sectionId = 1;
    if (!rollNumber) updateUnset.rollNumber = 1;

    const updated = await StudentEnrollmentModel.findOneAndUpdate(
      {
        _id: id,
        organizationId: tenant.organizationId,
        coachingCenterId: tenant.coachingCenterId,
      },
      {
        $set: updateSet,
        ...(Object.keys(updateUnset).length > 0 ? { $unset: updateUnset } : {}),
      },
      { new: true }
    );
    if (!updated) {
      return NextResponse.json({ error: 'Enrollment not found' }, { status: 404 });
    }

    await logAuditEvent({
      actorId: actor.getId(),
      actorRole: actor.getRole(),
      action: 'MANAGE_STUDENT_ENROLLMENT',
      targetId: updated._id,
      organizationId: tenant.organizationId,
      coachingCenterId: tenant.coachingCenterId,
      ip: request.headers.get('x-forwarded-for') || undefined,
    });

    return NextResponse.json(serializeEnrollment(updated));
  } catch (error) {
    const duplicateKeyError =
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      (error as { code?: unknown }).code === 11000;
    if (duplicateKeyError) {
      return NextResponse.json(
        { error: 'Enrollment already exists for this student in the selected academic year.' },
        { status: 409 }
      );
    }
    const message = error instanceof Error ? error.message : 'Failed';
    const status = message === 'UNAUTHORIZED' ? 401 : message === 'FORBIDDEN' ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const actor = await requireActorWithPermission(Permission.MANAGE_STUDENT_ENROLLMENT);
    const requestedOrganizationId = normalizeId(request.nextUrl.searchParams.get('organizationId') || undefined);
    const requestedCoachingCenterId = normalizeId(request.nextUrl.searchParams.get('coachingCenterId') || undefined);
    const id = normalizeId(request.nextUrl.searchParams.get('id') || undefined);

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    const tenant = resolveTenantScope(actor, requestedOrganizationId, requestedCoachingCenterId);
    if (actor.getRole() === UserRole.SUPER_ADMIN && (!tenant.organizationId || !tenant.coachingCenterId)) {
      return NextResponse.json({ error: 'organizationId and coachingCenterId are required' }, { status: 400 });
    }
    assertTenantScope(actor, tenant.organizationId, tenant.coachingCenterId);

    await initializeApp();

    const deleted = await StudentEnrollmentModel.findOneAndDelete({
      _id: id,
      organizationId: tenant.organizationId,
      coachingCenterId: tenant.coachingCenterId,
    });

    if (!deleted) {
      return NextResponse.json({ error: 'Enrollment not found' }, { status: 404 });
    }

    await logAuditEvent({
      actorId: actor.getId(),
      actorRole: actor.getRole(),
      action: 'MANAGE_STUDENT_ENROLLMENT',
      targetId: id,
      organizationId: tenant.organizationId,
      coachingCenterId: tenant.coachingCenterId,
      ip: request.headers.get('x-forwarded-for') || undefined,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed';
    const status = message === 'UNAUTHORIZED' ? 401 : message === 'FORBIDDEN' ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
