/**
 * Create School Use Case
 */

import { Result } from '@/shared/domain';
import { SchoolRepository } from '../../domain/repositories';
import { School } from '../../domain/entities/School';
import { SchoolName, SchoolCode, Address, ContactInfo } from '../../domain/value-objects';
import { generateId } from '@/shared/lib/utils';

export interface CreateSchoolRequest {
  organizationId: string;
  schoolName: string;
  schoolCode: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country?: string;
  contactEmail: string;
  contactPhone: string;
}

export interface CreateSchoolResponse {
  schoolId: string;
  schoolName: string;
  schoolCode: string;
}

export class CreateSchoolUseCase {
  constructor(private schoolRepository: SchoolRepository) {}

  async execute(
    request: CreateSchoolRequest
  ): Promise<Result<CreateSchoolResponse, string>> {
    try {
      const schoolName = SchoolName.create(request.schoolName);
      const schoolCode = SchoolCode.create(request.schoolCode);
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

      const schoolId = generateId();
      const school = School.create(
        schoolId,
        request.organizationId,
        schoolName,
        schoolCode,
        address,
        contactInfo
      );

      await this.schoolRepository.save(school);

      return Result.ok<CreateSchoolResponse>({
        schoolId,
        schoolName: schoolName.getValue(),
        schoolCode: schoolCode.getValue(),
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error occurred';
      return Result.fail<CreateSchoolResponse>(message);
    }
  }
}
