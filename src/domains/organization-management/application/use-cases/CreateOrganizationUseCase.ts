/**
 * Create Organization Use Case
 */

import { Result } from '@/shared/domain';
import { OrganizationRepository } from '../../domain/repositories';
import { Organization } from '../../domain/entities/Organization';
import { OrganizationName, Address, ContactInfo } from '../../domain/value-objects';
import { generateId } from '@/shared/lib/utils';

export interface CreateOrganizationRequest {
  organizationName: string;
  type: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country?: string;
  contactEmail: string;
  contactPhone: string;
}

export interface CreateOrganizationResponse {
  organizationId: string;
  organizationName: string;
}

export class CreateOrganizationUseCase {
  constructor(private organizationRepository: OrganizationRepository) {}

  async execute(
    request: CreateOrganizationRequest
  ): Promise<Result<CreateOrganizationResponse, string>> {
    try {
      const organizationName = OrganizationName.create(request.organizationName);
      const address = Address.create({
        street: request.street,
        city: request.city,
        state: request.state,
        zipCode: request.zipCode,
        country: request.country,
      });
      const contactInfo = ContactInfo.create({
        email: request.contactEmail,
        phone: request.contactPhone,
      });

      const organizationId = generateId();
      const organization = Organization.create(
        organizationId,
        organizationName,
        request.type,
        address,
        contactInfo
      );

      await this.organizationRepository.save(organization);

      return Result.ok<CreateOrganizationResponse>({
        organizationId,
        organizationName: organizationName.getValue(),
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error occurred';
      return Result.fail<CreateOrganizationResponse>(message);
    }
  }
}
