type CacheEntry<T> = {
  value: T;
  expiresAt: number;
};

type ApiResponseCacheStore = Map<string, CacheEntry<unknown>>;

const globalForApiCache = globalThis as typeof globalThis & {
  __apiResponseCacheStore?: ApiResponseCacheStore;
  __apiResponseCacheInflight?: Map<string, Promise<unknown>>;
};

const store: ApiResponseCacheStore = globalForApiCache.__apiResponseCacheStore ?? new Map();
const inflight: Map<string, Promise<unknown>> = globalForApiCache.__apiResponseCacheInflight ?? new Map();

if (!globalForApiCache.__apiResponseCacheStore) {
  globalForApiCache.__apiResponseCacheStore = store;
}
if (!globalForApiCache.__apiResponseCacheInflight) {
  globalForApiCache.__apiResponseCacheInflight = inflight;
}

function now(): number {
  return Date.now();
}

const DEFAULT_MAX_ENTRIES = 1000;

function touch(key: string, entry: CacheEntry<unknown>) {
  // Refresh LRU order by reinserting.
  store.delete(key);
  store.set(key, entry);
}

function pruneExpired() {
  const current = now();
  for (const [key, entry] of store.entries()) {
    if (entry.expiresAt <= current) {
      store.delete(key);
    }
  }
}

function ensureCapacity(maxEntries = DEFAULT_MAX_ENTRIES) {
  pruneExpired();
  while (store.size > maxEntries) {
    const oldestKey = store.keys().next().value as string | undefined;
    if (!oldestKey) return;
    store.delete(oldestKey);
  }
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

  touch(key, entry);
  return entry.value as T;
}

export function setCachedValue<T>(key: string, value: T, ttlMs: number, maxEntries = DEFAULT_MAX_ENTRIES): void {
  store.set(key, {
    value,
    expiresAt: now() + ttlMs,
  });
  ensureCapacity(maxEntries);
}

export function invalidateCacheByPrefix(prefix: string): void {
  for (const key of store.keys()) {
    if (key.startsWith(prefix)) {
      store.delete(key);
    }
  }
}

export async function getOrSetCachedValue<T>(
  key: string,
  ttlMs: number,
  loader: () => Promise<T>,
  maxEntries = DEFAULT_MAX_ENTRIES
): Promise<T> {
  const cached = getCachedValue<T>(key);
  if (cached !== null) return cached;

  const existing = inflight.get(key) as Promise<T> | undefined;
  if (existing) return existing;

  const promise = loader()
    .then((value) => {
      setCachedValue(key, value, ttlMs, maxEntries);
      inflight.delete(key);
      return value;
    })
    .catch((error) => {
      inflight.delete(key);
      throw error;
    });

  inflight.set(key, promise as Promise<unknown>);
  return promise;
}
