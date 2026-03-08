import { Result } from '@/shared/domain';
import { FeeTypeRepository } from '../../domain/repositories';
import { FeeType, FeeFrequency } from '../../domain/entities/FeeType';
import { generateId } from '@/shared/lib/utils';

export interface CreateFeeTypeRequest {
  organizationId: string;
  coachingCenterId: string;
  name: string;
  amount: number;
  frequency: FeeFrequency;
  isMandatory: boolean;
  isTaxable: boolean;
}

export class CreateFeeTypeUseCase {
  constructor(private repo: FeeTypeRepository) {}

  async execute(request: CreateFeeTypeRequest): Promise<Result<FeeType, string>> {
    try {
      const entity = FeeType.create(generateId(), request);
      await this.repo.save(entity);
      return Result.ok(entity);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return Result.fail(message);
    }
  }
}
