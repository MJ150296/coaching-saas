import type { Repository } from '@/shared/domain';
import { Organization } from '../entities/Organization';
import { School } from '../entities/School';

export interface OrganizationRepository extends Repository<Organization, string> {
  findByName(name: string): Promise<Organization | null>;
  findByType(type: string): Promise<Organization[]>;
  findActive(): Promise<Organization[]>;
}

export interface SchoolRepository extends Repository<School, string> {
  findByOrganizationId(organizationId: string): Promise<School[]>;
  findByCode(code: string): Promise<School | null>;
  findActive(): Promise<School[]>;
  findByOrganizationIdAndActive(organizationId: string): Promise<School[]>;
}
