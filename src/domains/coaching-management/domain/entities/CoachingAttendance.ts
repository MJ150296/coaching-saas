import { AggregateRoot } from '@/shared/domain';

export enum CoachingAttendanceStatus {
  PRESENT = 'PRESENT',
  ABSENT = 'ABSENT',
  LATE = 'LATE',
}

export interface CoachingAttendanceProps {
  organizationId: string;
  schoolId: string;
  programId: string;
  batchId: string;
  sessionId: string;
  studentId: string;
  status: CoachingAttendanceStatus;
  remarks?: string;
  markedAt: Date;
}

export class CoachingAttendance extends AggregateRoot<string> {
  private organizationId: string;
  private schoolId: string;
  private programId: string;
  private batchId: string;
  private sessionId: string;
  private studentId: string;
  private status: CoachingAttendanceStatus;
  private remarks?: string;
  private markedAt: Date;

  constructor(id: string, props: CoachingAttendanceProps, createdAt?: Date, updatedAt?: Date) {
    super(id, createdAt, updatedAt);
    this.organizationId = props.organizationId;
    this.schoolId = props.schoolId;
    this.programId = props.programId;
    this.batchId = props.batchId;
    this.sessionId = props.sessionId;
    this.studentId = props.studentId;
    this.status = props.status;
    this.remarks = props.remarks;
    this.markedAt = props.markedAt;
  }

  static create(
    id: string,
    props: Omit<CoachingAttendanceProps, 'markedAt'>
  ): CoachingAttendance {
    if (!props.sessionId || !props.studentId) {
      throw new Error('sessionId and studentId are required');
    }

    return new CoachingAttendance(id, {
      ...props,
      studentId: props.studentId.trim(),
      remarks: props.remarks?.trim(),
      markedAt: new Date(),
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

  getSessionId(): string {
    return this.sessionId;
  }

  getStudentId(): string {
    return this.studentId;
  }

  getStatus(): CoachingAttendanceStatus {
    return this.status;
  }

  getRemarks(): string | undefined {
    return this.remarks;
  }

  getMarkedAt(): Date {
    return this.markedAt;
  }
}
