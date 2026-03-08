import { Result } from '@/shared/domain';
import { FeePlanRepository } from '../../domain/repositories';
import { FeePlan, FeePlanItem } from '../../domain/entities/FeePlan';
import { generateId } from '@/shared/lib/utils';

export interface CreateFeePlanRequest {
  organizationId: string;
  coachingCenterId: string;
  academicYearId: string;
  name: string;
  items: FeePlanItem[];
}

export class CreateFeePlanUseCase {
  constructor(private repo: FeePlanRepository) {}

  async execute(request: CreateFeePlanRequest): Promise<Result<FeePlan, string>> {
    try {
      const entity = FeePlan.create(generateId(), request);
      await this.repo.save(entity);
      return Result.ok(entity);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return Result.fail(message);
    }
  }
}
