import { NextRequest, NextResponse } from 'next/server';
import { requireActorWithPermission } from '@/shared/infrastructure/admin-guards';
import { Permission, hasPermission } from '@/shared/infrastructure/rbac';
import { assertTenantScope, resolveTenantScope } from '@/shared/infrastructure/tenant';
import { ServiceKeys } from '@/shared/bootstrap/ServiceKeys';
import { initializeAppAndGetService } from '@/shared/bootstrap/init';
import { MarkCoachingAttendanceUseCase } from '@/domains/coaching-management/application/use-cases';
import { MongoCoachingAttendanceRepository } from '@/domains/coaching-management/infrastructure/persistence/MongoCoachingRepository';
import {
  CoachingAttendanceStatus,
} from '@/domains/coaching-management/domain/entities/CoachingAttendance';
import { logAuditEvent } from '@/shared/infrastructure/audit-log';
import { UserRole } from '@/domains/user-management/domain/entities/User';
import { getActorUser } from '@/shared/infrastructure/actor';
import { parsePositiveIntParam } from '@/shared/lib/utils';

function parseAttendanceStatus(value: unknown): CoachingAttendanceStatus | undefined {
  if (typeof value !== 'string') return undefined;
  if (!Object.values(CoachingAttendanceStatus).includes(value as CoachingAttendanceStatus)) {
    return undefined;
  }
  return value as CoachingAttendanceStatus;
}

export async function GET(request: NextRequest) {
  try {
    const actor = await getActorUser();
    if (!actor) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!hasPermission(actor.getRole(), Permission.MANAGE_COACHING)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const requestedOrganizationId = request.nextUrl.searchParams.get('organizationId') || undefined;
    const requestedSchoolId = request.nextUrl.searchParams.get('schoolId') || undefined;
    const requestedSessionId = request.nextUrl.searchParams.get('sessionId') || undefined;
    const requestedStudentId = request.nextUrl.searchParams.get('studentId') || undefined;
    const withMeta = request.nextUrl.searchParams.get('withMeta') === 'true';
    const limit = parsePositiveIntParam(request.nextUrl.searchParams.get('limit'), 500) ?? (withMeta ? 100 : 200);
    const offset = parsePositiveIntParam(request.nextUrl.searchParams.get('offset'), 50000) ?? 0;

    const tenant = resolveTenantScope(actor, requestedOrganizationId, requestedSchoolId);
    if (actor.getRole() !== UserRole.SUPER_ADMIN) {
      assertTenantScope(actor, tenant.organizationId, tenant.schoolId);
    }

    const repo = await initializeAppAndGetService<MongoCoachingAttendanceRepository>(
      ServiceKeys.COACHING_ATTENDANCE_REPOSITORY
    );

    const filtered = await repo.findByFilters({
      organizationId: tenant.organizationId,
      schoolId: tenant.schoolId,
      sessionId: requestedSessionId,
      studentId: requestedStudentId,
      limit,
      offset,
    });

    const items = filtered.map((attendance) => ({
      id: attendance.getId(),
      organizationId: attendance.getOrganizationId(),
      schoolId: attendance.getSchoolId(),
      programId: attendance.getProgramId(),
      batchId: attendance.getBatchId(),
      sessionId: attendance.getSessionId(),
      studentId: attendance.getStudentId(),
      status: attendance.getStatus(),
      remarks: attendance.getRemarks(),
      markedAt: attendance.getMarkedAt(),
      createdAt: attendance.getCreatedAt(),
      updatedAt: attendance.getUpdatedAt(),
    }));

    if (!withMeta) {
      return NextResponse.json(items);
    }

    const total = await repo.countByFilters({
      organizationId: tenant.organizationId,
      schoolId: tenant.schoolId,
      sessionId: requestedSessionId,
      studentId: requestedStudentId,
    });

    return NextResponse.json({ items, total, limit, offset });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed';
    const status = message === 'UNAUTHORIZED' ? 401 : message === 'FORBIDDEN' ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(request: NextRequest) {
  try {
    const actor = await requireActorWithPermission(Permission.MANAGE_COACHING);
    const body = await request.json();
    const tenant = resolveTenantScope(actor, body.organizationId, body.schoolId);

    if (actor.getRole() === UserRole.SUPER_ADMIN && (!tenant.organizationId || !tenant.schoolId)) {
      return NextResponse.json({ error: 'organizationId and schoolId are required' }, { status: 400 });
    }

    assertTenantScope(actor, tenant.organizationId, tenant.schoolId);

    const status = parseAttendanceStatus(body.status);
    if (!status) {
      return NextResponse.json({ error: 'Valid attendance status is required' }, { status: 400 });
    }

    const useCase = await initializeAppAndGetService<MarkCoachingAttendanceUseCase>(
      ServiceKeys.MARK_COACHING_ATTENDANCE_USE_CASE
    );

    const result = await useCase.execute({
      ...body,
      ...tenant,
      status,
    });

    if (result.getIsFailure()) {
      return NextResponse.json({ error: result.getError() }, { status: 400 });
    }

    const created = result.getValue();
    await logAuditEvent({
      actorId: actor.getId(),
      actorRole: actor.getRole(),
      action: 'MARK_COACHING_ATTENDANCE',
      targetId: created.getId(),
      organizationId: tenant.organizationId,
      schoolId: tenant.schoolId,
      ip: request.headers.get('x-forwarded-for') || undefined,
      metadata: {
        sessionId: created.getSessionId(),
        studentId: created.getStudentId(),
      },
    });

    return NextResponse.json(
      {
        id: created.getId(),
        organizationId: created.getOrganizationId(),
        schoolId: created.getSchoolId(),
        programId: created.getProgramId(),
        batchId: created.getBatchId(),
        sessionId: created.getSessionId(),
        studentId: created.getStudentId(),
        status: created.getStatus(),
        remarks: created.getRemarks(),
        markedAt: created.getMarkedAt(),
        createdAt: created.getCreatedAt(),
        updatedAt: created.getUpdatedAt(),
      },
      { status: 201 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed';
    const status = message === 'UNAUTHORIZED' ? 401 : message === 'FORBIDDEN' ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
