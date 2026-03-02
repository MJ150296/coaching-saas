import { AggregateRoot } from '@/shared/domain';

export enum CoachingSessionStatus {
  SCHEDULED = 'SCHEDULED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export interface CoachingSessionProps {
  organizationId: string;
  schoolId: string;
  programId: string;
  batchId: string;
  topic: string;
  sessionDate: Date;
  startsAt?: string;
  endsAt?: string;
  facultyId?: string;
  status: CoachingSessionStatus;
}

export class CoachingSession extends AggregateRoot<string> {
  private organizationId: string;
  private schoolId: string;
  private programId: string;
  private batchId: string;
  private topic: string;
  private sessionDate: Date;
  private startsAt?: string;
  private endsAt?: string;
  private facultyId?: string;
  private status: CoachingSessionStatus;

  constructor(id: string, props: CoachingSessionProps, createdAt?: Date, updatedAt?: Date) {
    super(id, createdAt, updatedAt);
    this.organizationId = props.organizationId;
    this.schoolId = props.schoolId;
    this.programId = props.programId;
    this.batchId = props.batchId;
    this.topic = props.topic;
    this.sessionDate = props.sessionDate;
    this.startsAt = props.startsAt;
    this.endsAt = props.endsAt;
    this.facultyId = props.facultyId;
    this.status = props.status;
  }

  static create(id: string, props: Omit<CoachingSessionProps, 'status'>): CoachingSession {
    if (!props.topic || props.topic.trim().length === 0) {
      throw new Error('Session topic is required');
    }

    if (!(props.sessionDate instanceof Date) || Number.isNaN(props.sessionDate.getTime())) {
      throw new Error('Valid sessionDate is required');
    }

    return new CoachingSession(id, {
      ...props,
      topic: props.topic.trim(),
      startsAt: props.startsAt?.trim(),
      endsAt: props.endsAt?.trim(),
      facultyId: props.facultyId?.trim(),
      status: CoachingSessionStatus.SCHEDULED,
    });
  }

  getOrganizationId(): string {
    return this.organizationId;
  }

  getSchoolId(): string {
    return this.schoolId;
  }

  getProgramId(): string {
    return this.programId;
  }

  getBatchId(): string {
    return this.batchId;
  }

  getTopic(): string {
    return this.topic;
  }

  getSessionDate(): Date {
    return this.sessionDate;
  }

  getStartsAt(): string | undefined {
    return this.startsAt;
  }

  getEndsAt(): string | undefined {
    return this.endsAt;
  }

  getFacultyId(): string | undefined {
    return this.facultyId;
  }

  getStatus(): CoachingSessionStatus {
    return this.status;
  }
}
