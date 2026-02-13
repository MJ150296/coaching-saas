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
  schoolId?: string
): void {
  if (actor.getRole() === UserRole.SUPER_ADMIN) {
    return;
  }

  if (!actor.getOrganizationId() || !actor.getSchoolId()) {
    throw new Error('Actor tenant scope is missing');
  }

  if (!organizationId || !schoolId) {
    throw new Error('organizationId and schoolId are required');
  }

  if (actor.getOrganizationId() !== organizationId || actor.getSchoolId() !== schoolId) {
    throw new Error('Tenant scope mismatch');
  }
}

export function resolveTenantScope(
  actor: User,
  organizationId?: string,
  schoolId?: string
): { organizationId?: string; schoolId?: string } {
  const normalizedOrganizationId = normalizeTenantId(organizationId);
  const normalizedSchoolId = normalizeTenantId(schoolId);

  if (actor.getRole() === UserRole.SUPER_ADMIN) {
    return { organizationId: normalizedOrganizationId, schoolId: normalizedSchoolId };
  }

  return {
    organizationId: normalizedOrganizationId ?? actor.getOrganizationId(),
    schoolId: normalizedSchoolId ?? actor.getSchoolId(),
  };
}
