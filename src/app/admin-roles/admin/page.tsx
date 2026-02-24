'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useSession } from 'next-auth/react';
import { UserRole } from '@/domains/user-management/domain/entities/User';
import { Badge } from '@/shared/components/ui/Badge';
import { PageLoader } from '@/shared/components/ui/PageLoader';
import { TableLoader } from '@/shared/components/ui/TableLoader';
import { useToast } from '@/shared/components/ui/ToastProvider';

type UserListItem = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  createdAt: string | Date;
};

type DashboardStats = {
  totalSchools?: number;
  totalUsers: number;
  totalAdmins: number;
  totalTeachers: number;
  totalStudents: number;
  totalStaff: number;
};

type DashboardOverviewResponse = {
  summary: DashboardStats;
  recentUsers: UserListItem[];
};

const roleBadgeVariant: Record<UserRole, 'blue' | 'green' | 'purple' | 'orange' | 'gray'> = {
  [UserRole.SUPER_ADMIN]: 'purple',
  [UserRole.ORGANIZATION_ADMIN]: 'blue',
  [UserRole.SCHOOL_ADMIN]: 'blue',
  [UserRole.ADMIN]: 'blue',
  [UserRole.TEACHER]: 'green',
  [UserRole.STUDENT]: 'orange',
  [UserRole.PARENT]: 'gray',
  [UserRole.STAFF]: 'gray',
};

export default function AdminPage() {
  const { data: session, status } = useSession();
  const { toastMessage } = useToast();
  const [loadingStats, setLoadingStats] = useState(false);
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalAdmins: 0,
    totalTeachers: 0,
    totalStudents: 0,
    totalStaff: 0,
  });
  const [recentUsers, setRecentUsers] = useState<UserListItem[]>([]);

  const actorRole = session?.user?.role as UserRole | undefined;
  const actorOrganizationId = (session?.user as { organizationId?: string } | undefined)?.organizationId;
  const actorSchoolId = (session?.user as { schoolId?: string } | undefined)?.schoolId;

  const roleTitle = useMemo(() => {
    if (!actorRole) return 'Admin Workspace';
    const labels: Record<UserRole, string> = {
      [UserRole.SUPER_ADMIN]: 'Superadmin Workspace',
      [UserRole.ORGANIZATION_ADMIN]: 'Organization Admin Workspace',
      [UserRole.SCHOOL_ADMIN]: 'School Admin Workspace',
      [UserRole.ADMIN]: 'Admin Workspace',
      [UserRole.TEACHER]: 'Teacher Workspace',
      [UserRole.STUDENT]: 'Student Workspace',
      [UserRole.PARENT]: 'Parent Workspace',
      [UserRole.STAFF]: 'Staff Workspace',
    };
    return labels[actorRole];
  }, [actorRole]);

  useEffect(() => {
    if (status !== 'authenticated') return;
    if (!actorRole) {
      setStats({
        totalUsers: 0,
        totalAdmins: 0,
        totalTeachers: 0,
        totalStudents: 0,
        totalStaff: 0,
      });
      setRecentUsers([]);
      return;
    }

    let active = true;

    async function loadDashboardData() {
      setLoadingStats(true);
      try {
        const response = await fetch('/api/admin/dashboard/overview');
        const data = (await response.json()) as DashboardOverviewResponse & { error?: string };
        if (!response.ok) {
          throw new Error(data?.error || 'Failed to load dashboard data');
        }

        if (!active) return;
        setStats({
          totalUsers: Number(data.summary?.totalUsers ?? 0),
          totalAdmins: Number(data.summary?.totalAdmins ?? 0),
          totalTeachers: Number(data.summary?.totalTeachers ?? 0),
          totalStudents: Number(data.summary?.totalStudents ?? 0),
          totalStaff: Number(data.summary?.totalStaff ?? 0),
        });
        setRecentUsers(Array.isArray(data.recentUsers) ? data.recentUsers : []);
      } catch (error) {
        toastMessage(`Error: ${String(error)}`);
      } finally {
        if (active) setLoadingStats(false);
      }
    }

    loadDashboardData();

    return () => {
      active = false;
    };
  }, [status, actorRole, actorOrganizationId, actorSchoolId, toastMessage]);

  if (status === 'loading') {
    return <PageLoader message="Loading dashboard..." />;
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-indigo-50/35 to-sky-50/50 py-8">
      <main className="mx-auto max-w-7xl space-y-6 px-4 sm:px-6 lg:px-8">
        <section className="rounded-2xl border border-indigo-100 bg-linear-to-r from-indigo-600 via-blue-600 to-sky-600 p-6 shadow-lg shadow-indigo-200/70">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-white">{roleTitle}</h1>
              <p className="mt-2 text-sm text-indigo-50">
                Track users, monitor school operations, and jump directly into admin workflows.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {actorRole ? <Badge variant="blue">{actorRole.replaceAll('_', ' ')}</Badge> : null}
              {actorOrganizationId ? <Badge variant="green">Org: {actorOrganizationId}</Badge> : null}
              {actorSchoolId ? <Badge variant="orange">School: {actorSchoolId}</Badge> : null}
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
          <StatCard title="Total Users" value={stats.totalUsers} loading={loadingStats} tone="blue" />
          <StatCard title="Admin Users" value={stats.totalAdmins} loading={loadingStats} tone="purple" />
          <StatCard title="Teachers" value={stats.totalTeachers} loading={loadingStats} tone="green" />
          <StatCard title="Students" value={stats.totalStudents} loading={loadingStats} tone="orange" />
          <StatCard title="Staff" value={stats.totalStaff} loading={loadingStats} tone="gray" />
        </section>

        <section className="grid grid-cols-1 gap-6 lg:grid-cols-5">
          <div className="rounded-2xl border border-slate-200/80 bg-white/95 p-6 shadow-sm shadow-slate-200/70 lg:col-span-2">
            <h2 className="text-lg font-semibold text-slate-900">Quick Actions</h2>
            <div className="mt-4 grid grid-cols-1 gap-2">
              <QuickLink href="/admin-roles/users" label="Manage Users" />
              <QuickLink href="/admin-roles/academic" label="Manage Academic" />
              <QuickLink href="/admin-roles/enrollments" label="Manage Enrollments" />
              <QuickLink href="/admin-roles/fees" label="Manage Fees" />
              <QuickLink href="/admin-roles/admin/onboarding" label="Onboarding Flow" />
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white/95 p-6 shadow-sm shadow-slate-200/70 lg:col-span-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-slate-900">Recent Users</h2>
              <span className="text-xs font-medium text-slate-500">Latest {recentUsers.length} records</span>
            </div>
            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Name</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Email</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Role</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Created</th>
                  </tr>
                </thead>
                {loadingStats ? (
                  <TableLoader columns={4} rows={6} />
                ) : (
                <tbody className="divide-y divide-slate-200 bg-white">
                  {recentUsers.map((item) => (
                    <tr key={item.id}>
                      <td className="px-3 py-2 text-sm text-slate-700">{item.firstName} {item.lastName}</td>
                      <td className="px-3 py-2 text-sm text-slate-700">{item.email}</td>
                      <td className="px-3 py-2 text-sm">
                        <Badge variant={roleBadgeVariant[item.role]}>{item.role.replaceAll('_', ' ')}</Badge>
                      </td>
                      <td className="px-3 py-2 text-sm text-slate-700">{new Date(item.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                  {recentUsers.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-3 py-4 text-center text-sm text-slate-500">
                        No users found in current role scope.
                      </td>
                    </tr>
                  )}
                </tbody>
                )}
              </table>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

function StatCard({
  title,
  value,
  loading,
  tone,
}: {
  title: string;
  value: number;
  loading: boolean;
  tone: 'gray' | 'blue' | 'green' | 'purple' | 'orange';
}) {
  const toneClass: Record<typeof tone, string> = {
    gray: 'border-slate-200 bg-slate-50/80',
    blue: 'border-blue-200 bg-blue-50/80',
    green: 'border-emerald-200 bg-emerald-50/80',
    purple: 'border-violet-200 bg-violet-50/80',
    orange: 'border-orange-200 bg-orange-50/80',
  };

  return (
    <div className={`rounded-2xl border p-5 shadow-sm ${toneClass[tone]}`}>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{title}</p>
      <p className="mt-2 text-3xl font-bold text-slate-900">{loading ? '...' : value.toLocaleString()}</p>
    </div>
  );
}

function QuickLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
    >
      {label}
    </Link>
  );
}
