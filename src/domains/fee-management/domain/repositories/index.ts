import type { Repository } from '@/shared/domain';
import { FeeType } from '../entities/FeeType';
import { FeePlan } from '../entities/FeePlan';
import { FeePlanAssignment } from '../entities/FeePlanAssignment';
import { StudentFeeLedgerEntry } from '../entities/StudentFeeLedgerEntry';
import { Payment } from '../entities/Payment';
import { CreditNote } from '../entities/CreditNote';

export type FeeTypeRepository = Repository<FeeType, string> & {
  findByTenant(organizationId?: string, coachingCenterId?: string, options?: { limit?: number; offset?: number }): Promise<FeeType[]>;
  countByTenant(organizationId?: string, coachingCenterId?: string): Promise<number>;
};

export type FeePlanRepository = Repository<FeePlan, string> & {
  findByTenant(organizationId?: string, coachingCenterId?: string, options?: { academicYearId?: string; limit?: number; offset?: number }): Promise<FeePlan[]>;
  countByTenant(organizationId?: string, coachingCenterId?: string, options?: { academicYearId?: string }): Promise<number>;
};

export type FeePlanAssignmentRepository = Repository<FeePlanAssignment, string> & {
  findByTenant(organizationId?: string, coachingCenterId?: string, options?: { academicYearId?: string; limit?: number; offset?: number }): Promise<FeePlanAssignment[]>;
  countByTenant(organizationId?: string, coachingCenterId?: string, options?: { academicYearId?: string }): Promise<number>;
};

export type StudentFeeLedgerRepository = Repository<StudentFeeLedgerEntry, string> & {
  findByTenant(organizationId?: string, coachingCenterId?: string, options?: { academicYearId?: string; status?: string; limit?: number; offset?: number }): Promise<StudentFeeLedgerEntry[]>;
  countByTenant(organizationId?: string, coachingCenterId?: string, options?: { academicYearId?: string; status?: string }): Promise<number>;
};

export type PaymentRepository = Repository<Payment, string> & {
  findByTenant(organizationId?: string, coachingCenterId?: string, options?: { academicYearId?: string; method?: string; limit?: number; offset?: number }): Promise<Payment[]>;
  countByTenant(organizationId?: string, coachingCenterId?: string, options?: { academicYearId?: string; method?: string }): Promise<number>;
};

export type CreditNoteRepository = Repository<CreditNote, string> & {
  findByTenant(organizationId?: string, coachingCenterId?: string, options?: { academicYearId?: string; limit?: number; offset?: number }): Promise<CreditNote[]>;
  countByTenant(organizationId?: string, coachingCenterId?: string, options?: { academicYearId?: string }): Promise<number>;
};
