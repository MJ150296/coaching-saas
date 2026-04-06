import { User, UserRole } from '@/domains/user-management/domain/entities/User';
import { OrganizationModel, CoachingCenterModel } from '@/domains/organization-management/infrastructure/persistence/OrganizationCoachingCenterSchema';
import { connectDB } from '@/shared/infrastructure/database';
import { getCachedValue, setCachedValue } from '@/shared/infrastructure/api-response-cache';
import { getLogger } from '@/shared/infrastructure/logger';
import { getAdminDashboardOverview } from './admin-dashboard.server';

const ORG_CACHE_TTL_MS = 15_000;
const ORG_CACHE_PREFIX = 'api:admin:organizations:';
const CENTER_CACHE_TTL_MS = 15_000;
const CENTER_CACHE_PREFIX = 'api:admin:coaching-centers:';

export type OrganizationItem = {
  id: string;
  name: string;
  type: string;
  status: 'active' | 'inactive';
};

export type CoachingCenterItem = {
  id: string;
  organizationId: string;
  name: string;
  code: string;
  status: 'active' | 'inactive';
};

export type SuperadminDashboardData = {
  overview: Awaited<ReturnType<typeof getAdminDashboardOverview>>['payload'];
  organizations: OrganizationItem[];
  coachingCenters: CoachingCenterItem[];
  cache: {
    overviewHit: boolean;
    organizationsHit: boolean;
    coachingCentersHit: boolean;
  };
};

export async function getSuperadminDashboardData(actor: User): Promise<SuperadminDashboardData> {
  const logger = getLogger();
  if (actor.getRole() !== UserRole.SUPER_ADMIN) {
    throw new Error('FORBIDDEN');
  }

  const { payload: overview, cacheHit: overviewHit } = await getAdminDashboardOverview(actor);

  const orgCacheKey = `${ORG_CACHE_PREFIX}${actor.getId()}:${UserRole.SUPER_ADMIN}:::`;
  const centerCacheKey = `${CENTER_CACHE_PREFIX}${actor.getId()}:${UserRole.SUPER_ADMIN}:::`;

  const cachedOrgs = getCachedValue<OrganizationItem[]>(orgCacheKey);
  const cachedCenters = getCachedValue<CoachingCenterItem[]>(centerCacheKey);

  if (cachedOrgs && cachedCenters) {
    return {
      overview,
      organizations: cachedOrgs,
      coachingCenters: cachedCenters,
      cache: {
        overviewHit,
        organizationsHit: true,
        coachingCentersHit: true,
      },
    };
  }

  await connectDB();
  const start = Date.now();

  const [orgRows, centerRows] = await Promise.all([
    cachedOrgs
      ? Promise.resolve([])
      : OrganizationModel.find({})
          .sort({ createdAt: -1 })
          .select('_id organizationName type status')
          .lean<Array<{ _id: string; organizationName: string; type: string; status: 'active' | 'inactive' }>>(),
    cachedCenters
      ? Promise.resolve([])
      : CoachingCenterModel.find({})
          .sort({ createdAt: -1 })
          .select('_id organizationId coachingCenterName coachingCenterCode status')
          .lean<Array<{ _id: string; organizationId: string; coachingCenterName: string; coachingCenterCode: string; status: 'active' | 'inactive' }>>(),
  ]);

  const organizations = cachedOrgs ?? orgRows.map((row) => ({
    id: row._id,
    name: row.organizationName,
    type: row.type,
    status: row.status,
  }));

  const coachingCenters = cachedCenters ?? centerRows.map((row) => ({
    id: row._id,
    organizationId: row.organizationId,
    name: row.coachingCenterName,
    code: row.coachingCenterCode,
    status: row.status,
  }));

  if (!cachedOrgs) {
    setCachedValue(orgCacheKey, organizations, ORG_CACHE_TTL_MS);
  }
  if (!cachedCenters) {
    setCachedValue(centerCacheKey, coachingCenters, CENTER_CACHE_TTL_MS);
  }

  logger.info('GET /admin-roles/superadmin dashboard', {
    durationMs: Date.now() - start,
    organizations: organizations.length,
    coachingCenters: coachingCenters.length,
  });

  return {
    overview,
    organizations,
    coachingCenters,
    cache: {
      overviewHit,
      organizationsHit: Boolean(cachedOrgs),
      coachingCentersHit: Boolean(cachedCenters),
    },
  };
}
