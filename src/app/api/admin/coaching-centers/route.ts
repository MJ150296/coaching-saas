import { NextRequest, NextResponse } from 'next/server';
import { ServiceKeys } from '@/shared/bootstrap/ServiceKeys';
import { initializeAppAndGetService } from '@/shared/bootstrap/init';
import { CreateCoachingCenterUseCase } from '@/domains/organization-management/application/use-cases';
import { MongoCoachingCenterRepository } from '@/domains/organization-management/infrastructure/persistence';
import { UserRole } from '@/domains/user-management/domain/entities/User';
import { Permission } from '@/shared/infrastructure/rbac';
import { requireActorWithPermission } from '@/shared/infrastructure/admin-guards';
import { logAuditEvent } from '@/shared/infrastructure/audit-log';
import { getActorUser } from '@/shared/infrastructure/actor';
import { CoachingCenterModel } from '@/domains/organization-management/infrastructure/persistence/OrganizationSchoolSchema';
import { getLogger } from '@/shared/infrastructure/logger';
import { getCachedValue, invalidateCacheByPrefix, setCachedValue } from '@/shared/infrastructure/api-response-cache';

const COACHING_CENTER_CACHE_TTL_MS = 15_000;
const COACHING_CENTER_CACHE_PREFIX = 'api:admin:coaching-centers:';

export async function GET(request: NextRequest) {
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

    const requestedOrganizationId = request.nextUrl.searchParams.get('organizationId') || undefined;
    const cacheKey = `${COACHING_CENTER_CACHE_PREFIX}${actor.getId()}:${role}:${actor.getOrganizationId() ?? ''}:${actor.getCoachingCenterId() ?? ''}:${requestedOrganizationId ?? ''}`;
    const cached = getCachedValue<unknown[]>(cacheKey);
    if (cached) {
      logger.debug('GET /api/admin/coaching-centers cache hit', { durationMs: Date.now() - start, role });
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
      organizationId: string;
      name: string;
      code: string;
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
      if (requestedOrganizationId) {
        const rows = await CoachingCenterModel.find({ organizationId: requestedOrganizationId })
          .sort({ createdAt: -1 })
          .select('_id organizationId coachingCenterName coachingCenterCode status address contactInfo')
          .lean<
            Array<{
              _id: string;
              organizationId: string;
              coachingCenterName: string;
              coachingCenterCode: string;
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
          organizationId: row.organizationId,
          name: row.coachingCenterName,
          code: row.coachingCenterCode,
          status: row.status,
          address: row.address,
          contactInfo: row.contactInfo,
        }));
      } else {
        const rows = await CoachingCenterModel.find({})
          .sort({ createdAt: -1 })
          .select('_id organizationId coachingCenterName coachingCenterCode status address contactInfo')
          .lean<
            Array<{
              _id: string;
              organizationId: string;
              coachingCenterName: string;
              coachingCenterCode: string;
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
          organizationId: row.organizationId,
          name: row.coachingCenterName,
          code: row.coachingCenterCode,
          status: row.status,
          address: row.address,
          contactInfo: row.contactInfo,
        }));
      }
    } else if (role === UserRole.ORGANIZATION_ADMIN || role === UserRole.ADMIN) {
      if (!actor.getOrganizationId()) {
        return NextResponse.json([], { status: 200 });
      }
      const rows = await CoachingCenterModel.find({ organizationId: actor.getOrganizationId() })
        .sort({ createdAt: -1 })
        .select('_id organizationId coachingCenterName coachingCenterCode status address contactInfo')
        .lean<
          Array<{
            _id: string;
            organizationId: string;
            coachingCenterName: string;
            coachingCenterCode: string;
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
        organizationId: row.organizationId,
        name: row.coachingCenterName,
        code: row.coachingCenterCode,
        status: row.status,
        address: row.address,
        contactInfo: row.contactInfo,
      }));
    } else if (role === UserRole.COACHING_ADMIN) {
      if (!actor.getCoachingCenterId()) {
        return NextResponse.json([], { status: 200 });
      }
      const row = await CoachingCenterModel.findById(actor.getCoachingCenterId())
        .select('_id organizationId coachingCenterName coachingCenterCode status address contactInfo')
        .lean<{
          _id: string;
          organizationId: string;
          coachingCenterName: string;
          coachingCenterCode: string;
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
          organizationId: row.organizationId,
          name: row.coachingCenterName,
          code: row.coachingCenterCode,
          status: row.status,
          address: row.address,
          contactInfo: row.contactInfo,
        }];
      }
    }

    setCachedValue(cacheKey, data, COACHING_CENTER_CACHE_TTL_MS);
    logger.info('GET /api/admin/coaching-centers', {
      durationMs: Date.now() - start,
      repoResolveMs: repoStart - start,
      queryMs: Date.now() - repoStart,
      count: data.length,
      role,
      requestedOrganizationId,
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
    logger.error('GET /api/admin/coaching-centers failed', error instanceof Error ? error : undefined, {
      durationMs: Date.now() - start,
    });
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const actor = await requireActorWithPermission(Permission.CREATE_COACHING_CENTER);
    const body = await request.json();
    const organizationId = body.organizationId ?? actor.getOrganizationId();

    if (!organizationId) {
      return NextResponse.json({ error: 'organizationId is required' }, { status: 400 });
    }

    if (actor.getRole() !== UserRole.SUPER_ADMIN && organizationId !== actor.getOrganizationId()) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const useCase = await initializeAppAndGetService<CreateCoachingCenterUseCase>(
      ServiceKeys.CREATE_COACHING_CENTER_USE_CASE
    );
    const result = await useCase.execute({ ...body, organizationId });

    if (result.getIsFailure()) {
      return NextResponse.json({ error: result.getError() }, { status: 400 });
    }

    await logAuditEvent({
      actorId: actor.getId(),
      actorRole: actor.getRole(),
      action: 'CREATE_COACHING_CENTER',
      targetId: result.getValue().coachingCenterId,
      organizationId,
      schoolId: result.getValue().coachingCenterId,
      coachingCenterId: result.getValue().coachingCenterId,
      ip: request.headers.get('x-forwarded-for') || undefined,
    });

    invalidateCacheByPrefix(COACHING_CENTER_CACHE_PREFIX);
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
    const actor = await requireActorWithPermission(Permission.CREATE_COACHING_CENTER);
    const body = await request.json();
    const id = typeof body.id === 'string' ? body.id.trim() : '';
    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    const repo = await initializeAppAndGetService<MongoCoachingCenterRepository>(
      ServiceKeys.COACHING_CENTER_REPOSITORY
    );
    const existing = await repo.findById(id);
    if (!existing) {
      return NextResponse.json({ error: 'Coaching center not found' }, { status: 404 });
    }

    const organizationId = (body.organizationId ?? existing.getOrganizationId()) as string;
    if (actor.getRole() !== UserRole.SUPER_ADMIN && organizationId !== actor.getOrganizationId()) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const centerNameRaw =
      typeof body.coachingCenterName === 'string'
        ? body.coachingCenterName
        : typeof body.schoolName === 'string'
          ? body.schoolName
          : '';
    const centerCodeRaw =
      typeof body.coachingCenterCode === 'string'
        ? body.coachingCenterCode
        : typeof body.schoolCode === 'string'
          ? body.schoolCode
          : '';
    const schoolName = centerNameRaw.trim();
    const schoolCode = centerCodeRaw.trim().toUpperCase();
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
        { error: 'organizationId, coachingCenterName, coachingCenterCode, street, city, state, zipCode, contactEmail and contactPhone are required' },
        { status: 400 }
      );
    }

    try {
      await CoachingCenterModel.updateOne(
        { _id: id },
        {
          $set: {
            organizationId,
            coachingCenterName: schoolName,
            coachingCenterCode: schoolCode,
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
        return NextResponse.json({ error: 'Coaching center code already exists' }, { status: 409 });
      }
      throw error;
    }

    await logAuditEvent({
      actorId: actor.getId(),
      actorRole: actor.getRole(),
      action: 'UPDATE_COACHING_CENTER',
      targetId: id,
      organizationId,
      schoolId: id,
      coachingCenterId: id,
      ip: request.headers.get('x-forwarded-for') || undefined,
    });

    invalidateCacheByPrefix(COACHING_CENTER_CACHE_PREFIX);
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
    const actor = await requireActorWithPermission(Permission.CREATE_COACHING_CENTER);
    const id = request.nextUrl.searchParams.get('id')?.trim();
    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    const repo = await initializeAppAndGetService<MongoCoachingCenterRepository>(
      ServiceKeys.COACHING_CENTER_REPOSITORY
    );
    const existing = await repo.findById(id);
    if (!existing) {
      return NextResponse.json({ error: 'Coaching center not found' }, { status: 404 });
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
      action: 'DELETE_COACHING_CENTER',
      targetId: id,
      organizationId: existing.getOrganizationId(),
      schoolId: id,
      coachingCenterId: id,
      ip: request.headers.get('x-forwarded-for') || undefined,
    });

    invalidateCacheByPrefix(COACHING_CENTER_CACHE_PREFIX);
    invalidateCacheByPrefix('api:admin:dashboard:overview:');
    invalidateCacheByPrefix('api:admin:academic-options:');
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed';
    const status = message === 'UNAUTHORIZED' ? 401 : message === 'FORBIDDEN' ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
