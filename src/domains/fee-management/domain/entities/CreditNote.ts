import { AggregateRoot } from '@/shared/domain';

export interface CreditNoteProps {
  organizationId: string;
  coachingCenterId: string;
  academicYearId: string;
  studentId: string;
  amount: number;
  reason: string;
  createdOn: Date;
}

export class CreditNote extends AggregateRoot<string> {
  private organizationId: string;
  private coachingCenterId: string;
  private academicYearId: string;
  private studentId: string;
  private amount: number;
  private reason: string;
  private createdOn: Date;

  constructor(id: string, props: CreditNoteProps, createdAt?: Date, updatedAt?: Date) {
    super(id, createdAt, updatedAt);
    this.organizationId = props.organizationId;
    this.coachingCenterId = props.coachingCenterId;
    this.academicYearId = props.academicYearId;
    this.studentId = props.studentId;
    this.amount = props.amount;
    this.reason = props.reason;
    this.createdOn = props.createdOn;
  }

  static create(id: string, props: CreditNoteProps): CreditNote {
    return new CreditNote(id, props);
  }

  getOrganizationId(): string {
    return this.organizationId;
  }

  getCoachingCenterId(): string {
    return this.coachingCenterId;
  }

  getAcademicYearId(): string {
    return this.academicYearId;
  }

  getStudentId(): string {
    return this.studentId;
  }

  getAmount(): number {
    return this.amount;
  }

  getReason(): string {
    return this.reason;
  }

  getCreatedOn(): Date {
    return this.createdOn;
  }
}
