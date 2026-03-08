import { Result } from '@/shared/domain';
import { AcademicYearRepository } from '../../domain/repositories';
import { AcademicYear } from '../../domain/entities/AcademicYear';
import { generateId } from '@/shared/lib/utils';

export interface CreateAcademicYearRequest {
  organizationId: string;
  coachingCenterId: string;
  name: string;
  startDate: string;
  endDate: string;
}

export class CreateAcademicYearUseCase {
  constructor(private repo: AcademicYearRepository) {}

  async execute(request: CreateAcademicYearRequest): Promise<Result<AcademicYear, string>> {
    try {
      const year = AcademicYear.create(generateId(), {
        organizationId: request.organizationId,
        coachingCenterId: request.coachingCenterId,
        name: request.name,
        startDate: new Date(request.startDate),
        endDate: new Date(request.endDate),
      });

      await this.repo.save(year);
      return Result.ok(year);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return Result.fail(message);
    }
  }
}
