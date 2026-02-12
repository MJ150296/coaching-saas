import { Result } from '@/shared/domain';
import { FeePlanAssignmentRepository } from '../../domain/repositories';
import { FeePlanAssignment } from '../../domain/entities/FeePlanAssignment';
import { generateId } from '@/shared/lib/utils';

export interface AssignFeePlanRequest {
  organizationId: string;
  schoolId: string;
  academicYearId: string;
  feePlanId: string;
  classMasterId: string;
  sectionId?: string;
}

export class AssignFeePlanUseCase {
  constructor(private repo: FeePlanAssignmentRepository) {}

  async execute(request: AssignFeePlanRequest): Promise<Result<FeePlanAssignment, string>> {
    try {
      const entity = FeePlanAssignment.create(generateId(), request);
      await this.repo.save(entity);
      return Result.ok(entity);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return Result.fail(message);
    }
  }
}
