"use client";

import { useState } from "react";
import { UserRole } from "@/domains/user-management/domain/entities/User";

export default function AdminUsersPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [organizationId, setOrganizationId] = useState("");
  const [schoolId, setSchoolId] = useState("");
  const [role, setRole] = useState<UserRole>(UserRole.TEACHER);
  const [parentEmail, setParentEmail] = useState("");
  const [parentPassword, setParentPassword] = useState("");
  const [parentFirstName, setParentFirstName] = useState("");
  const [parentLastName, setParentLastName] = useState("");
  const [parentPhone, setParentPhone] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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
        setOrganizationId('');
        setSchoolId('');
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
              <label className="block text-sm font-medium text-gray-700">Organization ID</label>
              <input value={organizationId} onChange={(e) => setOrganizationId(e.target.value)} className="mt-1 block w-full rounded border px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">School ID</label>
              <input value={schoolId} onChange={(e) => setSchoolId(e.target.value)} className="mt-1 block w-full rounded border px-3 py-2" />
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
            <select value={role} onChange={(e) => setRole(e.target.value as UserRole)} className="mt-1 block w-full rounded border px-3 py-2">
              {Object.values(UserRole).map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
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
