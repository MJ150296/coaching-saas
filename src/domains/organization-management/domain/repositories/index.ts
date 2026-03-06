import type { Repository } from '@/shared/domain';
import { Organization } from '../entities/Organization';
import { CoachingCenter } from '../entities/CoachingCenter';

export interface OrganizationRepository extends Repository<Organization, string> {
  findByName(name: string): Promise<Organization | null>;
  findByType(type: string): Promise<Organization[]>;
  findActive(): Promise<Organization[]>;
}

export interface CoachingCenterRepository extends Repository<CoachingCenter, string> {
  findByOrganizationId(organizationId: string): Promise<CoachingCenter[]>;
  findByCode(code: string): Promise<CoachingCenter | null>;
  findActive(): Promise<CoachingCenter[]>;
  findByOrganizationIdAndActive(organizationId: string): Promise<CoachingCenter[]>;
}
