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
import { registerFeeServices } from './registerFeeServices';
import { connectDB } from '@/shared/infrastructure/database';
import { Container } from '@/shared/bootstrap/Container';
import { ServiceKeys } from '@/shared/bootstrap/ServiceKeys';

export async function getFeeServices(): Promise<{
  feeTypeRepository: MongoFeeTypeRepository;
  feePlanAssignmentRepository: MongoFeePlanAssignmentRepository;
  feePlanRepository: MongoFeePlanRepository;
  studentFeeLedgerRepository: MongoStudentFeeLedgerRepository;
  paymentRepository: MongoPaymentRepository;
  creditNoteRepository: MongoCreditNoteRepository;
  createFeeTypeUseCase: CreateFeeTypeUseCase;
  createFeePlanUseCase: CreateFeePlanUseCase;
  assignFeePlanUseCase: AssignFeePlanUseCase;
  createStudentFeeLedgerUseCase: CreateStudentFeeLedgerUseCase;
  createPaymentUseCase: CreatePaymentUseCase;
  createCreditNoteUseCase: CreateCreditNoteUseCase;
}> {
  await connectDB();
  registerFeeServices();

  return {
    feeTypeRepository: Container.resolve<MongoFeeTypeRepository>(ServiceKeys.FEE_TYPE_REPOSITORY),
    feePlanAssignmentRepository: Container.resolve<MongoFeePlanAssignmentRepository>(
      ServiceKeys.FEE_PLAN_ASSIGNMENT_REPOSITORY
    ),
    feePlanRepository: Container.resolve<MongoFeePlanRepository>(ServiceKeys.FEE_PLAN_REPOSITORY),
    studentFeeLedgerRepository: Container.resolve<MongoStudentFeeLedgerRepository>(
      ServiceKeys.STUDENT_FEE_LEDGER_REPOSITORY
    ),
    paymentRepository: Container.resolve<MongoPaymentRepository>(ServiceKeys.PAYMENT_REPOSITORY),
    creditNoteRepository: Container.resolve<MongoCreditNoteRepository>(ServiceKeys.CREDIT_NOTE_REPOSITORY),
    createFeeTypeUseCase: Container.resolve<CreateFeeTypeUseCase>(ServiceKeys.CREATE_FEE_TYPE_USE_CASE),
    createFeePlanUseCase: Container.resolve<CreateFeePlanUseCase>(ServiceKeys.CREATE_FEE_PLAN_USE_CASE),
    assignFeePlanUseCase: Container.resolve<AssignFeePlanUseCase>(ServiceKeys.ASSIGN_FEE_PLAN_USE_CASE),
    createStudentFeeLedgerUseCase: Container.resolve<CreateStudentFeeLedgerUseCase>(
      ServiceKeys.CREATE_STUDENT_FEE_LEDGER_USE_CASE
    ),
    createPaymentUseCase: Container.resolve<CreatePaymentUseCase>(ServiceKeys.CREATE_PAYMENT_USE_CASE),
    createCreditNoteUseCase: Container.resolve<CreateCreditNoteUseCase>(ServiceKeys.CREATE_CREDIT_NOTE_USE_CASE),
  };
}
