type CacheEntry<T> = {
  value: T;
  expiresAt: number;
};

type ApiResponseCacheStore = Map<string, CacheEntry<unknown>>;

const globalForApiCache = globalThis as typeof globalThis & {
  __apiResponseCacheStore?: ApiResponseCacheStore;
};

const store: ApiResponseCacheStore = globalForApiCache.__apiResponseCacheStore ?? new Map();

if (!globalForApiCache.__apiResponseCacheStore) {
  globalForApiCache.__apiResponseCacheStore = store;
}

function now(): number {
  return Date.now();
}

export function getCachedValue<T>(key: string): T | null {
  const entry = store.get(key);
  if (!entry) {
    return null;
  }

  if (entry.expiresAt <= now()) {
    store.delete(key);
    return null;
  }

  return entry.value as T;
}

export function setCachedValue<T>(key: string, value: T, ttlMs: number): void {
  store.set(key, {
    value,
    expiresAt: now() + ttlMs,
  });
}

export function invalidateCacheByPrefix(prefix: string): void {
  for (const key of store.keys()) {
    if (key.startsWith(prefix)) {
      store.delete(key);
    }
  }
}
