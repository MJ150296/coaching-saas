'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useToast } from '@/shared/components/ui/ToastProvider';
import { PageLoader } from '@/shared/components/ui/PageLoader';
import { UserRole } from '@/domains/user-management/domain/entities/User';

type ProfileResponse = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: string;
  organizationId?: string;
  schoolId?: string;
  isActive: boolean;
  emailVerified: boolean;
  createdAt: string | Date;
  updatedAt: string | Date;
};

function formatRoleLabel(role: string): string {
  return role === UserRole.COACHING_ADMIN
    ? 'COACHING ADMIN'
    : role.replaceAll('_', ' ');
}

export default function ProfileSettingsPage() {
  const { data: session, status } = useSession();
  const { toastMessage } = useToast();

  const [loading, setLoading] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  const [email, setEmail] = useState('');
  const [role, setRole] = useState('');
  const [organizationId, setOrganizationId] = useState('');
  const [schoolId, setSchoolId] = useState('');
  const [emailVerified, setEmailVerified] = useState(false);
  const [createdAt, setCreatedAt] = useState('');

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    if (status !== 'authenticated') return;
    let active = true;

    async function loadProfile() {
      setLoading(true);
      try {
        const response = await fetch('/api/users/profile');
        const data = (await response.json()) as ProfileResponse | { error?: string };

        if (!response.ok) {
          toastMessage((data as { error?: string })?.error || 'Failed to load profile');
          return;
        }

        if (!active) return;
        const profile = data as ProfileResponse;
        setEmail(profile.email || '');
        setRole(profile.role || '');
        setOrganizationId(profile.organizationId || '');
        setSchoolId(profile.schoolId || '');
        setEmailVerified(Boolean(profile.emailVerified));
        setCreatedAt(new Date(profile.createdAt).toLocaleDateString());
        setFirstName(profile.firstName || '');
        setLastName(profile.lastName || '');
        setPhone(profile.phone || '');
      } catch (error) {
        toastMessage(`Error: ${String(error)}`);
      } finally {
        if (active) setLoading(false);
      }
    }

    loadProfile();
    return () => {
      active = false;
    };
  }, [status, toastMessage]);

  async function savePersonalSettings(e: React.FormEvent) {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const response = await fetch('/api/users/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName,
          lastName,
          phone,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        toastMessage(data?.error || 'Failed to update profile');
        return;
      }

      toastMessage('Profile updated successfully.');
    } catch (error) {
      toastMessage(`Error: ${String(error)}`);
    } finally {
      setSavingProfile(false);
    }
  }

  async function savePasswordSettings(e: React.FormEvent) {
    e.preventDefault();

    if (!currentPassword || !newPassword || !confirmPassword) {
      toastMessage('Please fill current, new and confirm password.');
      return;
    }

    if (newPassword !== confirmPassword) {
      toastMessage('New password and confirm password do not match.');
      return;
    }

    setSavingPassword(true);
    try {
      const response = await fetch('/api/users/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName,
          lastName,
          phone,
          currentPassword,
          newPassword,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        toastMessage(data?.error || 'Failed to update password');
        return;
      }

      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      toastMessage('Password updated successfully.');
    } catch (error) {
      toastMessage(`Error: ${String(error)}`);
    } finally {
      setSavingPassword(false);
    }
  }

  const firstNameFromSession = session?.user?.name?.split(' ')[0] ?? 'User';
  const inputClassName =
    'mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100';

  if (status === 'loading' || loading) {
    return (
      <PageLoader
        message="Loading profile settings..."
        containerClassName="min-h-screen flex items-center justify-center bg-slate-50"
        messageClassName="mt-4 text-slate-600"
      />
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-indigo-50/30 to-blue-50/30 py-8">
      <main className="mx-auto max-w-5xl space-y-6 px-4 sm:px-6 lg:px-8">
        <section className="rounded-2xl border border-indigo-100 bg-linear-to-r from-indigo-600 via-blue-600 to-sky-600 p-6 shadow-lg shadow-indigo-200/70">
          <h1 className="text-2xl font-bold text-white">Profile Settings</h1>
          <p className="mt-2 text-sm text-indigo-50">
            Update your personal information and account security settings, {firstNameFromSession}.
          </p>
        </section>

        <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-slate-200/80 bg-white/95 p-6 shadow-sm shadow-slate-200/70">
            <h2 className="text-lg font-semibold text-slate-900">Account Details</h2>
            <div className="mt-4 space-y-3 text-sm text-slate-700">
              <p><span className="font-semibold">Email:</span> {email || '-'}</p>
              <p><span className="font-semibold">Role:</span> {role ? formatRoleLabel(role) : '-'}</p>
              <p><span className="font-semibold">Organization:</span> {organizationId || '-'}</p>
              <p><span className="font-semibold">Coaching Center:</span> {schoolId || '-'}</p>
              <p><span className="font-semibold">Email Verified:</span> {emailVerified ? 'Yes' : 'No'}</p>
              <p><span className="font-semibold">Account Created:</span> {createdAt || '-'}</p>
            </div>
          </div>

          <form
            onSubmit={savePersonalSettings}
            className="rounded-2xl border border-slate-200/80 bg-white/95 p-6 shadow-sm shadow-slate-200/70"
          >
            <h2 className="text-lg font-semibold text-slate-900">Personal Information</h2>
            <div className="mt-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">First Name</label>
                <input
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                  className={inputClassName}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Last Name</label>
                <input
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                  className={inputClassName}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Phone</label>
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Optional"
                  className={inputClassName}
                />
              </div>
              <button
                type="submit"
                disabled={savingProfile}
                className="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {savingProfile ? 'Saving...' : 'Save Personal Settings'}
              </button>
            </div>
          </form>
        </section>

        <form
          onSubmit={savePasswordSettings}
          className="rounded-2xl border border-slate-200/80 bg-white/95 p-6 shadow-sm shadow-slate-200/70"
        >
          <h2 className="text-lg font-semibold text-slate-900">Change Password</h2>
          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <label className="block text-sm font-medium text-gray-700">Current Password</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className={inputClassName}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className={inputClassName}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Confirm New Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={inputClassName}
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={savingPassword}
            className="mt-4 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {savingPassword ? 'Updating...' : 'Update Password'}
          </button>
        </form>
      </main>
    </div>
  );
}
