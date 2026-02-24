/**
 * NextAuth Configuration
 */

import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { MongoUserRepository } from '@/domains/user-management/infrastructure/persistence/MongoUserRepository';
import { PasswordEncryption } from '@/domains/user-management/infrastructure/external-services/PasswordEncryption';
import { initializeAppAndGetService } from '@/shared/bootstrap/init';
import { ServiceKeys } from '@/shared/bootstrap/ServiceKeys';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          const userRepository = await initializeAppAndGetService<MongoUserRepository>(
            ServiceKeys.USER_REPOSITORY
          );

          const user = await userRepository.findByEmail(credentials.email);

          if (!user) {
            return null;
          }

          if (!user.isUserActive()) {
            return null;
          }

          const passwordMatch = await PasswordEncryption.compare(
            credentials.password,
            user.getPassword().getValue()
          );

          if (!passwordMatch) {
            return null;
          }

          return {
            id: user.getId(),
            email: user.getEmail().getValue(),
            name: user.getName().getFullName(),
            role: user.getRole(),
            organizationId: user.getOrganizationId(),
            schoolId: user.getSchoolId(),
            emailVerified: user.isEmailVerified() ? new Date() : null,
          };
        } catch (error) {
          console.error('Auth error:', error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.organizationId = user.organizationId;
        token.schoolId = user.schoolId;
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
        session.user.schoolId = token.schoolId;
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
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  jwt: {
    secret: process.env.NEXTAUTH_SECRET,
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET,
};
