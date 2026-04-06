import { NextRequest, NextResponse } from 'next/server';
import { getCoachingServices } from '@/domains/coaching-management/bootstrap/getCoachingServices';
import { UserRole } from '@/domains/user-management/domain/entities/User';
import { getActorUser } from '@/shared/infrastructure/actor';
import { parsePositiveIntParam } from '@/shared/lib/utils';
import {
  CoachingAttendanceStatus,
} from '@/domains/coaching-management/domain/entities/CoachingAttendance';
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
    const coachingCenterId = actor.getCoachingCenterId();
    if (!organizationId || !coachingCenterId) {
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

    const { coachingSessionRepository: sessionRepo } = await getCoachingServices();
    const session = await sessionRepo.findById(requestedSessionId);
    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    if (
      session.getOrganizationId() !== organizationId ||
      session.getCoachingCenterId() !== coachingCenterId ||
      session.getFacultyId() !== actor.getId()
    ) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { coachingAttendanceRepository: attendanceRepo } = await getCoachingServices();

    const filtered = await attendanceRepo.findByFilters({
      organizationId,
      coachingCenterId,
      sessionId: requestedSessionId,
      studentId: requestedStudentId,
      limit,
      offset,
    });

    const items = filtered.map((attendance) => ({
      id: attendance.getId(),
      organizationId: attendance.getOrganizationId(),
      coachingCenterId: attendance.getCoachingCenterId(),
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
      coachingCenterId,
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
    const coachingCenterId = actor.getCoachingCenterId();
    if (!organizationId || !coachingCenterId) {
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

    const { coachingSessionRepository: sessionRepo } = await getCoachingServices();
    const session = await sessionRepo.findById(sessionId);
    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    if (
      session.getOrganizationId() !== organizationId ||
      session.getCoachingCenterId() !== coachingCenterId ||
      session.getFacultyId() !== actor.getId()
    ) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { markCoachingAttendanceUseCase: useCase } = await getCoachingServices();

    const result = await useCase.execute({
      organizationId,
      coachingCenterId,
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
      coachingCenterId,
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
        coachingCenterId: created.getCoachingCenterId(),
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
