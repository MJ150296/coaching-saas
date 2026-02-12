import { AggregateRoot } from '@/shared/domain';

export type LedgerStatus = 'DUE' | 'PAID' | 'CANCELLED';

export interface StudentFeeLedgerEntryProps {
  organizationId: string;
  schoolId: string;
  academicYearId: string;
  studentId: string;
  feePlanId?: string;
  feeTypeId?: string;
  amount: number;
  dueDate: Date;
  status: LedgerStatus;
}

export class StudentFeeLedgerEntry extends AggregateRoot<string> {
  private organizationId: string;
  private schoolId: string;
  private academicYearId: string;
  private studentId: string;
  private feePlanId?: string;
  private feeTypeId?: string;
  private amount: number;
  private dueDate: Date;
  private status: LedgerStatus;

  constructor(id: string, props: StudentFeeLedgerEntryProps, createdAt?: Date, updatedAt?: Date) {
    super(id, createdAt, updatedAt);
    this.organizationId = props.organizationId;
    this.schoolId = props.schoolId;
    this.academicYearId = props.academicYearId;
    this.studentId = props.studentId;
    this.feePlanId = props.feePlanId;
    this.feeTypeId = props.feeTypeId;
    this.amount = props.amount;
    this.dueDate = props.dueDate;
    this.status = props.status;
  }

  static create(id: string, props: Omit<StudentFeeLedgerEntryProps, 'status'>): StudentFeeLedgerEntry {
    return new StudentFeeLedgerEntry(id, { ...props, status: 'DUE' });
  }

  getOrganizationId(): string {
    return this.organizationId;
  }

  getSchoolId(): string {
    return this.schoolId;
  }

  getAcademicYearId(): string {
    return this.academicYearId;
  }

  getStudentId(): string {
    return this.studentId;
  }

  getFeePlanId(): string | undefined {
    return this.feePlanId;
  }

  getFeeTypeId(): string | undefined {
    return this.feeTypeId;
  }

  getAmount(): number {
    return this.amount;
  }

  getDueDate(): Date {
    return this.dueDate;
  }

  getStatus(): LedgerStatus {
    return this.status;
  }
}
