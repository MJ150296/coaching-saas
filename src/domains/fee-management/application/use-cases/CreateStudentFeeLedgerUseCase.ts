import { Result } from '@/shared/domain';
import { StudentFeeLedgerRepository } from '../../domain/repositories';
import { DiscountMode, DiscountType, StudentFeeLedgerEntry } from '../../domain/entities/StudentFeeLedgerEntry';
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
  discountType?: DiscountType;
  discountMode?: DiscountMode;
  discountValue?: number;
  discountReason?: string;
}

export class CreateStudentFeeLedgerUseCase {
  constructor(private repo: StudentFeeLedgerRepository) {}

  async execute(request: CreateStudentFeeLedgerRequest): Promise<Result<StudentFeeLedgerEntry, string>> {
    try {
      const grossAmount = Number(request.amount);
      if (!Number.isFinite(grossAmount) || grossAmount <= 0) {
        return Result.fail('amount must be greater than 0');
      }

      const dueDate = new Date(request.dueDate);
      if (Number.isNaN(dueDate.getTime())) {
        return Result.fail('dueDate must be a valid date');
      }

      const discountType = request.discountType ?? 'NONE';
      const discountMode = request.discountMode ?? 'FLAT';
      const discountValue = Number(request.discountValue ?? 0);
      if (!Number.isFinite(discountValue) || discountValue < 0) {
        return Result.fail('discountValue must be 0 or greater');
      }

      const discountableTypes = new Set<DiscountType>(['SCHOLARSHIP', 'SIBLING', 'STAFF', 'CUSTOM']);
      if (discountType === 'NONE' && discountValue > 0) {
        return Result.fail('discountType must not be NONE when discountValue is provided');
      }
      if (discountType !== 'NONE' && !discountableTypes.has(discountType)) {
        return Result.fail('Invalid discountType');
      }

      let discountAmount = 0;
      if (discountType !== 'NONE') {
        if (discountMode === 'PERCENT') {
          if (discountValue > 100) {
            return Result.fail('discountValue cannot exceed 100 for PERCENT mode');
          }
          discountAmount = Number(((grossAmount * discountValue) / 100).toFixed(2));
        } else {
          discountAmount = discountValue;
        }
      }
      if (discountAmount > grossAmount) {
        return Result.fail('discount cannot exceed amount');
      }

      const netAmount = Number((grossAmount - discountAmount).toFixed(2));
      const entity = StudentFeeLedgerEntry.create(generateId(), {
        organizationId: request.organizationId,
        schoolId: request.schoolId,
        academicYearId: request.academicYearId,
        studentId: request.studentId,
        feePlanId: request.feePlanId,
        feeTypeId: request.feeTypeId,
        originalAmount: grossAmount,
        amount: netAmount,
        discount:
          discountType === 'NONE'
            ? undefined
            : {
                type: discountType,
                mode: discountMode,
                value: discountValue,
                amount: discountAmount,
                reason:
                  typeof request.discountReason === 'string' && request.discountReason.trim()
                    ? request.discountReason.trim()
                    : undefined,
              },
        dueDate,
      });

      await this.repo.save(entity);
      return Result.ok(entity);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return Result.fail(message);
    }
  }
}
