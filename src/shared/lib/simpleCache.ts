type CacheEntry = { value: any; expiresAt: number };

const cache = new Map<string, CacheEntry>();

export function setCache(key: string, value: any, ttlSeconds = 60) {
  const expiresAt = Date.now() + ttlSeconds * 1000;
  cache.set(key, { value, expiresAt });
}

export function getCache(key: string) {
  const e = cache.get(key);
  if (!e) return null;
  if (Date.now() > e.expiresAt) {
    cache.delete(key);
    return null;
  }
  return e.value;
}

export function clearCache() {
  cache.clear();
}
