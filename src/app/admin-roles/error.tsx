'use client';

import { useEffect } from 'react';

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Admin route error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <main className="mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center px-6 py-12 text-center">
        <h1 className="text-2xl font-semibold">Admin area error</h1>
        <p className="mt-3 text-sm text-slate-600">
          Something went wrong in the admin console. Try again or return to the dashboard.
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={reset}
            className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
          >
            Try again
          </button>
          <a
            href="/admin-roles/admin"
            className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-white"
          >
            Go to dashboard
          </a>
        </div>
      </main>
    </div>
  );
}
