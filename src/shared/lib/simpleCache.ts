type CacheEntry<T> = { value: T; expiresAt: number };

const cache = new Map<string, CacheEntry<unknown>>();

export function setCache<T>(key: string, value: T, ttlSeconds = 60): void {
  const expiresAt = Date.now() + ttlSeconds * 1000;
  cache.set(key, { value, expiresAt } as CacheEntry<unknown>);
}

export function getCache<T>(key: string): T | null {
  const e = cache.get(key);
  if (!e) return null;
  if (Date.now() > e.expiresAt) {
    cache.delete(key);
    return null;
  }
  return e.value as T;
}

export function clearCache(): void {
  cache.clear();
}
