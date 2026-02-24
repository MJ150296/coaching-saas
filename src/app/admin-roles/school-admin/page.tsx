'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { UserRole } from '@/domains/user-management/domain/entities/User';
import { Badge } from '@/shared/components/ui/Badge';
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
  totalUsers: number;
  totalAdmins: number;
  totalTeachers: number;
  totalStudents: number;
  totalStaff: number;
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

export default function SchoolAdminDashboardPage() {
  const { data: session, status } = useSession();
  const { toastMessage } = useToast();
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalAdmins: 0,
    totalTeachers: 0,
    totalStudents: 0,
    totalStaff: 0,
  });
  const [recentUsers, setRecentUsers] = useState<UserListItem[]>([]);
  const [schoolName, setSchoolName] = useState('');

  const organizationId = (session?.user as { organizationId?: string } | undefined)?.organizationId;
  const schoolId = (session?.user as { schoolId?: string } | undefined)?.schoolId;

  useEffect(() => {
    if (status !== 'authenticated' || !organizationId || !schoolId) return;
    let active = true;

    async function fetchCountByRole(role?: UserRole): Promise<number> {
      const params = new URLSearchParams();
      params.set('withMeta', 'true');
      params.set('limit', '1');
      params.set('organizationId', organizationId);
      params.set('schoolId', schoolId);
      if (role) params.set('role', role);

      const response = await fetch(`/api/admin/users?${params.toString()}`);
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || 'Failed to load dashboard stats');
      }
      if (Array.isArray(data)) return data.length;
      return Number(data?.total ?? 0);
    }

    async function loadDashboardData() {
      setLoading(true);
      try {
        const [totalUsers, totalAdmins, totalTeachers, totalStudents, totalStaff, usersResponse, schoolsResponse] =
          await Promise.all([
            fetchCountByRole(),
            Promise.all([
              fetchCountByRole(UserRole.SCHOOL_ADMIN),
              fetchCountByRole(UserRole.ADMIN),
            ]).then((counts) => counts.reduce((sum, current) => sum + current, 0)),
            fetchCountByRole(UserRole.TEACHER),
            fetchCountByRole(UserRole.STUDENT),
            fetchCountByRole(UserRole.STAFF),
            fetch(
              `/api/admin/users?${new URLSearchParams({
                withMeta: 'true',
                limit: '8',
                organizationId,
                schoolId,
              }).toString()}`
            ),
            fetch(`/api/admin/schools?${new URLSearchParams({ organizationId }).toString()}`),
          ]);

        const usersData = await usersResponse.json();
        if (!usersResponse.ok) {
          throw new Error(usersData?.error || 'Failed to load recent users');
        }

        const schoolsData = await schoolsResponse.json();
        if (!schoolsResponse.ok) {
          throw new Error(schoolsData?.error || 'Failed to load school information');
        }

        if (!active) return;

        const users = Array.isArray(usersData)
          ? ((usersData as UserListItem[]) ?? [])
          : ((usersData?.items as UserListItem[] | undefined) ?? []);
        const schools = (schoolsData as Array<{ id: string; name: string }> | undefined) ?? [];
        const currentSchool = schools.find((item) => item.id === schoolId);

        setStats({
          totalUsers,
          totalAdmins,
          totalTeachers,
          totalStudents,
          totalStaff,
        });
        setRecentUsers(users);
        setSchoolName(currentSchool?.name ?? schoolId);
      } catch (error) {
        toastMessage(`Error: ${String(error)}`);
      } finally {
        if (active) setLoading(false);
      }
    }

    loadDashboardData();

    return () => {
      active = false;
    };
  }, [status, organizationId, schoolId, toastMessage]);

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-emerald-50/25 to-lime-50/45 py-8">
      <main className="mx-auto max-w-7xl space-y-6 px-4 sm:px-6 lg:px-8">
        <section className="rounded-2xl border border-emerald-100 bg-linear-to-r from-emerald-600 via-teal-600 to-lime-600 p-6 shadow-lg shadow-emerald-200/70">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-white">School Admin Dashboard</h1>
              <p className="mt-2 text-sm text-emerald-50">
                Monitor users and school operations for your assigned campus.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {organizationId ? <Badge variant="blue">Org: {organizationId}</Badge> : null}
              {schoolId ? <Badge variant="green">School: {schoolName || schoolId}</Badge> : null}
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
          <StatCard title="Total Users" value={stats.totalUsers} loading={loading} tone="blue" />
          <StatCard title="Admin Users" value={stats.totalAdmins} loading={loading} tone="purple" />
          <StatCard title="Teachers" value={stats.totalTeachers} loading={loading} tone="green" />
          <StatCard title="Students" value={stats.totalStudents} loading={loading} tone="orange" />
          <StatCard title="Staff" value={stats.totalStaff} loading={loading} tone="gray" />
        </section>

        <section className="grid grid-cols-1 gap-6 lg:grid-cols-5">
          <div className="rounded-2xl border border-slate-200/80 bg-white/95 p-6 shadow-sm shadow-slate-200/70 lg:col-span-2">
            <h2 className="text-lg font-semibold text-slate-900">Quick Actions</h2>
            <div className="mt-4 grid grid-cols-1 gap-2">
              <QuickLink href="/admin-roles/academic" label="Manage Academic" />
              <QuickLink href="/admin-roles/enrollments" label="Manage Enrollments" />
              <QuickLink href="/admin-roles/fees" label="Manage Fees" />
              <QuickLink href="/admin-roles/admin/onboarding" label="Onboarding Flow" />
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white/95 p-6 shadow-sm shadow-slate-200/70 lg:col-span-3">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-slate-900">Recent Users</h2>
              <span className="text-xs font-medium text-slate-500">Latest {recentUsers.length}</span>
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
                        {loading ? 'Loading users...' : 'No users found for your school scope.'}
                      </td>
                    </tr>
                  )}
                </tbody>
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
      className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"
    >
      {label}
    </Link>
  );
}
