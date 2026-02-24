import { NextRequest, NextResponse } from 'next/server';
import { requireActorWithPermission } from '@/shared/infrastructure/admin-guards';
import { Permission, hasPermission } from '@/shared/infrastructure/rbac';
import { assertTenantScope, resolveTenantScope } from '@/shared/infrastructure/tenant';
import { getActorUser } from '@/shared/infrastructure/actor';
import { UserRole } from '@/domains/user-management/domain/entities/User';
import { initializeApp } from '@/shared/bootstrap/init';
import {
  ISubjectAllocationDocument,
  SubjectAllocationModel,
  TimetableEntryModel,
} from '@/domains/academic-management/infrastructure/persistence/AcademicSchema';
import { logAuditEvent } from '@/shared/infrastructure/audit-log';
import { parsePositiveIntParam } from '@/shared/lib/utils';

const DEFAULT_WORKING_DAYS = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'];

interface TimetableGenerationPayload {
  organizationId?: string;
  schoolId?: string;
  academicYearId?: string;
  classMasterId?: string;
  sectionId?: string;
  periodsPerDay?: number;
  workingDays?: string[];
}

interface AllocationSlot {
  sourceAllocationId: string;
  subjectName: string;
  teacherId?: string;
}

interface TimetableSlot extends AllocationSlot {
  dayOfWeek: string;
  periodNumber: number;
}

function normalizeId(value?: string): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function normalizeWorkingDays(workingDays?: string[]): string[] {
  if (!Array.isArray(workingDays) || workingDays.length === 0) {
    return DEFAULT_WORKING_DAYS;
  }

  const normalized = workingDays
    .map((day) => String(day).trim().toUpperCase())
    .filter((day) => day.length > 0);

  if (normalized.length === 0) {
    return DEFAULT_WORKING_DAYS;
  }

  const uniqueDays = Array.from(new Set(normalized));
  return uniqueDays;
}

function expandAllocations(allocations: ISubjectAllocationDocument[]): AllocationSlot[] {
  const slots: AllocationSlot[] = [];
  for (const allocation of allocations) {
    const periods = Number(allocation.weeklyPeriods ?? 1);
    const safePeriods = Number.isFinite(periods) && periods > 0 ? Math.floor(periods) : 1;

    for (let index = 0; index < safePeriods; index += 1) {
      slots.push({
        sourceAllocationId: allocation._id,
        subjectName: allocation.subjectName,
        teacherId: allocation.teacherId,
      });
    }
  }
  return slots;
}

function buildTimetable(
  allocations: ISubjectAllocationDocument[],
  workingDays: string[],
  periodsPerDay: number
): TimetableSlot[] {
  const expanded = expandAllocations(allocations);
  const capacity = workingDays.length * periodsPerDay;

  if (expanded.length > capacity) {
    throw new Error(
      `Timetable capacity exceeded: ${expanded.length} requested slots for ${capacity} available slots.`
    );
  }

  const remainingByAllocation = new Map<string, number>();
  const slotByAllocation = new Map<string, AllocationSlot>();
  for (const slot of expanded) {
    remainingByAllocation.set(
      slot.sourceAllocationId,
      (remainingByAllocation.get(slot.sourceAllocationId) ?? 0) + 1
    );
    slotByAllocation.set(slot.sourceAllocationId, slot);
  }

  const keys = Array.from(remainingByAllocation.keys()).sort((left, right) => {
    const leftCount = remainingByAllocation.get(left) ?? 0;
    const rightCount = remainingByAllocation.get(right) ?? 0;
    if (rightCount !== leftCount) return rightCount - leftCount;
    return left.localeCompare(right);
  });

  const daySubjectUsage = new Map<string, Set<string>>();
  const output: TimetableSlot[] = [];
  let pointer = 0;

  for (const dayOfWeek of workingDays) {
    daySubjectUsage.set(dayOfWeek, new Set<string>());

    for (let periodNumber = 1; periodNumber <= periodsPerDay; periodNumber += 1) {
      const dayUsage = daySubjectUsage.get(dayOfWeek);
      if (!dayUsage) break;

      let selectedKey: string | undefined;

      for (let step = 0; step < keys.length; step += 1) {
        const key = keys[(pointer + step) % keys.length];
        const remaining = remainingByAllocation.get(key) ?? 0;
        if (remaining <= 0) continue;
        if (dayUsage.has(key)) continue;
        selectedKey = key;
        pointer = (pointer + step + 1) % keys.length;
        break;
      }

      if (!selectedKey) {
        for (let step = 0; step < keys.length; step += 1) {
          const key = keys[(pointer + step) % keys.length];
          const remaining = remainingByAllocation.get(key) ?? 0;
          if (remaining <= 0) continue;
          selectedKey = key;
          pointer = (pointer + step + 1) % keys.length;
          break;
        }
      }

      if (!selectedKey) {
        continue;
      }

      const remaining = (remainingByAllocation.get(selectedKey) ?? 0) - 1;
      remainingByAllocation.set(selectedKey, remaining);
      dayUsage.add(selectedKey);

      const allocation = slotByAllocation.get(selectedKey);
      if (!allocation) continue;

      output.push({
        ...allocation,
        dayOfWeek,
        periodNumber,
      });
    }
  }

  return output;
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
    const requestedSchoolId = request.nextUrl.searchParams.get('schoolId') || undefined;
    const tenant = resolveTenantScope(actor, requestedOrganizationId, requestedSchoolId);
    if (actor.getRole() !== UserRole.SUPER_ADMIN) {
      assertTenantScope(actor, tenant.organizationId, tenant.schoolId);
    }

    const academicYearId = normalizeId(request.nextUrl.searchParams.get('academicYearId') || undefined);
    const classMasterId = normalizeId(request.nextUrl.searchParams.get('classMasterId') || undefined);
    const sectionId = normalizeId(request.nextUrl.searchParams.get('sectionId') || undefined);
    const limit = parsePositiveIntParam(request.nextUrl.searchParams.get('limit'));
    const offset = parsePositiveIntParam(request.nextUrl.searchParams.get('offset'));

    if (!tenant.organizationId || !tenant.schoolId || !academicYearId || !classMasterId) {
      return NextResponse.json(
        { error: 'organizationId, schoolId, academicYearId and classMasterId are required' },
        { status: 400 }
      );
    }

    await initializeApp();

    const baseQuery = {
      organizationId: tenant.organizationId,
      schoolId: tenant.schoolId,
      academicYearId,
      classMasterId,
    };

    const query = sectionId
      ? { ...baseQuery, sectionId }
      : { ...baseQuery, sectionId: { $exists: false } };

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
        sourceAllocationId: entry.sourceAllocationId,
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
    const body = (await request.json()) as TimetableGenerationPayload;

    const tenant = resolveTenantScope(actor, body.organizationId, body.schoolId);
    if (actor.getRole() === UserRole.SUPER_ADMIN && (!tenant.organizationId || !tenant.schoolId)) {
      return NextResponse.json({ error: 'organizationId and schoolId are required' }, { status: 400 });
    }
    assertTenantScope(actor, tenant.organizationId, tenant.schoolId);

    const academicYearId = normalizeId(body.academicYearId);
    const classMasterId = normalizeId(body.classMasterId);
    const sectionId = normalizeId(body.sectionId);
    const periodsPerDay =
      Number.isFinite(Number(body.periodsPerDay)) && Number(body.periodsPerDay) > 0
        ? Math.floor(Number(body.periodsPerDay))
        : 8;
    const workingDays = normalizeWorkingDays(body.workingDays);

    if (!tenant.organizationId || !tenant.schoolId || !academicYearId || !classMasterId) {
      return NextResponse.json(
        { error: 'organizationId, schoolId, academicYearId and classMasterId are required' },
        { status: 400 }
      );
    }

    await initializeApp();

    const baseAllocationQuery = {
      organizationId: tenant.organizationId,
      schoolId: tenant.schoolId,
      academicYearId,
      classMasterId,
    };

    const allocations = sectionId
      ? await SubjectAllocationModel.find({
          ...baseAllocationQuery,
          $or: [{ sectionId }, { sectionId: { $exists: false } }],
        })
      : await SubjectAllocationModel.find({ ...baseAllocationQuery, sectionId: { $exists: false } });

    if (allocations.length === 0) {
      return NextResponse.json(
        { error: 'No subject allocations found for the selected scope' },
        { status: 400 }
      );
    }

    const timetable = buildTimetable(allocations, workingDays, periodsPerDay);

    if (sectionId) {
      await TimetableEntryModel.deleteMany({
        organizationId: tenant.organizationId,
        schoolId: tenant.schoolId,
        academicYearId,
        classMasterId,
        sectionId,
      });
    } else {
      await TimetableEntryModel.deleteMany({
        organizationId: tenant.organizationId,
        schoolId: tenant.schoolId,
        academicYearId,
        classMasterId,
        sectionId: { $exists: false },
      });
    }

    await TimetableEntryModel.insertMany(
      timetable.map((slot) => ({
        _id: `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
        organizationId: tenant.organizationId,
        schoolId: tenant.schoolId,
        academicYearId,
        classMasterId,
        sectionId,
        dayOfWeek: slot.dayOfWeek,
        periodNumber: slot.periodNumber,
        subjectName: slot.subjectName,
        teacherId: slot.teacherId,
        sourceAllocationId: slot.sourceAllocationId,
      }))
    );

    await logAuditEvent({
      actorId: actor.getId(),
      actorRole: actor.getRole(),
      action: 'GENERATE_TIMETABLE',
      organizationId: tenant.organizationId,
      schoolId: tenant.schoolId,
      ip: request.headers.get('x-forwarded-for') || undefined,
    });

    return NextResponse.json({
      success: true,
      generatedSlots: timetable.length,
      workingDays,
      periodsPerDay,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed';
    const status = message === 'UNAUTHORIZED' ? 401 : message === 'FORBIDDEN' ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
