import { PageLoader } from '@/shared/components/ui/PageLoader';

export default function Loading() {
  return (
    <PageLoader
      message="Loading users page..."
      containerClassName="min-h-screen flex items-center justify-center bg-transparent"
      messageClassName="mt-4 text-slate-600"
    />
  );
}
