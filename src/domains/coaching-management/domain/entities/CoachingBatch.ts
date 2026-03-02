import { AggregateRoot } from '@/shared/domain';

export interface CoachingBatchProps {
  organizationId: string;
  schoolId: string;
  programId: string;
  name: string;
  facultyId?: string;
  capacity: number;
  scheduleSummary?: string;
  startsOn?: Date;
  endsOn?: Date;
  isActive: boolean;
}

export class CoachingBatch extends AggregateRoot<string> {
  private organizationId: string;
  private schoolId: string;
  private programId: string;
  private name: string;
  private facultyId?: string;
  private capacity: number;
  private scheduleSummary?: string;
  private startsOn?: Date;
  private endsOn?: Date;
  private isActive: boolean;

  constructor(id: string, props: CoachingBatchProps, createdAt?: Date, updatedAt?: Date) {
    super(id, createdAt, updatedAt);
    this.organizationId = props.organizationId;
    this.schoolId = props.schoolId;
    this.programId = props.programId;
    this.name = props.name;
    this.facultyId = props.facultyId;
    this.capacity = props.capacity;
    this.scheduleSummary = props.scheduleSummary;
    this.startsOn = props.startsOn;
    this.endsOn = props.endsOn;
    this.isActive = props.isActive;
  }

  static create(id: string, props: Omit<CoachingBatchProps, 'isActive'>): CoachingBatch {
    if (!props.name || props.name.trim().length === 0) {
      throw new Error('Batch name is required');
    }

    if (!Number.isFinite(props.capacity) || props.capacity <= 0) {
      throw new Error('Batch capacity must be greater than 0');
    }

    if (props.startsOn && props.endsOn && props.startsOn > props.endsOn) {
      throw new Error('Batch start date must be before end date');
    }

    return new CoachingBatch(id, {
      ...props,
      name: props.name.trim(),
      facultyId: props.facultyId?.trim(),
      scheduleSummary: props.scheduleSummary?.trim(),
      isActive: true,
    });
  }

  getOrganizationId(): string {
    return this.organizationId;
  }

  getSchoolId(): string {
    return this.schoolId;
  }

  getProgramId(): string {
    return this.programId;
  }

  getName(): string {
    return this.name;
  }

  getFacultyId(): string | undefined {
    return this.facultyId;
  }

  getCapacity(): number {
    return this.capacity;
  }

  getScheduleSummary(): string | undefined {
    return this.scheduleSummary;
  }

  getStartsOn(): Date | undefined {
    return this.startsOn;
  }

  getEndsOn(): Date | undefined {
    return this.endsOn;
  }

  isBatchActive(): boolean {
    return this.isActive;
  }
}
