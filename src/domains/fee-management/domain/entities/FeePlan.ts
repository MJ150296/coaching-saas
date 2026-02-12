import { AggregateRoot } from '@/shared/domain';
import type { FeeFrequency } from './FeeType';

export interface FeePlanItem {
  feeTypeId: string;
  name: string;
  amount: number;
  frequency: FeeFrequency;
}

export interface FeePlanProps {
  organizationId: string;
  schoolId: string;
  academicYearId: string;
  name: string;
  items: FeePlanItem[];
}

export class FeePlan extends AggregateRoot<string> {
  private organizationId: string;
  private schoolId: string;
  private academicYearId: string;
  private name: string;
  private items: FeePlanItem[];

  constructor(id: string, props: FeePlanProps, createdAt?: Date, updatedAt?: Date) {
    super(id, createdAt, updatedAt);
    this.organizationId = props.organizationId;
    this.schoolId = props.schoolId;
    this.academicYearId = props.academicYearId;
    this.name = props.name;
    this.items = props.items;
  }

  static create(id: string, props: FeePlanProps): FeePlan {
    return new FeePlan(id, props);
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

  getName(): string {
    return this.name;
  }

  getItems(): FeePlanItem[] {
    return this.items;
  }
}
