import { NextRequest, NextResponse } from 'next/server';
import { requireActorWithPermission } from '@/shared/infrastructure/admin-guards';
import { Permission } from '@/shared/infrastructure/rbac';
import { assertTenantScope, resolveTenantScope } from '@/shared/infrastructure/tenant';
import { getFeeServices } from '@/domains/fee-management/bootstrap/getFeeServices';
import { logAuditEvent } from '@/shared/infrastructure/audit-log';
import { UserRole } from '@/domains/user-management/domain/entities/User';
import { getActorUser } from '@/shared/infrastructure/actor';
import { hasPermission } from '@/shared/infrastructure/rbac';
import { parsePositiveIntParam } from '@/shared/lib/utils';
import { invalidateCacheByPrefix } from '@/shared/infrastructure/api-response-cache';
import { StudentFeeLedgerEntry } from '@/domains/fee-management/domain/entities/StudentFeeLedgerEntry';

export async function GET(request: NextRequest) {
  try {
    const actor = await getActorUser();
    if (!actor) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (
      !hasPermission(actor.getRole(), Permission.CREATE_STUDENT_FEE_LEDGER) &&
      !hasPermission(actor.getRole(), Permission.CREATE_FEE_TYPE)
    ) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const requestedOrganizationId =
      request.nextUrl.searchParams.get('organizationId') || undefined;
    const requestedCoachingCenterId = request.nextUrl.searchParams.get('coachingCenterId') || undefined;
    const withMeta = request.nextUrl.searchParams.get('withMeta') === 'true';
    const limit = parsePositiveIntParam(request.nextUrl.searchParams.get('limit'), 500) ?? (withMeta ? 100 : 200);
    const offset = parsePositiveIntParam(request.nextUrl.searchParams.get('offset'), 50000) ?? 0;
    const academicYearId = request.nextUrl.searchParams.get('academicYearId') || undefined;
    const status = request.nextUrl.searchParams.get('status') || undefined;
    const tenant = resolveTenantScope(actor, requestedOrganizationId, requestedCoachingCenterId);

    if (actor.getRole() !== UserRole.SUPER_ADMIN) {
      assertTenantScope(actor, tenant.organizationId, tenant.coachingCenterId);
    }

    const { studentFeeLedgerRepository: repo } = await getFeeServices();
    const filtered = await repo.findByTenant(tenant.organizationId, tenant.coachingCenterId, {
      academicYearId,
      status,
      limit,
      offset,
    });

    const items = filtered.map((item) => ({
      id: item.getId(),
      studentId: item.getStudentId(),
      feePlanId: item.getFeePlanId(),
      feeTypeId: item.getFeeTypeId(),
      originalAmount: item.getOriginalAmount(),
      amount: item.getAmount(),
      discount: item.getDiscount(),
      dueDate: item.getDueDate(),
      status: item.getStatus(),
      organizationId: item.getOrganizationId(),
      coachingCenterId: item.getCoachingCenterId(),
      academicYearId: item.getAcademicYearId(),
      createdAt: item.getCreatedAt(),
    }));

    if (!withMeta) {
      return NextResponse.json(items);
    }

    const total = await repo.countByTenant(tenant.organizationId, tenant.coachingCenterId, { academicYearId, status });
    return NextResponse.json({
      items,
      total,
      limit,
      offset,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed';
    const status = message === 'UNAUTHORIZED' ? 401 : message === 'FORBIDDEN' ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(request: NextRequest) {
  try {
    const actor = await requireActorWithPermission(Permission.CREATE_STUDENT_FEE_LEDGER);
    const body = await request.json();
    const tenant = resolveTenantScope(actor, body.organizationId, body.coachingCenterId);
    if (actor.getRole() === UserRole.SUPER_ADMIN && (!tenant.organizationId || !tenant.coachingCenterId)) {
      return NextResponse.json({ error: 'organizationId and coachingCenterId are required' }, { status: 400 });
    }
    assertTenantScope(actor, tenant.organizationId, tenant.coachingCenterId);

    const { studentFeeLedgerRepository: repo } = await getFeeServices();

    const id = crypto.randomUUID();
    const ledgerEntry = new StudentFeeLedgerEntry(id, {
      ...tenant,
      academicYearId: body.academicYearId,
      studentId: body.studentId,
      feePlanId: body.feePlanId,
      feeTypeId: body.feeTypeId,
      originalAmount: body.originalAmount,
      amount: body.amount,
      discount: body.discount,
      dueDate: new Date(body.dueDate),
      status: 'DUE',
    });

    await repo.save(ledgerEntry);

    await logAuditEvent({
      actorId: actor.getId(),
      actorRole: actor.getRole(),
      action: 'CREATE_STUDENT_FEE_LEDGER',
      organizationId: tenant.organizationId,
      coachingCenterId: tenant.coachingCenterId,
      ip: request.headers.get('x-forwarded-for') || undefined,
    });

    invalidateCacheByPrefix('api:admin:dashboard:overview:');
    return NextResponse.json({ id: ledgerEntry.getId(), ...body }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed';
    const status = message === 'UNAUTHORIZED' ? 401 : message === 'FORBIDDEN' ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const actor = await requireActorWithPermission(Permission.CREATE_STUDENT_FEE_LEDGER);
    const body = await request.json();
    const tenant = resolveTenantScope(actor, body.organizationId, body.coachingCenterId);
    if (actor.getRole() === UserRole.SUPER_ADMIN && (!tenant.organizationId || !tenant.coachingCenterId)) {
      return NextResponse.json({ error: 'organizationId and coachingCenterId are required' }, { status: 400 });
    }
    assertTenantScope(actor, tenant.organizationId, tenant.coachingCenterId);

    const { studentIds, academicYearId, amount, dueDate, feeTypeId, feePlanId, discount } = body;

    if (!Array.isArray(studentIds) || studentIds.length === 0) {
      return NextResponse.json({ error: 'studentIds must be a non-empty array' }, { status: 400 });
    }

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: 'amount must be greater than 0' }, { status: 400 });
    }

    if (!dueDate) {
      return NextResponse.json({ error: 'dueDate is required' }, { status: 400 });
    }

    const { studentFeeLedgerRepository: repo } = await getFeeServices();

    const entries: StudentFeeLedgerEntry[] = [];
    const errors: string[] = [];

    for (const studentId of studentIds) {
      try {
        const id = crypto.randomUUID();
        const discountAmount = discount ? (discount.mode === 'FLAT' ? discount.value : (amount * discount.value) / 100) : 0;
        const finalAmount = amount - discountAmount;

        const ledgerEntry = new StudentFeeLedgerEntry(id, {
          organizationId: tenant.organizationId!,
          coachingCenterId: tenant.coachingCenterId!,
          academicYearId,
          studentId,
          feePlanId,
          feeTypeId,
          originalAmount: amount,
          amount: finalAmount,
          discount: discount ? {
            type: discount.type,
            mode: discount.mode,
            value: discount.value,
            amount: discountAmount,
            reason: discount.reason,
          } : undefined,
          dueDate: new Date(dueDate),
          status: 'DUE',
        });

        await repo.save(ledgerEntry);
        entries.push(ledgerEntry);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        errors.push(`Failed to create entry for student ${studentId}: ${errorMessage}`);
      }
    }

    await logAuditEvent({
      actorId: actor.getId(),
      actorRole: actor.getRole(),
      action: 'BULK_CREATE_STUDENT_FEE_LEDGER',
      organizationId: tenant.organizationId,
      coachingCenterId: tenant.coachingCenterId,
      ip: request.headers.get('x-forwarded-for') || undefined,
      metadata: { studentCount: studentIds.length, successCount: entries.length, errorCount: errors.length },
    });

    invalidateCacheByPrefix('api:admin:dashboard:overview:');

    return NextResponse.json({
      created: entries.length,
      errors: errors.length > 0 ? errors : undefined,
      entries: entries.map((entry) => ({
        id: entry.getId(),
        studentId: entry.getStudentId(),
        amount: entry.getAmount(),
        originalAmount: entry.getOriginalAmount(),
        dueDate: entry.getDueDate(),
        status: entry.getStatus(),
      })),
    }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed';
    const status = message === 'UNAUTHORIZED' ? 401 : message === 'FORBIDDEN' ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
