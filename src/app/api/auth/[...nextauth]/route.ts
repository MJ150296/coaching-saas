/**
 * NextAuth API Route Handler
 */

import NextAuth from 'next-auth/next';
import { NextRequest } from 'next/server';
import { authOptions } from '@/shared/infrastructure/auth';
import { checkRateLimit, getClientIp } from '@/shared/infrastructure/rate-limit';

const handler = NextAuth(authOptions);

type RouteContext = {
  params: { nextauth: string[] };
};

export async function GET(request: NextRequest, context: RouteContext) {
  return handler(request, context);
}

export async function POST(request: NextRequest, context: RouteContext) {
  const ip = getClientIp(request);
  const result = await checkRateLimit({
    key: `ratelimit:auth:login:${ip}`,
    limit: 10,
    windowSec: 60,
  });

  if (!result.allowed) {
    return new Response(JSON.stringify({ error: 'Too many login attempts. Try again soon.' }), {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': String(Math.ceil(result.resetMs / 1000)),
      },
    });
  }

  return handler(request, context);
}
