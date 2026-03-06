import { AggregateRoot } from '@/shared/domain';

export interface SubjectAllocationProps {
  organizationId: string;
  coachingCenterId: string;
  academicYearId: string;
  classMasterId: string;
  sectionId?: string;
  subjectName: string;
  teacherId?: string;
  weeklyPeriods?: number;
}

export class SubjectAllocation extends AggregateRoot<string> {
  private organizationId: string;
  private coachingCenterId: string;
  private academicYearId: string;
  private classMasterId: string;
  private sectionId?: string;
  private subjectName: string;
  private teacherId?: string;
  private weeklyPeriods?: number;

  constructor(id: string, props: SubjectAllocationProps, createdAt?: Date, updatedAt?: Date) {
    super(id, createdAt, updatedAt);
    this.organizationId = props.organizationId;
    this.coachingCenterId = props.coachingCenterId;
    this.academicYearId = props.academicYearId;
    this.classMasterId = props.classMasterId;
    this.sectionId = props.sectionId;
    this.subjectName = props.subjectName;
    this.teacherId = props.teacherId;
    this.weeklyPeriods = props.weeklyPeriods;
  }

  static create(id: string, props: SubjectAllocationProps): SubjectAllocation {
    return new SubjectAllocation(id, props);
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

  getClassMasterId(): string {
    return this.classMasterId;
  }

  getSectionId(): string | undefined {
    return this.sectionId;
  }

  getSubjectName(): string {
    return this.subjectName;
  }

  getTeacherId(): string | undefined {
    return this.teacherId;
  }

  getWeeklyPeriods(): number | undefined {
    return this.weeklyPeriods;
  }
}
