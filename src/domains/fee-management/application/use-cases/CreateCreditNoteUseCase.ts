import { Result } from '@/shared/domain';
import { CreditNoteRepository } from '../../domain/repositories';
import { CreditNote } from '../../domain/entities/CreditNote';
import { generateId } from '@/shared/lib/utils';

export interface CreateCreditNoteRequest {
  organizationId: string;
  schoolId: string;
  academicYearId: string;
  studentId: string;
  amount: number;
  reason: string;
  createdOn: string;
}

export class CreateCreditNoteUseCase {
  constructor(private repo: CreditNoteRepository) {}

  async execute(request: CreateCreditNoteRequest): Promise<Result<CreditNote, string>> {
    try {
      const entity = CreditNote.create(generateId(), {
        organizationId: request.organizationId,
        schoolId: request.schoolId,
        academicYearId: request.academicYearId,
        studentId: request.studentId,
        amount: request.amount,
        reason: request.reason,
        createdOn: new Date(request.createdOn),
      });

      await this.repo.save(entity);
      return Result.ok(entity);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return Result.fail(message);
    }
  }
}
