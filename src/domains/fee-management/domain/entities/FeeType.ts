import { AggregateRoot } from '@/shared/domain';

export type FeeFrequency = 'ONE_TIME' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY';

export interface FeeTypeProps {
  organizationId: string;
  schoolId: string;
  name: string;
  amount: number;
  frequency: FeeFrequency;
  isMandatory: boolean;
  isTaxable: boolean;
}

export class FeeType extends AggregateRoot<string> {
  private organizationId: string;
  private schoolId: string;
  private name: string;
  private amount: number;
  private frequency: FeeFrequency;
  private isMandatory: boolean;
  private isTaxable: boolean;

  constructor(id: string, props: FeeTypeProps, createdAt?: Date, updatedAt?: Date) {
    super(id, createdAt, updatedAt);
    this.organizationId = props.organizationId;
    this.schoolId = props.schoolId;
    this.name = props.name;
    this.amount = props.amount;
    this.frequency = props.frequency;
    this.isMandatory = props.isMandatory;
    this.isTaxable = props.isTaxable;
  }

  static create(id: string, props: FeeTypeProps): FeeType {
    return new FeeType(id, props);
  }

  getOrganizationId(): string {
    return this.organizationId;
  }

  getSchoolId(): string {
    return this.schoolId;
  }

  getName(): string {
    return this.name;
  }

  getAmount(): number {
    return this.amount;
  }

  getFrequency(): FeeFrequency {
    return this.frequency;
  }

  isMandatoryFee(): boolean {
    return this.isMandatory;
  }

  isTaxableFee(): boolean {
    return this.isTaxable;
  }
}
