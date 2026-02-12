import { Result } from '@/shared/domain';
import { SubjectAllocationRepository } from '../../domain/repositories';
import { SubjectAllocation } from '../../domain/entities/SubjectAllocation';
import { generateId } from '@/shared/lib/utils';

export interface CreateSubjectAllocationRequest {
  organizationId: string;
  schoolId: string;
  academicYearId: string;
  classMasterId: string;
  sectionId?: string;
  subjectName: string;
  teacherId?: string;
  weeklyPeriods?: number;
}

export class CreateSubjectAllocationUseCase {
  constructor(private repo: SubjectAllocationRepository) {}

  async execute(request: CreateSubjectAllocationRequest): Promise<Result<SubjectAllocation, string>> {
    try {
      const entity = SubjectAllocation.create(generateId(), {
        organizationId: request.organizationId,
        schoolId: request.schoolId,
        academicYearId: request.academicYearId,
        classMasterId: request.classMasterId,
        sectionId: request.sectionId,
        subjectName: request.subjectName,
        teacherId: request.teacherId,
        weeklyPeriods: request.weeklyPeriods,
      });

      await this.repo.save(entity);
      return Result.ok(entity);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return Result.fail(message);
    }
  }
}
