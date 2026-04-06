import { Result } from '@/shared/domain';
import { generateId } from '@/shared/lib/utils';
import { CoachingEnrollmentRepository } from '../../domain/repositories';
import { CoachingEnrollment } from '../../domain/entities/CoachingEnrollment';
import type { FeePlanAssignmentRepository, FeePlanRepository, StudentFeeLedgerRepository, FeeTypeRepository } from '@/domains/fee-management/domain/repositories';
import { StudentFeeLedgerEntry } from '@/domains/fee-management/domain/entities/StudentFeeLedgerEntry';

export interface CreateCoachingEnrollmentRequest {
  organizationId: string;
  coachingCenterId: string;
  programId: string;
  batchId: string;
  studentId: string;
  academicYearId: string;
}

export interface CreateCoachingEnrollmentDependencies {
  enrollmentRepo: CoachingEnrollmentRepository;
  feePlanAssignmentRepo: FeePlanAssignmentRepository;
  feePlanRepo: FeePlanRepository;
  feeTypeRepo: FeeTypeRepository;
  ledgerRepo: StudentFeeLedgerRepository;
}

export class CreateCoachingEnrollmentUseCase {
  constructor(private deps: CreateCoachingEnrollmentDependencies) {}

  async execute(
    request: CreateCoachingEnrollmentRequest
  ): Promise<Result<CoachingEnrollment, string>> {
    try {
      const duplicate = await this.deps.enrollmentRepo.existsByStudentInBatch(
        request.organizationId,
        request.coachingCenterId,
        request.batchId,
        request.studentId
      );

      if (duplicate) {
        return Result.fail('Student is already enrolled in this coaching batch');
      }

      const entity = CoachingEnrollment.create(generateId(), request);
      await this.deps.enrollmentRepo.save(entity);

      // Auto-generate ledger entries for ONE_TIME fees
      try {
        await this.autoGenerateLedgerEntries(request, entity);
      } catch (ledgerError) {
        // Log but don't fail the enrollment if ledger generation fails
        console.error('Failed to auto-generate ledger entries:', ledgerError);
      }

      return Result.ok(entity);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return Result.fail(message);
    }
  }

  private async autoGenerateLedgerEntries(
    request: CreateCoachingEnrollmentRequest,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _enrollment: CoachingEnrollment
  ): Promise<void> {
    // Find fee plan assignment for this batch (or program)
    const assignments = await this.deps.feePlanAssignmentRepo.findByTenant(
      request.organizationId,
      request.coachingCenterId,
      { academicYearId: request.academicYearId }
    );

    // Find assignment matching batch or program
    const assignment = assignments.find(
      (a) => a.getBatchId() === request.batchId || 
             (a.getProgramId() === request.programId && !a.getBatchId())
    );

    if (!assignment) {
      // No fee plan assigned, skip ledger generation
      return;
    }

    // Get the fee plan
    const feePlan = await this.deps.feePlanRepo.findById(assignment.getFeePlanId());
    if (!feePlan) {
      return;
    }

    // Get fee types for the items
    const feeTypeIds = feePlan.getItems().map((item) => item.feeTypeId);
    const feeTypes = await Promise.all(
      feeTypeIds.map((id) => this.deps.feeTypeRepo.findById(id))
    );

    const feeTypeMap = new Map(
      feeTypes.filter(Boolean).map((ft) => [ft!.getId(), ft!])
    );

    // Create ledger entries for ONE_TIME fees only
    const now = new Date();
    for (const item of feePlan.getItems()) {
      const feeType = feeTypeMap.get(item.feeTypeId);
      if (!feeType) continue;

      // Only auto-generate for ONE_TIME fees
      const frequency = feeType.getFrequency();
      if (frequency !== 'ONE_TIME') continue;

      const ledgerId = generateId();
      const dueDate = new Date(now);
      dueDate.setDate(dueDate.getDate() + 30); // Default 30 days due date

      const ledgerEntry = new StudentFeeLedgerEntry(ledgerId, {
        organizationId: request.organizationId,
        coachingCenterId: request.coachingCenterId,
        academicYearId: request.academicYearId,
        studentId: request.studentId,
        feePlanId: feePlan.getId(),
        feeTypeId: item.feeTypeId,
        originalAmount: item.amount,
        amount: item.amount,
        dueDate,
        status: 'DUE',
      });

      await this.deps.ledgerRepo.save(ledgerEntry);
    }
  }
}