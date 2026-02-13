"use client";

import { useEffect, useMemo, useState } from "react";
import { UserRole } from "@/domains/user-management/domain/entities/User";
import { SearchableDropdown } from "@/shared/components/ui/SearchableDropdown";

type OrganizationOption = {
  id: string;
  name: string;
};

type SchoolOption = {
  id: string;
  name: string;
  organizationId: string;
};

export default function AdminUsersPage() {
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
  const roleOptions = Object.values(UserRole).map((r) => ({
    value: r,
    label: r.replaceAll("_", " "),
  }));
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
        const response = await fetch("/api/admin/organizations");
        const data = await response.json();
        if (!response.ok || !active) return;

        const items = ((data as Array<{ id: string; name: string }> | undefined) ?? []).map(
          (item) => ({
            id: item.id,
            name: item.name,
          })
        );
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
        const params = new URLSearchParams();
        params.set("organizationId", organizationId);
        const response = await fetch(`/api/admin/schools?${params.toString()}`);
        const data = await response.json();
        if (!response.ok || !active) return;
        const items = (
          (data as Array<{ id: string; name: string; organizationId: string }> | undefined) ?? []
        ).map((item) => ({
          id: item.id,
          name: item.name,
          organizationId: item.organizationId,
        }));
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

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

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto bg-white p-6 rounded shadow">
        <h2 className="text-2xl font-bold mb-4">Create User</h2>
        <div className="mb-4 flex flex-wrap gap-3 text-sm">
          <a className="text-indigo-600 hover:underline" href="/admin-roles/academic">Academic</a>
          <a className="text-indigo-600 hover:underline" href="/admin-roles/fees">Fees</a>
          <a className="text-indigo-600 hover:underline" href="/admin-roles/schools">Schools</a>
          <a className="text-indigo-600 hover:underline" href="/admin-roles/organizations">Organizations</a>
        </div>
        {message && <div className="mb-4 text-sm text-gray-700">{message}</div>}

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="rounded border border-gray-200 bg-gray-50 p-3 text-xs text-gray-600">
            Organization and school are optional for non-superadmin users. Superadmin must set both.
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700">Organization</label>
              <div className="mt-1">
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
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">School</label>
              <div className="mt-1">
                <SearchableDropdown
                  options={schoolOptions}
                  value={schoolId}
                  onChange={setSchoolId}
                  search={schoolSearch}
                  onSearchChange={setSchoolSearch}
                  placeholder="Select school"
                  searchPlaceholder="Search school"
                  disabled={tenantLoading || !organizationId}
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input value={email} onChange={(e) => setEmail(e.target.value)} required className="mt-1 block w-full rounded border px-3 py-2" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Password</label>
            <input value={password} onChange={(e) => setPassword(e.target.value)} required type="password" className="mt-1 block w-full rounded border px-3 py-2" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700">First name</label>
              <input value={firstName} onChange={(e) => setFirstName(e.target.value)} required className="mt-1 block w-full rounded border px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Last name</label>
              <input value={lastName} onChange={(e) => setLastName(e.target.value)} required className="mt-1 block w-full rounded border px-3 py-2" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Phone</label>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} className="mt-1 block w-full rounded border px-3 py-2" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Role</label>
            <div className="mt-1">
              <SearchableDropdown
                options={roleOptions}
                value={role}
                onChange={(value) => setRole(value as UserRole)}
                search={roleSearch}
                onSearchChange={setRoleSearch}
                placeholder="Select role"
                searchPlaceholder="Search role"
              />
            </div>
          </div>

          {role === UserRole.STUDENT && (
            <div className="rounded border border-gray-200 p-3 space-y-3">
              <h3 className="text-sm font-semibold text-gray-700">Parent Details (required for student)</h3>
              <div>
                <label className="block text-sm font-medium text-gray-700">Parent Email</label>
                <input value={parentEmail} onChange={(e) => setParentEmail(e.target.value)} required className="mt-1 block w-full rounded border px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Parent Password</label>
                <input value={parentPassword} onChange={(e) => setParentPassword(e.target.value)} required type="password" className="mt-1 block w-full rounded border px-3 py-2" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Parent First name</label>
                  <input value={parentFirstName} onChange={(e) => setParentFirstName(e.target.value)} required className="mt-1 block w-full rounded border px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Parent Last name</label>
                  <input value={parentLastName} onChange={(e) => setParentLastName(e.target.value)} required className="mt-1 block w-full rounded border px-3 py-2" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Parent Phone</label>
                <input value={parentPhone} onChange={(e) => setParentPhone(e.target.value)} className="mt-1 block w-full rounded border px-3 py-2" />
              </div>
            </div>
          )}

          <div>
            <button disabled={loading} className="w-full bg-indigo-600 text-white py-2 rounded">{loading ? 'Creating...' : 'Create User'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
