'use client';

import { FormEvent, useState } from 'react';
import { signIn } from 'next-auth/react';

export default function SuperadminBootstrapPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
  });

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/superadmin-register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to bootstrap superadmin');
        return;
      }

      await signIn('credentials', {
        email: form.email,
        password: form.password,
        redirect: false,
      });

      window.location.assign('/');
    } catch {
      setError('Unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <form onSubmit={onSubmit} className="w-full max-w-lg bg-white p-6 rounded-lg shadow space-y-4">
        <h1 className="text-2xl font-bold text-gray-900">Bootstrap Super Admin</h1>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="grid grid-cols-2 gap-3">
          <input className="border p-2 rounded" placeholder="First name" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} required />
          <input className="border p-2 rounded" placeholder="Last name" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} required />
        </div>
        <input className="border p-2 rounded w-full" type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
        <input className="border p-2 rounded w-full" placeholder="Phone (optional)" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        <input className="border p-2 rounded w-full" type="password" placeholder="Password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
        <input className="border p-2 rounded w-full" type="password" placeholder="Confirm password" value={form.confirmPassword} onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })} required />
        <button disabled={isLoading} className="w-full bg-indigo-600 text-white rounded p-2 disabled:opacity-50" type="submit">
          {isLoading ? 'Creating...' : 'Create Super Admin'}
        </button>
      </form>
    </main>
  );
}
