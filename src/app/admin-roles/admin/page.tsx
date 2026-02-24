'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useSession } from 'next-auth/react';
import { UserRole } from '@/domains/user-management/domain/entities/User';
import { SearchableDropdown } from '@/shared/components/ui/SearchableDropdown';
import { Badge } from '@/shared/components/ui/Badge';
import { useToast } from '@/shared/components/ui/ToastProvider';

type OrganizationOption = {
  id: string;
  name: string;
};

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

export default function AdminPage() {
  const { data: session, status } = useSession();
  const { toastMessage } = useToast();
  const [organizationOptions, setOrganizationOptions] = useState<OrganizationOption[]>([]);
  const [schoolOptions, setSchoolOptions] = useState<SchoolOption[]>([]);
  const [selectedOrganizationId, setSelectedOrganizationId] = useState('');
  const [selectedSchoolId, setSelectedSchoolId] = useState('');
  const [organizationSearch, setOrganizationSearch] = useState('');
  const [schoolSearch, setSchoolSearch] = useState('');
  const [loadingTenant, setLoadingTenant] = useState(false);
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

  const canSelectOrganization = actorRole === UserRole.SUPER_ADMIN;
  const canSelectSchool = actorRole === UserRole.SUPER_ADMIN || actorRole === UserRole.ORGANIZATION_ADMIN;

  useEffect(() => {
    if (actorOrganizationId) {
      setSelectedOrganizationId(actorOrganizationId);
    }
    if (actorSchoolId) {
      setSelectedSchoolId(actorSchoolId);
    }
  }, [actorOrganizationId, actorSchoolId]);

  useEffect(() => {
    if (status !== 'authenticated') return;
    let active = true;

    async function loadOrganizations() {
      setLoadingTenant(true);
      try {
        const response = await fetch('/api/admin/organizations');
        const data = await response.json();
        if (!response.ok || !active) {
          toastMessage(data?.error || 'Failed to load organizations');
          return;
        }

        const items = ((data as Array<{ id: string; name: string }> | undefined) ?? []).map((item) => ({
          id: item.id,
          name: item.name,
        }));

        if (!active) return;
        setOrganizationOptions(items);
        if (!actorOrganizationId && items.length === 1) {
          setSelectedOrganizationId(items[0].id);
        }
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') return;
        toastMessage(`Error: ${String(error)}`);
      } finally {
        if (active) setLoadingTenant(false);
      }
    }

    loadOrganizations();

    return () => {
      active = false;
    };
  }, [status, actorOrganizationId, toastMessage]);

  useEffect(() => {
    if (status !== 'authenticated') return;
    if (!selectedOrganizationId) {
      setSchoolOptions([]);
      if (!actorSchoolId) {
        setSelectedSchoolId('');
      }
      return;
    }

    let active = true;

    async function loadSchools() {
      setLoadingTenant(true);
      try {
        const params = new URLSearchParams();
        params.set('organizationId', selectedOrganizationId);
        const response = await fetch(`/api/admin/schools?${params.toString()}`);
        const data = await response.json();
        if (!response.ok || !active) {
          toastMessage(data?.error || 'Failed to load schools');
          return;
        }

        const items = (
          (data as Array<{ id: string; name: string; organizationId: string }> | undefined) ?? []
        ).map((item) => ({
          id: item.id,
          name: item.name,
          organizationId: item.organizationId,
        }));

        if (!active) return;
        setSchoolOptions(items);
        setSelectedSchoolId((prev) => {
          if (actorSchoolId) return actorSchoolId;
          if (items.length === 1) return items[0].id;
          if (items.some((item) => item.id === prev)) return prev;
          return '';
        });
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') return;
        toastMessage(`Error: ${String(error)}`);
      } finally {
        if (active) setLoadingTenant(false);
      }
    }

    loadSchools();

    return () => {
      active = false;
    };
  }, [status, selectedOrganizationId, actorSchoolId, toastMessage]);

  useEffect(() => {
    if (status !== 'authenticated') return;
    if (!selectedOrganizationId || !selectedSchoolId) {
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

    async function fetchCountByRole(role?: UserRole): Promise<number> {
      const params = new URLSearchParams();
      params.set('withMeta', 'true');
      params.set('limit', '1');
      params.set('organizationId', selectedOrganizationId);
      params.set('schoolId', selectedSchoolId);
      if (role) params.set('role', role);

      const response = await fetch(`/api/admin/users?${params.toString()}`);
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || 'Failed to load user stats');
      }
      if (Array.isArray(data)) return data.length;
      return Number(data?.total ?? 0);
    }

    async function loadDashboardData() {
      setLoadingStats(true);
      try {
        const [totalUsers, totalAdmins, totalTeachers, totalStudents, totalStaff, recentUsersResponse] =
          await Promise.all([
            fetchCountByRole(),
            Promise.all([
              fetchCountByRole(UserRole.SUPER_ADMIN),
              fetchCountByRole(UserRole.ORGANIZATION_ADMIN),
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
                organizationId: selectedOrganizationId,
                schoolId: selectedSchoolId,
              }).toString()}`
            ),
          ]);

        const recentUsersData = await recentUsersResponse.json();
        if (!recentUsersResponse.ok) {
          throw new Error(recentUsersData?.error || 'Failed to load recent users');
        }

        if (!active) return;
        const recentItems = Array.isArray(recentUsersData)
          ? ((recentUsersData as UserListItem[]) ?? [])
          : ((recentUsersData?.items as UserListItem[] | undefined) ?? []);

        setStats({
          totalUsers,
          totalAdmins,
          totalTeachers,
          totalStudents,
          totalStaff,
        });
        setRecentUsers(recentItems);
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
  }, [status, selectedOrganizationId, selectedSchoolId, toastMessage]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
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
              {selectedOrganizationId ? <Badge variant="green">Org: {selectedOrganizationId}</Badge> : null}
              {selectedSchoolId ? <Badge variant="orange">School: {selectedSchoolId}</Badge> : null}
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200/80 bg-white/95 p-6 shadow-sm shadow-slate-200/70">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-slate-900">Tenant Scope</h2>
            <button
              type="button"
              onClick={() => {
                setSelectedOrganizationId(actorOrganizationId ?? selectedOrganizationId);
                setSelectedSchoolId(actorSchoolId ?? selectedSchoolId);
              }}
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Reset to Session Scope
            </button>
          </div>
          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
            <SearchableDropdown
              options={organizationOptions.map((item) => ({
                value: item.id,
                label: `${item.name} (${item.id})`,
              }))}
              value={selectedOrganizationId}
              onChange={(value) => {
                setSelectedOrganizationId(value);
                if (!actorSchoolId) setSelectedSchoolId('');
              }}
              search={organizationSearch}
              onSearchChange={setOrganizationSearch}
              placeholder="Select organization"
              searchPlaceholder="Search organization"
              label="Organization"
              disabled={loadingTenant || !canSelectOrganization}
            />
            <SearchableDropdown
              options={schoolOptions.map((item) => ({
                value: item.id,
                label: `${item.name} (${item.id})`,
              }))}
              value={selectedSchoolId}
              onChange={setSelectedSchoolId}
              search={schoolSearch}
              onSearchChange={setSchoolSearch}
              placeholder={!selectedOrganizationId ? 'Select organization first' : 'Select school'}
              searchPlaceholder="Search school"
              label="School"
              disabled={loadingTenant || !selectedOrganizationId || !canSelectSchool}
            />
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
                        {!selectedOrganizationId || !selectedSchoolId
                          ? 'Select organization and school to load dashboard data.'
                          : loadingStats
                          ? 'Loading users...'
                          : 'No users found in selected scope.'}
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
      className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
    >
      {label}
    </Link>
  );
}
