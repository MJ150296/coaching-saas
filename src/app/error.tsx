'use client';

import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Application error:', error);
  }, [error]);

  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 text-slate-900">
        <main className="mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center px-6 py-12 text-center">
          <h1 className="text-2xl font-semibold">Something went wrong</h1>
          <p className="mt-3 text-sm text-slate-600">
            We hit an unexpected issue. Try again, or refresh the page if this keeps happening.
          </p>
          <button
            type="button"
            onClick={reset}
            className="mt-6 rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
          >
            Try again
          </button>
        </main>
      </body>
    </html>
  );
}
