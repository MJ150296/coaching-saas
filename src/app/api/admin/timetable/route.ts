import { NextRequest, NextResponse } from 'next/server';
import { requireActorWithPermission } from '@/shared/infrastructure/admin-guards';
import { Permission, hasPermission } from '@/shared/infrastructure/rbac';
import { assertTenantScope, resolveTenantScope } from '@/shared/infrastructure/tenant';
import { getActorUser } from '@/shared/infrastructure/actor';
import { UserRole } from '@/domains/user-management/domain/entities/User';
import { initializeApp } from '@/shared/bootstrap/init';
import {
  TimetableEntryModel,
} from '@/domains/academic-management/infrastructure/persistence/AcademicSchema';
import { logAuditEvent } from '@/shared/infrastructure/audit-log';
import { parsePositiveIntParam } from '@/shared/lib/utils';


interface TimetableEntryPayload {
  organizationId?: string;
  coachingCenterId?: string;
  academicYearId?: string;
  programId?: string;
  batchId?: string;
  dayOfWeek?: string;
  periodNumber?: number;
  subjectName?: string;
  teacherId?: string;
}

function normalizeId(value?: string): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}



export async function GET(request: NextRequest) {
  try {
    const actor = await getActorUser();
    if (!actor) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!hasPermission(actor.getRole(), Permission.CREATE_SUBJECT_ALLOCATION)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const requestedOrganizationId = request.nextUrl.searchParams.get('organizationId') || undefined;
    const requestedCoachingCenterId = request.nextUrl.searchParams.get('coachingCenterId') || undefined;
    const tenant = resolveTenantScope(actor, requestedOrganizationId, requestedCoachingCenterId);
    if (actor.getRole() !== UserRole.SUPER_ADMIN) {
      assertTenantScope(actor, tenant.organizationId, tenant.coachingCenterId);
    }

    const academicYearId = normalizeId(request.nextUrl.searchParams.get('academicYearId') || undefined);
    const programId = normalizeId(request.nextUrl.searchParams.get('programId') || undefined);
    const batchId = normalizeId(request.nextUrl.searchParams.get('batchId') || undefined);
    const limit = parsePositiveIntParam(request.nextUrl.searchParams.get('limit'));
    const offset = parsePositiveIntParam(request.nextUrl.searchParams.get('offset'));

    if (!tenant.organizationId || !tenant.coachingCenterId || !academicYearId || !programId) {
      return NextResponse.json(
        { error: 'organizationId, coachingCenterId, academicYearId and programId are required' },
        { status: 400 }
      );
    }

    await initializeApp();

    const baseQuery = {
      organizationId: tenant.organizationId,
      coachingCenterId: tenant.coachingCenterId,
      academicYearId,
      programId,
    };

    const query = batchId
      ? { ...baseQuery, batchId }
      : { ...baseQuery, batchId: { $exists: false } };

    let findQuery = TimetableEntryModel.find(query).sort({ dayOfWeek: 1, periodNumber: 1 });
    if (typeof offset === 'number' && offset > 0) {
      findQuery = findQuery.skip(offset);
    }
    if (typeof limit === 'number' && limit > 0) {
      findQuery = findQuery.limit(limit);
    }

    const [entries, total] = await Promise.all([
      findQuery,
      TimetableEntryModel.countDocuments(query),
    ]);

    return NextResponse.json({
      entries: entries.map((entry) => ({
        id: entry._id,
        dayOfWeek: entry.dayOfWeek,
        periodNumber: entry.periodNumber,
        subjectName: entry.subjectName,
        teacherId: entry.teacherId,
        programId: entry.programId,
        batchId: entry.batchId,
      })),
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
    const actor = await requireActorWithPermission(Permission.CREATE_SUBJECT_ALLOCATION);
    const body = (await request.json()) as TimetableEntryPayload;

    const tenant = resolveTenantScope(actor, body.organizationId, body.coachingCenterId);
    if (actor.getRole() === UserRole.SUPER_ADMIN && (!tenant.organizationId || !tenant.coachingCenterId)) {
      return NextResponse.json({ error: 'organizationId and coachingCenterId are required' }, { status: 400 });
    }
    assertTenantScope(actor, tenant.organizationId, tenant.coachingCenterId);

    const academicYearId = normalizeId(body.academicYearId);
    const programId = normalizeId(body.programId);
    const batchId = normalizeId(body.batchId);
    const dayOfWeek = typeof body.dayOfWeek === 'string' ? body.dayOfWeek.trim().toUpperCase() : undefined;
    const periodNumber = Number(body.periodNumber);
    const subjectName = typeof body.subjectName === 'string' ? body.subjectName.trim() : undefined;
    const teacherId = normalizeId(body.teacherId);

    if (!tenant.organizationId || !tenant.coachingCenterId || !academicYearId || !programId || !dayOfWeek || !periodNumber || !subjectName) {
      return NextResponse.json(
        { error: 'organizationId, coachingCenterId, academicYearId, programId, dayOfWeek, periodNumber and subjectName are required' },
        { status: 400 }
      );
    }

    if (!Number.isFinite(periodNumber) || periodNumber < 1) {
      return NextResponse.json({ error: 'periodNumber must be a positive integer' }, { status: 400 });
    }

    const validDays = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];
    if (!validDays.includes(dayOfWeek)) {
      return NextResponse.json({ error: 'dayOfWeek must be a valid day' }, { status: 400 });
    }

    await initializeApp();

    const existingEntry = await TimetableEntryModel.findOne({
      organizationId: tenant.organizationId,
      coachingCenterId: tenant.coachingCenterId,
      academicYearId,
      programId,
      batchId: batchId || { $exists: false },
      dayOfWeek,
      periodNumber,
    });

    if (existingEntry) {
      return NextResponse.json(
        { error: 'Timetable entry already exists for this slot' },
        { status: 409 }
      );
    }

    const entryId = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    const saved = await TimetableEntryModel.create({
      _id: entryId,
      organizationId: tenant.organizationId,
      coachingCenterId: tenant.coachingCenterId,
      academicYearId,
      programId,
      batchId: batchId || undefined,
      dayOfWeek,
      periodNumber,
      subjectName,
      teacherId: teacherId || undefined,
    });

    await logAuditEvent({
      actorId: actor.getId(),
      actorRole: actor.getRole(),
      action: 'CREATE_TIMETABLE_ENTRY',
      targetId: entryId,
      organizationId: tenant.organizationId,
      coachingCenterId: tenant.coachingCenterId,
      ip: request.headers.get('x-forwarded-for') || undefined,
    });

    return NextResponse.json({
      success: true,
      entry: {
        id: saved._id,
        dayOfWeek: saved.dayOfWeek,
        periodNumber: saved.periodNumber,
        subjectName: saved.subjectName,
        teacherId: saved.teacherId,
        programId: saved.programId,
        batchId: saved.batchId,
      },
    }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed';
    const status = message === 'UNAUTHORIZED' ? 401 : message === 'FORBIDDEN' ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
