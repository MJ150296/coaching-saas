import { AggregateRoot } from '@/shared/domain';

export type PaymentMethod = 'CASH' | 'ONLINE' | 'UPI' | 'BANK_TRANSFER';

export interface PaymentProps {
  organizationId: string;
  schoolId: string;
  academicYearId: string;
  studentId: string;
  amount: number;
  method: PaymentMethod;
  reference?: string;
  paidAt: Date;
}

export class Payment extends AggregateRoot<string> {
  private organizationId: string;
  private schoolId: string;
  private academicYearId: string;
  private studentId: string;
  private amount: number;
  private method: PaymentMethod;
  private reference?: string;
  private paidAt: Date;

  constructor(id: string, props: PaymentProps, createdAt?: Date, updatedAt?: Date) {
    super(id, createdAt, updatedAt);
    this.organizationId = props.organizationId;
    this.schoolId = props.schoolId;
    this.academicYearId = props.academicYearId;
    this.studentId = props.studentId;
    this.amount = props.amount;
    this.method = props.method;
    this.reference = props.reference;
    this.paidAt = props.paidAt;
  }

  static create(id: string, props: PaymentProps): Payment {
    return new Payment(id, props);
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

  getAmount(): number {
    return this.amount;
  }

  getMethod(): PaymentMethod {
    return this.method;
  }

  getReference(): string | undefined {
    return this.reference;
  }

  getPaidAt(): Date {
    return this.paidAt;
  }
}
