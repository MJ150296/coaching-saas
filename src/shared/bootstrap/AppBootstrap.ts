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
import { MongoOrganizationRepository, MongoSchoolRepository } from '@/domains/organization-management/infrastructure/persistence';
import { CreateOrganizationUseCase, CreateSchoolUseCase } from '@/domains/organization-management/application/use-cases';
import { MongoAcademicYearRepository, MongoClassMasterRepository, MongoSectionRepository, MongoSubjectAllocationRepository } from '@/domains/academic-management/infrastructure/persistence/MongoAcademicRepository';
import { CreateAcademicYearUseCase, CreateClassMasterUseCase, CreateSectionUseCase, CreateSubjectAllocationUseCase } from '@/domains/academic-management/application/use-cases';
import { MongoFeeTypeRepository, MongoFeePlanRepository, MongoFeePlanAssignmentRepository, MongoStudentFeeLedgerRepository, MongoPaymentRepository, MongoCreditNoteRepository } from '@/domains/fee-management/infrastructure/persistence/MongoFeeRepository';
import { CreateFeeTypeUseCase, CreateFeePlanUseCase, AssignFeePlanUseCase, CreateStudentFeeLedgerUseCase, CreatePaymentUseCase, CreateCreditNoteUseCase } from '@/domains/fee-management/application/use-cases';
import { connectDB } from '@/shared/infrastructure/database';
import { getLogger } from '@/shared/infrastructure/logger';

/**
 * Service keys for dependency injection
 */
export const ServiceKeys = {
  // Repositories
  USER_REPOSITORY: 'USER_REPOSITORY',
  ORGANIZATION_REPOSITORY: 'ORGANIZATION_REPOSITORY',
  SCHOOL_REPOSITORY: 'SCHOOL_REPOSITORY',
  ACADEMIC_YEAR_REPOSITORY: 'ACADEMIC_YEAR_REPOSITORY',
  CLASS_MASTER_REPOSITORY: 'CLASS_MASTER_REPOSITORY',
  SECTION_REPOSITORY: 'SECTION_REPOSITORY',
  SUBJECT_ALLOCATION_REPOSITORY: 'SUBJECT_ALLOCATION_REPOSITORY',
  FEE_TYPE_REPOSITORY: 'FEE_TYPE_REPOSITORY',
  FEE_PLAN_REPOSITORY: 'FEE_PLAN_REPOSITORY',
  FEE_PLAN_ASSIGNMENT_REPOSITORY: 'FEE_PLAN_ASSIGNMENT_REPOSITORY',
  STUDENT_FEE_LEDGER_REPOSITORY: 'STUDENT_FEE_LEDGER_REPOSITORY',
  PAYMENT_REPOSITORY: 'PAYMENT_REPOSITORY',
  CREDIT_NOTE_REPOSITORY: 'CREDIT_NOTE_REPOSITORY',

  // Use Cases
  CREATE_USER_USE_CASE: 'CREATE_USER_USE_CASE',
  GET_USER_BY_EMAIL_USE_CASE: 'GET_USER_BY_EMAIL_USE_CASE',
  VERIFY_USER_EMAIL_USE_CASE: 'VERIFY_USER_EMAIL_USE_CASE',
  CREATE_ORGANIZATION_USE_CASE: 'CREATE_ORGANIZATION_USE_CASE',
  CREATE_SCHOOL_USE_CASE: 'CREATE_SCHOOL_USE_CASE',
  CREATE_ACADEMIC_YEAR_USE_CASE: 'CREATE_ACADEMIC_YEAR_USE_CASE',
  CREATE_CLASS_MASTER_USE_CASE: 'CREATE_CLASS_MASTER_USE_CASE',
  CREATE_SECTION_USE_CASE: 'CREATE_SECTION_USE_CASE',
  CREATE_SUBJECT_ALLOCATION_USE_CASE: 'CREATE_SUBJECT_ALLOCATION_USE_CASE',
  CREATE_FEE_TYPE_USE_CASE: 'CREATE_FEE_TYPE_USE_CASE',
  CREATE_FEE_PLAN_USE_CASE: 'CREATE_FEE_PLAN_USE_CASE',
  ASSIGN_FEE_PLAN_USE_CASE: 'ASSIGN_FEE_PLAN_USE_CASE',
  CREATE_STUDENT_FEE_LEDGER_USE_CASE: 'CREATE_STUDENT_FEE_LEDGER_USE_CASE',
  CREATE_PAYMENT_USE_CASE: 'CREATE_PAYMENT_USE_CASE',
  CREATE_CREDIT_NOTE_USE_CASE: 'CREATE_CREDIT_NOTE_USE_CASE',
};

export class AppBootstrap {
  private static isInitialized = false;

  /**
   * Initialize the application
   */
  static async initialize(): Promise<void> {
    if (AppBootstrap.isInitialized) {
      // Already initialized
      return;
    }

    const logger = getLogger();
    logger.info('Starting application bootstrap...');

    try {
      // Connect to database
      logger.info('Connecting to database...');
      await connectDB();
      logger.info('Database connected successfully');

      // Register repositories
      AppBootstrap.registerRepositories();

      // Register use cases
      AppBootstrap.registerUseCases();

      // Register other services
      AppBootstrap.registerServices();

      AppBootstrap.isInitialized = true;
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

    // Create and register school repository as singleton
    Container.registerSingleton(ServiceKeys.SCHOOL_REPOSITORY, () => {
      logger.debug('Creating MongoSchoolRepository instance');
      return new MongoSchoolRepository();
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
  }

  /**
   * Register all use cases
   */
  private static registerUseCases(): void {
    const logger = getLogger();
    logger.debug('Registering use cases...');

    // Create User Use Case
    Container.registerSingleton(ServiceKeys.CREATE_USER_USE_CASE, () => {
      const userRepository = Container.resolve(ServiceKeys.USER_REPOSITORY);
      logger.debug('Creating CreateUserUseCase instance');
      return new CreateUserUseCase(userRepository);
    });

    // Get User By Email Use Case
    Container.registerSingleton(ServiceKeys.GET_USER_BY_EMAIL_USE_CASE, () => {
      const userRepository = Container.resolve(ServiceKeys.USER_REPOSITORY);
      logger.debug('Creating GetUserByEmailUseCase instance');
      return new GetUserByEmailUseCase(userRepository);
    });

    // Verify User Email Use Case
    Container.registerSingleton(ServiceKeys.VERIFY_USER_EMAIL_USE_CASE, () => {
      const userRepository = Container.resolve(ServiceKeys.USER_REPOSITORY);
      logger.debug('Creating VerifyUserEmailUseCase instance');
      return new VerifyUserEmailUseCase(userRepository);
    });

    // Create Organization Use Case
    Container.registerSingleton(ServiceKeys.CREATE_ORGANIZATION_USE_CASE, () => {
      const organizationRepository = Container.resolve(ServiceKeys.ORGANIZATION_REPOSITORY);
      logger.debug('Creating CreateOrganizationUseCase instance');
      return new CreateOrganizationUseCase(organizationRepository);
    });

    // Create School Use Case
    Container.registerSingleton(ServiceKeys.CREATE_SCHOOL_USE_CASE, () => {
      const schoolRepository = Container.resolve(ServiceKeys.SCHOOL_REPOSITORY);
      logger.debug('Creating CreateSchoolUseCase instance');
      return new CreateSchoolUseCase(schoolRepository);
    });

    Container.registerSingleton(ServiceKeys.CREATE_ACADEMIC_YEAR_USE_CASE, () => {
      const repo = Container.resolve(ServiceKeys.ACADEMIC_YEAR_REPOSITORY);
      logger.debug('Creating CreateAcademicYearUseCase instance');
      return new CreateAcademicYearUseCase(repo);
    });

    Container.registerSingleton(ServiceKeys.CREATE_CLASS_MASTER_USE_CASE, () => {
      const repo = Container.resolve(ServiceKeys.CLASS_MASTER_REPOSITORY);
      logger.debug('Creating CreateClassMasterUseCase instance');
      return new CreateClassMasterUseCase(repo);
    });

    Container.registerSingleton(ServiceKeys.CREATE_SECTION_USE_CASE, () => {
      const repo = Container.resolve(ServiceKeys.SECTION_REPOSITORY);
      logger.debug('Creating CreateSectionUseCase instance');
      return new CreateSectionUseCase(repo);
    });

    Container.registerSingleton(ServiceKeys.CREATE_SUBJECT_ALLOCATION_USE_CASE, () => {
      const repo = Container.resolve(ServiceKeys.SUBJECT_ALLOCATION_REPOSITORY);
      logger.debug('Creating CreateSubjectAllocationUseCase instance');
      return new CreateSubjectAllocationUseCase(repo);
    });

    Container.registerSingleton(ServiceKeys.CREATE_FEE_TYPE_USE_CASE, () => {
      const repo = Container.resolve(ServiceKeys.FEE_TYPE_REPOSITORY);
      logger.debug('Creating CreateFeeTypeUseCase instance');
      return new CreateFeeTypeUseCase(repo);
    });

    Container.registerSingleton(ServiceKeys.CREATE_FEE_PLAN_USE_CASE, () => {
      const repo = Container.resolve(ServiceKeys.FEE_PLAN_REPOSITORY);
      logger.debug('Creating CreateFeePlanUseCase instance');
      return new CreateFeePlanUseCase(repo);
    });

    Container.registerSingleton(ServiceKeys.ASSIGN_FEE_PLAN_USE_CASE, () => {
      const repo = Container.resolve(ServiceKeys.FEE_PLAN_ASSIGNMENT_REPOSITORY);
      logger.debug('Creating AssignFeePlanUseCase instance');
      return new AssignFeePlanUseCase(repo);
    });

    Container.registerSingleton(ServiceKeys.CREATE_STUDENT_FEE_LEDGER_USE_CASE, () => {
      const repo = Container.resolve(ServiceKeys.STUDENT_FEE_LEDGER_REPOSITORY);
      logger.debug('Creating CreateStudentFeeLedgerUseCase instance');
      return new CreateStudentFeeLedgerUseCase(repo);
    });

    Container.registerSingleton(ServiceKeys.CREATE_PAYMENT_USE_CASE, () => {
      const repo = Container.resolve(ServiceKeys.PAYMENT_REPOSITORY);
      logger.debug('Creating CreatePaymentUseCase instance');
      return new CreatePaymentUseCase(repo);
    });

    Container.registerSingleton(ServiceKeys.CREATE_CREDIT_NOTE_USE_CASE, () => {
      const repo = Container.resolve(ServiceKeys.CREDIT_NOTE_REPOSITORY);
      logger.debug('Creating CreateCreditNoteUseCase instance');
      return new CreateCreditNoteUseCase(repo);
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
    return AppBootstrap.isInitialized;
  }

  /**
   * Reset bootstrap (for testing)
   */
  static reset(): void {
    AppBootstrap.isInitialized = false;
    Container.clear();
  }
}
