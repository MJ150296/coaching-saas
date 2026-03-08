import { NextRequest, NextResponse } from 'next/server';
import { ServiceKeys } from '@/shared/bootstrap/ServiceKeys';
import { initializeAppAndGetService } from '@/shared/bootstrap/init';
import { CreateOrganizationUseCase } from '@/domains/organization-management/application/use-cases';
import { MongoOrganizationRepository } from '@/domains/organization-management/infrastructure/persistence';
import { UserRole } from '@/domains/user-management/domain/entities/User';
import { Permission } from '@/shared/infrastructure/rbac';
import { requireActorWithPermission } from '@/shared/infrastructure/admin-guards';
import { logAuditEvent } from '@/shared/infrastructure/audit-log';
import { getActorUser } from '@/shared/infrastructure/actor';
import { OrganizationModel, CoachingCenterModel } from '@/domains/organization-management/infrastructure/persistence/OrganizationCoachingCenterSchema';
import { getLogger } from '@/shared/infrastructure/logger';
import { getCachedValue, invalidateCacheByPrefix, setCachedValue } from '@/shared/infrastructure/api-response-cache';

const ORG_CACHE_TTL_MS = 15_000;
const ORG_CACHE_PREFIX = 'api:admin:organizations:';

export async function GET() {
  const logger = getLogger();
  const start = Date.now();
  try {
    const actor = await getActorUser();
    if (!actor) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const role = actor.getRole();
    if (
      role !== UserRole.SUPER_ADMIN &&
      role !== UserRole.ORGANIZATION_ADMIN &&
      role !== UserRole.COACHING_ADMIN &&
      role !== UserRole.ADMIN
    ) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const cacheKey = `${ORG_CACHE_PREFIX}${actor.getId()}:${role}:${actor.getOrganizationId() ?? ''}:${actor.getCoachingCenterId() ?? ''}`;
    const cached = getCachedValue<unknown[]>(cacheKey);
    if (cached) {
      logger.debug('GET /api/admin/organizations cache hit', { durationMs: Date.now() - start, role });
      return NextResponse.json(cached, {
        status: 200,
        headers: {
          'Cache-Control': 'private, max-age=15, stale-while-revalidate=30',
          'X-Cache': 'HIT',
        },
      });
    }

    const repoStart = Date.now();
    let data: Array<{
      id: string;
      name: string;
      type: string;
      status: 'active' | 'inactive';
      address: {
        street: string;
        city: string;
        state: string;
        zipCode: string;
        country?: string;
      };
      contactInfo: {
        email: string;
        phone: string;
      };
    }> = [];
    if (role === UserRole.SUPER_ADMIN) {
      const rows = await OrganizationModel.find({})
        .sort({ createdAt: -1 })
        .select('_id organizationName type status address contactInfo')
        .lean<
          Array<{
            _id: string;
            organizationName: string;
            type: string;
            status: 'active' | 'inactive';
            address: {
              street: string;
              city: string;
              state: string;
              zipCode: string;
              country?: string;
            };
            contactInfo: {
              email: string;
              phone: string;
            };
          }>
        >();
      data = rows.map((row) => ({
        id: row._id,
        name: row.organizationName,
        type: row.type,
        status: row.status,
        address: row.address,
        contactInfo: row.contactInfo,
      }));
    } else if (actor.getOrganizationId()) {
      const row = await OrganizationModel.findById(actor.getOrganizationId())
        .select('_id organizationName type status address contactInfo')
        .lean<{
          _id: string;
          organizationName: string;
          type: string;
          status: 'active' | 'inactive';
          address: {
            street: string;
            city: string;
            state: string;
            zipCode: string;
            country?: string;
          };
          contactInfo: {
            email: string;
            phone: string;
          };
        } | null>();
      if (row) {
        data = [{
          id: row._id,
          name: row.organizationName,
          type: row.type,
          status: row.status,
          address: row.address,
          contactInfo: row.contactInfo,
        }];
      }
    }

    setCachedValue(cacheKey, data, ORG_CACHE_TTL_MS);
    logger.info('GET /api/admin/organizations', {
      durationMs: Date.now() - start,
      repoResolveMs: repoStart - start,
      queryMs: Date.now() - repoStart,
      count: data.length,
      role,
    });
    return NextResponse.json(data, {
      status: 200,
      headers: {
        'Cache-Control': 'private, max-age=15, stale-while-revalidate=30',
        'X-Cache': 'MISS',
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed';
    logger.error('GET /api/admin/organizations failed', error instanceof Error ? error : undefined, {
      durationMs: Date.now() - start,
    });
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

    invalidateCacheByPrefix(ORG_CACHE_PREFIX);
    invalidateCacheByPrefix('api:admin:coaching-centers:');
    invalidateCacheByPrefix('api:admin:dashboard:overview:');
    invalidateCacheByPrefix('api:admin:academic-options:');
    return NextResponse.json(result.getValue(), { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed';
    const status = message === 'UNAUTHORIZED' ? 401 : message === 'FORBIDDEN' ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const actor = await getActorUser();
    if (!actor) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const actorRole = actor.getRole();
    if (actorRole !== UserRole.SUPER_ADMIN && actorRole !== UserRole.ORGANIZATION_ADMIN) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const id = typeof body.id === 'string' ? body.id.trim() : '';
    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }
    if (actorRole === UserRole.ORGANIZATION_ADMIN && actor.getOrganizationId() !== id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
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

    invalidateCacheByPrefix(ORG_CACHE_PREFIX);
    invalidateCacheByPrefix('api:admin:coaching-centers:');
    invalidateCacheByPrefix('api:admin:dashboard:overview:');
    invalidateCacheByPrefix('api:admin:academic-options:');
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

    const linkedCoachingCenterCount = await CoachingCenterModel.countDocuments({ organizationId: id });
    if (linkedCoachingCenterCount > 0) {
      return NextResponse.json(
        { error: 'Cannot delete organization with existing coaching centers. Delete coaching centers first.' },
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

    invalidateCacheByPrefix(ORG_CACHE_PREFIX);
    invalidateCacheByPrefix('api:admin:coaching-centers:');
    invalidateCacheByPrefix('api:admin:dashboard:overview:');
    invalidateCacheByPrefix('api:admin:academic-options:');
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed';
    const status = message === 'UNAUTHORIZED' ? 401 : message === 'FORBIDDEN' ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
