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
import { MongoAcademicYearRepository, MongoClassMasterRepository, MongoSectionRepository, MongoSubjectAllocationRepository } from '@/domains/academic-management/infrastructure/persistence/MongoAcademicRepository';
import { CreateAcademicYearUseCase, CreateClassMasterUseCase, CreateSectionUseCase, CreateSubjectAllocationUseCase } from '@/domains/academic-management/application/use-cases';
import { MongoFeeTypeRepository, MongoFeePlanRepository, MongoFeePlanAssignmentRepository, MongoStudentFeeLedgerRepository, MongoPaymentRepository, MongoCreditNoteRepository } from '@/domains/fee-management/infrastructure/persistence/MongoFeeRepository';
import { CreateFeeTypeUseCase, CreateFeePlanUseCase, AssignFeePlanUseCase, CreateStudentFeeLedgerUseCase, CreatePaymentUseCase, CreateCreditNoteUseCase } from '@/domains/fee-management/application/use-cases';
import {
  MongoCoachingProgramRepository,
  MongoCoachingBatchRepository,
  MongoCoachingEnrollmentRepository,
  MongoCoachingSessionRepository,
  MongoCoachingAttendanceRepository,
} from '@/domains/coaching-management/infrastructure/persistence/MongoCoachingRepository';
import {
  CreateCoachingProgramUseCase,
  CreateCoachingBatchUseCase,
  CreateCoachingEnrollmentUseCase,
  CreateCoachingSessionUseCase,
  MarkCoachingAttendanceUseCase,
} from '@/domains/coaching-management/application/use-cases';
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

    Container.registerSingleton(ServiceKeys.ACADEMIC_YEAR_REPOSITORY, () => {
      logger.debug('Creating MongoAcademicYearRepository instance');
      return new MongoAcademicYearRepository();
    });

    Container.registerSingleton(ServiceKeys.CLASS_MASTER_REPOSITORY, () => {
      logger.debug('Creating MongoClassMasterRepository instance');
      return new MongoClassMasterRepository();
    });

    Container.registerSingleton(ServiceKeys.SECTION_REPOSITORY, () => {
      logger.debug('Creating MongoSectionRepository instance');
      return new MongoSectionRepository();
    });

    Container.registerSingleton(ServiceKeys.SUBJECT_ALLOCATION_REPOSITORY, () => {
      logger.debug('Creating MongoSubjectAllocationRepository instance');
      return new MongoSubjectAllocationRepository();
    });

    Container.registerSingleton(ServiceKeys.FEE_TYPE_REPOSITORY, () => {
      logger.debug('Creating MongoFeeTypeRepository instance');
      return new MongoFeeTypeRepository();
    });

    Container.registerSingleton(ServiceKeys.FEE_PLAN_REPOSITORY, () => {
      logger.debug('Creating MongoFeePlanRepository instance');
      return new MongoFeePlanRepository();
    });

    Container.registerSingleton(ServiceKeys.FEE_PLAN_ASSIGNMENT_REPOSITORY, () => {
      logger.debug('Creating MongoFeePlanAssignmentRepository instance');
      return new MongoFeePlanAssignmentRepository();
    });

    Container.registerSingleton(ServiceKeys.STUDENT_FEE_LEDGER_REPOSITORY, () => {
      logger.debug('Creating MongoStudentFeeLedgerRepository instance');
      return new MongoStudentFeeLedgerRepository();
    });

    Container.registerSingleton(ServiceKeys.PAYMENT_REPOSITORY, () => {
      logger.debug('Creating MongoPaymentRepository instance');
      return new MongoPaymentRepository();
    });

    Container.registerSingleton(ServiceKeys.CREDIT_NOTE_REPOSITORY, () => {
      logger.debug('Creating MongoCreditNoteRepository instance');
      return new MongoCreditNoteRepository();
    });

    Container.registerSingleton(ServiceKeys.COACHING_PROGRAM_REPOSITORY, () => {
      logger.debug('Creating MongoCoachingProgramRepository instance');
      return new MongoCoachingProgramRepository();
    });

    Container.registerSingleton(ServiceKeys.COACHING_BATCH_REPOSITORY, () => {
      logger.debug('Creating MongoCoachingBatchRepository instance');
      return new MongoCoachingBatchRepository();
    });

    Container.registerSingleton(ServiceKeys.COACHING_ENROLLMENT_REPOSITORY, () => {
      logger.debug('Creating MongoCoachingEnrollmentRepository instance');
      return new MongoCoachingEnrollmentRepository();
    });

    Container.registerSingleton(ServiceKeys.COACHING_SESSION_REPOSITORY, () => {
      logger.debug('Creating MongoCoachingSessionRepository instance');
      return new MongoCoachingSessionRepository();
    });

    Container.registerSingleton(ServiceKeys.COACHING_ATTENDANCE_REPOSITORY, () => {
      logger.debug('Creating MongoCoachingAttendanceRepository instance');
      return new MongoCoachingAttendanceRepository();
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

    Container.registerSingleton(ServiceKeys.CREATE_ACADEMIC_YEAR_USE_CASE, () => {
      const repo = Container.resolve<MongoAcademicYearRepository>(ServiceKeys.ACADEMIC_YEAR_REPOSITORY);
      logger.debug('Creating CreateAcademicYearUseCase instance');
      return new CreateAcademicYearUseCase(repo);
    });

    Container.registerSingleton(ServiceKeys.CREATE_CLASS_MASTER_USE_CASE, () => {
      const repo = Container.resolve<MongoClassMasterRepository>(ServiceKeys.CLASS_MASTER_REPOSITORY);
      logger.debug('Creating CreateClassMasterUseCase instance');
      return new CreateClassMasterUseCase(repo);
    });

    Container.registerSingleton(ServiceKeys.CREATE_SECTION_USE_CASE, () => {
      const repo = Container.resolve<MongoSectionRepository>(ServiceKeys.SECTION_REPOSITORY);
      logger.debug('Creating CreateSectionUseCase instance');
      return new CreateSectionUseCase(repo);
    });

    Container.registerSingleton(ServiceKeys.CREATE_SUBJECT_ALLOCATION_USE_CASE, () => {
      const repo = Container.resolve<MongoSubjectAllocationRepository>(ServiceKeys.SUBJECT_ALLOCATION_REPOSITORY);
      logger.debug('Creating CreateSubjectAllocationUseCase instance');
      return new CreateSubjectAllocationUseCase(repo);
    });

    Container.registerSingleton(ServiceKeys.CREATE_FEE_TYPE_USE_CASE, () => {
      const repo = Container.resolve<MongoFeeTypeRepository>(ServiceKeys.FEE_TYPE_REPOSITORY);
      logger.debug('Creating CreateFeeTypeUseCase instance');
      return new CreateFeeTypeUseCase(repo);
    });

    Container.registerSingleton(ServiceKeys.CREATE_FEE_PLAN_USE_CASE, () => {
      const repo = Container.resolve<MongoFeePlanRepository>(ServiceKeys.FEE_PLAN_REPOSITORY);
      logger.debug('Creating CreateFeePlanUseCase instance');
      return new CreateFeePlanUseCase(repo);
    });

    Container.registerSingleton(ServiceKeys.ASSIGN_FEE_PLAN_USE_CASE, () => {
      const repo = Container.resolve<MongoFeePlanAssignmentRepository>(ServiceKeys.FEE_PLAN_ASSIGNMENT_REPOSITORY);
      logger.debug('Creating AssignFeePlanUseCase instance');
      return new AssignFeePlanUseCase(repo);
    });

    Container.registerSingleton(ServiceKeys.CREATE_STUDENT_FEE_LEDGER_USE_CASE, () => {
      const repo = Container.resolve<MongoStudentFeeLedgerRepository>(ServiceKeys.STUDENT_FEE_LEDGER_REPOSITORY);
      logger.debug('Creating CreateStudentFeeLedgerUseCase instance');
      return new CreateStudentFeeLedgerUseCase(repo);
    });

    Container.registerSingleton(ServiceKeys.CREATE_PAYMENT_USE_CASE, () => {
      const repo = Container.resolve<MongoPaymentRepository>(ServiceKeys.PAYMENT_REPOSITORY);
      logger.debug('Creating CreatePaymentUseCase instance');
      return new CreatePaymentUseCase(repo);
    });

    Container.registerSingleton(ServiceKeys.CREATE_CREDIT_NOTE_USE_CASE, () => {
      const repo = Container.resolve<MongoCreditNoteRepository>(ServiceKeys.CREDIT_NOTE_REPOSITORY);
      logger.debug('Creating CreateCreditNoteUseCase instance');
      return new CreateCreditNoteUseCase(repo);
    });

    Container.registerSingleton(ServiceKeys.CREATE_COACHING_PROGRAM_USE_CASE, () => {
      const repo = Container.resolve<MongoCoachingProgramRepository>(ServiceKeys.COACHING_PROGRAM_REPOSITORY);
      logger.debug('Creating CreateCoachingProgramUseCase instance');
      return new CreateCoachingProgramUseCase(repo);
    });

    Container.registerSingleton(ServiceKeys.CREATE_COACHING_BATCH_USE_CASE, () => {
      const repo = Container.resolve<MongoCoachingBatchRepository>(ServiceKeys.COACHING_BATCH_REPOSITORY);
      logger.debug('Creating CreateCoachingBatchUseCase instance');
      return new CreateCoachingBatchUseCase(repo);
    });

    Container.registerSingleton(ServiceKeys.CREATE_COACHING_ENROLLMENT_USE_CASE, () => {
      const repo = Container.resolve<MongoCoachingEnrollmentRepository>(ServiceKeys.COACHING_ENROLLMENT_REPOSITORY);
      logger.debug('Creating CreateCoachingEnrollmentUseCase instance');
      return new CreateCoachingEnrollmentUseCase(repo);
    });

    Container.registerSingleton(ServiceKeys.CREATE_COACHING_SESSION_USE_CASE, () => {
      const repo = Container.resolve<MongoCoachingSessionRepository>(ServiceKeys.COACHING_SESSION_REPOSITORY);
      logger.debug('Creating CreateCoachingSessionUseCase instance');
      return new CreateCoachingSessionUseCase(repo);
    });

    Container.registerSingleton(ServiceKeys.MARK_COACHING_ATTENDANCE_USE_CASE, () => {
      const repo = Container.resolve<MongoCoachingAttendanceRepository>(ServiceKeys.COACHING_ATTENDANCE_REPOSITORY);
      logger.debug('Creating MarkCoachingAttendanceUseCase instance');
      return new MarkCoachingAttendanceUseCase(repo);
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
