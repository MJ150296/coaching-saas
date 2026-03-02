import { Result } from '@/shared/domain';
import { generateId } from '@/shared/lib/utils';
import { CoachingEnrollmentRepository } from '../../domain/repositories';
import { CoachingEnrollment } from '../../domain/entities/CoachingEnrollment';

export interface CreateCoachingEnrollmentRequest {
  organizationId: string;
  schoolId: string;
  programId: string;
  batchId: string;
  studentId: string;
}

export class CreateCoachingEnrollmentUseCase {
  constructor(private repo: CoachingEnrollmentRepository) {}

  async execute(
    request: CreateCoachingEnrollmentRequest
  ): Promise<Result<CoachingEnrollment, string>> {
    try {
      const duplicate = await this.repo.existsByStudentInBatch(
        request.organizationId,
        request.schoolId,
        request.batchId,
        request.studentId
      );

      if (duplicate) {
        return Result.fail('Student is already enrolled in this coaching batch');
      }

      const entity = CoachingEnrollment.create(generateId(), request);
      await this.repo.save(entity);
      return Result.ok(entity);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return Result.fail(message);
    }
  }
}
