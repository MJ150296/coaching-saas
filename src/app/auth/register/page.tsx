/**
 * Registration Page
 */

'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { UserRole } from '@/domains/user-management/domain/entities/User';
import { SearchableDropdown } from '@/shared/components/ui/SearchableDropdown';

export default function Register() {
  const { data: session } = useSession();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    organizationId: '',
    schoolId: '',
    role: UserRole.STUDENT,
    parentEmail: '',
    parentPassword: '',
    parentFirstName: '',
    parentLastName: '',
    parentPhone: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [roleSearch, setRoleSearch] = useState('');

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          firstName: formData.firstName,
          lastName: formData.lastName,
          phone: formData.phone || undefined,
          organizationId: formData.organizationId || undefined,
          schoolId: formData.schoolId || undefined,
          role: formData.role,
          parent: formData.role === UserRole.STUDENT ? {
            email: formData.parentEmail,
            password: formData.parentPassword,
            firstName: formData.parentFirstName,
            lastName: formData.parentLastName,
            phone: formData.parentPhone || undefined,
          } : undefined,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || 'Registration failed');
        return;
      }

      setSuccess('User registered successfully.');
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        confirmPassword: '',
        phone: '',
        organizationId: '',
        schoolId: '',
        role: UserRole.STUDENT,
        parentEmail: '',
        parentPassword: '',
        parentFirstName: '',
        parentLastName: '',
        parentPhone: '',
      });
    } catch {
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  const actorRole = (session?.user as { role?: UserRole } | undefined)?.role;
  const canRegister =
    actorRole === UserRole.SUPER_ADMIN ||
    actorRole === UserRole.ORGANIZATION_ADMIN ||
    actorRole === UserRole.SCHOOL_ADMIN ||
    actorRole === UserRole.ADMIN;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Register a new user
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Registration is admin-only.
          </p>
        </div>

        {!session && (
          <div className="rounded-md bg-yellow-50 p-4">
            <p className="text-sm font-medium text-yellow-800">
              Please sign in as an admin to create users.
            </p>
          </div>
        )}

        {session && !canRegister && (
          <div className="rounded-md bg-red-50 p-4">
            <p className="text-sm font-medium text-red-800">
              Your role does not have permission to register users.
            </p>
          </div>
        )}

        {error && (
          <div className="rounded-md bg-red-50 p-4">
            <p className="text-sm font-medium text-red-800">{error}</p>
          </div>
        )}

        {success && (
          <div className="rounded-md bg-green-50 p-4">
            <p className="text-sm font-medium text-green-800">{success}</p>
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <input
                type="text"
                name="organizationId"
                placeholder="Organization ID (optional)"
                value={formData.organizationId}
                onChange={handleChange}
                disabled={isLoading || !canRegister}
                className="flex-1 appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
              <input
                type="text"
                name="schoolId"
                placeholder="School ID (optional)"
                value={formData.schoolId}
                onChange={handleChange}
                disabled={isLoading || !canRegister}
                className="flex-1 appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>

            <SearchableDropdown
              options={Object.values(UserRole).map((role) => ({ value: role, label: role }))}
              value={formData.role}
              onChange={(value) =>
                setFormData((prev) => ({
                  ...prev,
                  role: value as UserRole,
                }))
              }
              search={roleSearch}
              onSearchChange={setRoleSearch}
              placeholder="Select role"
              searchPlaceholder="Search role"
              disabled={isLoading || !canRegister}
            />

            <div className="flex gap-4">
              <input
                type="text"
                name="firstName"
                placeholder="First Name"
                value={formData.firstName}
                onChange={handleChange}
                required
                disabled={isLoading || !canRegister}
                className="flex-1 appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
              <input
                type="text"
                name="lastName"
                placeholder="Last Name"
                value={formData.lastName}
                onChange={handleChange}
                required
                disabled={isLoading || !canRegister}
                className="flex-1 appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>

            <input
              type="email"
              name="email"
              placeholder="Email address"
              value={formData.email}
              onChange={handleChange}
              required
              disabled={isLoading || !canRegister}
              className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />

            <input
              type="tel"
              name="phone"
              placeholder="Phone (optional)"
              value={formData.phone}
              onChange={handleChange}
              disabled={isLoading || !canRegister}
              className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />

            <input
              type="password"
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
              required
              disabled={isLoading || !canRegister}
              className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />

            <input
              type="password"
              name="confirmPassword"
              placeholder="Confirm Password"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              disabled={isLoading || !canRegister}
              className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />

            {formData.role === UserRole.STUDENT && (
              <div className="rounded-md border border-gray-200 p-4 space-y-3">
                <h3 className="text-sm font-semibold text-gray-700">Parent Details (required for student)</h3>
                <input
                  type="email"
                  name="parentEmail"
                  placeholder="Parent Email"
                  value={formData.parentEmail}
                  onChange={handleChange}
                  required
                  disabled={isLoading || !canRegister}
                  className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
                <input
                  type="password"
                  name="parentPassword"
                  placeholder="Parent Password"
                  value={formData.parentPassword}
                  onChange={handleChange}
                  required
                  disabled={isLoading || !canRegister}
                  className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
                <div className="flex gap-4">
                  <input
                    type="text"
                    name="parentFirstName"
                    placeholder="Parent First Name"
                    value={formData.parentFirstName}
                    onChange={handleChange}
                    required
                    disabled={isLoading || !canRegister}
                    className="flex-1 appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                  <input
                    type="text"
                    name="parentLastName"
                    placeholder="Parent Last Name"
                    value={formData.parentLastName}
                    onChange={handleChange}
                    required
                    disabled={isLoading || !canRegister}
                    className="flex-1 appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
                <input
                  type="tel"
                  name="parentPhone"
                  placeholder="Parent Phone (optional)"
                  value={formData.parentPhone}
                  onChange={handleChange}
                  disabled={isLoading || !canRegister}
                  className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading || !canRegister}
            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {isLoading ? 'Creating user...' : 'Register'}
          </button>

          <div className="text-center">
            <a href="/auth/signin" className="text-blue-600 hover:text-blue-500">
              Already have an account? Sign in
            </a>
          </div>
        </form>
      </div>
    </div>
  );
}
