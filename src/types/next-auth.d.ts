import 'next-auth';
import 'next-auth/jwt';
import { UserRole } from '@/domains/user-management/domain/entities/User';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      role: UserRole;
      organizationId?: string;
      coachingCenterId?: string;
      firstName?: string;
      lastName?: string;
    } & DefaultSession['user'];
  }

  interface User {
    id: string;
    role: UserRole;
    organizationId?: string;
    coachingCenterId?: string;
    firstName?: string;
    lastName?: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id?: string;
    role?: UserRole;
    organizationId?: string;
    coachingCenterId?: string;
    firstName?: string;
    lastName?: string;
  }
}
