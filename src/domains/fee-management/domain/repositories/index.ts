import type { Repository } from '@/shared/domain';
import { FeeType } from '../entities/FeeType';
import { FeePlan } from '../entities/FeePlan';
import { FeePlanAssignment } from '../entities/FeePlanAssignment';
import { StudentFeeLedgerEntry } from '../entities/StudentFeeLedgerEntry';
import { Payment } from '../entities/Payment';
import { CreditNote } from '../entities/CreditNote';

export type FeeTypeRepository = Repository<FeeType, string>;
export type FeePlanRepository = Repository<FeePlan, string>;
export type FeePlanAssignmentRepository = Repository<FeePlanAssignment, string>;
export type StudentFeeLedgerRepository = Repository<StudentFeeLedgerEntry, string>;
export type PaymentRepository = Repository<Payment, string>;
export type CreditNoteRepository = Repository<CreditNote, string>;
