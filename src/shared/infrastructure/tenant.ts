import { User } from '@/domains/user-management/domain/entities/User';
import { UserRole } from '@/domains/user-management/domain/entities/User';

function normalizeTenantId(value?: string): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

export function assertTenantScope(
  actor: User,
  organizationId?: string,
  coachingCenterId?: string
): void {
  const tenantId = coachingCenterId;
  if (actor.getRole() === UserRole.SUPER_ADMIN) {
    return;
  }

  if (!actor.getOrganizationId() || !actor.getCoachingCenterId()) {
    throw new Error('Actor tenant scope is missing');
  }

  if (!organizationId || !tenantId) {
    throw new Error('organizationId and coachingCenterId are required');
  }

  if (actor.getOrganizationId() !== organizationId || actor.getCoachingCenterId() !== tenantId) {
    throw new Error('Tenant scope mismatch');
  }
}

export function resolveTenantScope(
  actor: User,
  organizationId?: string,
  coachingCenterId?: string
): { organizationId?: string; coachingCenterId?: string; coachingCenterId?: string } {
  const normalizedOrganizationId = normalizeTenantId(organizationId);
  const normalizedCoachingCenterId = normalizeTenantId(coachingCenterId);

  if (actor.getRole() === UserRole.SUPER_ADMIN) {
    return {
      organizationId: normalizedOrganizationId,
      coachingCenterId: normalizedCoachingCenterId,
      coachingCenterId: normalizedCoachingCenterId,
    };
  }

  const actorTenantId = actor.getCoachingCenterId();
  const resolvedTenantId = normalizedCoachingCenterId ?? actorTenantId;
  return {
    organizationId: normalizedOrganizationId ?? actor.getOrganizationId(),
    coachingCenterId: resolvedTenantId,
    coachingCenterId: resolvedTenantId,
  };
}
