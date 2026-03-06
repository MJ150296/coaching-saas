/**
 * Coaching Center Entity (Aggregate Root)
 */

import { AggregateRoot } from '@/shared/domain';
import { CoachingCenterName, CoachingCenterCode, Address, ContactInfo } from '../value-objects';

export interface CoachingCenterProps {
  organizationId: string;
  coachingCenterName: CoachingCenterName;
  coachingCenterCode: CoachingCenterCode;
  address: Address;
  contactInfo: ContactInfo;
  principalId?: string;
  status: 'active' | 'inactive';
  studentCount?: number;
  teacherCount?: number;
  metadata?: Record<string, unknown>;
}

export class CoachingCenter extends AggregateRoot<string> {
  private organizationId: string;
  private coachingCenterName: CoachingCenterName;
  private coachingCenterCode: CoachingCenterCode;
  private address: Address;
  private contactInfo: ContactInfo;
  private principalId?: string;
  private status: 'active' | 'inactive';
  private studentCount: number;
  private teacherCount: number;
  private metadata?: Record<string, unknown>;

  constructor(id: string, props: CoachingCenterProps, createdAt?: Date, updatedAt?: Date) {
    super(id, createdAt, updatedAt);
    this.organizationId = props.organizationId;
    this.coachingCenterName = props.coachingCenterName;
    this.coachingCenterCode = props.coachingCenterCode;
    this.address = props.address;
    this.contactInfo = props.contactInfo;
    this.principalId = props.principalId;
    this.status = props.status;
    this.studentCount = props.studentCount || 0;
    this.teacherCount = props.teacherCount || 0;
    this.metadata = props.metadata;
  }

  static create(
    id: string,
    organizationId: string,
    coachingCenterName: CoachingCenterName,
    coachingCenterCode: CoachingCenterCode,
    address: Address,
    contactInfo: ContactInfo
  ): CoachingCenter {
    return new CoachingCenter(id, {
      organizationId,
      coachingCenterName,
      coachingCenterCode,
      address,
      contactInfo,
      status: 'active',
      studentCount: 0,
      teacherCount: 0,
    });
  }

  getOrganizationId(): string {
    return this.organizationId;
  }

  getCoachingCenterName(): CoachingCenterName {
    return this.coachingCenterName;
  }

  getCoachingCenterCode(): CoachingCenterCode {
    return this.coachingCenterCode;
  }

  getAddress(): Address {
    return this.address;
  }

  getContactInfo(): ContactInfo {
    return this.contactInfo;
  }

  getPrincipalId(): string | undefined {
    return this.principalId;
  }

  assignPrincipal(principalId: string): void {
    this.principalId = principalId;
    this.setUpdatedAt(new Date());
  }

  getStatus(): 'active' | 'inactive' {
    return this.status;
  }

  activate(): void {
    this.status = 'active';
    this.setUpdatedAt(new Date());
  }

  deactivate(): void {
    this.status = 'inactive';
    this.setUpdatedAt(new Date());
  }

  getStudentCount(): number {
    return this.studentCount;
  }

  incrementStudentCount(): void {
    this.studentCount++;
    this.setUpdatedAt(new Date());
  }

  decrementStudentCount(): void {
    if (this.studentCount > 0) {
      this.studentCount--;
      this.setUpdatedAt(new Date());
    }
  }

  getTeacherCount(): number {
    return this.teacherCount;
  }

  incrementTeacherCount(): void {
    this.teacherCount++;
    this.setUpdatedAt(new Date());
  }

  decrementTeacherCount(): void {
    if (this.teacherCount > 0) {
      this.teacherCount--;
      this.setUpdatedAt(new Date());
    }
  }

  getMetadata(): Record<string, unknown> | undefined {
    return this.metadata;
  }

  setMetadata(metadata: Record<string, unknown>): void {
    this.metadata = metadata;
    this.setUpdatedAt(new Date());
  }
}
