/**
 * Superadmin Dashboard
 * /admin/dashboard
 */

'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { UserRole } from '@/domains/user-management/domain/entities/User';
import { SearchableDropdown } from '@/shared/components/ui/SearchableDropdown';
import { Badge } from '@/shared/components/ui/Badge';

interface AdminStats {
  totalAdmins: number;
  totalSchools: number;
  totalStudents: number;
  totalTeachers: number;
}

export default function AdminDashboard() {
  const { status } = useSession();
  const [stats, setStats] = useState<AdminStats>({
    totalAdmins: 0,
    totalSchools: 0,
    totalStudents: 0,
    totalTeachers: 0,
  });
  const [showCreateAdminModal, setShowCreateAdminModal] = useState(false);
  const [createAdminForm, setCreateAdminForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    role: UserRole.ORGANIZATION_ADMIN,
  });
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createAdminRoleSearch, setCreateAdminRoleSearch] = useState('');

  // Fetch stats
  useEffect(() => {
    if (status === 'authenticated') {
      // TODO: Replace with actual API call
      setStats({
        totalAdmins: 1,
        totalSchools: 0,
        totalStudents: 0,
        totalTeachers: 0,
      });
    }
  }, [status]);

  function handleAdminFormChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    setCreateAdminForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  async function handleCreateAdmin(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError('');
    setSubmitSuccess('');

    // Validation
    if (
      !createAdminForm.firstName ||
      !createAdminForm.lastName ||
      !createAdminForm.email ||
      !createAdminForm.password
    ) {
      setSubmitError('Please fill in all required fields');
      return;
    }

    if (createAdminForm.password !== createAdminForm.confirmPassword) {
      setSubmitError('Passwords do not match');
      return;
    }

    if (createAdminForm.password.length < 8) {
      setSubmitError('Password must be at least 8 characters');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: createAdminForm.email,
          password: createAdminForm.password,
          firstName: createAdminForm.firstName,
          lastName: createAdminForm.lastName,
          phone: createAdminForm.phone,
          role: createAdminForm.role, // TODO: Update API to accept role
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setSubmitError(data.error || 'Failed to create admin');
        return;
      }

      setSubmitSuccess('Admin account created successfully');
      setCreateAdminForm({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: '',
        role: UserRole.ORGANIZATION_ADMIN,
      });

      setTimeout(() => {
        setShowCreateAdminModal(false);
        setSubmitSuccess('');
      }, 2000);
    } catch {
      setSubmitError('An error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

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
    <div className="min-h-screen bg-gray-50">
      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900">Dashboard</h2>
          <p className="mt-2 text-gray-600">Welcome to your superadmin dashboard. Manage your system here.</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-gray-600 text-sm font-medium">Total Admins</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalAdmins}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4.354a4 4 0 110 5.292M15 21H3v-2a6 6 0 0112 0v2zm0 0h6v-2a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                  />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-gray-600 text-sm font-medium">Total Schools</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalSchools}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
                  />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-gray-600 text-sm font-medium">Total Students</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalStudents}</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-purple-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6.253v13m0-13C6.228 6.228 2 10.456 2 15.5c0 5.044 4.228 9.272 10 9.272s10-4.228 10-9.272c0-5.044-4.228-9.247-10-9.247z"
                  />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-gray-600 text-sm font-medium">Total Teachers</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalTeachers}</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-orange-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <button
                onClick={() => setShowCreateAdminModal(true)}
                className="w-full px-4 py-2 text-left text-sm font-medium text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
              >
                + Create New Admin User
              </button>
              <button className="w-full px-4 py-2 text-left text-sm font-medium text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors">
                + Add Organization
              </button>
              <button className="w-full px-4 py-2 text-left text-sm font-medium text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors">
                + Configure System Settings
              </button>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Navigation</h3>
            <div className="space-y-3">
              <a
                href="/admin-roles/users"
                className="block w-full px-4 py-2 text-left text-sm font-medium text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
              >
                Manage Users
              </a>
              <a
                href="/admin-roles/academic"
                className="block w-full px-4 py-2 text-left text-sm font-medium text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
              >
                Academic Management
              </a>
              <a
                href="/admin-roles/fees"
                className="block w-full px-4 py-2 text-left text-sm font-medium text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
              >
                Fee Management
              </a>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">System Status</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Database Connection</span>
                <Badge variant="green">Connected</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Email Service</span>
                <Badge variant="yellow">Pending</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Backup Status</span>
                <Badge variant="green">Active</Badge>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Create Admin Modal */}
      {showCreateAdminModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Create Admin User</h3>
              <button
                onClick={() => setShowCreateAdminModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            {submitError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-800">{submitError}</p>
              </div>
            )}

            {submitSuccess && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md">
                <p className="text-sm text-green-800">{submitSuccess}</p>
              </div>
            )}

            <form onSubmit={handleCreateAdmin} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    First Name *
                  </label>
                  <input
                    type="text"
                    name="firstName"
                    value={createAdminForm.firstName}
                    onChange={handleAdminFormChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    name="lastName"
                    value={createAdminForm.lastName}
                    onChange={handleAdminFormChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  name="email"
                  value={createAdminForm.email}
                  onChange={handleAdminFormChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Role *
                </label>
                <SearchableDropdown
                  options={[
                    { value: UserRole.ORGANIZATION_ADMIN, label: 'Organization Admin' },
                    { value: UserRole.SCHOOL_ADMIN, label: 'School Admin' },
                  ]}
                  value={createAdminForm.role}
                  onChange={(value) =>
                    setCreateAdminForm((prev) => ({ ...prev, role: value as UserRole }))
                  }
                  search={createAdminRoleSearch}
                  onSearchChange={setCreateAdminRoleSearch}
                  placeholder="Select role"
                  searchPlaceholder="Search role"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password *
                </label>
                <input
                  type="password"
                  name="password"
                  value={createAdminForm.password}
                  onChange={handleAdminFormChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Confirm Password *
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={createAdminForm.confirmPassword}
                  onChange={handleAdminFormChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateAdminModal(false)}
                  className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md shadow-sm hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Creating...' : 'Create Admin'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
