'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Badge } from '@/shared/components/ui/Badge';
import { UserRole } from '@/domains/user-management/domain/entities/User';
import { TableLoader } from '@/shared/components/ui/TableLoader';
import { useToast } from '@/shared/components/ui/ToastProvider';
import { DashboardControls, isWithinDateRange } from '@/shared/components/dashboard/DashboardControls';

type DashboardOverviewResponse = {
  summary: {
    totalCoachingCenters: number;
    totalUsers: number;
    totalAdmins: number;
    totalTeachers: number;
    totalStudents: number;
    totalStaff: number;
  };
  recentUsers: Array<{
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: UserRole;
    createdAt: string;
  }>;
};

type OrganizationItem = {
  id: string;
  name: string;
  type: string;
  status: 'active' | 'inactive';
};

type CoachingCenterItem = {
  id: string;
  organizationId: string;
  name: string;
  code: string;
  status: 'active' | 'inactive';
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

export default function SuperadminDashboardPage() {
  const { status } = useSession();
  const { toastMessage } = useToast();
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [overview, setOverview] = useState<DashboardOverviewResponse>({
    summary: {
      totalCoachingCenters: 0,
      totalUsers: 0,
      totalAdmins: 0,
      totalTeachers: 0,
      totalStudents: 0,
      totalStaff: 0,
    },
    recentUsers: [],
  });
  const [organizations, setOrganizations] = useState<OrganizationItem[]>([]);
  const [coachingCenters, setCoachingCenters] = useState<CoachingCenterItem[]>([]);
  const [lastUpdated, setLastUpdated] = useState<string>('');

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    try {
      const [overviewResponse, organizationsResponse, centersResponse] = await Promise.all([
        fetch('/api/admin/dashboard/overview', { cache: 'no-store' }),
        fetch('/api/admin/organizations', { cache: 'no-store' }),
        fetch('/api/admin/coaching-centers', { cache: 'no-store' }),
      ]);

      const [overviewBody, organizationsBody, centersBody] = await Promise.all([
        overviewResponse.json(),
        organizationsResponse.json(),
        centersResponse.json(),
      ]);

      if (!overviewResponse.ok) {
        throw new Error(overviewBody?.error || 'Failed to load dashboard overview');
      }
      if (!organizationsResponse.ok) {
        throw new Error(organizationsBody?.error || 'Failed to load organizations');
      }
      if (!centersResponse.ok) {
        throw new Error(centersBody?.error || 'Failed to load coaching centers');
      }

      setOverview({
        summary: {
          totalCoachingCenters: Number(overviewBody?.summary?.totalCoachingCenters ?? 0),
          totalUsers: Number(overviewBody?.summary?.totalUsers ?? 0),
          totalAdmins: Number(overviewBody?.summary?.totalAdmins ?? 0),
          totalTeachers: Number(overviewBody?.summary?.totalTeachers ?? 0),
          totalStudents: Number(overviewBody?.summary?.totalStudents ?? 0),
          totalStaff: Number(overviewBody?.summary?.totalStaff ?? 0),
        },
        recentUsers: Array.isArray(overviewBody?.recentUsers) ? overviewBody.recentUsers : [],
      });
      setOrganizations(Array.isArray(organizationsBody) ? organizationsBody : []);
      setCoachingCenters(Array.isArray(centersBody) ? centersBody : []);
      setLastUpdated(new Date().toLocaleString());
    } catch (error) {
      toastMessage(`Error: ${String(error)}`);
    } finally {
      setLoading(false);
    }
  }, [toastMessage]);

  useEffect(() => {
    if (status !== 'authenticated') return;
    loadDashboard();
  }, [status, loadDashboard]);

  const filteredOrganizations = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return organizations;
    return organizations.filter((item) =>
      [item.name, item.id, item.type, item.status].join(' ').toLowerCase().includes(q)
    );
  }, [organizations, query]);

  const filteredCoachingCenters = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return coachingCenters;
    return coachingCenters.filter((item) =>
      [item.name, item.id, item.organizationId, item.code, item.status]
        .join(' ')
        .toLowerCase()
        .includes(q)
    );
  }, [coachingCenters, query]);

  const filteredRecentUsers = useMemo(() => {
    const q = query.trim().toLowerCase();
    return overview.recentUsers.filter((item) => {
      const matchesQuery = !q
        || [item.firstName, item.lastName, item.email, item.role].join(' ').toLowerCase().includes(q);
      const matchesDate = isWithinDateRange(item.createdAt, dateFrom, dateTo);
      return matchesQuery && matchesDate;
    });
  }, [overview.recentUsers, query, dateFrom, dateTo]);

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-violet-50/30 to-indigo-50/40 py-8">
      <main className="mx-auto max-w-7xl space-y-6 px-4 sm:px-6 lg:px-8">
        <section className="rounded-2xl border border-violet-100 bg-linear-to-r from-violet-700 via-indigo-700 to-blue-700 p-6 shadow-lg shadow-violet-200/70">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-white">Superadmin Dashboard</h1>
              <p className="mt-2 text-sm text-violet-50">
                Platform-wide view across organizations, coaching centers, and user operations.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="purple">Global Scope</Badge>
              <button
                type="button"
                onClick={loadDashboard}
                className="rounded-lg border border-white/40 bg-white/15 px-3 py-1 text-xs font-semibold text-white transition hover:bg-white/25"
                disabled={loading}
              >
                {loading ? 'Refreshing...' : 'Refresh'}
              </button>
            </div>
          </div>
          {lastUpdated ? (
            <p className="mt-3 text-xs text-violet-100">Last updated: {lastUpdated}</p>
          ) : null}
        </section>

        <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-6">
          <StatCard title="Organizations" value={organizations.length} tone="purple" loading={loading} />
          <StatCard title="Coaching Centers" value={overview.summary.totalCoachingCenters} tone="blue" loading={loading} />
          <StatCard title="Total Users" value={overview.summary.totalUsers} tone="green" loading={loading} />
          <StatCard title="Admin Users" value={overview.summary.totalAdmins} tone="orange" loading={loading} />
          <StatCard title="Teachers" value={overview.summary.totalTeachers} tone="gray" loading={loading} />
          <StatCard title="Students" value={overview.summary.totalStudents} tone="blue" loading={loading} />
        </section>

        <section className="rounded-2xl border border-slate-200/80 bg-white/95 p-6 shadow-sm shadow-slate-200/70">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-slate-900">Quick Actions</h2>
            <DashboardControls
              query={query}
              onQueryChange={setQuery}
              dateFrom={dateFrom}
              onDateFromChange={setDateFrom}
              dateTo={dateTo}
              onDateToChange={setDateTo}
              onRefresh={loadDashboard}
              loading={loading}
              searchPlaceholder="Search organizations, centers, users"
            />
          </div>
          <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
            <QuickLink href="/admin-roles/organizations" label="Manage Organizations" />
            <QuickLink href="/admin-roles/coaching-centers" label="Manage Coaching Centers" />
            <QuickLink href="/admin-roles/users" label="Manage Users" />
            <QuickLink href="/admin-roles/admin/onboarding" label="Open Onboarding" />
          </div>
        </section>

        <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="rounded-2xl border border-slate-200/80 bg-white/95 p-6 shadow-sm shadow-slate-200/70">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-lg font-semibold text-slate-900">Organizations</h2>
              <Badge variant="purple">{filteredOrganizations.length}</Badge>
            </div>
            <div className="mt-4 space-y-3">
              {filteredOrganizations.slice(0, 8).map((item) => (
                <div key={item.id} className="rounded-xl border border-slate-200 bg-slate-50/80 p-3">
                  <p className="font-medium text-slate-900">{item.name}</p>
                  <p className="mt-1 text-xs text-slate-600">{item.type} · {item.id}</p>
                  <p className="mt-1 text-xs font-medium text-slate-500">Status: {item.status}</p>
                </div>
              ))}
              {!loading && filteredOrganizations.length === 0 ? (
                <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-3 text-sm text-slate-600">
                  No organizations found.
                </div>
              ) : null}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white/95 p-6 shadow-sm shadow-slate-200/70">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-lg font-semibold text-slate-900">Coaching Centers</h2>
              <Badge variant="blue">{filteredCoachingCenters.length}</Badge>
            </div>
            <div className="mt-4 space-y-3">
              {filteredCoachingCenters.slice(0, 8).map((item) => (
                <div key={item.id} className="rounded-xl border border-slate-200 bg-slate-50/80 p-3">
                  <p className="font-medium text-slate-900">{item.name}</p>
                  <p className="mt-1 text-xs text-slate-600">{item.code} · {item.organizationId}</p>
                  <p className="mt-1 text-xs font-medium text-slate-500">Status: {item.status}</p>
                </div>
              ))}
              {!loading && filteredCoachingCenters.length === 0 ? (
                <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-3 text-sm text-slate-600">
                  No coaching centers found.
                </div>
              ) : null}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white/95 p-6 shadow-sm shadow-slate-200/70">
            <h2 className="text-lg font-semibold text-slate-900">Recent Users</h2>
            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-2 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Name</th>
                    <th className="px-2 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Role</th>
                  </tr>
                </thead>
                {loading ? (
                  <TableLoader columns={2} rows={6} />
                ) : (
                  <tbody className="divide-y divide-slate-200 bg-white">
                    {filteredRecentUsers.map((item) => (
                      <tr key={item.id}>
                        <td className="px-2 py-2 text-sm text-slate-700">
                          <p>{item.firstName} {item.lastName}</p>
                          <p className="text-xs text-slate-500">{item.email}</p>
                        </td>
                        <td className="px-2 py-2 text-sm">
                          <Badge variant={roleBadgeVariant[item.role]}>{formatRoleLabel(item.role)}</Badge>
                        </td>
                      </tr>
                    ))}
                    {filteredRecentUsers.length === 0 ? (
                      <tr>
                        <td colSpan={2} className="px-2 py-4 text-center text-sm text-slate-500">No users found.</td>
                      </tr>
                    ) : null}
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
  tone,
  loading,
}: {
  title: string;
  value: number;
  tone: 'gray' | 'blue' | 'green' | 'purple' | 'orange';
  loading: boolean;
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
      className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700"
    >
      {label}
    </Link>
  );
}
