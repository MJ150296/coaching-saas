import { Result } from '@/shared/domain';
import { ClassMasterRepository } from '../../domain/repositories';
import { ClassMaster } from '../../domain/entities/ClassMaster';
import { generateId } from '@/shared/lib/utils';

export interface CreateClassMasterRequest {
  organizationId: string;
  coachingCenterId: string;
  name: string;
  level?: string;
}

export class CreateClassMasterUseCase {
  constructor(private repo: ClassMasterRepository) {}

  async execute(request: CreateClassMasterRequest): Promise<Result<ClassMaster, string>> {
    try {
      const entity = ClassMaster.create(generateId(), {
        organizationId: request.organizationId,
        coachingCenterId: request.coachingCenterId,
        name: request.name,
        level: request.level,
      });

      await this.repo.save(entity);
      return Result.ok(entity);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return Result.fail(message);
    }
  }
}
