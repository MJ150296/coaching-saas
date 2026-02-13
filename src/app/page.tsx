/**
 * Home Page - Redirects based on auth status and role
 */

'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { UserRole } from '@/domains/user-management/domain/entities/User';

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [requiresBootstrap, setRequiresBootstrap] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check auth status and bootstrap status
  useEffect(() => {
    const checkStatus = async () => {
      // Check if superadmin exists
      try {
        const response = await fetch('/api/auth/superadmin-check');
        const data = await response.json();
        setRequiresBootstrap(data.requiresBootstrap);
      } catch (err) {
        console.error('Failed to check bootstrap status:', err);
        setRequiresBootstrap(false);
      }
      setIsLoading(false);
    };

    checkStatus();
  }, []);

  // Redirect logic
  useEffect(() => {
    if (isLoading || status === 'loading') {
      return;
    }

    // If bootstrap is required and no user is authenticated
    if (requiresBootstrap && status === 'unauthenticated') {
      router.push('/auth/superadmin-bootstrap');
      return;
    }

    // If user is authenticated, redirect based on role
    if (status === 'authenticated' && session?.user) {
      const userRole = (session.user as { role?: UserRole }).role;
      switch (userRole) {
        case UserRole.SUPER_ADMIN:
          router.push('/admin-roles/superadmin');
          break;
        case UserRole.ORGANIZATION_ADMIN:
        case UserRole.SCHOOL_ADMIN:
          router.push('/admin-roles/organizations');
          break;
        case UserRole.ADMIN:
          router.push('/admin-roles/admin');
          break;  
        case UserRole.TEACHER:
          router.push('/teacher/dashboard');
          break;
        case UserRole.STUDENT:
          router.push('/student/dashboard');
          break;
        case UserRole.PARENT:
          router.push('/parent/dashboard');
          break;
        case UserRole.STAFF:
          router.push('/staff/dashboard');
          break;
        default:
          router.push('/auth/signin');
      }
    }
  }, [status, session, isLoading, requiresBootstrap, router]);

  // Loading state
  if (isLoading || status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center from-blue-50 to-indigo-100">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Not authenticated and bootstrap is not required
  if (status === 'unauthenticated' && !requiresBootstrap) {
    return (
      <div className="min-h-screen flex items-center justify-center from-blue-50 to-indigo-100 px-4">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-lg shadow-lg p-8 space-y-6">
            <div className="text-center">
              <h1 className="text-3xl font-bold text-gray-900">School Management System</h1>
              <p className="mt-2 text-gray-600">Manage your school efficiently</p>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => {
                  console.log('Navigating to sign-in page...');
                  router.push('/auth/signin');
                }}
                className="w-full px-4 py-2 bg-indigo-600 text-white font-medium rounded-md hover:bg-indigo-700 transition-colors"
              >
                Sign In
              </button>
              <Link
                href="/auth/register"
                className="w-full block text-center px-4 py-2 border border-indigo-600 text-indigo-600 font-medium rounded-md hover:bg-indigo-50 transition-colors"
              >
                Register as Student
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

  // Default: just loading state (redirects happen via useEffect)
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900">School Management System</h1>
        <p className="mt-2 text-gray-600">Redirecting...</p>
      </div>
    </div>
  );
}
