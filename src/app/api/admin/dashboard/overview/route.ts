import { NextResponse } from 'next/server';
import { UserRole } from '@/domains/user-management/domain/entities/User';
import { UserModel } from '@/domains/user-management/infrastructure/persistence/UserSchema';
import { CoachingCenterModel } from '@/domains/organization-management/infrastructure/persistence/OrganizationCoachingCenterSchema';
import { getActorUser } from '@/shared/infrastructure/actor';
import { connectDB } from '@/shared/infrastructure/database';
import { getLogger } from '@/shared/infrastructure/logger';
import { getCachedValue, setCachedValue } from '@/shared/infrastructure/api-response-cache';

const DASHBOARD_OVERVIEW_CACHE_PREFIX = 'api:admin:dashboard:overview:';
const DASHBOARD_OVERVIEW_CACHE_TTL_MS = 15_000;

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

    const organizationId = actor.getOrganizationId();
    const coachingCenterId = actor.getCoachingCenterId();
    const userScopeQuery: Record<string, unknown> = {};
    const coachingCenterScopeQuery: Record<string, unknown> = {};

    if (role !== UserRole.SUPER_ADMIN) {
      if (!organizationId) {
        return NextResponse.json({ error: 'Actor organization scope missing' }, { status: 400 });
      }
      userScopeQuery.organizationId = organizationId;
      coachingCenterScopeQuery.organizationId = organizationId;
    }

    if (role === UserRole.COACHING_ADMIN || role === UserRole.ADMIN) {
      if (!coachingCenterId) {
        return NextResponse.json({ error: 'Actor coaching center scope missing' }, { status: 400 });
      }
      userScopeQuery.coachingCenterId = coachingCenterId;
      coachingCenterScopeQuery._id = coachingCenterId;
    }

    const cacheKey = `${DASHBOARD_OVERVIEW_CACHE_PREFIX}${actor.getId()}:${role}:${organizationId ?? ''}:${coachingCenterId ?? ''}`;
    const cached = getCachedValue<unknown>(cacheKey);
    if (cached) {
      logger.debug('GET /api/admin/dashboard/overview cache hit', {
        durationMs: Date.now() - start,
        role,
      });
      return NextResponse.json(cached, {
        status: 200,
        headers: {
          'Cache-Control': 'private, max-age=15, stale-while-revalidate=30',
          'X-Cache': 'HIT',
        },
      });
    }

    await connectDB();
    const queryStart = Date.now();
    const countStart = Date.now();

    const countByRole = (roleValue: UserRole): Promise<number> =>
      UserModel.countDocuments({
        ...userScopeQuery,
        role: roleValue,
      });

    const [
      totalUsers,
      totalSuperAdmins,
      totalOrganizationAdmins,
      totalCoachingCenterAdmins,
      totalAdminsOnly,
      totalTeachers,
      totalStudents,
      totalStaff,
      totalCoachingCenters,
    ] = await Promise.all([
      UserModel.countDocuments(userScopeQuery),
      countByRole(UserRole.SUPER_ADMIN),
      countByRole(UserRole.ORGANIZATION_ADMIN),
      countByRole(UserRole.COACHING_ADMIN),
      countByRole(UserRole.ADMIN),
      countByRole(UserRole.TEACHER),
      countByRole(UserRole.STUDENT),
      countByRole(UserRole.STAFF),
      CoachingCenterModel.countDocuments(coachingCenterScopeQuery),
    ]);

    const recentUsersStart = Date.now();
    const recentUsersRaw = await UserModel.find(userScopeQuery)
      .sort({ createdAt: -1 })
      .limit(8)
      .select('_id email firstName lastName role createdAt')
      .lean<Array<{ _id: string; email: string; firstName: string; lastName: string; role: UserRole; createdAt: Date }>>();

    const totalAdmins =
      totalSuperAdmins +
      totalOrganizationAdmins +
      totalCoachingCenterAdmins +
      totalAdminsOnly;

    const payload = {
      summary: {
        totalCoachingCenters,
        totalUsers,
        totalAdmins,
        totalTeachers,
        totalStudents,
        totalStaff,
      },
      recentUsers: recentUsersRaw.map((item) => ({
        id: item._id,
        email: item.email,
        firstName: item.firstName,
        lastName: item.lastName,
        role: item.role,
        createdAt: item.createdAt,
      })),
      scope: {
        role,
        organizationId: organizationId ?? null,
        coachingCenterId: coachingCenterId ?? null,
      },
    };
    setCachedValue(cacheKey, payload, DASHBOARD_OVERVIEW_CACHE_TTL_MS);
    logger.info('GET /api/admin/dashboard/overview', {
      durationMs: Date.now() - start,
      queryMs: Date.now() - queryStart,
      countMs: recentUsersStart - countStart,
      recentUsersMs: Date.now() - recentUsersStart,
      role,
      summary: payload.summary,
    });
    return NextResponse.json(payload, {
      status: 200,
      headers: {
        'Cache-Control': 'private, max-age=15, stale-while-revalidate=30',
        'X-Cache': 'MISS',
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed';
    logger.error('GET /api/admin/dashboard/overview failed', error instanceof Error ? error : undefined, {
      durationMs: Date.now() - start,
    });
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
