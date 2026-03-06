import { AggregateRoot } from '@/shared/domain';

export interface ClassMasterProps {
  organizationId: string;
  coachingCenterId: string;
  name: string;
  level?: string;
}

export class ClassMaster extends AggregateRoot<string> {
  private organizationId: string;
  private coachingCenterId: string;
  private name: string;
  private level?: string;

  constructor(id: string, props: ClassMasterProps, createdAt?: Date, updatedAt?: Date) {
    super(id, createdAt, updatedAt);
    this.organizationId = props.organizationId;
    this.coachingCenterId = props.coachingCenterId;
    this.name = props.name;
    this.level = props.level;
  }

  static create(id: string, props: ClassMasterProps): ClassMaster {
    return new ClassMaster(id, props);
  }

  getOrganizationId(): string {
    return this.organizationId;
  }

  getCoachingCenterId(): string {
    return this.coachingCenterId;
  }

  getName(): string {
    return this.name;
  }

  getLevel(): string | undefined {
    return this.level;
  }
}
