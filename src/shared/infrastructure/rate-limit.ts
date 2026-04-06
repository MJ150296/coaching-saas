import { getRedisClient } from './redis';
import { getLogger } from './logger';

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  resetMs: number;
};

type RateLimitOptions = {
  key: string;
  limit: number;
  windowSec: number;
};

export function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    const [first] = forwarded.split(',').map((part) => part.trim());
    if (first) return first;
  }
  const realIp = request.headers.get('x-real-ip');
  if (realIp) return realIp;
  return 'unknown';
}

export async function checkRateLimit(options: RateLimitOptions): Promise<RateLimitResult> {
  const client = await getRedisClient();
  if (!client) {
    return {
      allowed: true,
      remaining: options.limit,
      resetMs: options.windowSec * 1000,
    };
  }

  try {
    const count = await client.incr(options.key);
    if (count === 1) {
      await client.expire(options.key, options.windowSec);
    }
    const ttl = await client.ttl(options.key);
    const resetMs = Math.max(ttl, 0) * 1000;
    return {
      allowed: count <= options.limit,
      remaining: Math.max(options.limit - count, 0),
      resetMs: resetMs || options.windowSec * 1000,
    };
  } catch (error) {
    getLogger().warn('Rate limiting failed, allowing request.', {
      error: error instanceof Error ? error.message : String(error),
    });
    return {
      allowed: true,
      remaining: options.limit,
      resetMs: options.windowSec * 1000,
    };
  }
}
