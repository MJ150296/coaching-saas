"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { UserRole } from "@/domains/user-management/domain/entities/User";
import { SearchableDropdown } from "@/shared/components/ui/SearchableDropdown";
import { TableLoader } from "@/shared/components/ui/TableLoader";
import { useToast } from "@/shared/components/ui/ToastProvider";
import { canCreateRole } from "@/shared/infrastructure/role-policy";
import { getAdminOrganizations, getAdminSchools } from "@/shared/lib/client/adminTenantReferenceData";

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
  phone?: string;
  isActive: boolean;
  emailVerified: boolean;
  createdAt: string | Date;
};

export default function AdminUsersPage() {
  const { data: session, status: sessionStatus } = useSession();
  const { toastMessage } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [organizationId, setOrganizationId] = useState("");
  const [schoolId, setSchoolId] = useState("");
  const [role, setRole] = useState<UserRole>(UserRole.TEACHER);
  const [roleSearch, setRoleSearch] = useState("");
  const [organizationSearch, setOrganizationSearch] = useState("");
  const [schoolSearch, setSchoolSearch] = useState("");
  const [organizations, setOrganizations] = useState<OrganizationOption[]>([]);
  const [schools, setSchools] = useState<SchoolOption[]>([]);
  const [tenantLoading, setTenantLoading] = useState(false);
  const [parentEmail, setParentEmail] = useState("");
  const [parentPassword, setParentPassword] = useState("");
  const [parentFirstName, setParentFirstName] = useState("");
  const [parentLastName, setParentLastName] = useState("");
  const [parentPhone, setParentPhone] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [usersLoading, setUsersLoading] = useState(false);
  const [users, setUsers] = useState<UserListItem[]>([]);
  const [usersTotal, setUsersTotal] = useState(0);
  const [listRoleFilter, setListRoleFilter] = useState("");
  const [listRoleSearch, setListRoleSearch] = useState("");
  const [userSearchText, setUserSearchText] = useState("");
  const actorRole = session?.user?.role as UserRole | undefined;
  const roleOptions = useMemo(
    () =>
      actorRole
        ? Object.values(UserRole)
            .filter((targetRole) => canCreateRole(actorRole, targetRole))
            .map((targetRole) => ({
              value: targetRole,
              label: targetRole.replaceAll("_", " "),
            }))
        : [],
    [actorRole]
  );
  const listRoleOptions = useMemo(
    () => [{ value: "", label: "ALL" }, ...roleOptions],
    [roleOptions]
  );
  const organizationOptions = useMemo(
    () =>
      organizations.map((org) => ({
        value: org.id,
        label: `${org.name} (${org.id})`,
      })),
    [organizations]
  );
  const schoolOptions = useMemo(
    () =>
      schools
        .filter((school) => !organizationId || school.organizationId === organizationId)
        .map((school) => ({
          value: school.id,
          label: `${school.name} (${school.id})`,
        })),
    [schools, organizationId]
  );

  useEffect(() => {
    let active = true;

    async function loadOrganizations() {
      setTenantLoading(true);
      try {
        const items = await getAdminOrganizations();
        if (!active) return;
        setOrganizations(items);
        if (items.length === 1) {
          setOrganizationId((prev) => prev || items[0].id);
        }
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
        // Ignore background option loading errors.
      } finally {
        if (active) setTenantLoading(false);
      }
    }

    loadOrganizations();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!organizationId) {
      setSchools([]);
      setSchoolId("");
      return;
    }

    let active = true;
    async function loadSchools() {
      setTenantLoading(true);
      try {
        const items = await getAdminSchools(organizationId);
        if (!active) return;
        setSchools(items);
        setSchoolId((prev) => {
          if (items.length === 1) return items[0].id;
          if (!items.some((item) => item.id === prev)) return "";
          return prev;
        });
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
        // Ignore background option loading errors.
      } finally {
        if (active) setTenantLoading(false);
      }
    }

    loadSchools();
    return () => {
      active = false;
    };
  }, [organizationId]);

  const loadUsers = useCallback(async () => {
    if (!organizationId || !schoolId) {
      setUsers([]);
      setUsersTotal(0);
      return;
    }

    setUsersLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("organizationId", organizationId);
      params.set("schoolId", schoolId);
      params.set("withMeta", "true");
      params.set("limit", "200");
      if (listRoleFilter) params.set("role", listRoleFilter);

      const response = await fetch(`/api/admin/users?${params.toString()}`);
      const data = await response.json();
      if (!response.ok) return;

      const items = Array.isArray(data)
        ? ((data as UserListItem[]) ?? [])
        : ((data?.items as UserListItem[] | undefined) ?? []);
      const total = Array.isArray(data)
        ? items.length
        : Number(data?.total ?? items.length);

      setUsers(items);
      setUsersTotal(total);
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
    } finally {
      setUsersLoading(false);
    }
  }, [organizationId, schoolId, listRoleFilter]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  useEffect(() => {
    if (!message) return;
    toastMessage(message);
  }, [message, toastMessage]);

  useEffect(() => {
    if (roleOptions.length === 0) return;
    if (roleOptions.some((option) => option.value === role)) return;
    setRole(roleOptions[0].value as UserRole);
    setRoleSearch("");
  }, [role, roleOptions]);

  const filteredUsers = useMemo(() => {
    const query = userSearchText.trim().toLowerCase();
    if (!query) return users;
    return users.filter((item) => {
      const fullName = `${item.firstName} ${item.lastName}`.toLowerCase();
      return (
        fullName.includes(query) ||
        item.email.toLowerCase().includes(query) ||
        item.role.toLowerCase().includes(query)
      );
    });
  }, [users, userSearchText]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    if (!actorRole) {
      setMessage("Unable to determine your role. Please sign in again.");
      return;
    }
    if (!roleOptions.some((option) => option.value === role)) {
      setMessage("You are not allowed to create this role.");
      return;
    }
    setLoading(true);

    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          firstName,
          lastName,
          phone,
          role,
          organizationId: organizationId || undefined,
          schoolId: schoolId || undefined,
          parent: role === UserRole.STUDENT ? {
            email: parentEmail,
            password: parentPassword,
            firstName: parentFirstName,
            lastName: parentLastName,
            phone: parentPhone || undefined,
          } : undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(data?.error || 'Failed to create user');
      } else {
        setMessage('User created: ' + (data.user?.email || email));
        await loadUsers();
        setEmail('');
        setPassword('');
        setFirstName('');
        setLastName('');
        setPhone('');
        setParentEmail('');
        setParentPassword('');
        setParentFirstName('');
        setParentLastName('');
        setParentPhone('');
      }
    } catch (err) {
      setMessage('Error: ' + String(err));
    } finally {
      setLoading(false);
    }
  }

  const inputClassName =
    "mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100";

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-indigo-50/40 to-sky-50/50 py-8">
      <div className="mx-auto max-w-7xl space-y-6 px-4 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-indigo-100 bg-linear-to-r from-indigo-600 via-violet-600 to-fuchsia-600 p-6 shadow-lg shadow-indigo-200/70">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-white">User Management</h1>
              <p className="mt-2 text-sm text-indigo-50">
                Create users across organization and school scope with role-based access.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-semibold text-white">Users</span>
              <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-semibold text-white">Roles</span>
              <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-semibold text-white">Parent Link</span>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white/95 p-6 shadow-sm shadow-slate-200/70">
          <h2 className="text-lg font-semibold text-gray-900">Create User</h2>
          <p className="mt-1 text-sm text-gray-600">
            Organization and school are optional for non-superadmin users. Superadmin must set both.
          </p>

          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <SearchableDropdown
                options={organizationOptions}
                value={organizationId}
                onChange={(value) => {
                  setOrganizationId(value);
                  setSchoolId("");
                  setSchoolSearch("");
                }}
                search={organizationSearch}
                onSearchChange={setOrganizationSearch}
                placeholder="Select organization"
                searchPlaceholder="Search organization"
                disabled={tenantLoading}
                label="Organization"
              />
              <SearchableDropdown
                options={schoolOptions}
                value={schoolId}
                onChange={setSchoolId}
                search={schoolSearch}
                onSearchChange={setSchoolSearch}
                placeholder={!organizationId ? "Select organization first" : "Select school"}
                searchPlaceholder="Search school"
                disabled={tenantLoading || !organizationId}
                label="School"
              />
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className={inputClassName}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Password</label>
                <input
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  type="password"
                  className={inputClassName}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">First name</label>
                <input
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                  className={inputClassName}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Last name</label>
                <input
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                  className={inputClassName}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">Phone</label>
                <input value={phone} onChange={(e) => setPhone(e.target.value)} className={inputClassName} />
              </div>
              <SearchableDropdown
                options={roleOptions}
                value={role}
                onChange={(value) => setRole(value as UserRole)}
                search={roleSearch}
                onSearchChange={setRoleSearch}
                placeholder={roleOptions.length > 0 ? "Select role" : "No roles available"}
                searchPlaceholder="Search role"
                label="Role"
                disabled={sessionStatus === "loading" || roleOptions.length === 0}
              />
            </div>

            {role === UserRole.STUDENT && (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-4">
                <h3 className="text-sm font-semibold text-slate-800">
                  Parent Details (email required; other fields only if creating a new parent)
                </h3>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Parent Email</label>
                    <input
                      value={parentEmail}
                      onChange={(e) => setParentEmail(e.target.value)}
                      required
                      className={inputClassName}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Parent Password</label>
                    <input
                      value={parentPassword}
                      onChange={(e) => setParentPassword(e.target.value)}
                      type="password"
                      className={inputClassName}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Parent First name</label>
                    <input
                      value={parentFirstName}
                      onChange={(e) => setParentFirstName(e.target.value)}
                      className={inputClassName}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Parent Last name</label>
                    <input
                      value={parentLastName}
                      onChange={(e) => setParentLastName(e.target.value)}
                      className={inputClassName}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Parent Phone</label>
                  <input
                    value={parentPhone}
                    onChange={(e) => setParentPhone(e.target.value)}
                    className={inputClassName}
                  />
                </div>
              </div>
            )}

            <div className="flex items-center gap-2">
              <button
                disabled={loading || sessionStatus === "loading" || roleOptions.length === 0}
                className="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Creating..." : "Create User"}
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={() => {
                  setEmail("");
                  setPassword("");
                  setFirstName("");
                  setLastName("");
                  setPhone("");
                  setParentEmail("");
                  setParentPassword("");
                  setParentFirstName("");
                  setParentLastName("");
                  setParentPhone("");
                }}
                className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Clear Form
              </button>
            </div>
          </form>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white/95 p-6 shadow-sm shadow-slate-200/70">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-gray-900">Existing Users</h2>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700">
                Total: {usersTotal}
              </span>
              <span className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold text-indigo-700">
                Visible: {filteredUsers.length}
              </span>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="space-y-2 md:col-span-2">
              <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500">
                Search User
              </label>
              <input
                value={userSearchText}
                onChange={(e) => setUserSearchText(e.target.value)}
                placeholder="Search by name, email, or role"
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </div>
            <SearchableDropdown
              options={listRoleOptions}
              value={listRoleFilter}
              onChange={setListRoleFilter}
              search={listRoleSearch}
              onSearchChange={setListRoleSearch}
              placeholder="Filter by role"
              searchPlaceholder="Search role filter"
              label="Role Filter"
              disabled={!organizationId || !schoolId}
            />
          </div>

          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={() => loadUsers()}
              disabled={usersLoading || !organizationId || !schoolId}
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {usersLoading ? "Refreshing..." : "Refresh"}
            </button>
            <button
              type="button"
              onClick={() => {
                setListRoleFilter("");
                setUserSearchText("");
              }}
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-slate-50"
            >
              Clear Filters
            </button>
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Name</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Email</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Role</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Phone</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Active</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Verified</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Created</th>
                </tr>
              </thead>
              {usersLoading ? (
                <TableLoader columns={7} rows={8} className="bg-white/80" />
              ) : (
              <tbody className="divide-y divide-slate-200 bg-white/80">
                {filteredUsers.map((item) => (
                  <tr key={item.id}>
                    <td className="px-3 py-2 text-sm text-gray-700">{item.firstName} {item.lastName}</td>
                    <td className="px-3 py-2 text-sm text-gray-700">{item.email}</td>
                    <td className="px-3 py-2 text-sm text-gray-700">
                      <span className="rounded-full bg-indigo-100 px-2 py-1 text-xs font-semibold text-indigo-700">
                        {item.role.replaceAll("_", " ")}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-sm text-gray-700">{item.phone || "-"}</td>
                    <td className="px-3 py-2 text-sm">
                      {item.isActive ? (
                        <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-semibold text-green-700">Active</span>
                      ) : (
                        <span className="rounded-full bg-red-100 px-2 py-1 text-xs font-semibold text-red-700">Inactive</span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-sm">
                      {item.emailVerified ? (
                        <span className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-700">Yes</span>
                      ) : (
                        <span className="rounded-full bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-700">No</span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-sm text-gray-700">
                      {new Date(item.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
                {filteredUsers.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-3 py-4 text-center text-sm text-gray-500">
                      {!organizationId || !schoolId
                        ? "Select organization and school to view users."
                        : "No users found for selected filters."}
                    </td>
                  </tr>
                )}
              </tbody>
              )}
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
