import { User, UserRole } from '@/domains/user-management/domain/entities/User';
import { UserModel } from '@/domains/user-management/infrastructure/persistence/UserSchema';
import { CoachingCenterModel } from '@/domains/organization-management/infrastructure/persistence/OrganizationCoachingCenterSchema';
import { connectDB } from '@/shared/infrastructure/database';
import { getCachedValue, setCachedValue } from '@/shared/infrastructure/api-response-cache';
import { getLogger } from '@/shared/infrastructure/logger';

const DASHBOARD_OVERVIEW_CACHE_PREFIX = 'api:admin:dashboard:overview:';
const DASHBOARD_OVERVIEW_CACHE_TTL_MS = 15_000;

export type UserListItem = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  createdAt: string;
};

export type DashboardStats = {
  totalCoachingCenters?: number;
  totalUsers: number;
  totalAdmins: number;
  totalTeachers: number;
  totalStudents: number;
  totalStaff: number;
};

export type AdminDashboardOverviewPayload = {
  summary: DashboardStats;
  recentUsers: UserListItem[];
  scope: {
    role: UserRole;
    organizationId: string | null;
    coachingCenterId: string | null;
  };
};

export type AdminDashboardOverviewResult = {
  payload: AdminDashboardOverviewPayload;
  cacheHit: boolean;
};

export async function getAdminDashboardOverview(actor: User): Promise<AdminDashboardOverviewResult> {
  const logger = getLogger();
  const start = Date.now();
  const role = actor.getRole();

  if (
    role !== UserRole.SUPER_ADMIN &&
    role !== UserRole.ORGANIZATION_ADMIN &&
    role !== UserRole.COACHING_ADMIN &&
    role !== UserRole.ADMIN
  ) {
    throw new Error('FORBIDDEN');
  }

  const organizationId = actor.getOrganizationId();
  const coachingCenterId = actor.getCoachingCenterId();
  const userScopeQuery: Record<string, unknown> = {};
  const coachingCenterScopeQuery: Record<string, unknown> = {};

  if (role !== UserRole.SUPER_ADMIN) {
    if (!organizationId) {
      throw new Error('Actor organization scope missing');
    }
    userScopeQuery.organizationId = organizationId;
    coachingCenterScopeQuery.organizationId = organizationId;
  }

  if (role === UserRole.COACHING_ADMIN || role === UserRole.ADMIN) {
    if (!coachingCenterId) {
      throw new Error('Actor coaching center scope missing');
    }
    userScopeQuery.coachingCenterId = coachingCenterId;
    coachingCenterScopeQuery._id = coachingCenterId;
  }

  const cacheKey = `${DASHBOARD_OVERVIEW_CACHE_PREFIX}${actor.getId()}:${role}:${organizationId ?? ''}:${coachingCenterId ?? ''}`;
  const cached = getCachedValue<AdminDashboardOverviewPayload>(cacheKey);
  if (cached) {
    logger.debug('GET /api/admin/dashboard/overview cache hit', {
      durationMs: Date.now() - start,
      role,
    });
    return { payload: cached, cacheHit: true };
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

  const payload: AdminDashboardOverviewPayload = {
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
      createdAt: item.createdAt.toISOString().slice(0, 10),
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

  return { payload, cacheHit: false };
}
