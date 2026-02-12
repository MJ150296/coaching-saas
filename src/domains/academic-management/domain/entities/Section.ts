import { AggregateRoot } from '@/shared/domain';

export interface SectionProps {
  organizationId: string;
  schoolId: string;
  classMasterId: string;
  name: string;
  capacity?: number;
  roomNumber?: string;
  shift?: string;
  classTeacherId?: string;
}

export class Section extends AggregateRoot<string> {
  private organizationId: string;
  private schoolId: string;
  private classMasterId: string;
  private name: string;
  private capacity?: number;
  private roomNumber?: string;
  private shift?: string;
  private classTeacherId?: string;

  constructor(id: string, props: SectionProps, createdAt?: Date, updatedAt?: Date) {
    super(id, createdAt, updatedAt);
    this.organizationId = props.organizationId;
    this.schoolId = props.schoolId;
    this.classMasterId = props.classMasterId;
    this.name = props.name;
    this.capacity = props.capacity;
    this.roomNumber = props.roomNumber;
    this.shift = props.shift;
    this.classTeacherId = props.classTeacherId;
  }

  static create(id: string, props: SectionProps): Section {
    return new Section(id, props);
  }

  getOrganizationId(): string {
    return this.organizationId;
  }

  getSchoolId(): string {
    return this.schoolId;
  }

  getClassMasterId(): string {
    return this.classMasterId;
  }

  getName(): string {
    return this.name;
  }

  getCapacity(): number | undefined {
    return this.capacity;
  }

  getRoomNumber(): string | undefined {
    return this.roomNumber;
  }

  getShift(): string | undefined {
    return this.shift;
  }

  getClassTeacherId(): string | undefined {
    return this.classTeacherId;
  }
}
