import { Result } from '@/shared/domain';
import { generateId } from '@/shared/lib/utils';
import { CoachingBatchRepository } from '../../domain/repositories';
import { CoachingBatch } from '../../domain/entities/CoachingBatch';

export interface CreateCoachingBatchRequest {
  organizationId: string;
  schoolId: string;
  programId: string;
  name: string;
  facultyId?: string;
  capacity: number;
  scheduleSummary?: string;
  startsOn?: Date;
  endsOn?: Date;
}

export class CreateCoachingBatchUseCase {
  constructor(private repo: CoachingBatchRepository) {}

  async execute(
    request: CreateCoachingBatchRequest
  ): Promise<Result<CoachingBatch, string>> {
    try {
      const entity = CoachingBatch.create(generateId(), request);
      await this.repo.save(entity);
      return Result.ok(entity);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return Result.fail(message);
    }
  }
}
