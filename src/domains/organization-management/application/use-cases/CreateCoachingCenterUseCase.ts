/**
 * Create Coaching Center Use Case
 */

import { Result } from '@/shared/domain';
import { CoachingCenterRepository } from '../../domain/repositories';
import { CoachingCenter } from '../../domain/entities/CoachingCenter';
import { CoachingCenterName, CoachingCenterCode, Address, ContactInfo } from '../../domain/value-objects';
import { generateId } from '@/shared/lib/utils';

export interface CreateCoachingCenterRequest {
  organizationId: string;
  coachingCenterName?: string;
  coachingCenterCode?: string;
  coachingCenterName?: string;
  coachingCenterCode?: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country?: string;
  contactEmail: string;
  contactPhone: string;
}

export interface CreateCoachingCenterResponse {
  coachingCenterId: string;
  coachingCenterName: string;
  coachingCenterCode: string;
  coachingCenterId: string;
  coachingCenterName: string;
  coachingCenterCode: string;
}

export class CreateCoachingCenterUseCase {
  constructor(private coachingCenterRepository: CoachingCenterRepository) {}

  async execute(
    request: CreateCoachingCenterRequest
  ): Promise<Result<CreateCoachingCenterResponse, string>> {
    try {
      const rawName = request.coachingCenterName ?? request.coachingCenterName;
      const rawCode = request.coachingCenterCode ?? request.coachingCenterCode;
      if (!rawName || !rawCode) {
        return Result.fail<CreateCoachingCenterResponse>('coachingCenterName and coachingCenterCode are required');
      }
      const centerName = CoachingCenterName.create(rawName);
      const centerCode = CoachingCenterCode.create(rawCode);
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

      const centerId = generateId();
      const center = CoachingCenter.create(
        centerId,
        request.organizationId,
        centerName,
        centerCode,
        address,
        contactInfo
      );

      await this.coachingCenterRepository.save(center);

      return Result.ok<CreateCoachingCenterResponse>({
        coachingCenterId: centerId,
        coachingCenterName: centerName.getValue(),
        coachingCenterCode: centerCode.getValue(),
        coachingCenterId: centerId,
        coachingCenterName: centerName.getValue(),
        coachingCenterCode: centerCode.getValue(),
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error occurred';
      return Result.fail<CreateCoachingCenterResponse>(message);
    }
  }
}
