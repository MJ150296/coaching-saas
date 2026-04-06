import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

const PUBLIC_PATHS = new Set([
  '/',
  '/auth/signin',
  '/auth/register',
  '/auth/superadmin-bootstrap',
]);

function isPublicPath(pathname: string): boolean {
  if (PUBLIC_PATHS.has(pathname)) return true;
  if (pathname.startsWith('/auth/')) return true;
  if (pathname.startsWith('/api/')) return true;
  if (pathname.startsWith('/_next/')) return true;
  if (pathname === '/favicon.ico') return true;
  return false;
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  const token = await getToken({ req: request });
  if (!token) {
    const signInUrl = request.nextUrl.clone();
    signInUrl.pathname = '/auth/signin';
    signInUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(signInUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/admin-roles/:path*',
    '/teacher/:path*',
    '/student/:path*',
    '/parent/:path*',
    '/staff/:path*',
    '/profile/:path*',
  ],
};

