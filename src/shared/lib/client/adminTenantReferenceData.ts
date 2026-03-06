export type AdminOrganizationOption = {
  id: string;
  name: string;
};

export type AdminCoachingCenterOption = {
  id: string;
  name: string;
  organizationId: string;
};

type CacheEntry<T> = {
  data: T;
  expiresAt: number;
};

const TENANT_CACHE_TTL_MS = 60_000;

let organizationCache: CacheEntry<AdminOrganizationOption[]> | null = null;
let organizationPromise: Promise<AdminOrganizationOption[]> | null = null;

const coachingCenterCache = new Map<string, CacheEntry<AdminCoachingCenterOption[]>>();
const coachingCenterPromises = new Map<string, Promise<AdminCoachingCenterOption[]>>();

function now(): number {
  return Date.now();
}

function getCoachingCenterCacheKey(organizationId?: string): string {
  return organizationId?.trim() || '__ALL__';
}

export async function getAdminOrganizations(options?: {
  force?: boolean;
}): Promise<AdminOrganizationOption[]> {
  const force = Boolean(options?.force);
  const current = organizationCache;
  if (!force && current && current.expiresAt > now()) {
    return current.data;
  }

  if (!force && organizationPromise) {
    return organizationPromise;
  }

  organizationPromise = (async () => {
    try {
      const response = await fetch('/api/admin/organizations');
      const data = (await response.json()) as Array<{ id?: string; name?: string }> | { error?: string };
      if (!response.ok || !Array.isArray(data)) {
        throw new Error((data as { error?: string })?.error || 'Failed to load organizations');
      }

      const items = data
        .filter((item) => typeof item.id === 'string' && typeof item.name === 'string')
        .map((item) => ({
          id: item.id as string,
          name: item.name as string,
        }));

      organizationCache = {
        data: items,
        expiresAt: now() + TENANT_CACHE_TTL_MS,
      };

      return items;
    } finally {
      organizationPromise = null;
    }
  })();

  return organizationPromise;
}

export async function getAdminCoachingCenters(
  organizationId?: string,
  options?: { force?: boolean }
): Promise<AdminCoachingCenterOption[]> {
  const force = Boolean(options?.force);
  const key = getCoachingCenterCacheKey(organizationId);
  const current = coachingCenterCache.get(key);
  if (!force && current && current.expiresAt > now()) {
    return current.data;
  }

  const inFlight = coachingCenterPromises.get(key);
  if (!force && inFlight) {
    return inFlight;
  }

  const request = (async () => {
    try {
      const params = new URLSearchParams();
      if (organizationId?.trim()) {
        params.set('organizationId', organizationId.trim());
      }

      const response = await fetch(`/api/admin/coaching-centers?${params.toString()}`);
      const data = (await response.json()) as
        | Array<{ id?: string; name?: string; organizationId?: string }>
        | { error?: string };
      if (!response.ok || !Array.isArray(data)) {
        throw new Error((data as { error?: string })?.error || 'Failed to load coaching centers');
      }

      const items = data
        .filter(
          (item) =>
            typeof item.id === 'string' &&
            typeof item.name === 'string' &&
            typeof item.organizationId === 'string'
        )
        .map((item) => ({
          id: item.id as string,
          name: item.name as string,
          organizationId: item.organizationId as string,
        }));

      coachingCenterCache.set(key, {
        data: items,
        expiresAt: now() + TENANT_CACHE_TTL_MS,
      });

      return items;
    } finally {
      coachingCenterPromises.delete(key);
    }
  })();

  coachingCenterPromises.set(key, request);
  return request;
}

export function invalidateAdminOrganizations(): void {
  organizationCache = null;
  organizationPromise = null;
}

export function invalidateAdminCoachingCenters(organizationId?: string): void {
  if (!organizationId) {
    coachingCenterCache.clear();
    coachingCenterPromises.clear();
    return;
  }

  const key = getCoachingCenterCacheKey(organizationId);
  coachingCenterCache.delete(key);
  coachingCenterPromises.delete(key);
}

export function invalidateAdminTenantReferenceData(): void {
  invalidateAdminOrganizations();
  invalidateAdminCoachingCenters();
}
