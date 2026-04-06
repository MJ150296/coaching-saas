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
import { Payment } from '@/domains/fee-management/domain/entities/Payment';

export async function GET(request: NextRequest) {
  try {
    const actor = await getActorUser();
    if (!actor) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (
      !hasPermission(actor.getRole(), Permission.CREATE_PAYMENT) &&
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
    const method = request.nextUrl.searchParams.get('method') || undefined;
    const tenant = resolveTenantScope(actor, requestedOrganizationId, requestedCoachingCenterId);

    if (actor.getRole() !== UserRole.SUPER_ADMIN) {
      assertTenantScope(actor, tenant.organizationId, tenant.coachingCenterId);
    }

    const { paymentRepository: repo } = await getFeeServices();
    const filtered = await repo.findByTenant(tenant.organizationId, tenant.coachingCenterId, {
      academicYearId,
      method,
      limit,
      offset,
    });

    const items = filtered.map((item) => ({
      id: item.getId(),
      studentId: item.getStudentId(),
      amount: item.getAmount(),
      method: item.getMethod(),
      reference: item.getReference(),
      paidAt: item.getPaidAt(),
      organizationId: item.getOrganizationId(),
      coachingCenterId: item.getCoachingCenterId(),
      academicYearId: item.getAcademicYearId(),
      createdAt: item.getCreatedAt(),
    }));

    if (!withMeta) {
      return NextResponse.json(items);
    }

    const total = await repo.countByTenant(tenant.organizationId, tenant.coachingCenterId, { academicYearId, method });
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
    const actor = await requireActorWithPermission(Permission.CREATE_PAYMENT);
    const body = await request.json();
    const tenant = resolveTenantScope(actor, body.organizationId, body.coachingCenterId);
    if (actor.getRole() === UserRole.SUPER_ADMIN && (!tenant.organizationId || !tenant.coachingCenterId)) {
      return NextResponse.json({ error: 'organizationId and coachingCenterId are required' }, { status: 400 });
    }
    assertTenantScope(actor, tenant.organizationId, tenant.coachingCenterId);

    const { paymentRepository: repo } = await getFeeServices();

    const id = crypto.randomUUID();
    const payment = new Payment(id, {
      organizationId: tenant.organizationId!,
      coachingCenterId: tenant.coachingCenterId!,
      academicYearId: body.academicYearId,
      studentId: body.studentId,
      amount: body.amount,
      method: body.method,
      reference: body.reference,
      paidAt: new Date(body.paidAt),
      ledgerEntryId: body.ledgerEntryId,
    });

    await repo.save(payment);

    // If ledgerEntryId is provided, update the ledger entry status to PAID
    if (body.ledgerEntryId) {
      try {
        const { studentFeeLedgerRepository: ledgerRepo } = await getFeeServices();
        const ledgerEntry = await ledgerRepo.findById(body.ledgerEntryId);
        if (ledgerEntry && ledgerEntry.getStudentId() === body.studentId) {
          ledgerEntry.markAsPaid();
          await ledgerRepo.save(ledgerEntry);
        }
      } catch (ledgerError) {
        // Log but don't fail the payment if ledger update fails
        console.error('Failed to update ledger entry status:', ledgerError);
      }
    }

    await logAuditEvent({
      actorId: actor.getId(),
      actorRole: actor.getRole(),
      action: 'CREATE_PAYMENT',
      organizationId: tenant.organizationId,
      coachingCenterId: tenant.coachingCenterId,
      ip: request.headers.get('x-forwarded-for') || undefined,
    });

    invalidateCacheByPrefix('api:admin:dashboard:overview:');
    return NextResponse.json({ id: payment.getId(), ...body }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed';
    const status = message === 'UNAUTHORIZED' ? 401 : message === 'FORBIDDEN' ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
