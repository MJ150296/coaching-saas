import { Result } from '@/shared/domain';
import { SectionRepository } from '../../domain/repositories';
import { Section } from '../../domain/entities/Section';
import { generateId } from '@/shared/lib/utils';

export interface CreateSectionRequest {
  organizationId: string;
  schoolId: string;
  classMasterId: string;
  name: string;
  capacity?: number;
  roomNumber?: string;
  shift?: string;
  classTeacherId?: string;
}

export class CreateSectionUseCase {
  constructor(private repo: SectionRepository) {}

  async execute(request: CreateSectionRequest): Promise<Result<Section, string>> {
    try {
      const entity = Section.create(generateId(), {
        organizationId: request.organizationId,
        schoolId: request.schoolId,
        classMasterId: request.classMasterId,
        name: request.name,
        capacity: request.capacity,
        roomNumber: request.roomNumber,
        shift: request.shift,
        classTeacherId: request.classTeacherId,
      });

      await this.repo.save(entity);
      return Result.ok(entity);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return Result.fail(message);
    }
  }
}
