/**
 * Application Bootstrap
 * Initializes all application dependencies and services
 */

import { Container } from './Container';
import { MongoUserRepository } from '@/domains/user-management/infrastructure/persistence/MongoUserRepository';
import {
  CreateUserUseCase,
  GetUserByEmailUseCase,
  VerifyUserEmailUseCase,
} from '@/domains/user-management/application/use-cases';
import { MongoOrganizationRepository, MongoCoachingCenterRepository } from '@/domains/organization-management/infrastructure/persistence';
import { CreateOrganizationUseCase, CreateCoachingCenterUseCase } from '@/domains/organization-management/application/use-cases';
import { connectDB } from '@/shared/infrastructure/database';
import { getLogger } from '@/shared/infrastructure/logger';
import { ServiceKeys } from './ServiceKeys';

type AppBootstrapGlobalCache = {
  initialized: boolean;
};

const globalForAppBootstrap = globalThis as typeof globalThis & {
  __appBootstrapCache?: AppBootstrapGlobalCache;
};

const appBootstrapCache: AppBootstrapGlobalCache = globalForAppBootstrap.__appBootstrapCache ?? {
  initialized: false,
};

if (!globalForAppBootstrap.__appBootstrapCache) {
  globalForAppBootstrap.__appBootstrapCache = appBootstrapCache;
}

export class AppBootstrap {
  /**
   * Initialize the application
   */
  static async initialize(): Promise<void> {
    if (appBootstrapCache.initialized && Container.has(ServiceKeys.USER_REPOSITORY)) {
      // Already initialized and container is hydrated in this runtime.
      return;
    }

    const logger = getLogger();
    logger.info('Starting application bootstrap...');

    try {
      // Always ensure DB connection for the current runtime.
      // connectDB() is cached/idempotent and returns quickly when already connected.
      logger.info('Connecting to database...');
      await connectDB();
      logger.info('Database connected successfully');

      // Register repositories
      AppBootstrap.registerRepositories();

      // Register use cases
      AppBootstrap.registerUseCases();

      // Register other services
      AppBootstrap.registerServices();

      appBootstrapCache.initialized = true;
      logger.info('Application bootstrap completed successfully');
    } catch (error) {
      logger.error('Application bootstrap failed', error as Error);
      throw new Error(`Failed to initialize application: ${error}`);
    }
  }

  /**
   * Register all repositories
   */
  private static registerRepositories(): void {
    const logger = getLogger();
    logger.debug('Registering repositories...');

    // Create and register user repository as singleton
    Container.registerSingleton(ServiceKeys.USER_REPOSITORY, () => {
      logger.debug('Creating MongoUserRepository instance');
      return new MongoUserRepository();
    });

    // Create and register organization repository as singleton
    Container.registerSingleton(ServiceKeys.ORGANIZATION_REPOSITORY, () => {
      logger.debug('Creating MongoOrganizationRepository instance');
      return new MongoOrganizationRepository();
    });

    // Create and register coaching center repository as singleton
    Container.registerSingleton(ServiceKeys.COACHING_CENTER_REPOSITORY, () => {
      logger.debug('Creating MongoCoachingCenterRepository instance');
      return new MongoCoachingCenterRepository();
    });

  }

  /**
   * Register all use cases
   */
  private static registerUseCases(): void {
    const logger = getLogger();
    logger.debug('Registering use cases...');

    // Create User Use Case
    Container.registerSingleton(ServiceKeys.CREATE_USER_USE_CASE, () => {
      const userRepository = Container.resolve<MongoUserRepository>(ServiceKeys.USER_REPOSITORY);
      logger.debug('Creating CreateUserUseCase instance');
      return new CreateUserUseCase(userRepository);
    });

    // Get User By Email Use Case
    Container.registerSingleton(ServiceKeys.GET_USER_BY_EMAIL_USE_CASE, () => {
      const userRepository = Container.resolve<MongoUserRepository>(ServiceKeys.USER_REPOSITORY);
      logger.debug('Creating GetUserByEmailUseCase instance');
      return new GetUserByEmailUseCase(userRepository);
    });

    // Verify User Email Use Case
    Container.registerSingleton(ServiceKeys.VERIFY_USER_EMAIL_USE_CASE, () => {
      const userRepository = Container.resolve<MongoUserRepository>(ServiceKeys.USER_REPOSITORY);
      logger.debug('Creating VerifyUserEmailUseCase instance');
      return new VerifyUserEmailUseCase(userRepository);
    });

    // Create Organization Use Case
    Container.registerSingleton(ServiceKeys.CREATE_ORGANIZATION_USE_CASE, () => {
      const organizationRepository = Container.resolve<MongoOrganizationRepository>(ServiceKeys.ORGANIZATION_REPOSITORY);
      logger.debug('Creating CreateOrganizationUseCase instance');
      return new CreateOrganizationUseCase(organizationRepository);
    });

    // Create Coaching Center Use Case
    Container.registerSingleton(ServiceKeys.CREATE_COACHING_CENTER_USE_CASE, () => {
      const centerRepository = Container.resolve<MongoCoachingCenterRepository>(ServiceKeys.COACHING_CENTER_REPOSITORY);
      logger.debug('Creating CreateCoachingCenterUseCase instance');
      return new CreateCoachingCenterUseCase(centerRepository);
    });

  }

  /**
   * Register other services (logging, config, etc.)
   */
  private static registerServices(): void {
    const logger = getLogger();
    logger.debug('Registering services...');

    // Add additional service registrations here
  }

  /**
   * Check if application is initialized
   */
  static isBootstrapped(): boolean {
    return appBootstrapCache.initialized;
  }

  /**
   * Reset bootstrap (for testing)
   */
  static reset(): void {
    appBootstrapCache.initialized = false;
    Container.clear();
  }
}
