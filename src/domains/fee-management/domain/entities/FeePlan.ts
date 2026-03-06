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
  coachingCenterId: string;
  academicYearId: string;
  name: string;
  items: FeePlanItem[];
}

export class FeePlan extends AggregateRoot<string> {
  private organizationId: string;
  private coachingCenterId: string;
  private academicYearId: string;
  private name: string;
  private items: FeePlanItem[];

  constructor(id: string, props: FeePlanProps, createdAt?: Date, updatedAt?: Date) {
    super(id, createdAt, updatedAt);
    this.organizationId = props.organizationId;
    this.coachingCenterId = props.coachingCenterId;
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

  getCoachingCenterId(): string {
    return this.coachingCenterId;
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
