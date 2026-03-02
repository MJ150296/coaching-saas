import { NextRequest, NextResponse } from 'next/server';
import { UserRole } from '@/domains/user-management/domain/entities/User';
import { getActorUser } from '@/shared/infrastructure/actor';
import { ServiceKeys } from '@/shared/bootstrap/ServiceKeys';
import { initializeAppAndGetService } from '@/shared/bootstrap/init';
import { parsePositiveIntParam } from '@/shared/lib/utils';
import {
  CoachingAttendanceStatus,
} from '@/domains/coaching-management/domain/entities/CoachingAttendance';
import {
  MarkCoachingAttendanceUseCase,
} from '@/domains/coaching-management/application/use-cases';
import {
  MongoCoachingAttendanceRepository,
  MongoCoachingSessionRepository,
} from '@/domains/coaching-management/infrastructure/persistence/MongoCoachingRepository';
import { logAuditEvent } from '@/shared/infrastructure/audit-log';

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

    if (actor.getRole() !== UserRole.TEACHER) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const organizationId = actor.getOrganizationId();
    const schoolId = actor.getSchoolId();
    if (!organizationId || !schoolId) {
      return NextResponse.json({ items: [], total: 0, limit: 0, offset: 0 });
    }

    const requestedSessionId = request.nextUrl.searchParams.get('sessionId') || undefined;
    const requestedStudentId = request.nextUrl.searchParams.get('studentId') || undefined;
    const withMeta = request.nextUrl.searchParams.get('withMeta') === 'true';
    const limit =
      parsePositiveIntParam(request.nextUrl.searchParams.get('limit'), 500) ??
      (withMeta ? 100 : 200);
    const offset = parsePositiveIntParam(request.nextUrl.searchParams.get('offset'), 50000) ?? 0;

    if (!requestedSessionId) {
      return NextResponse.json(
        { error: 'sessionId is required for teacher attendance listing' },
        { status: 400 }
      );
    }

    const sessionRepo = await initializeAppAndGetService<MongoCoachingSessionRepository>(
      ServiceKeys.COACHING_SESSION_REPOSITORY
    );
    const session = await sessionRepo.findById(requestedSessionId);
    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    if (
      session.getOrganizationId() !== organizationId ||
      session.getSchoolId() !== schoolId ||
      session.getFacultyId() !== actor.getId()
    ) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const attendanceRepo = await initializeAppAndGetService<MongoCoachingAttendanceRepository>(
      ServiceKeys.COACHING_ATTENDANCE_REPOSITORY
    );

    const filtered = await attendanceRepo.findByFilters({
      organizationId,
      schoolId,
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

    const total = await attendanceRepo.countByFilters({
      organizationId,
      schoolId,
      sessionId: requestedSessionId,
      studentId: requestedStudentId,
    });

    return NextResponse.json({ items, total, limit, offset });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const actor = await getActorUser();
    if (!actor) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (actor.getRole() !== UserRole.TEACHER) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const organizationId = actor.getOrganizationId();
    const schoolId = actor.getSchoolId();
    if (!organizationId || !schoolId) {
      return NextResponse.json({ error: 'Teacher tenant scope is missing' }, { status: 400 });
    }

    const body = await request.json();
    const status = parseAttendanceStatus(body.status);
    if (!status) {
      return NextResponse.json({ error: 'Valid attendance status is required' }, { status: 400 });
    }

    const sessionId = typeof body.sessionId === 'string' ? body.sessionId.trim() : '';
    if (!sessionId) {
      return NextResponse.json({ error: 'sessionId is required' }, { status: 400 });
    }
    const studentId = typeof body.studentId === 'string' ? body.studentId.trim() : '';
    if (!studentId) {
      return NextResponse.json({ error: 'studentId is required' }, { status: 400 });
    }

    const sessionRepo = await initializeAppAndGetService<MongoCoachingSessionRepository>(
      ServiceKeys.COACHING_SESSION_REPOSITORY
    );
    const session = await sessionRepo.findById(sessionId);
    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    if (
      session.getOrganizationId() !== organizationId ||
      session.getSchoolId() !== schoolId ||
      session.getFacultyId() !== actor.getId()
    ) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const useCase = await initializeAppAndGetService<MarkCoachingAttendanceUseCase>(
      ServiceKeys.MARK_COACHING_ATTENDANCE_USE_CASE
    );

    const result = await useCase.execute({
      organizationId,
      schoolId,
      programId: session.getProgramId(),
      batchId: session.getBatchId(),
      sessionId: session.getId(),
      studentId,
      status,
      remarks: body.remarks,
    });

    if (result.getIsFailure()) {
      return NextResponse.json({ error: result.getError() }, { status: 400 });
    }

    const created = result.getValue();
    await logAuditEvent({
      actorId: actor.getId(),
      actorRole: actor.getRole(),
      action: 'TEACHER_MARK_COACHING_ATTENDANCE',
      targetId: created.getId(),
      organizationId,
      schoolId,
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
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
