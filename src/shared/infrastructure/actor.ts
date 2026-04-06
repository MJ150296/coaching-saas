import { getServerSession } from 'next-auth';
import { getUserServices } from '@/domains/user-management/bootstrap/getUserServices';
import { authConfig } from '@/shared/infrastructure/auth-config';
import { User } from '@/domains/user-management/domain/entities/User';

export async function getActorUser(): Promise<User | null> {
  const session = await getServerSession(authConfig);
  if (!session?.user?.email) {
    return null;
  }

  const { userRepository: repo } = await getUserServices();
  return repo.findByEmail(session.user.email);
}
