import { Result } from '@/shared/domain';
import { generateId } from '@/shared/lib/utils';
import { CoachingProgramRepository } from '../../domain/repositories';
import { CoachingProgram } from '../../domain/entities/CoachingProgram';

export interface CreateCoachingProgramRequest {
  organizationId: string;
  coachingCenterId: string;
  academicYearId: string;
  name: string;
  code?: string;
  classLevel?: string;
  board?: string;
  description?: string;
}

export class CreateCoachingProgramUseCase {
  constructor(private repo: CoachingProgramRepository) {}

  async execute(
    request: CreateCoachingProgramRequest
  ): Promise<Result<CoachingProgram, string>> {
    try {
      const program = CoachingProgram.create(generateId(), request);
      await this.repo.save(program);
      return Result.ok(program);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return Result.fail(message);
    }
  }
}
