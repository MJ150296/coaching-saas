import type { Repository } from '@/shared/domain';
import { FeeType } from '../entities/FeeType';
import { FeePlan } from '../entities/FeePlan';
import { FeePlanAssignment } from '../entities/FeePlanAssignment';
import { StudentFeeLedgerEntry } from '../entities/StudentFeeLedgerEntry';
import { Payment } from '../entities/Payment';
import { CreditNote } from '../entities/CreditNote';

export interface FeeTypeRepository extends Repository<FeeType, string> {}
export interface FeePlanRepository extends Repository<FeePlan, string> {}
export interface FeePlanAssignmentRepository extends Repository<FeePlanAssignment, string> {}
export interface StudentFeeLedgerRepository extends Repository<StudentFeeLedgerEntry, string> {}
export interface PaymentRepository extends Repository<Payment, string> {}
export interface CreditNoteRepository extends Repository<CreditNote, string> {}
