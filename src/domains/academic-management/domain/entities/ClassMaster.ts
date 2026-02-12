import { AggregateRoot } from '@/shared/domain';

export interface ClassMasterProps {
  organizationId: string;
  schoolId: string;
  name: string;
  level?: string;
}

export class ClassMaster extends AggregateRoot<string> {
  private organizationId: string;
  private schoolId: string;
  private name: string;
  private level?: string;

  constructor(id: string, props: ClassMasterProps, createdAt?: Date, updatedAt?: Date) {
    super(id, createdAt, updatedAt);
    this.organizationId = props.organizationId;
    this.schoolId = props.schoolId;
    this.name = props.name;
    this.level = props.level;
  }

  static create(id: string, props: ClassMasterProps): ClassMaster {
    return new ClassMaster(id, props);
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

  getLevel(): string | undefined {
    return this.level;
  }
}
