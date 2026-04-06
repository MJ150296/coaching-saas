import { NextRequest, NextResponse } from 'next/server';
import { getCoachingServices } from '@/domains/coaching-management/bootstrap/getCoachingServices';
import { getFeeServices } from '@/domains/fee-management/bootstrap/getFeeServices';
import { requireActorWithPermission } from '@/shared/infrastructure/admin-guards';
import { Permission } from '@/shared/infrastructure/rbac';
import { assertTenantScope, resolveTenantScope } from '@/shared/infrastructure/tenant';
import { logAuditEvent } from '@/shared/infrastructure/audit-log';
import { UserRole } from '@/domains/user-management/domain/entities/User';
import { generateId } from '@/shared/lib/utils';
import { StudentFeeLedgerEntry } from '@/domains/fee-management/domain/entities/StudentFeeLedgerEntry';

export async function POST(request: NextRequest) {
  try {
    const actor = await requireActorWithPermission(Permission.CREATE_STUDENT_FEE_LEDGER);
    const body = await request.json();
    const tenant = resolveTenantScope(actor, body.organizationId, body.coachingCenterId);

    if (actor.getRole() === UserRole.SUPER_ADMIN && (!tenant.organizationId || !tenant.coachingCenterId)) {
      return NextResponse.json({ error: 'organizationId and coachingCenterId are required' }, { status: 400 });
    }

    assertTenantScope(actor, tenant.organizationId, tenant.coachingCenterId);

    const { academicYearId, frequency, periodStartDate, periodEndDate } = body;

    if (!academicYearId) {
      return NextResponse.json({ error: 'academicYearId is required' }, { status: 400 });
    }

    if (!frequency || !['MONTHLY', 'QUARTERLY', 'YEARLY'].includes(frequency)) {
      return NextResponse.json({ error: 'frequency must be MONTHLY, QUARTERLY, or YEARLY' }, { status: 400 });
    }

    // Initialize repositories
    const { coachingEnrollmentRepository: enrollmentRepo } = await getCoachingServices();
    const {
      feePlanAssignmentRepository: feePlanAssignmentRepo,
      feePlanRepository: feePlanRepo,
      feeTypeRepository: feeTypeRepo,
      studentFeeLedgerRepository: ledgerRepo,
    } = await getFeeServices();

    // Get all enrollments for the tenant
    const enrollments = await enrollmentRepo.findByFilters({
      organizationId: tenant.organizationId,
      coachingCenterId: tenant.coachingCenterId,
    });

    // Get all fee plan assignments for the tenant
    const assignments = await feePlanAssignmentRepo.findByTenant(
      tenant.organizationId,
      tenant.coachingCenterId,
      { academicYearId }
    );

    // Get all fee plans
    const feePlanIds = [...new Set(assignments.map((a) => a.getFeePlanId()))];
    const feePlans = await Promise.all(
      feePlanIds.map((id) => feePlanRepo.findById(id))
    );
    const feePlanMap = new Map(
      feePlans.filter(Boolean).map((fp) => [fp!.getId(), fp!])
    );

    // Get all fee types
    const allFeeTypeIds = feePlans
      .filter(Boolean)
      .flatMap((fp) => fp!.getItems().map((item) => item.feeTypeId));
    const uniqueFeeTypeIds = [...new Set(allFeeTypeIds)];
    const feeTypes = await Promise.all(
      uniqueFeeTypeIds.map((id) => feeTypeRepo.findById(id))
    );
    const feeTypeMap = new Map(
      feeTypes.filter(Boolean).map((ft) => [ft!.getId(), ft!])
    );

    // Calculate due date based on period end date or default to 30 days from now
    const dueDate = periodEndDate
      ? new Date(periodEndDate)
      : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    const entries: StudentFeeLedgerEntry[] = [];
    const errors: string[] = [];

    // Process each enrollment
    for (const enrollment of enrollments) {
      const batchId = enrollment.getBatchId();
      const programId = enrollment.getProgramId();
      const studentId = enrollment.getStudentId();

      // Find fee plan assignment for this batch or program
      const assignment = assignments.find(
        (a) =>
          a.getBatchId() === batchId ||
          (a.getProgramId() === programId && !a.getBatchId())
      );

      if (!assignment) {
        continue; // No fee plan assigned
      }

      const feePlan = feePlanMap.get(assignment.getFeePlanId());
      if (!feePlan) {
        continue;
      }

      // Process each fee plan item
      for (const item of feePlan.getItems()) {
        const feeType = feeTypeMap.get(item.feeTypeId);
        if (!feeType) {
          continue;
        }

        // Only generate for the requested frequency
        if (feeType.getFrequency() !== frequency) {
          continue;
        }

        // Check if ledger entry already exists for this period
        const existingEntries = await ledgerRepo.findByTenant(
          tenant.organizationId,
          tenant.coachingCenterId,
          {
            academicYearId,
            status: 'DUE',
          }
        );

        const periodStart = periodStartDate ? new Date(periodStartDate) : new Date(0);
        const periodEnd = periodEndDate ? new Date(periodEndDate) : new Date();

        const duplicate = existingEntries.find(
          (entry) =>
            entry.getStudentId() === studentId &&
            entry.getFeeTypeId() === item.feeTypeId &&
            entry.getDueDate() >= periodStart &&
            entry.getDueDate() <= periodEnd
        );

        if (duplicate) {
          continue; // Already exists for this period
        }

        try {
          const ledgerId = generateId();
          const ledgerEntry = new StudentFeeLedgerEntry(ledgerId, {
            organizationId: tenant.organizationId!,
            coachingCenterId: tenant.coachingCenterId!,
            academicYearId,
            studentId,
            feePlanId: feePlan.getId(),
            feeTypeId: item.feeTypeId,
            originalAmount: item.amount,
            amount: item.amount,
            dueDate,
            status: 'DUE',
          });

          await ledgerRepo.save(ledgerEntry);
          entries.push(ledgerEntry);
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          errors.push(`Failed to create entry for student ${studentId}: ${errorMessage}`);
        }
      }
    }

    await logAuditEvent({
      actorId: actor.getId(),
      actorRole: actor.getRole(),
      action: 'GENERATE_RECURRING_FEES',
      organizationId: tenant.organizationId,
      coachingCenterId: tenant.coachingCenterId,
      ip: request.headers.get('x-forwarded-for') || undefined,
      metadata: {
        frequency,
        academicYearId,
        entriesCreated: entries.length,
        errors: errors.length,
      },
    });

    return NextResponse.json({
      created: entries.length,
      errors: errors.length > 0 ? errors : undefined,
      frequency,
      periodStartDate,
      periodEndDate,
    }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed';
    const status = message === 'UNAUTHORIZED' ? 401 : message === 'FORBIDDEN' ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
