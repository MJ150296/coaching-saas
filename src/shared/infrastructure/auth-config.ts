import { NextAuthOptions } from 'next-auth';
import { normalizeUserRole } from '@/domains/user-management/domain/entities/User';

export const authConfig: Pick<
  NextAuthOptions,
  'callbacks' | 'pages' | 'session' | 'jwt' | 'secret'
> = {
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = normalizeUserRole(user.role) ?? undefined;
        token.organizationId = user.organizationId;
        token.coachingCenterId = user.coachingCenterId ?? undefined;
      } else if (token.role) {
        token.role = normalizeUserRole(token.role) ?? undefined;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        if (token.role) {
          session.user.role = token.role;
        }
        session.user.organizationId = token.organizationId;
        session.user.coachingCenterId = (token.coachingCenterId as string | undefined) ?? undefined;
      }
      return session;
    },
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60,
  },
  jwt: {
    secret: process.env.NEXTAUTH_SECRET,
    maxAge: 30 * 24 * 60 * 60,
  },
  secret: process.env.NEXTAUTH_SECRET,
};
