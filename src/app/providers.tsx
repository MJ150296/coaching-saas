/**
 * SessionProvider Wrapper for Client Components
 */

'use client';

import { SessionProvider } from 'next-auth/react';
import { ReactNode } from 'react';
import { ToastProvider } from '@/shared/components/ui/ToastProvider';

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <SessionProvider refetchOnWindowFocus={false} refetchWhenOffline={false} refetchInterval={0}>
      <ToastProvider>{children}</ToastProvider>
    </SessionProvider>
  );
}
