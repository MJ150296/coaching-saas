import type { Repository } from '@/shared/domain';
import { AcademicYear } from '../entities/AcademicYear';

export interface AcademicYearRepository extends Repository<AcademicYear, string> {
  existsByScopeAndPeriod(input: {
    organizationId: string;
    coachingCenterId: string;
    name: string;
    startDate: Date;
    endDate: Date;
    excludeId?: string;
  }): Promise<boolean>;
}
