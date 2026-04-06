/**
 * NextAuth Configuration
 */

import { getUserServices } from '@/domains/user-management/bootstrap/getUserServices';
import { authConfig } from './auth-config';
import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { PasswordEncryption } from '@/domains/user-management/infrastructure/external-services/PasswordEncryption';

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
          const { userRepository } = await getUserServices();

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
            coachingCenterId: user.getCoachingCenterId(),
            emailVerified: user.isEmailVerified() ? new Date() : null,
          };
        } catch (error) {
          console.error('Auth error:', error);
          return null;
        }
      },
    }),
  ],
  ...authConfig,
};
