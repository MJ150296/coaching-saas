import { createClient } from 'redis';
import { getLogger } from './logger';

type RedisClient = ReturnType<typeof createClient>;

type RedisGlobalCache = {
  client: RedisClient | null;
  promise: Promise<RedisClient> | null;
  warned: boolean;
};

const globalForRedis = globalThis as typeof globalThis & {
  __redisCache?: RedisGlobalCache;
};

const cache: RedisGlobalCache = globalForRedis.__redisCache ?? {
  client: null,
  promise: null,
  warned: false,
};

if (!globalForRedis.__redisCache) {
  globalForRedis.__redisCache = cache;
}

function getRedisUrl(): string | undefined {
  return process.env.REDIS_URL;
}

export async function getRedisClient(): Promise<RedisClient | null> {
  const url = getRedisUrl();
  if (!url) {
    if (!cache.warned) {
      getLogger().warn('REDIS_URL is not set; rate limiting will be disabled.');
      cache.warned = true;
    }
    return null;
  }

  if (cache.client) {
    return cache.client;
  }

  if (!cache.promise) {
    const client = createClient({ url });
    client.on('error', (err) => {
      getLogger().error('Redis client error', err instanceof Error ? err : undefined);
    });
    cache.promise = client.connect().then(() => client);
  }

  try {
    cache.client = await cache.promise;
    return cache.client;
  } catch (error) {
    cache.promise = null;
    getLogger().error('Failed to connect to Redis', error instanceof Error ? error : undefined);
    return null;
  }
}
