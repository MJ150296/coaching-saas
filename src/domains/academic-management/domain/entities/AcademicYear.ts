import { AggregateRoot } from '@/shared/domain';

export interface AcademicYearProps {
  organizationId: string;
  schoolId: string;
  name: string;
  startDate: Date;
  endDate: Date;
  isActive: boolean;
}

export class AcademicYear extends AggregateRoot<string> {
  private organizationId: string;
  private schoolId: string;
  private name: string;
  private startDate: Date;
  private endDate: Date;
  private isActive: boolean;

  constructor(id: string, props: AcademicYearProps, createdAt?: Date, updatedAt?: Date) {
    super(id, createdAt, updatedAt);
    this.organizationId = props.organizationId;
    this.schoolId = props.schoolId;
    this.name = props.name;
    this.startDate = props.startDate;
    this.endDate = props.endDate;
    this.isActive = props.isActive;
  }

  static create(id: string, props: Omit<AcademicYearProps, 'isActive'>): AcademicYear {
    return new AcademicYear(id, { ...props, isActive: true });
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

  getStartDate(): Date {
    return this.startDate;
  }

  getEndDate(): Date {
    return this.endDate;
  }

  isActiveYear(): boolean {
    return this.isActive;
  }
}
