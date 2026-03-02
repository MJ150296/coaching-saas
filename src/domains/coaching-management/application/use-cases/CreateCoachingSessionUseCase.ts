import { Result } from '@/shared/domain';
import { generateId } from '@/shared/lib/utils';
import { CoachingSessionRepository } from '../../domain/repositories';
import { CoachingSession } from '../../domain/entities/CoachingSession';

export interface CreateCoachingSessionRequest {
  organizationId: string;
  schoolId: string;
  programId: string;
  batchId: string;
  topic: string;
  sessionDate: Date;
  startsAt?: string;
  endsAt?: string;
  facultyId?: string;
}

export class CreateCoachingSessionUseCase {
  constructor(private repo: CoachingSessionRepository) {}

  async execute(request: CreateCoachingSessionRequest): Promise<Result<CoachingSession, string>> {
    try {
      const entity = CoachingSession.create(generateId(), request);
      await this.repo.save(entity);
      return Result.ok(entity);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return Result.fail(message);
    }
  }
}
