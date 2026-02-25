import { AggregateRoot } from '@/shared/domain';

export type LedgerStatus = 'DUE' | 'PAID' | 'CANCELLED';
export type DiscountType = 'NONE' | 'SCHOLARSHIP' | 'SIBLING' | 'STAFF' | 'CUSTOM';
export type DiscountMode = 'FLAT' | 'PERCENT';

export interface LedgerDiscount {
  type: DiscountType;
  mode: DiscountMode;
  value: number;
  amount: number;
  reason?: string;
}

export interface StudentFeeLedgerEntryProps {
  organizationId: string;
  schoolId: string;
  academicYearId: string;
  studentId: string;
  feePlanId?: string;
  feeTypeId?: string;
  originalAmount: number;
  amount: number;
  discount?: LedgerDiscount;
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
  private originalAmount: number;
  private amount: number;
  private discount?: LedgerDiscount;
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
    this.originalAmount = props.originalAmount;
    this.amount = props.amount;
    this.discount = props.discount;
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

  getOriginalAmount(): number {
    return this.originalAmount;
  }

  getDiscount(): LedgerDiscount | undefined {
    return this.discount;
  }

  getDueDate(): Date {
    return this.dueDate;
  }

  getStatus(): LedgerStatus {
    return this.status;
  }
}
