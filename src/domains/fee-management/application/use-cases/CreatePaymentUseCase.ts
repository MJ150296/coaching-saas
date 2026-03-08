import { Result } from '@/shared/domain';
import { PaymentRepository } from '../../domain/repositories';
import { Payment, PaymentMethod } from '../../domain/entities/Payment';
import { generateId } from '@/shared/lib/utils';

export interface CreatePaymentRequest {
  organizationId: string;
  coachingCenterId: string;
  academicYearId: string;
  studentId: string;
  amount: number;
  method: PaymentMethod;
  reference?: string;
  paidAt: string;
}

export class CreatePaymentUseCase {
  constructor(private repo: PaymentRepository) {}

  async execute(request: CreatePaymentRequest): Promise<Result<Payment, string>> {
    try {
      const entity = Payment.create(generateId(), {
        organizationId: request.organizationId,
        coachingCenterId: request.coachingCenterId,
        academicYearId: request.academicYearId,
        studentId: request.studentId,
        amount: request.amount,
        method: request.method,
        reference: request.reference,
        paidAt: new Date(request.paidAt),
      });

      await this.repo.save(entity);
      return Result.ok(entity);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return Result.fail(message);
    }
  }
}
