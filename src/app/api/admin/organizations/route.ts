import { NextRequest, NextResponse } from 'next/server';
import { ServiceKeys } from '@/shared/bootstrap/ServiceKeys';
import { initializeAppAndGetService } from '@/shared/bootstrap/init';
import { CreateOrganizationUseCase } from '@/domains/organization-management/application/use-cases';
import { Organization } from '@/domains/organization-management/domain/entities/Organization';
import { MongoOrganizationRepository } from '@/domains/organization-management/infrastructure/persistence';
import { UserRole } from '@/domains/user-management/domain/entities/User';
import { Permission } from '@/shared/infrastructure/rbac';
import { requireActorWithPermission } from '@/shared/infrastructure/admin-guards';
import { logAuditEvent } from '@/shared/infrastructure/audit-log';
import { getActorUser } from '@/shared/infrastructure/actor';
import { OrganizationModel, SchoolModel } from '@/domains/organization-management/infrastructure/persistence/OrganizationSchoolSchema';

export async function GET() {
  try {
    const actor = await getActorUser();
    if (!actor) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const role = actor.getRole();
    if (
      role !== UserRole.SUPER_ADMIN &&
      role !== UserRole.ORGANIZATION_ADMIN &&
      role !== UserRole.SCHOOL_ADMIN &&
      role !== UserRole.ADMIN
    ) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const repo = await initializeAppAndGetService<MongoOrganizationRepository>(
      ServiceKeys.ORGANIZATION_REPOSITORY
    );
    let organizations: Organization[] = [];
    if (role === UserRole.SUPER_ADMIN) {
      organizations = await repo.findAll();
    } else if (actor.getOrganizationId()) {
      const org = await repo.findById(actor.getOrganizationId());
      organizations = org ? [org] : [];
    }

    const data = organizations.map((org) => ({
      id: org.getId(),
      name: org.getOrganizationName().getValue(),
      type: org.getType(),
      status: org.getStatus(),
      address: {
        street: org.getAddress().getStreet(),
        city: org.getAddress().getCity(),
        state: org.getAddress().getState(),
        zipCode: org.getAddress().getZipCode(),
        country: org.getAddress().getCountry(),
      },
      contactInfo: {
        email: org.getContactInfo().getEmail(),
        phone: org.getContactInfo().getPhone(),
      },
    }));

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const actor = await requireActorWithPermission(Permission.CREATE_ORGANIZATION);
    if (actor.getRole() !== UserRole.SUPER_ADMIN) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const useCase = await initializeAppAndGetService<CreateOrganizationUseCase>(
      ServiceKeys.CREATE_ORGANIZATION_USE_CASE
    );
    const result = await useCase.execute(body);

    if (result.getIsFailure()) {
      return NextResponse.json({ error: result.getError() }, { status: 400 });
    }

    await logAuditEvent({
      actorId: actor.getId(),
      actorRole: actor.getRole(),
      action: 'CREATE_ORGANIZATION',
      targetId: result.getValue().organizationId,
      organizationId: result.getValue().organizationId,
      ip: request.headers.get('x-forwarded-for') || undefined,
    });

    return NextResponse.json(result.getValue(), { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed';
    const status = message === 'UNAUTHORIZED' ? 401 : message === 'FORBIDDEN' ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const actor = await requireActorWithPermission(Permission.CREATE_ORGANIZATION);
    if (actor.getRole() !== UserRole.SUPER_ADMIN) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const id = typeof body.id === 'string' ? body.id.trim() : '';
    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    const repo = await initializeAppAndGetService<MongoOrganizationRepository>(
      ServiceKeys.ORGANIZATION_REPOSITORY
    );
    const existing = await repo.findById(id);
    if (!existing) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    const name = typeof body.organizationName === 'string' ? body.organizationName.trim() : '';
    const type = typeof body.type === 'string' ? body.type.trim() : '';
    const street = typeof body.street === 'string' ? body.street.trim() : '';
    const city = typeof body.city === 'string' ? body.city.trim() : '';
    const state = typeof body.state === 'string' ? body.state.trim() : '';
    const zipCode = typeof body.zipCode === 'string' ? body.zipCode.trim() : '';
    const country = typeof body.country === 'string' ? body.country.trim() : undefined;
    const contactEmail = typeof body.contactEmail === 'string' ? body.contactEmail.trim() : '';
    const contactPhone = typeof body.contactPhone === 'string' ? body.contactPhone.trim() : '';
    const status = body.status === 'inactive' ? 'inactive' : 'active';

    if (!name || !type || !street || !city || !state || !zipCode || !contactEmail || !contactPhone) {
      return NextResponse.json(
        { error: 'organizationName, type, street, city, state, zipCode, contactEmail and contactPhone are required' },
        { status: 400 }
      );
    }

    const updatePayload = {
      organizationName: name,
      type,
      address: {
        street,
        city,
        state,
        zipCode,
        country: country || 'INDIA',
      },
      contactInfo: {
        email: contactEmail,
        phone: contactPhone,
      },
      status,
    };

    await OrganizationModel.updateOne({ _id: id }, { $set: updatePayload });

    await logAuditEvent({
      actorId: actor.getId(),
      actorRole: actor.getRole(),
      action: 'UPDATE_ORGANIZATION',
      targetId: id,
      organizationId: id,
      ip: request.headers.get('x-forwarded-for') || undefined,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed';
    const status = message === 'UNAUTHORIZED' ? 401 : message === 'FORBIDDEN' ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const actor = await requireActorWithPermission(Permission.CREATE_ORGANIZATION);
    if (actor.getRole() !== UserRole.SUPER_ADMIN) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const id = request.nextUrl.searchParams.get('id')?.trim();
    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    const repo = await initializeAppAndGetService<MongoOrganizationRepository>(
      ServiceKeys.ORGANIZATION_REPOSITORY
    );
    const existing = await repo.findById(id);
    if (!existing) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    const linkedSchoolCount = await SchoolModel.countDocuments({ organizationId: id });
    if (linkedSchoolCount > 0) {
      return NextResponse.json(
        { error: 'Cannot delete organization with existing schools. Delete schools first.' },
        { status: 409 }
      );
    }

    await repo.delete(id);

    await logAuditEvent({
      actorId: actor.getId(),
      actorRole: actor.getRole(),
      action: 'DELETE_ORGANIZATION',
      targetId: id,
      organizationId: id,
      ip: request.headers.get('x-forwarded-for') || undefined,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed';
    const status = message === 'UNAUTHORIZED' ? 401 : message === 'FORBIDDEN' ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
