import {
  AssignFeePlanUseCase,
  CreateCreditNoteUseCase,
  CreateFeePlanUseCase,
  CreateFeeTypeUseCase,
  CreatePaymentUseCase,
  CreateStudentFeeLedgerUseCase,
} from '../application/use-cases';
import {
  MongoCreditNoteRepository,
  MongoFeePlanAssignmentRepository,
  MongoFeePlanRepository,
  MongoFeeTypeRepository,
  MongoPaymentRepository,
  MongoStudentFeeLedgerRepository,
} from '../infrastructure/persistence/MongoFeeRepository';
import { Container } from '@/shared/bootstrap/Container';
import { ServiceKeys } from '@/shared/bootstrap/ServiceKeys';

export function registerFeeServices(): void {
  if (!Container.has(ServiceKeys.FEE_TYPE_REPOSITORY)) {
    Container.registerSingleton(ServiceKeys.FEE_TYPE_REPOSITORY, () => new MongoFeeTypeRepository());
  }

  if (!Container.has(ServiceKeys.FEE_PLAN_REPOSITORY)) {
    Container.registerSingleton(ServiceKeys.FEE_PLAN_REPOSITORY, () => new MongoFeePlanRepository());
  }

  if (!Container.has(ServiceKeys.FEE_PLAN_ASSIGNMENT_REPOSITORY)) {
    Container.registerSingleton(
      ServiceKeys.FEE_PLAN_ASSIGNMENT_REPOSITORY,
      () => new MongoFeePlanAssignmentRepository()
    );
  }

  if (!Container.has(ServiceKeys.STUDENT_FEE_LEDGER_REPOSITORY)) {
    Container.registerSingleton(
      ServiceKeys.STUDENT_FEE_LEDGER_REPOSITORY,
      () => new MongoStudentFeeLedgerRepository()
    );
  }

  if (!Container.has(ServiceKeys.PAYMENT_REPOSITORY)) {
    Container.registerSingleton(ServiceKeys.PAYMENT_REPOSITORY, () => new MongoPaymentRepository());
  }

  if (!Container.has(ServiceKeys.CREDIT_NOTE_REPOSITORY)) {
    Container.registerSingleton(ServiceKeys.CREDIT_NOTE_REPOSITORY, () => new MongoCreditNoteRepository());
  }

  if (!Container.has(ServiceKeys.CREATE_FEE_TYPE_USE_CASE)) {
    Container.registerSingleton(ServiceKeys.CREATE_FEE_TYPE_USE_CASE, () => {
      const repo = Container.resolve<MongoFeeTypeRepository>(ServiceKeys.FEE_TYPE_REPOSITORY);
      return new CreateFeeTypeUseCase(repo);
    });
  }

  if (!Container.has(ServiceKeys.CREATE_FEE_PLAN_USE_CASE)) {
    Container.registerSingleton(ServiceKeys.CREATE_FEE_PLAN_USE_CASE, () => {
      const repo = Container.resolve<MongoFeePlanRepository>(ServiceKeys.FEE_PLAN_REPOSITORY);
      return new CreateFeePlanUseCase(repo);
    });
  }

  if (!Container.has(ServiceKeys.ASSIGN_FEE_PLAN_USE_CASE)) {
    Container.registerSingleton(ServiceKeys.ASSIGN_FEE_PLAN_USE_CASE, () => {
      const repo = Container.resolve<MongoFeePlanAssignmentRepository>(ServiceKeys.FEE_PLAN_ASSIGNMENT_REPOSITORY);
      return new AssignFeePlanUseCase(repo);
    });
  }

  if (!Container.has(ServiceKeys.CREATE_STUDENT_FEE_LEDGER_USE_CASE)) {
    Container.registerSingleton(ServiceKeys.CREATE_STUDENT_FEE_LEDGER_USE_CASE, () => {
      const repo = Container.resolve<MongoStudentFeeLedgerRepository>(ServiceKeys.STUDENT_FEE_LEDGER_REPOSITORY);
      return new CreateStudentFeeLedgerUseCase(repo);
    });
  }

  if (!Container.has(ServiceKeys.CREATE_PAYMENT_USE_CASE)) {
    Container.registerSingleton(ServiceKeys.CREATE_PAYMENT_USE_CASE, () => {
      const repo = Container.resolve<MongoPaymentRepository>(ServiceKeys.PAYMENT_REPOSITORY);
      return new CreatePaymentUseCase(repo);
    });
  }

  if (!Container.has(ServiceKeys.CREATE_CREDIT_NOTE_USE_CASE)) {
    Container.registerSingleton(ServiceKeys.CREATE_CREDIT_NOTE_USE_CASE, () => {
      const repo = Container.resolve<MongoCreditNoteRepository>(ServiceKeys.CREDIT_NOTE_REPOSITORY);
      return new CreateCreditNoteUseCase(repo);
    });
  }
}
