import { UserRole } from '@/domains/user-management/domain/entities/User';
import { getActorUser } from '@/shared/infrastructure/actor';
import { connectDB } from '@/shared/infrastructure/database';
import { UserModel } from '@/domains/user-management/infrastructure/persistence/UserSchema';
import { assertTenantScope, resolveTenantScope } from '@/shared/infrastructure/tenant';

const ADMIN_ROLES = new Set<UserRole>([
  UserRole.SUPER_ADMIN,
  UserRole.ORGANIZATION_ADMIN,
  UserRole.COACHING_ADMIN,
  UserRole.ADMIN,
]);

type UserAnalyticsFilters = {
  role: UserRole;
  page: number;
  limit: number;
  query?: string;
  status?: 'active' | 'inactive' | 'all';
  verified?: 'verified' | 'unverified' | 'all';
};

type UserRow = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  organizationId?: string;
  coachingCenterId?: string;
  isActive: boolean;
  emailVerified: boolean;
  createdAt: Date;
};

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export async function getUserAnalyticsTable(filters: UserAnalyticsFilters) {
  const actor = await getActorUser();
  if (!actor) throw new Error('Unauthorized');
  if (!ADMIN_ROLES.has(actor.getRole())) throw new Error('Forbidden');

  const tenant = resolveTenantScope(actor, undefined, undefined);
  if (actor.getRole() !== UserRole.SUPER_ADMIN) {
    assertTenantScope(actor, tenant.organizationId, tenant.coachingCenterId);
  }

  await connectDB();

  const query: Record<string, unknown> = {
    role: filters.role,
  };

  if (tenant.organizationId) query.organizationId = tenant.organizationId;
  if (tenant.coachingCenterId) query.coachingCenterId = tenant.coachingCenterId;

  if (filters.query) {
    const regex = new RegExp(escapeRegex(filters.query.trim()), 'i');
    query.$or = [
      { email: regex },
      { firstName: regex },
      { lastName: regex },
      { phone: regex },
    ];
  }

  if (filters.status === 'active') query.isActive = true;
  if (filters.status === 'inactive') query.isActive = false;
  if (filters.verified === 'verified') query.emailVerified = true;
  if (filters.verified === 'unverified') query.emailVerified = false;

  const skip = Math.max(0, (filters.page - 1) * filters.limit);

  const [items, total, activeCount, verifiedCount, centerIds] = await Promise.all([
    UserModel.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(filters.limit)
      .select('_id email firstName lastName phone organizationId coachingCenterId isActive emailVerified createdAt')
      .lean<UserRow[]>()
      .then((rows) =>
        rows.map((row) => ({
          id: String(row._id),
          email: row.email,
          firstName: row.firstName,
          lastName: row.lastName,
          phone: row.phone,
          organizationId: row.organizationId,
          coachingCenterId: row.coachingCenterId,
          isActive: row.isActive,
          emailVerified: row.emailVerified,
          createdAt: row.createdAt,
        }))
      ),
    UserModel.countDocuments(query),
    UserModel.countDocuments({ ...query, isActive: true }),
    UserModel.countDocuments({ ...query, emailVerified: true }),
    UserModel.distinct('coachingCenterId', query),
  ]);

  const distinctCenters = centerIds.filter((value) => typeof value === 'string' && value.length > 0).length;

  return {
    items,
    total,
    page: filters.page,
    limit: filters.limit,
    totalPages: Math.max(1, Math.ceil(total / filters.limit)),
    activeCount,
    verifiedCount,
    distinctCenters,
  };
}

