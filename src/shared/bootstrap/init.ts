/**
 * Application Initialization Hook
 * Call this once at server startup
 */

import { AppBootstrap } from '@/shared/bootstrap';

let initPromise: Promise<void> | null = null;

/**
 * Initialize the application (idempotent)
 * Safe to call multiple times
 */
export async function initializeApp(): Promise<void> {
  // Prevent multiple concurrent initializations
  if (initPromise) {
    return initPromise;
  }

  // Skip if already initialized
  if (AppBootstrap.isBootstrapped()) {
    return;
  }

  // Initialize and cache the promise
  initPromise = AppBootstrap.initialize();
  await initPromise;
}

/**
 * Initialize app and return a service
 */
export async function initializeAppAndGetService<T>(serviceKey: string): Promise<T> {
  await initializeApp();
  const { Container } = await import('@/shared/bootstrap');
  return Container.resolve<T>(serviceKey);
}
