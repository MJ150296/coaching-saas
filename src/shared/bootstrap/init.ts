/**
 * Application Initialization Hook
 * Call this once at server startup
 */

import { Container } from './Container';

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

  initPromise = (async () => {
    const bootstrapModule = (await import('./AppBootstrap')) as {
      AppBootstrap: {
        isBootstrapped(): boolean;
        initialize(): Promise<void>;
      };
    };

    if (bootstrapModule.AppBootstrap.isBootstrapped()) {
      return;
    }

    await bootstrapModule.AppBootstrap.initialize();
  })();
  await initPromise;
}

/**
 * Initialize app and return a service
 */
export async function initializeAppAndGetService<T>(serviceKey: string): Promise<T> {
  await initializeApp();
  return Container.resolve<T>(serviceKey);
}
