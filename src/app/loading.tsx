'use client';

import { PageLoader } from '@/shared/components/ui/PageLoader';

export default function Loading() {
  return (
    <PageLoader
      message="Loading..."
      spinnerClassName="h-12 w-12 border-b-2 border-indigo-600"
      containerClassName="min-h-screen flex items-center justify-center bg-slate-50"
      messageClassName="mt-4 text-slate-600"
    />
  );
}
