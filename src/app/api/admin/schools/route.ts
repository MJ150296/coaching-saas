import { NextRequest, NextResponse } from 'next/server';
import { ServiceKeys } from '@/shared/bootstrap/ServiceKeys';
import { initializeAppAndGetService } from '@/shared/bootstrap/init';
import { CreateSchoolUseCase } from '@/domains/organization-management/application/use-cases';
import { School } from '@/domains/organization-management/domain/entities/School';
import { MongoSchoolRepository } from '@/domains/organization-management/infrastructure/persistence';
import { UserRole } from '@/domains/user-management/domain/entities/User';
import { Permission } from '@/shared/infrastructure/rbac';
import { requireActorWithPermission } from '@/shared/infrastructure/admin-guards';
import { logAuditEvent } from '@/shared/infrastructure/audit-log';
import { getActorUser } from '@/shared/infrastructure/actor';
import { SchoolModel } from '@/domains/organization-management/infrastructure/persistence/OrganizationSchoolSchema';

export async function GET(request: NextRequest) {
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

    const repo = await initializeAppAndGetService<MongoSchoolRepository>(
      ServiceKeys.SCHOOL_REPOSITORY
    );

    const requestedOrganizationId = request.nextUrl.searchParams.get('organizationId') || undefined;

    let schools: School[] = [];
    if (role === UserRole.SUPER_ADMIN) {
      if (requestedOrganizationId) {
        schools = await repo.findByOrganizationId(requestedOrganizationId);
      } else {
        schools = await repo.findAll();
      }
    } else if (role === UserRole.ORGANIZATION_ADMIN || role === UserRole.ADMIN) {
      if (!actor.getOrganizationId()) {
        return NextResponse.json([], { status: 200 });
      }
      schools = await repo.findByOrganizationId(actor.getOrganizationId());
    } else if (role === UserRole.SCHOOL_ADMIN) {
      if (!actor.getSchoolId()) {
        return NextResponse.json([], { status: 200 });
      }
      const school = await repo.findById(actor.getSchoolId());
      schools = school ? [school] : [];
    }

    const data = schools.map((school) => ({
      id: school.getId(),
      organizationId: school.getOrganizationId(),
      name: school.getSchoolName().getValue(),
      code: school.getSchoolCode().getValue(),
      status: school.getStatus(),
      address: {
        street: school.getAddress().getStreet(),
        city: school.getAddress().getCity(),
        state: school.getAddress().getState(),
        zipCode: school.getAddress().getZipCode(),
        country: school.getAddress().getCountry(),
      },
      contactInfo: {
        email: school.getContactInfo().getEmail(),
        phone: school.getContactInfo().getPhone(),
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
    const actor = await requireActorWithPermission(Permission.CREATE_SCHOOL);
    const body = await request.json();
    const organizationId = body.organizationId ?? actor.getOrganizationId();

    if (!organizationId) {
      return NextResponse.json({ error: 'organizationId is required' }, { status: 400 });
    }

    if (actor.getRole() !== UserRole.SUPER_ADMIN && organizationId !== actor.getOrganizationId()) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const useCase = await initializeAppAndGetService<CreateSchoolUseCase>(
      ServiceKeys.CREATE_SCHOOL_USE_CASE
    );
    const result = await useCase.execute({ ...body, organizationId });

    if (result.getIsFailure()) {
      return NextResponse.json({ error: result.getError() }, { status: 400 });
    }

    await logAuditEvent({
      actorId: actor.getId(),
      actorRole: actor.getRole(),
      action: 'CREATE_SCHOOL',
      targetId: result.getValue().schoolId,
      organizationId,
      schoolId: result.getValue().schoolId,
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
    const actor = await requireActorWithPermission(Permission.CREATE_SCHOOL);
    const body = await request.json();
    const id = typeof body.id === 'string' ? body.id.trim() : '';
    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    const repo = await initializeAppAndGetService<MongoSchoolRepository>(
      ServiceKeys.SCHOOL_REPOSITORY
    );
    const existing = await repo.findById(id);
    if (!existing) {
      return NextResponse.json({ error: 'School not found' }, { status: 404 });
    }

    const organizationId = (body.organizationId ?? existing.getOrganizationId()) as string;
    if (actor.getRole() !== UserRole.SUPER_ADMIN && organizationId !== actor.getOrganizationId()) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const schoolName = typeof body.schoolName === 'string' ? body.schoolName.trim() : '';
    const schoolCode = typeof body.schoolCode === 'string' ? body.schoolCode.trim().toUpperCase() : '';
    const street = typeof body.street === 'string' ? body.street.trim() : '';
    const city = typeof body.city === 'string' ? body.city.trim() : '';
    const state = typeof body.state === 'string' ? body.state.trim() : '';
    const zipCode = typeof body.zipCode === 'string' ? body.zipCode.trim() : '';
    const country = typeof body.country === 'string' ? body.country.trim() : undefined;
    const contactEmail = typeof body.contactEmail === 'string' ? body.contactEmail.trim() : '';
    const contactPhone = typeof body.contactPhone === 'string' ? body.contactPhone.trim() : '';
    const status = body.status === 'inactive' ? 'inactive' : 'active';

    if (!organizationId || !schoolName || !schoolCode || !street || !city || !state || !zipCode || !contactEmail || !contactPhone) {
      return NextResponse.json(
        { error: 'organizationId, schoolName, schoolCode, street, city, state, zipCode, contactEmail and contactPhone are required' },
        { status: 400 }
      );
    }

    try {
      await SchoolModel.updateOne(
        { _id: id },
        {
          $set: {
            organizationId,
            schoolName,
            schoolCode,
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
          },
        }
      );
    } catch (error) {
      const duplicateCode =
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        (error as { code?: unknown }).code === 11000;
      if (duplicateCode) {
        return NextResponse.json({ error: 'School code already exists' }, { status: 409 });
      }
      throw error;
    }

    await logAuditEvent({
      actorId: actor.getId(),
      actorRole: actor.getRole(),
      action: 'UPDATE_SCHOOL',
      targetId: id,
      organizationId,
      schoolId: id,
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
    const actor = await requireActorWithPermission(Permission.CREATE_SCHOOL);
    const id = request.nextUrl.searchParams.get('id')?.trim();
    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    const repo = await initializeAppAndGetService<MongoSchoolRepository>(
      ServiceKeys.SCHOOL_REPOSITORY
    );
    const existing = await repo.findById(id);
    if (!existing) {
      return NextResponse.json({ error: 'School not found' }, { status: 404 });
    }

    if (
      actor.getRole() !== UserRole.SUPER_ADMIN &&
      existing.getOrganizationId() !== actor.getOrganizationId()
    ) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await repo.delete(id);

    await logAuditEvent({
      actorId: actor.getId(),
      actorRole: actor.getRole(),
      action: 'DELETE_SCHOOL',
      targetId: id,
      organizationId: existing.getOrganizationId(),
      schoolId: id,
      ip: request.headers.get('x-forwarded-for') || undefined,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed';
    const status = message === 'UNAUTHORIZED' ? 401 : message === 'FORBIDDEN' ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
