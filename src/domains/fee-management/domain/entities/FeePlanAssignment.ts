import { AggregateRoot } from '@/shared/domain';

export interface FeePlanAssignmentProps {
  organizationId: string;
  coachingCenterId: string;
  academicYearId: string;
  feePlanId: string;
  classMasterId: string;
  sectionId?: string;
}

export class FeePlanAssignment extends AggregateRoot<string> {
  private organizationId: string;
  private coachingCenterId: string;
  private academicYearId: string;
  private feePlanId: string;
  private classMasterId: string;
  private sectionId?: string;

  constructor(id: string, props: FeePlanAssignmentProps, createdAt?: Date, updatedAt?: Date) {
    super(id, createdAt, updatedAt);
    this.organizationId = props.organizationId;
    this.coachingCenterId = props.coachingCenterId;
    this.academicYearId = props.academicYearId;
    this.feePlanId = props.feePlanId;
    this.classMasterId = props.classMasterId;
    this.sectionId = props.sectionId;
  }

  static create(id: string, props: FeePlanAssignmentProps): FeePlanAssignment {
    return new FeePlanAssignment(id, props);
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

  getFeePlanId(): string {
    return this.feePlanId;
  }

  getClassMasterId(): string {
    return this.classMasterId;
  }

  getSectionId(): string | undefined {
    return this.sectionId;
  }
}
