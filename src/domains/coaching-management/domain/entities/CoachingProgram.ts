import { AggregateRoot } from '@/shared/domain';

export enum CoachingProgramStatus {
  DRAFT = 'DRAFT',
  ACTIVE = 'ACTIVE',
  ARCHIVED = 'ARCHIVED',
}

export interface CoachingProgramProps {
  organizationId: string;
  coachingCenterId: string;
  academicYearId: string;
  name: string;
  code?: string;
  classLevel?: string;
  board?: string;
  description?: string;
  status: CoachingProgramStatus;
}

export class CoachingProgram extends AggregateRoot<string> {
  private organizationId: string;
  private coachingCenterId: string;
  private academicYearId: string;
  private name: string;
  private code?: string;
  private classLevel?: string;
  private board?: string;
  private description?: string;
  private status: CoachingProgramStatus;

  constructor(id: string, props: CoachingProgramProps, createdAt?: Date, updatedAt?: Date) {
    super(id, createdAt, updatedAt);
    this.organizationId = props.organizationId;
    this.coachingCenterId = props.coachingCenterId;
    this.academicYearId = props.academicYearId;
    this.name = props.name;
    this.code = props.code;
    this.classLevel = props.classLevel;
    this.board = props.board;
    this.description = props.description;
    this.status = props.status;
  }

  static create(id: string, props: Omit<CoachingProgramProps, 'status'>): CoachingProgram {
    if (!props.name || props.name.trim().length === 0) {
      throw new Error('Program name is required');
    }

    return new CoachingProgram(id, {
      ...props,
      name: props.name.trim(),
      code: props.code?.trim(),
      classLevel: props.classLevel?.trim(),
      board: props.board?.trim(),
      description: props.description?.trim(),
      status: CoachingProgramStatus.DRAFT,
    });
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

  getCode(): string | undefined {
    return this.code;
  }

  getClassLevel(): string | undefined {
    return this.classLevel;
  }

  getBoard(): string | undefined {
    return this.board;
  }

  getDescription(): string | undefined {
    return this.description;
  }

  getStatus(): CoachingProgramStatus {
    return this.status;
  }
}
