import { Result } from '@/shared/domain';
import { generateId } from '@/shared/lib/utils';
import { CoachingAttendanceRepository } from '../../domain/repositories';
import {
  CoachingAttendance,
  CoachingAttendanceStatus,
} from '../../domain/entities/CoachingAttendance';

export interface MarkCoachingAttendanceRequest {
  organizationId: string;
  coachingCenterId: string;
  programId: string;
  batchId: string;
  sessionId: string;
  studentId: string;
  status: CoachingAttendanceStatus;
  remarks?: string;
}

export class MarkCoachingAttendanceUseCase {
  constructor(private repo: CoachingAttendanceRepository) {}

  async execute(
    request: MarkCoachingAttendanceRequest
  ): Promise<Result<CoachingAttendance, string>> {
    try {
      const alreadyMarked = await this.repo.existsBySessionAndStudent(
        request.organizationId,
        request.coachingCenterId,
        request.sessionId,
        request.studentId
      );

      if (alreadyMarked) {
        return Result.fail('Attendance already marked for this student in the session');
      }

      const entity = CoachingAttendance.create(generateId(), request);
      await this.repo.save(entity);
      return Result.ok(entity);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return Result.fail(message);
    }
  }
}
