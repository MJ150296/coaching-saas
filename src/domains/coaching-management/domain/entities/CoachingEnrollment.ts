import { AggregateRoot } from '@/shared/domain';

export enum CoachingEnrollmentStatus {
  ACTIVE = 'ACTIVE',
  PAUSED = 'PAUSED',
  CANCELLED = 'CANCELLED',
}

export interface CoachingEnrollmentProps {
  organizationId: string;
  coachingCenterId: string;
  programId: string;
  batchId: string;
  studentId: string;
  enrolledOn: Date;
  status: CoachingEnrollmentStatus;
}

export class CoachingEnrollment extends AggregateRoot<string> {
  private organizationId: string;
  private coachingCenterId: string;
  private programId: string;
  private batchId: string;
  private studentId: string;
  private enrolledOn: Date;
  private status: CoachingEnrollmentStatus;

  constructor(id: string, props: CoachingEnrollmentProps, createdAt?: Date, updatedAt?: Date) {
    super(id, createdAt, updatedAt);
    this.organizationId = props.organizationId;
    this.coachingCenterId = props.coachingCenterId;
    this.programId = props.programId;
    this.batchId = props.batchId;
    this.studentId = props.studentId;
    this.enrolledOn = props.enrolledOn;
    this.status = props.status;
  }

  static create(
    id: string,
    props: Omit<CoachingEnrollmentProps, 'status' | 'enrolledOn'>
  ): CoachingEnrollment {
    if (!props.studentId || props.studentId.trim().length === 0) {
      throw new Error('studentId is required');
    }

    return new CoachingEnrollment(id, {
      ...props,
      studentId: props.studentId.trim(),
      enrolledOn: new Date(),
      status: CoachingEnrollmentStatus.ACTIVE,
    });
  }

  getOrganizationId(): string {
    return this.organizationId;
  }

  getCoachingCenterId(): string {
    return this.coachingCenterId;
  }

  getProgramId(): string {
    return this.programId;
  }

  getBatchId(): string {
    return this.batchId;
  }

  getStudentId(): string {
    return this.studentId;
  }

  getEnrolledOn(): Date {
    return this.enrolledOn;
  }

  getStatus(): CoachingEnrollmentStatus {
    return this.status;
  }
}
