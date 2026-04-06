import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/shared/infrastructure/auth';
import { getRoleBasedRedirectPath } from '@/shared/infrastructure/auth-utils';
import { initializeAppAndGetService } from '@/shared/bootstrap/init';
import { ServiceKeys } from '@/shared/bootstrap/ServiceKeys';
import { MongoUserRepository } from '@/domains/user-management/infrastructure/persistence/MongoUserRepository';
import { UserRole } from '@/domains/user-management/domain/entities/User';

export const dynamic = 'force-dynamic';

async function checkRequiresBootstrap(): Promise<boolean> {
  try {
    const userRepository = await initializeAppAndGetService<MongoUserRepository>(
      ServiceKeys.USER_REPOSITORY
    );
    const superadmins = await userRepository.findByRole(UserRole.SUPER_ADMIN);
    return superadmins.length === 0;
  } catch (error) {
    console.error('Failed to check superadmin bootstrap status:', error);
    return false;
  }
}

export default async function Home() {
  const session = await getServerSession(authOptions);

  if (session?.user) {
    const redirectPath = getRoleBasedRedirectPath(session.user.role ?? null);
    redirect(redirectPath);
  }

  const requiresBootstrap = await checkRequiresBootstrap();
  if (requiresBootstrap) {
    redirect('/auth/superadmin-bootstrap');
  }

  return (
    <div className="min-h-screen flex items-center justify-center from-blue-50 to-indigo-100 px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-lg shadow-lg p-8 space-y-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900">Coaching Management System</h1>
            <p className="mt-2 text-gray-600">Manage your coaching operations efficiently</p>
          </div>

          <div className="space-y-3">
            <Link
              href="/auth/signin"
              className="block w-full px-4 py-2 bg-indigo-600 text-white text-center font-medium rounded-md hover:bg-indigo-700 transition-colors"
            >
              Sign In
            </Link>
          </div>

          <p className="text-center text-sm text-gray-600">
            Sign in with your credentials to access the system.
          </p>
        </div>
      </div>
    </div>
  );
}
