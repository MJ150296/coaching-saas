/**
 * Application Initialization Hook
 * Call this once at server startup
 */

import { Container } from './Container';
import { ServiceKeys } from './ServiceKeys';

type BootstrapGlobalCache = {
  initPromise: Promise<void> | null;
};

const globalForBootstrap = globalThis as typeof globalThis & {
  __bootstrapCache?: BootstrapGlobalCache;
};

const bootstrapCache: BootstrapGlobalCache = globalForBootstrap.__bootstrapCache ?? {
  initPromise: null,
};

if (!globalForBootstrap.__bootstrapCache) {
  globalForBootstrap.__bootstrapCache = bootstrapCache;
}

/**
 * Initialize the application (idempotent)
 * Safe to call multiple times
 */
export async function initializeApp(): Promise<void> {
  // If the current runtime already has registered services, skip bootstrap.
  if (Container.has(ServiceKeys.USER_REPOSITORY)) {
    return;
  }

  // Prevent multiple concurrent initializations
  if (bootstrapCache.initPromise) {
    await bootstrapCache.initPromise;
    if (Container.has(ServiceKeys.USER_REPOSITORY)) {
      return;
    }
    // Existing promise resolved in another runtime state but container is still empty (e.g. HMR).
    bootstrapCache.initPromise = null;
  }

  bootstrapCache.initPromise = (async () => {
    const bootstrapModule = (await import('./AppBootstrap')) as {
      AppBootstrap: {
        initialize(): Promise<void>;
      };
    };

    await bootstrapModule.AppBootstrap.initialize();
  })();
  await bootstrapCache.initPromise;
}

/**
 * Initialize app and return a service
 */
export async function initializeAppAndGetService<T>(serviceKey: string): Promise<T> {
  await initializeApp();
  return Container.resolve<T>(serviceKey);
}
