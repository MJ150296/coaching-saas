"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Pencil, Trash2 } from "lucide-react";
import { UserRole } from "@/domains/user-management/domain/entities/User";
import { MultiSelect } from "@/components/multi-select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { TableLoader } from "@/shared/components/ui/TableLoader";
import { useToast } from "@/shared/components/ui/ToastProvider";
import { canCreateRole } from "@/shared/infrastructure/role-policy";
import { getAdminOrganizations, getAdminCoachingCenters } from "@/shared/lib/client/adminTenantReferenceData";

type OrganizationOption = {
  id: string;
  name: string;
};

type CoachingCenterOption = {
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
  organizationId?: string;
  coachingCenterId?: string;
  isActive: boolean;
  emailVerified: boolean;
  createdAt: string | Date;
};

type UsersManagementClientProps = {
  initialActorRole?: UserRole;
  initialOrganizationId?: string;
  initialCoachingCenterId?: string;
  initialListRoleFilter?: string;
  initialUserSearchText?: string;
};

export default function UsersManagementClient({
  initialActorRole,
  initialOrganizationId = "",
  initialCoachingCenterId = "",
  initialListRoleFilter = "",
  initialUserSearchText = "",
}: UsersManagementClientProps) {
  const { data: session, status: sessionStatus } = useSession();
  const { toastMessage } = useToast();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [organizationId, setOrganizationId] = useState(initialOrganizationId);
  const [coachingCenterId, setCoachingCenterId] = useState(initialCoachingCenterId);
  const [role, setRole] = useState<UserRole>(UserRole.TEACHER);
  const [organizations, setOrganizations] = useState<OrganizationOption[]>([]);
  const [coachingCenters, setCoachingCenters] = useState<CoachingCenterOption[]>([]);
  const [tenantLoading, setTenantLoading] = useState(false);
  const [parentEmail, setParentEmail] = useState("");
  const [parentPassword, setParentPassword] = useState("");
  const [parentFirstName, setParentFirstName] = useState("");
  const [parentLastName, setParentLastName] = useState("");
  const [parentPhone, setParentPhone] = useState("");
  const [schoolGrade, setSchoolGrade] = useState("");
  const [schoolName, setSchoolName] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [usersLoading, setUsersLoading] = useState(false);
  const [users, setUsers] = useState<UserListItem[]>([]);
  const [usersTotal, setUsersTotal] = useState(0);
  const [listRoleFilters, setListRoleFilters] = useState<string[]>(
    initialListRoleFilter ? [initialListRoleFilter] : []
  );
  const [userSearchText, setUserSearchText] = useState(initialUserSearchText);
  const [debouncedSearchText, setDebouncedSearchText] = useState(initialUserSearchText);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [editingUser, setEditingUser] = useState<UserListItem | null>(null);
  const [editUserEmail, setEditUserEmail] = useState("");
  const [editUserFirstName, setEditUserFirstName] = useState("");
  const [editUserLastName, setEditUserLastName] = useState("");
  const [editUserPhone, setEditUserPhone] = useState("");
  const [editUserIsActive, setEditUserIsActive] = useState(true);
  const [deleteUser, setDeleteUser] = useState<UserListItem | null>(null);

  // Debounce search input for server-side search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchText(userSearchText);
    }, 300);
    return () => clearTimeout(timer);
  }, [userSearchText]);

  const actorRole = (session?.user?.role as UserRole | undefined) ?? initialActorRole;

  const formatRoleLabel = (inputRole: UserRole): string =>
    inputRole === UserRole.COACHING_ADMIN ? "COACHING_ADMIN" : inputRole.replaceAll("_", " ");

  const roleOptions = useMemo(
    () =>
      actorRole
        ? Object.values(UserRole)
            .filter((targetRole) => canCreateRole(actorRole, targetRole))
            .map((targetRole) => ({
              value: targetRole,
              label: formatRoleLabel(targetRole),
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

  const coachingCenterOptions = useMemo(
    () =>
      coachingCenters
        .filter((coachingCenter) => !organizationId || coachingCenter.organizationId === organizationId)
        .map((coachingCenter) => ({
          value: coachingCenter.id,
          label: `${coachingCenter.name} (${coachingCenter.id})`,
        })),
    [coachingCenters, organizationId]
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
      setCoachingCenters([]);
      setCoachingCenterId("");
      return;
    }

    let active = true;
    async function loadCoachingCenters() {
      setTenantLoading(true);
      try {
        const items = await getAdminCoachingCenters(organizationId);
        if (!active) return;
        setCoachingCenters(items);
        setCoachingCenterId((prev) => {
          if (items.length === 1) return items[0].id;
          if (!items.some((item) => item.id === prev)) return "";
          return prev;
        });
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
      } finally {
        if (active) setTenantLoading(false);
      }
    }

    loadCoachingCenters();
    return () => {
      active = false;
    };
  }, [organizationId]);

  const loadUsers = useCallback(async () => {
    if (!organizationId || !coachingCenterId) {
      setUsers([]);
      setUsersTotal(0);
      return;
    }

    setUsersLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("organizationId", organizationId);
      params.set("coachingCenterId", coachingCenterId);
      params.set("withMeta", "true");
      params.set("limit", itemsPerPage.toString());
      params.set("offset", ((currentPage - 1) * itemsPerPage).toString());
      if (listRoleFilters.length > 0) params.set("role", listRoleFilters.join(","));
      if (debouncedSearchText.trim()) params.set("search", debouncedSearchText.trim());

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
  }, [organizationId, coachingCenterId, listRoleFilters, debouncedSearchText, currentPage, itemsPerPage]);

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
  }, [role, roleOptions]);

  // Calculate pagination
  const totalPages = Math.ceil(usersTotal / itemsPerPage);
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, usersTotal);

  // Use server-side filtered results directly
  const filteredUsers = users;

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchText, listRoleFilters, organizationId, coachingCenterId]);

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
          coachingCenterId: coachingCenterId || undefined,
          schoolGrade: role === UserRole.STUDENT ? schoolGrade || undefined : undefined,
          schoolName: role === UserRole.STUDENT ? schoolName || undefined : undefined,
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
        setShowCreateForm(false);
      }
    } catch (err) {
      setMessage('Error: ' + String(err));
    } finally {
      setLoading(false);
    }
  }

  function openUserEdit(item: UserListItem) {
    setEditingUser(item);
    setEditUserEmail(item.email);
    setEditUserFirstName(item.firstName);
    setEditUserLastName(item.lastName);
    setEditUserPhone(item.phone || "");
    setEditUserIsActive(item.isActive);
  }

  function closeUserEdit() {
    setEditingUser(null);
    setEditUserEmail("");
    setEditUserFirstName("");
    setEditUserLastName("");
    setEditUserPhone("");
    setEditUserIsActive(true);
  }

  async function handleUserUpdate() {
    if (!editingUser) return;
    setLoading(true);
    setMessage(null);
    try {
      const response = await fetch("/api/admin/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingUser.id,
          organizationId: organizationId || editingUser.organizationId,
          coachingCenterId: coachingCenterId || editingUser.coachingCenterId,
          email: editUserEmail,
          firstName: editUserFirstName,
          lastName: editUserLastName,
          phone: editUserPhone || undefined,
          isActive: editUserIsActive,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        setMessage(data?.error || "Failed to update user");
        return;
      }
      await loadUsers();
      closeUserEdit();
      setMessage("User updated successfully.");
    } catch (err) {
      setMessage("Error: " + String(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleUserDelete() {
    if (!deleteUser) return;
    setLoading(true);
    setMessage(null);
    try {
      const params = new URLSearchParams();
      params.set("id", deleteUser.id);
      if (organizationId || deleteUser.organizationId) params.set("organizationId", organizationId || deleteUser.organizationId || "");
      if (coachingCenterId || deleteUser.coachingCenterId) params.set("coachingCenterId", coachingCenterId || deleteUser.coachingCenterId || "");
      const response = await fetch(`/api/admin/users?${params.toString()}`, {
        method: "DELETE",
      });
      const data = await response.json();
      if (!response.ok) {
        setMessage(data?.error || "Failed to delete user");
        return;
      }
      await loadUsers();
      setDeleteUser(null);
      setMessage("User deleted successfully.");
    } catch (err) {
      setMessage("Error: " + String(err));
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
              <h1 className="text-2xl font-bold text-white">User Registration Management</h1>
              <p className="mt-2 text-sm text-indigo-50">
                Manage users for your organization and coaching center. Use onboarding wizard for first-time setup.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <a
                href="/admin-roles/admin/onboarding"
                className="rounded-full bg-white/20 px-3 py-1 text-xs font-semibold text-white hover:bg-white/30"
              >
                Go to Onboarding →
              </a>
            </div>
          </div>
        </div>

        {/* Create User Section */}
        <div className="rounded-2xl border border-slate-200/80 bg-white/95 p-6 shadow-sm shadow-slate-200/70">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Create New User</h2>
              <p className="mt-1 text-sm text-gray-600">
                Add individual users to your organization. For bulk operations, use the bulk import feature.
              </p>
            </div>
            <button
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
            >
              {showCreateForm ? "Cancel" : "+ Create User"}
            </button>
          </div>

          {showCreateForm && (
            <form onSubmit={handleSubmit} className="mt-6 space-y-4 border-t border-slate-200 pt-6">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <MultiSelect
                  options={organizationOptions}
                  value={organizationId ? [organizationId] : []}
                  onValueChange={(values) => {
                    setOrganizationId(values[0] || "");
                    setCoachingCenterId("");
                  }}
                  placeholder="Select organization"
                  disabled={tenantLoading}
                  singleSelect
                />
                <MultiSelect
                  options={coachingCenterOptions}
                  value={coachingCenterId ? [coachingCenterId] : []}
                  onValueChange={(values) => setCoachingCenterId(values[0] || "")}
                  placeholder={!organizationId ? "Select organization first" : "Select coaching center"}
                  disabled={tenantLoading || !organizationId}
                  singleSelect
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
                <MultiSelect
                  options={roleOptions}
                  value={role ? [role] : []}
                  onValueChange={(values) => setRole(values[0] as UserRole)}
                  placeholder={roleOptions.length > 0 ? "Select role" : "No roles available"}
                  disabled={sessionStatus === "loading" || roleOptions.length === 0}
                  singleSelect
                />
              </div>

              {role === UserRole.STUDENT && (
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-4">
                  <h3 className="text-sm font-semibold text-slate-800">
                    Student Details
                  </h3>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">School Name</label>
                      <input
                        value={schoolName}
                        onChange={(e) => setSchoolName(e.target.value)}
                        className={inputClassName}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Class/Grade</label>
                      <input
                        value={schoolGrade}
                        onChange={(e) => setSchoolGrade(e.target.value)}
                        className={inputClassName}
                      />
                    </div>
                  </div>
                </div>
              )}

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
          )}
        </div>

        {/* User List Section */}
        <div className="rounded-2xl border border-slate-200/80 bg-white/95 p-6 shadow-sm shadow-slate-200/70">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-gray-900">Registered Users</h2>
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
                placeholder="Search by name, email, contact number, or role"
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </div>
            <MultiSelect
              options={listRoleOptions}
              onValueChange={setListRoleFilters}
              defaultValue={listRoleFilters}
              placeholder="Filter by role"
              className="w-full"
            />
          </div>

          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={() => loadUsers()}
              disabled={usersLoading || !organizationId || !coachingCenterId}
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {usersLoading ? "Refreshing..." : "Refresh"}
            </button>
            <button
              type="button"
              onClick={() => {
                setListRoleFilters([]);
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
                  <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Actions</th>
                </tr>
              </thead>
              {usersLoading ? (
                <TableLoader columns={8} rows={8} className="bg-white/80" />
              ) : (
                <tbody className="divide-y divide-slate-200 bg-white/80">
                  {filteredUsers.map((item) => (
                    <tr key={item.id}>
                      <td className="px-3 py-2 text-sm">
                        <button
                          onClick={() => router.push(`/profile/users/${item.id}`)}
                          className="text-indigo-600 hover:text-indigo-800 hover:underline font-medium transition-colors"
                        >
                          {item.firstName} {item.lastName}
                        </button>
                      </td>
                      <td className="px-3 py-2 text-sm text-gray-700">{item.email}</td>
                      <td className="px-3 py-2 text-sm text-gray-700">
                        <span className="rounded-full bg-indigo-100 px-2 py-1 text-xs font-semibold text-indigo-700">
                          {formatRoleLabel(item.role).replaceAll("_", " ")}
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
                      <td className="px-3 py-2 text-sm text-gray-700">
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => openUserEdit(item)}
                            title="Edit user"
                            aria-label={`Edit ${item.firstName} ${item.lastName}`}
                            className="rounded-lg border border-slate-300 p-2 text-slate-700 hover:bg-slate-50"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteUser(item)}
                            title="Delete user"
                            aria-label={`Delete ${item.firstName} ${item.lastName}`}
                            className="rounded-lg border border-red-300 p-2 text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredUsers.length === 0 && (
                    <tr>
                      <td colSpan={8} className="px-3 py-4 text-center text-sm text-gray-500">
                        {!organizationId || !coachingCenterId
                          ? "Select organization and coaching center to view users."
                          : "No users found for selected filters."}
                      </td>
                    </tr>
                  )}
                </tbody>
              )}
            </table>
          </div>

          {/* Pagination Controls */}
          {usersTotal > 0 && (
            <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-600">Show:</label>
                <select
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="rounded-md border border-gray-300 bg-white px-2 py-1 text-sm"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
                <span className="text-sm text-gray-600">per page</span>
              </div>

              <div className="text-sm text-gray-600">
                Showing {startItem} to {endItem} of {usersTotal} users
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                  className="rounded-md border border-gray-300 px-2 py-1 text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  First
                </button>
                <button
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="rounded-md border border-gray-300 px-2 py-1 text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Previous
                </button>

                {/* Page Numbers */}
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }

                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`rounded-md border px-2 py-1 text-sm ${
                        currentPage === pageNum
                          ? "border-indigo-500 bg-indigo-500 text-white"
                          : "border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}

                <button
                  onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="rounded-md border border-gray-300 px-2 py-1 text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Next
                </button>
                <button
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                  className="rounded-md border border-gray-300 px-2 py-1 text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Last
                </button>
              </div>
            </div>
          )}
        </div>

        <Dialog open={Boolean(editingUser)} onOpenChange={(open) => !open && closeUserEdit()}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit User</DialogTitle>
              <DialogDescription>
                Update user profile details here.
              </DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <input value={editUserEmail} onChange={(e) => setEditUserEmail(e.target.value)} className={inputClassName} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Phone</label>
                <input value={editUserPhone} onChange={(e) => setEditUserPhone(e.target.value)} className={inputClassName} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">First name</label>
                <input value={editUserFirstName} onChange={(e) => setEditUserFirstName(e.target.value)} className={inputClassName} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Last name</label>
                <input value={editUserLastName} onChange={(e) => setEditUserLastName(e.target.value)} className={inputClassName} />
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <input
                type="checkbox"
                checked={editUserIsActive}
                onChange={(e) => setEditUserIsActive(e.target.checked)}
              />
              Active user
            </label>
            {editingUser ? (
              <p className="text-xs text-slate-500">
                Role: {formatRoleLabel(editingUser.role).replaceAll("_", " ")}
              </p>
            ) : null}
            <DialogFooter>
              <button
                type="button"
                onClick={closeUserEdit}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={loading || !editingUser}
                onClick={handleUserUpdate}
                className="rounded-lg border border-indigo-600 bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Saving..." : "Update User"}
              </button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={Boolean(deleteUser)} onOpenChange={(open) => !open && setDeleteUser(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete User</DialogTitle>
              <DialogDescription>
                This action cannot be undone. Deletion is blocked if the user is still referenced by linked records.
              </DialogDescription>
            </DialogHeader>
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
              {deleteUser ? `You are deleting ${deleteUser.firstName} ${deleteUser.lastName}.` : ""}
            </div>
            <DialogFooter>
              <button
                type="button"
                onClick={() => setDeleteUser(null)}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={loading || !deleteUser}
                onClick={handleUserDelete}
                className="rounded-lg border border-red-600 bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Deleting..." : "Delete User"}
              </button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
