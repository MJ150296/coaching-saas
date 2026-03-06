'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { UserRole } from '@/domains/user-management/domain/entities/User';
import { Badge } from '@/shared/components/ui/Badge';
import { TableLoader } from '@/shared/components/ui/TableLoader';
import { useToast } from '@/shared/components/ui/ToastProvider';
import { getAdminCoachingCenters } from '@/shared/lib/client/adminTenantReferenceData';

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

type DashboardOverviewResponse = {
  summary: DashboardStats;
  recentUsers: UserListItem[];
};

const roleBadgeVariant: Record<UserRole, 'blue' | 'green' | 'purple' | 'orange' | 'gray'> = {
  [UserRole.SUPER_ADMIN]: 'purple',
  [UserRole.ORGANIZATION_ADMIN]: 'blue',
  [UserRole.COACHING_ADMIN]: 'blue',
  [UserRole.ADMIN]: 'blue',
  [UserRole.TEACHER]: 'green',
  [UserRole.STUDENT]: 'orange',
  [UserRole.PARENT]: 'gray',
  [UserRole.STAFF]: 'gray',
};

function formatRoleLabel(role: UserRole): string {
  if (role === UserRole.COACHING_ADMIN) return 'COACHING ADMIN';
  return role.replaceAll('_', ' ');
}

export default function CoachingAdminDashboardPage() {
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
  const [coachingCenterName, setCoachingCenterName] = useState('');

  const organizationId = (session?.user as { organizationId?: string } | undefined)?.organizationId;
  const schoolId = (session?.user as { schoolId?: string } | undefined)?.schoolId;

  useEffect(() => {
    if (status !== 'authenticated' || !organizationId || !schoolId) return;
    let active = true;

    async function loadDashboardData() {
      setLoading(true);
      try {
        const [overviewResponse, schools] = await Promise.all([
          fetch('/api/admin/dashboard/overview'),
          getAdminCoachingCenters(organizationId),
        ]);
        const overviewData = (await overviewResponse.json()) as DashboardOverviewResponse & {
          error?: string;
        };
        if (!overviewResponse.ok) {
          throw new Error(overviewData?.error || 'Failed to load dashboard data');
        }

        if (!active) return;

        const currentCoachingCenter = schools.find((item) => item.id === schoolId);

        setStats({
          totalUsers: Number(overviewData.summary?.totalUsers ?? 0),
          totalAdmins: Number(overviewData.summary?.totalAdmins ?? 0),
          totalTeachers: Number(overviewData.summary?.totalTeachers ?? 0),
          totalStudents: Number(overviewData.summary?.totalStudents ?? 0),
          totalStaff: Number(overviewData.summary?.totalStaff ?? 0),
        });
        setRecentUsers(Array.isArray(overviewData.recentUsers) ? overviewData.recentUsers : []);
        setCoachingCenterName(
          currentCoachingCenter?.name ?? schoolId ?? ''
        );
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
              <h1 className="text-2xl font-bold text-white">Coaching Admin Dashboard</h1>
              <p className="mt-2 text-sm text-emerald-50">
                Monitor users and coaching center operations for your assigned campus.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {organizationId ? <Badge variant="blue">Org: {organizationId}</Badge> : null}
              {schoolId ? <Badge variant="green">Coaching Center: {coachingCenterName || schoolId}</Badge> : null}
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
              <QuickLink href="/admin-roles/manage-setting/academic" label="Manage Academic" />
              <QuickLink href="/admin-roles/manage-setting/enrollments" label="Manage Enrollments" />
              <QuickLink href="/admin-roles/manage-setting/fees" label="Manage Fees" />
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
                {loading ? (
                  <TableLoader columns={4} rows={6} />
                ) : (
                  <tbody className="divide-y divide-slate-200 bg-white">
                    {recentUsers.map((item) => (
                      <tr key={item.id}>
                        <td className="px-3 py-2 text-sm text-slate-700">{item.firstName} {item.lastName}</td>
                        <td className="px-3 py-2 text-sm text-slate-700">{item.email}</td>
                        <td className="px-3 py-2 text-sm">
                          <Badge variant={roleBadgeVariant[item.role]}>{formatRoleLabel(item.role)}</Badge>
                        </td>
                        <td className="px-3 py-2 text-sm text-slate-700">{new Date(item.createdAt).toLocaleDateString()}</td>
                      </tr>
                    ))}
                    {recentUsers.length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-3 py-4 text-center text-sm text-slate-500">
                          No users found for your coaching center scope.
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
      className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"
    >
      {label}
    </Link>
  );
}
