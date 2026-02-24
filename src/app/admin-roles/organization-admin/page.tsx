'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useSession } from 'next-auth/react';
import { UserRole } from '@/domains/user-management/domain/entities/User';
import { Badge } from '@/shared/components/ui/Badge';
import { SearchableDropdown } from '@/shared/components/ui/SearchableDropdown';
import { useToast } from '@/shared/components/ui/ToastProvider';

type SchoolOption = {
  id: string;
  name: string;
  organizationId: string;
};

type UserListItem = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  createdAt: string | Date;
};

type DashboardStats = {
  totalSchools: number;
  totalUsers: number;
  totalAdmins: number;
  totalTeachers: number;
  totalStudents: number;
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

export default function OrganizationAdminDashboardPage() {
  const { data: session, status } = useSession();
  const { toastMessage } = useToast();
  const [schoolOptions, setSchoolOptions] = useState<SchoolOption[]>([]);
  const [selectedSchoolId, setSelectedSchoolId] = useState('');
  const [schoolSearch, setSchoolSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<DashboardStats>({
    totalSchools: 0,
    totalUsers: 0,
    totalAdmins: 0,
    totalTeachers: 0,
    totalStudents: 0,
  });
  const [recentUsers, setRecentUsers] = useState<UserListItem[]>([]);

  const organizationId = (session?.user as { organizationId?: string } | undefined)?.organizationId;
  const schoolIdFromSession = (session?.user as { schoolId?: string } | undefined)?.schoolId;

  const schoolDropdownOptions = useMemo(
    () =>
      schoolOptions.map((school) => ({
        value: school.id,
        label: `${school.name} (${school.id})`,
      })),
    [schoolOptions]
  );

  useEffect(() => {
    if (!schoolIdFromSession) return;
    setSelectedSchoolId((prev) => prev || schoolIdFromSession);
  }, [schoolIdFromSession]);

  useEffect(() => {
    if (status !== 'authenticated' || !organizationId) return;
    let active = true;

    async function loadSchools() {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        params.set('organizationId', organizationId);
        const response = await fetch(`/api/admin/schools?${params.toString()}`);
        const data = await response.json();
        if (!response.ok || !active) {
          toastMessage(data?.error || 'Failed to load schools');
          return;
        }

        const schools = (
          (data as Array<{ id: string; name: string; organizationId: string }> | undefined) ?? []
        ).map((item) => ({
          id: item.id,
          name: item.name,
          organizationId: item.organizationId,
        }));

        if (!active) return;
        setSchoolOptions(schools);
        setStats((prev) => ({ ...prev, totalSchools: schools.length }));
        setSelectedSchoolId((prev) => {
          if (schoolIdFromSession) return schoolIdFromSession;
          if (prev && schools.some((item) => item.id === prev)) return prev;
          if (schools.length === 1) return schools[0].id;
          return '';
        });
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') return;
        toastMessage(`Error: ${String(error)}`);
      } finally {
        if (active) setLoading(false);
      }
    }

    loadSchools();
    return () => {
      active = false;
    };
  }, [status, organizationId, schoolIdFromSession, toastMessage]);

  useEffect(() => {
    if (status !== 'authenticated' || !organizationId || !selectedSchoolId) {
      setRecentUsers([]);
      setStats((prev) => ({
        ...prev,
        totalUsers: 0,
        totalAdmins: 0,
        totalTeachers: 0,
        totalStudents: 0,
      }));
      return;
    }

    let active = true;

    async function fetchCountByRole(role?: UserRole): Promise<number> {
      const params = new URLSearchParams();
      params.set('withMeta', 'true');
      params.set('limit', '1');
      params.set('organizationId', organizationId);
      params.set('schoolId', selectedSchoolId);
      if (role) params.set('role', role);

      const response = await fetch(`/api/admin/users?${params.toString()}`);
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || 'Failed to load dashboard stats');
      }

      if (Array.isArray(data)) return data.length;
      return Number(data?.total ?? 0);
    }

    async function loadStatsAndUsers() {
      setLoading(true);
      try {
        const [totalUsers, totalAdmins, totalTeachers, totalStudents, usersResponse] = await Promise.all([
          fetchCountByRole(),
          Promise.all([
            fetchCountByRole(UserRole.ORGANIZATION_ADMIN),
            fetchCountByRole(UserRole.SCHOOL_ADMIN),
            fetchCountByRole(UserRole.ADMIN),
          ]).then((counts) => counts.reduce((sum, current) => sum + current, 0)),
          fetchCountByRole(UserRole.TEACHER),
          fetchCountByRole(UserRole.STUDENT),
          fetch(
            `/api/admin/users?${new URLSearchParams({
              withMeta: 'true',
              limit: '8',
              organizationId,
              schoolId: selectedSchoolId,
            }).toString()}`
          ),
        ]);

        const usersData = await usersResponse.json();
        if (!usersResponse.ok) {
          throw new Error(usersData?.error || 'Failed to load recent users');
        }

        if (!active) return;
        const items = Array.isArray(usersData)
          ? ((usersData as UserListItem[]) ?? [])
          : ((usersData?.items as UserListItem[] | undefined) ?? []);

        setStats((prev) => ({
          ...prev,
          totalUsers,
          totalAdmins,
          totalTeachers,
          totalStudents,
        }));
        setRecentUsers(items);
      } catch (error) {
        toastMessage(`Error: ${String(error)}`);
      } finally {
        if (active) setLoading(false);
      }
    }

    loadStatsAndUsers();

    return () => {
      active = false;
    };
  }, [status, organizationId, selectedSchoolId, toastMessage]);

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-cyan-50/30 to-blue-50/50 py-8">
      <main className="mx-auto max-w-7xl space-y-6 px-4 sm:px-6 lg:px-8">
        <section className="rounded-2xl border border-cyan-100 bg-linear-to-r from-cyan-600 via-blue-600 to-indigo-600 p-6 shadow-lg shadow-cyan-200/70">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-white">Organization Admin Dashboard</h1>
              <p className="mt-2 text-sm text-cyan-50">
                View school-level performance and manage operations within your organization.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {organizationId ? <Badge variant="green">Org: {organizationId}</Badge> : null}
              {selectedSchoolId ? <Badge variant="orange">School: {selectedSchoolId}</Badge> : null}
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200/80 bg-white/95 p-6 shadow-sm shadow-slate-200/70">
          <h2 className="text-lg font-semibold text-slate-900">School Scope</h2>
          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
            <SearchableDropdown
              options={schoolDropdownOptions}
              value={selectedSchoolId}
              onChange={setSelectedSchoolId}
              search={schoolSearch}
              onSearchChange={setSchoolSearch}
              placeholder="Select school"
              searchPlaceholder="Search school"
              label="School"
              disabled={Boolean(schoolIdFromSession)}
            />
          </div>
        </section>

        <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
          <StatCard title="Total Schools" value={stats.totalSchools} loading={loading} tone="blue" />
          <StatCard title="Total Users" value={stats.totalUsers} loading={loading} tone="green" />
          <StatCard title="Admin Users" value={stats.totalAdmins} loading={loading} tone="purple" />
          <StatCard title="Teachers" value={stats.totalTeachers} loading={loading} tone="orange" />
          <StatCard title="Students" value={stats.totalStudents} loading={loading} tone="gray" />
        </section>

        <section className="grid grid-cols-1 gap-6 lg:grid-cols-5">
          <div className="rounded-2xl border border-slate-200/80 bg-white/95 p-6 shadow-sm shadow-slate-200/70 lg:col-span-2">
            <h2 className="text-lg font-semibold text-slate-900">Quick Actions</h2>
            <div className="mt-4 grid grid-cols-1 gap-2">
              <QuickLink href="/admin-roles/schools" label="Manage Schools" />
              <QuickLink href="/admin-roles/users" label="Manage Users" />
              <QuickLink href="/admin-roles/academic" label="Manage Academic" />
              <QuickLink href="/admin-roles/enrollments" label="Manage Enrollments" />
              <QuickLink href="/admin-roles/fees" label="Manage Fees" />
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
                        {selectedSchoolId ? 'No users found for selected school.' : 'Select a school to load user data.'}
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
      className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-cyan-200 hover:bg-cyan-50 hover:text-cyan-700"
    >
      {label}
    </Link>
  );
}
