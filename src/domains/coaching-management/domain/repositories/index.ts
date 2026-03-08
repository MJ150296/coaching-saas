import type { Repository } from '@/shared/domain';
import { CoachingProgram } from '../entities/CoachingProgram';
import { CoachingBatch } from '../entities/CoachingBatch';
import { CoachingEnrollment } from '../entities/CoachingEnrollment';
import { CoachingSession } from '../entities/CoachingSession';
import { CoachingAttendance } from '../entities/CoachingAttendance';

export interface CoachingProgramRepository extends Repository<CoachingProgram, string> {
  findByFilters(filters: {
    organizationId?: string;
    coachingCenterId?: string;
    academicYearId?: string;
    limit?: number;
    offset?: number;
  }): Promise<CoachingProgram[]>;
  countByFilters(filters: {
    organizationId?: string;
    coachingCenterId?: string;
    academicYearId?: string;
  }): Promise<number>;
}

export interface CoachingBatchRepository extends Repository<CoachingBatch, string> {
  findByFilters(filters: {
    organizationId?: string;
    coachingCenterId?: string;
    programId?: string;
    limit?: number;
    offset?: number;
  }): Promise<CoachingBatch[]>;
  countByFilters(filters: {
    organizationId?: string;
    coachingCenterId?: string;
    programId?: string;
  }): Promise<number>;
}

export interface CoachingEnrollmentRepository extends Repository<CoachingEnrollment, string> {
  findByFilters(filters: {
    organizationId?: string;
    coachingCenterId?: string;
    programId?: string;
    batchId?: string;
    studentId?: string;
    limit?: number;
    offset?: number;
  }): Promise<CoachingEnrollment[]>;
  countByFilters(filters: {
    organizationId?: string;
    coachingCenterId?: string;
    programId?: string;
    batchId?: string;
    studentId?: string;
  }): Promise<number>;
  existsByStudentInBatch(
    organizationId: string,
    coachingCenterId: string,
    batchId: string,
    studentId: string
  ): Promise<boolean>;
}

export interface CoachingSessionRepository extends Repository<CoachingSession, string> {
  findByFilters(filters: {
    organizationId?: string;
    coachingCenterId?: string;
    programId?: string;
    batchId?: string;
    facultyId?: string;
    sessionDateFrom?: Date;
    sessionDateTo?: Date;
    limit?: number;
    offset?: number;
  }): Promise<CoachingSession[]>;
  countByFilters(filters: {
    organizationId?: string;
    coachingCenterId?: string;
    programId?: string;
    batchId?: string;
    facultyId?: string;
    sessionDateFrom?: Date;
    sessionDateTo?: Date;
  }): Promise<number>;
}

export interface CoachingAttendanceRepository extends Repository<CoachingAttendance, string> {
  findByFilters(filters: {
    organizationId?: string;
    coachingCenterId?: string;
    sessionId?: string;
    studentId?: string;
    limit?: number;
    offset?: number;
  }): Promise<CoachingAttendance[]>;
  countByFilters(filters: {
    organizationId?: string;
    coachingCenterId?: string;
    sessionId?: string;
    studentId?: string;
  }): Promise<number>;
  existsBySessionAndStudent(
    organizationId: string,
    coachingCenterId: string,
    sessionId: string,
    studentId: string
  ): Promise<boolean>;
}
