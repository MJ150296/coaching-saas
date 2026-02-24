/**
 * Sign In Page
 */

'use client';

import { signIn, useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getRoleBasedRedirectPath } from '@/shared/infrastructure/auth-utils';
import { UserRole } from '@/domains/user-management/domain/entities/User';

interface SeedUser {
  email: string;
  role: string;
}

interface SeedResponse {
  users: SeedUser[];
}

export default function SignIn() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError(result.error);
        setIsLoading(false);
      } else if (result?.ok) {
        // Let useSession update and redirect effect handle navigation.
        setIsLoading(false);
      }
    } catch {
      setError('An error occurred. Please try again.');
      setIsLoading(false);
    }
  }

  // Redirect if already authenticated
  useEffect(() => {
    if (status === 'authenticated' && session?.user?.role) {
      const redirectPath = getRoleBasedRedirectPath(session.user.role as UserRole);
      router.replace(redirectPath);
    }
  }, [status, session, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in to your account
          </h2>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <p className="text-sm font-medium text-red-800">{error}</p>
            </div>
          )}

          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email" className="sr-only">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {isLoading ? 'Signing in...' : 'Sign in'}
            </button>
          </div>

          <div className="text-center">
            <a href="/auth/register" className="text-blue-600 hover:text-blue-500">
              Don&apos;t have an account? Register
            </a>
          </div>
        </form>

        {/* Development Help */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
            <p className="text-sm font-medium text-yellow-800 mb-2">
              🔧 Development Mode - Test Credentials
            </p>
            <p className="text-xs text-yellow-700 mb-3">
              To seed test users with different roles:
            </p>
            <button
              type="button"
              onClick={async () => {
                try {
                  const response = await fetch('/api/dev/seed-test-user', {
                    method: 'POST',
                  });
                  const data: SeedResponse = await response.json();
                  alert(
                    'Test users created!\n\n' +
                    data.users
                      .map((u) => `${u.email}: ${u.role}`)
                      .join('\n') +
                    '\n\nPassword for all: Check console or docs'
                  );
                  console.log('Test Users:', data.users);
                } catch (error) {
                  alert('Error seeding test users: ' + String(error));
                }
              }}
              className="w-full px-3 py-2 text-xs font-medium bg-yellow-100 text-yellow-800 rounded hover:bg-yellow-200 transition"
            >
              Create Test Users
            </button>
            <p className="text-xs text-yellow-700 mt-2">
              admin@test.com / Admin@123456
              <br />
              teacher@test.com / Teacher@123456
              <br />
              student@test.com / Student@123456
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
