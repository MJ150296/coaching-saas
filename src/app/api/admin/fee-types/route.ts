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
import { FeeType, type FeeFrequency } from '@/domains/fee-management/domain/entities/FeeType';
import { FeePlanModel, StudentFeeLedgerModel, FeeTypeModel } from '@/domains/fee-management/infrastructure/persistence/FeeSchema';

export async function GET(request: NextRequest) {
  try {
    const actor = await getActorUser();
    if (!actor) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (
      !hasPermission(actor.getRole(), Permission.CREATE_FEE_TYPE) &&
      !hasPermission(actor.getRole(), Permission.CREATE_STUDENT_FEE_LEDGER)
    ) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const requestedOrganizationId =
      request.nextUrl.searchParams.get('organizationId') || undefined;
    const requestedCoachingCenterId = request.nextUrl.searchParams.get('coachingCenterId') || undefined;
    const withMeta = request.nextUrl.searchParams.get('withMeta') === 'true';
    const limit = parsePositiveIntParam(request.nextUrl.searchParams.get('limit'), 500) ?? (withMeta ? 100 : 200);
    const offset = parsePositiveIntParam(request.nextUrl.searchParams.get('offset'), 50000) ?? 0;
    const tenant = resolveTenantScope(actor, requestedOrganizationId, requestedCoachingCenterId);

    if (actor.getRole() !== UserRole.SUPER_ADMIN) {
      assertTenantScope(actor, tenant.organizationId, tenant.coachingCenterId);
    }

    const { feeTypeRepository: repo } = await getFeeServices();
    const filtered = await repo.findByTenant(tenant.organizationId, tenant.coachingCenterId, {
      limit,
      offset,
    });

    const items = filtered.map((item) => ({
      id: item.getId(),
      name: item.getName(),
      amount: item.getAmount(),
      frequency: item.getFrequency(),
      isMandatory: item.isMandatoryFee(),
      isTaxable: item.isTaxableFee(),
      organizationId: item.getOrganizationId(),
      coachingCenterId: item.getCoachingCenterId(),
      createdAt: item.getCreatedAt(),
      updatedAt: item.getUpdatedAt(),
    }));

    if (!withMeta) {
      return NextResponse.json(items);
    }

    const total = await repo.countByTenant(tenant.organizationId, tenant.coachingCenterId);
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
    const actor = await requireActorWithPermission(Permission.CREATE_FEE_TYPE);
    const body = await request.json();
    const tenant = resolveTenantScope(actor, body.organizationId, body.coachingCenterId);
    if (actor.getRole() === UserRole.SUPER_ADMIN && (!tenant.organizationId || !tenant.coachingCenterId)) {
      return NextResponse.json({ error: 'organizationId and coachingCenterId are required' }, { status: 400 });
    }
    assertTenantScope(actor, tenant.organizationId, tenant.coachingCenterId);

    const { createFeeTypeUseCase: useCase } = await getFeeServices();
    const result = await useCase.execute({ ...body, ...tenant });

    if (result.getIsFailure()) {
      return NextResponse.json({ error: result.getError() }, { status: 400 });
    }

    await logAuditEvent({
      actorId: actor.getId(),
      actorRole: actor.getRole(),
      action: 'CREATE_FEE_TYPE',
      organizationId: tenant.organizationId,
      coachingCenterId: tenant.coachingCenterId,
      ip: request.headers.get('x-forwarded-for') || undefined,
    });

    invalidateCacheByPrefix('api:admin:academic-options:');
    invalidateCacheByPrefix('api:admin:dashboard:overview:');
    return NextResponse.json(result.getValue(), { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed';
    const status = message === 'UNAUTHORIZED' ? 401 : message === 'FORBIDDEN' ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const actor = await requireActorWithPermission(Permission.CREATE_FEE_TYPE);
    const body = await request.json();
    const tenant = resolveTenantScope(actor, body.organizationId, body.coachingCenterId);

    if (!body.id) {
      return NextResponse.json({ error: 'Fee type id is required' }, { status: 400 });
    }

    if (actor.getRole() === UserRole.SUPER_ADMIN && (!tenant.organizationId || !tenant.coachingCenterId)) {
      return NextResponse.json({ error: 'organizationId and coachingCenterId are required' }, { status: 400 });
    }
    assertTenantScope(actor, tenant.organizationId, tenant.coachingCenterId);

    const normalizedName = String(body.name || '').trim();
    const amount = Number(body.amount);
    const frequency = String(body.frequency || '').trim();

    if (!normalizedName || Number.isNaN(amount) || amount < 0 || !frequency) {
      return NextResponse.json({ error: 'Valid name, amount and frequency are required' }, { status: 400 });
    }

    const { feeTypeRepository: repo } = await getFeeServices();
    const existing = await repo.findById(body.id);

    if (!existing) {
      return NextResponse.json({ error: 'Fee type not found' }, { status: 404 });
    }

    if (
      existing.getOrganizationId() !== tenant.organizationId ||
      existing.getCoachingCenterId() !== tenant.coachingCenterId
    ) {
      return NextResponse.json({ error: 'Fee type does not belong to the selected tenant' }, { status: 403 });
    }

    const duplicateCount = await FeeTypeModel.countDocuments({
      organizationId: tenant.organizationId,
      coachingCenterId: tenant.coachingCenterId,
      name: normalizedName,
      _id: { $ne: body.id },
    });

    if (duplicateCount > 0) {
      return NextResponse.json({ error: 'Another fee type already exists with the same name.' }, { status: 400 });
    }

    const updated = new FeeType(body.id, {
      organizationId: tenant.organizationId,
      coachingCenterId: tenant.coachingCenterId,
      name: normalizedName,
      amount,
      frequency: frequency as FeeFrequency,
      isMandatory: body.isMandatory !== false,
      isTaxable: Boolean(body.isTaxable),
    });

    await repo.save(updated);

    await logAuditEvent({
      actorId: actor.getId(),
      actorRole: actor.getRole(),
      action: 'UPDATE_FEE_TYPE',
      organizationId: tenant.organizationId,
      coachingCenterId: tenant.coachingCenterId,
      ip: request.headers.get('x-forwarded-for') || undefined,
    });

    invalidateCacheByPrefix('api:admin:academic-options:');
    invalidateCacheByPrefix('api:admin:dashboard:overview:');
    return NextResponse.json({
      id: updated.getId(),
      name: updated.getName(),
      amount: updated.getAmount(),
      frequency: updated.getFrequency(),
      isMandatory: updated.isMandatoryFee(),
      isTaxable: updated.isTaxableFee(),
      organizationId: updated.getOrganizationId(),
      coachingCenterId: updated.getCoachingCenterId(),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed';
    const status = message === 'UNAUTHORIZED' ? 401 : message === 'FORBIDDEN' ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const actor = await requireActorWithPermission(Permission.CREATE_FEE_TYPE);
    const id = request.nextUrl.searchParams.get('id') || undefined;
    const organizationId = request.nextUrl.searchParams.get('organizationId') || undefined;
    const coachingCenterId = request.nextUrl.searchParams.get('coachingCenterId') || undefined;
    const tenant = resolveTenantScope(actor, organizationId, coachingCenterId);

    if (!id) {
      return NextResponse.json({ error: 'Fee type id is required' }, { status: 400 });
    }

    if (actor.getRole() === UserRole.SUPER_ADMIN && (!tenant.organizationId || !tenant.coachingCenterId)) {
      return NextResponse.json({ error: 'organizationId and coachingCenterId are required' }, { status: 400 });
    }
    assertTenantScope(actor, tenant.organizationId, tenant.coachingCenterId);

    const { feeTypeRepository: repo } = await getFeeServices();
    const existing = await repo.findById(id);

    if (!existing) {
      return NextResponse.json({ error: 'Fee type not found' }, { status: 404 });
    }

    if (
      existing.getOrganizationId() !== tenant.organizationId ||
      existing.getCoachingCenterId() !== tenant.coachingCenterId
    ) {
      return NextResponse.json({ error: 'Fee type does not belong to the selected tenant' }, { status: 403 });
    }

    const dependencyQuery = {
      organizationId: tenant.organizationId,
      coachingCenterId: tenant.coachingCenterId,
    };

    const [feePlanCount, ledgerCount] = await Promise.all([
      FeePlanModel.countDocuments({ ...dependencyQuery, 'items.feeTypeId': id }),
      StudentFeeLedgerModel.countDocuments({ ...dependencyQuery, feeTypeId: id }),
    ]);

    if (feePlanCount + ledgerCount > 0) {
      return NextResponse.json(
        {
          error: 'This fee type is already in use and cannot be deleted.',
          references: {
            feePlans: feePlanCount,
            studentLedgerEntries: ledgerCount,
          },
        },
        { status: 400 }
      );
    }

    await repo.delete(id);

    await logAuditEvent({
      actorId: actor.getId(),
      actorRole: actor.getRole(),
      action: 'DELETE_FEE_TYPE',
      organizationId: tenant.organizationId,
      coachingCenterId: tenant.coachingCenterId,
      ip: request.headers.get('x-forwarded-for') || undefined,
    });

    invalidateCacheByPrefix('api:admin:academic-options:');
    invalidateCacheByPrefix('api:admin:dashboard:overview:');
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed';
    const status = message === 'UNAUTHORIZED' ? 401 : message === 'FORBIDDEN' ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
