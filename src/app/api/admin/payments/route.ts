import { NextRequest, NextResponse } from 'next/server';
import { requireActorWithPermission } from '@/shared/infrastructure/admin-guards';
import { Permission } from '@/shared/infrastructure/rbac';
import { assertTenantScope, resolveTenantScope } from '@/shared/infrastructure/tenant';
import { logAuditEvent } from '@/shared/infrastructure/audit-log';
import { UserRole } from '@/domains/user-management/domain/entities/User';
import { generateId } from '@/shared/lib/utils';
import { connectDB } from '@/shared/infrastructure/database';
import { PaymentModel, StudentFeeLedgerModel } from '@/domains/fee-management/infrastructure/persistence/FeeSchema';
import { UserModel } from '@/domains/user-management/infrastructure/persistence/UserSchema';
import mongoose from 'mongoose';

export async function POST(request: NextRequest) {
  try {
    const actor = await requireActorWithPermission(Permission.CREATE_PAYMENT);
    const body = await request.json();
    const tenant = resolveTenantScope(actor, body.organizationId, body.coachingCenterId ?? body.schoolId);
    if (actor.getRole() === UserRole.SUPER_ADMIN && (!tenant.organizationId || !tenant.schoolId)) {
      return NextResponse.json({ error: 'organizationId and coachingCenterId are required' }, { status: 400 });
    }
    assertTenantScope(actor, tenant.organizationId, tenant.schoolId);

    const organizationId = tenant.organizationId as string;
    const schoolId = tenant.schoolId as string;
    const academicYearId = typeof body.academicYearId === 'string' ? body.academicYearId.trim() : '';
    const studentId = typeof body.studentId === 'string' ? body.studentId.trim() : '';
    const amount = Number(body.amount);
    const paidAt = new Date(typeof body.paidAt === 'string' ? body.paidAt : '');
    const method = typeof body.method === 'string' ? body.method.trim() : '';
    const reference = typeof body.reference === 'string' && body.reference.trim().length > 0
      ? body.reference.trim()
      : undefined;

    if (!academicYearId || !studentId || !method) {
      return NextResponse.json(
        { error: 'academicYearId, studentId and method are required' },
        { status: 400 }
      );
    }
    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json({ error: 'amount must be greater than 0' }, { status: 400 });
    }
    if (Number.isNaN(paidAt.getTime())) {
      return NextResponse.json({ error: 'paidAt must be a valid date' }, { status: 400 });
    }

    const validMethods = new Set(['CASH', 'ONLINE', 'UPI', 'BANK_TRANSFER']);
    if (!validMethods.has(method)) {
      return NextResponse.json({ error: 'Invalid payment method' }, { status: 400 });
    }

    await connectDB();

    const student = await UserModel.findOne({ _id: studentId }).lean<{
      role: UserRole;
      organizationId?: string;
      schoolId?: string;
    } | null>();

    if (
      !student ||
      student.role !== UserRole.STUDENT ||
      student.organizationId !== organizationId ||
      student.schoolId !== schoolId
    ) {
      return NextResponse.json({ error: 'Student not found in tenant scope' }, { status: 400 });
    }

    const dueEntries = await StudentFeeLedgerModel.find({
      organizationId,
      schoolId,
      academicYearId,
      studentId,
      status: 'DUE',
    })
      .sort({ dueDate: 1, createdAt: 1 })
      .lean<Array<{ _id: string; amount: number }>>();

    if (dueEntries.length === 0) {
      return NextResponse.json({ error: 'No due ledger entries found for this student' }, { status: 400 });
    }

    const totalDue = dueEntries.reduce((sum, entry) => sum + entry.amount, 0);
    if (amount > totalDue) {
      return NextResponse.json({ error: `Payment exceeds total due amount (${totalDue})` }, { status: 400 });
    }

    let remaining = amount;
    const ledgerEntryIdsToMarkPaid: string[] = [];
    for (const entry of dueEntries) {
      if (remaining >= entry.amount) {
        remaining -= entry.amount;
        ledgerEntryIdsToMarkPaid.push(entry._id);
      }
      if (remaining === 0) {
        break;
      }
    }

    if (remaining !== 0) {
      return NextResponse.json(
        {
          error: 'Payment must match full due entries. Partial settlement of a single entry is not supported.',
        },
        { status: 400 }
      );
    }

    const paymentId = generateId();
    const session = await mongoose.startSession();

    try {
      await session.withTransaction(async () => {
        await PaymentModel.create(
          [
            {
              _id: paymentId,
              organizationId,
              schoolId,
              academicYearId,
              studentId,
              amount,
              method,
              reference,
              paidAt,
            },
          ],
          { session }
        );

        await StudentFeeLedgerModel.updateMany(
          { _id: { $in: ledgerEntryIdsToMarkPaid } },
          { $set: { status: 'PAID' } },
          { session }
        );
      });
    } finally {
      await session.endSession();
    }

    await logAuditEvent({
      actorId: actor.getId(),
      actorRole: actor.getRole(),
      action: 'CREATE_PAYMENT',
      organizationId: tenant.organizationId,
      schoolId: tenant.schoolId,
      ip: request.headers.get('x-forwarded-for') || undefined,
    });

    return NextResponse.json(
      {
        id: paymentId,
        organizationId,
        schoolId,
        academicYearId,
        studentId,
        amount,
        method,
        reference,
        paidAt,
        settledLedgerEntryCount: ledgerEntryIdsToMarkPaid.length,
      },
      { status: 201 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed';
    const status = message === 'UNAUTHORIZED' ? 401 : message === 'FORBIDDEN' ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
