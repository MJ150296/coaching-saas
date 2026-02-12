import { Result } from '@/shared/domain';
import { StudentFeeLedgerRepository } from '../../domain/repositories';
import { StudentFeeLedgerEntry } from '../../domain/entities/StudentFeeLedgerEntry';
import { generateId } from '@/shared/lib/utils';

export interface CreateStudentFeeLedgerRequest {
  organizationId: string;
  schoolId: string;
  academicYearId: string;
  studentId: string;
  feePlanId?: string;
  feeTypeId?: string;
  amount: number;
  dueDate: string;
}

export class CreateStudentFeeLedgerUseCase {
  constructor(private repo: StudentFeeLedgerRepository) {}

  async execute(request: CreateStudentFeeLedgerRequest): Promise<Result<StudentFeeLedgerEntry, string>> {
    try {
      const entity = StudentFeeLedgerEntry.create(generateId(), {
        organizationId: request.organizationId,
        schoolId: request.schoolId,
        academicYearId: request.academicYearId,
        studentId: request.studentId,
        feePlanId: request.feePlanId,
        feeTypeId: request.feeTypeId,
        amount: request.amount,
        dueDate: new Date(request.dueDate),
      });

      await this.repo.save(entity);
      return Result.ok(entity);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return Result.fail(message);
    }
  }
}
