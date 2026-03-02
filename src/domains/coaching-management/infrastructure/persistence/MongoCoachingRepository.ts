import { connectDB } from '@/shared/infrastructure/database';
import {
  CoachingBatchRepository,
  CoachingAttendanceRepository,
  CoachingEnrollmentRepository,
  CoachingProgramRepository,
  CoachingSessionRepository,
} from '../../domain/repositories';
import { CoachingProgram } from '../../domain/entities/CoachingProgram';
import { CoachingBatch } from '../../domain/entities/CoachingBatch';
import { CoachingEnrollment } from '../../domain/entities/CoachingEnrollment';
import { CoachingSession } from '../../domain/entities/CoachingSession';
import { CoachingAttendance } from '../../domain/entities/CoachingAttendance';
import {
  CoachingAttendanceModel,
  CoachingBatchModel,
  CoachingEnrollmentModel,
  CoachingProgramModel,
  CoachingSessionModel,
  ICoachingAttendanceDocument,
  ICoachingBatchDocument,
  ICoachingEnrollmentDocument,
  ICoachingProgramDocument,
  ICoachingSessionDocument,
} from './CoachingSchema';

export class MongoCoachingProgramRepository implements CoachingProgramRepository {
  private async ensureConnection() {
    await connectDB();
  }

  async save(entity: CoachingProgram): Promise<void> {
    await this.ensureConnection();
    await CoachingProgramModel.findByIdAndUpdate(
      entity.getId(),
      {
        _id: entity.getId(),
        organizationId: entity.getOrganizationId(),
        schoolId: entity.getSchoolId(),
        academicYearId: entity.getAcademicYearId(),
        name: entity.getName(),
        code: entity.getCode(),
        classLevel: entity.getClassLevel(),
        board: entity.getBoard(),
        description: entity.getDescription(),
        status: entity.getStatus(),
      },
      { upsert: true }
    );
  }

  async findById(id: string): Promise<CoachingProgram | null> {
    await this.ensureConnection();
    const doc = (await CoachingProgramModel.findById(id)) as ICoachingProgramDocument | null;
    if (!doc) return null;

    return new CoachingProgram(
      doc._id,
      {
        organizationId: doc.organizationId,
        schoolId: doc.schoolId,
        academicYearId: doc.academicYearId,
        name: doc.name,
        code: doc.code,
        classLevel: doc.classLevel,
        board: doc.board,
        description: doc.description,
        status: doc.status,
      },
      doc.createdAt,
      doc.updatedAt
    );
  }

  async findAll(): Promise<CoachingProgram[]> {
    await this.ensureConnection();
    const docs = (await CoachingProgramModel.find({})) as ICoachingProgramDocument[];
    return docs.map(
      (doc) =>
        new CoachingProgram(
          doc._id,
          {
            organizationId: doc.organizationId,
            schoolId: doc.schoolId,
            academicYearId: doc.academicYearId,
            name: doc.name,
            code: doc.code,
            classLevel: doc.classLevel,
            board: doc.board,
            description: doc.description,
            status: doc.status,
          },
          doc.createdAt,
          doc.updatedAt
        )
    );
  }

  async findByFilters(filters: {
    organizationId?: string;
    schoolId?: string;
    academicYearId?: string;
    limit?: number;
    offset?: number;
  }): Promise<CoachingProgram[]> {
    await this.ensureConnection();
    const query: {
      organizationId?: string;
      schoolId?: string;
      academicYearId?: string;
    } = {};

    if (filters.organizationId) query.organizationId = filters.organizationId;
    if (filters.schoolId) query.schoolId = filters.schoolId;
    if (filters.academicYearId) query.academicYearId = filters.academicYearId;

    let dbQuery = CoachingProgramModel.find(query).sort({ createdAt: -1 });
    if (typeof filters.offset === 'number' && filters.offset > 0) {
      dbQuery = dbQuery.skip(filters.offset);
    }
    if (typeof filters.limit === 'number' && filters.limit > 0) {
      dbQuery = dbQuery.limit(filters.limit);
    }

    const docs = (await dbQuery) as ICoachingProgramDocument[];
    return docs.map(
      (doc) =>
        new CoachingProgram(
          doc._id,
          {
            organizationId: doc.organizationId,
            schoolId: doc.schoolId,
            academicYearId: doc.academicYearId,
            name: doc.name,
            code: doc.code,
            classLevel: doc.classLevel,
            board: doc.board,
            description: doc.description,
            status: doc.status,
          },
          doc.createdAt,
          doc.updatedAt
        )
    );
  }

  async countByFilters(filters: {
    organizationId?: string;
    schoolId?: string;
    academicYearId?: string;
  }): Promise<number> {
    await this.ensureConnection();
    const query: {
      organizationId?: string;
      schoolId?: string;
      academicYearId?: string;
    } = {};

    if (filters.organizationId) query.organizationId = filters.organizationId;
    if (filters.schoolId) query.schoolId = filters.schoolId;
    if (filters.academicYearId) query.academicYearId = filters.academicYearId;
    return CoachingProgramModel.countDocuments(query);
  }

  async delete(id: string): Promise<void> {
    await this.ensureConnection();
    await CoachingProgramModel.findByIdAndDelete(id);
  }

  async exists(id: string): Promise<boolean> {
    await this.ensureConnection();
    const count = await CoachingProgramModel.countDocuments({ _id: id });
    return count > 0;
  }
}

export class MongoCoachingBatchRepository implements CoachingBatchRepository {
  private async ensureConnection() {
    await connectDB();
  }

  async save(entity: CoachingBatch): Promise<void> {
    await this.ensureConnection();
    await CoachingBatchModel.findByIdAndUpdate(
      entity.getId(),
      {
        _id: entity.getId(),
        organizationId: entity.getOrganizationId(),
        schoolId: entity.getSchoolId(),
        programId: entity.getProgramId(),
        name: entity.getName(),
        facultyId: entity.getFacultyId(),
        capacity: entity.getCapacity(),
        scheduleSummary: entity.getScheduleSummary(),
        startsOn: entity.getStartsOn(),
        endsOn: entity.getEndsOn(),
        isActive: entity.isBatchActive(),
      },
      { upsert: true }
    );
  }

  async findById(id: string): Promise<CoachingBatch | null> {
    await this.ensureConnection();
    const doc = (await CoachingBatchModel.findById(id)) as ICoachingBatchDocument | null;
    if (!doc) return null;

    return new CoachingBatch(
      doc._id,
      {
        organizationId: doc.organizationId,
        schoolId: doc.schoolId,
        programId: doc.programId,
        name: doc.name,
        facultyId: doc.facultyId,
        capacity: doc.capacity,
        scheduleSummary: doc.scheduleSummary,
        startsOn: doc.startsOn,
        endsOn: doc.endsOn,
        isActive: doc.isActive,
      },
      doc.createdAt,
      doc.updatedAt
    );
  }

  async findAll(): Promise<CoachingBatch[]> {
    await this.ensureConnection();
    const docs = (await CoachingBatchModel.find({})) as ICoachingBatchDocument[];
    return docs.map(
      (doc) =>
        new CoachingBatch(
          doc._id,
          {
            organizationId: doc.organizationId,
            schoolId: doc.schoolId,
            programId: doc.programId,
            name: doc.name,
            facultyId: doc.facultyId,
            capacity: doc.capacity,
            scheduleSummary: doc.scheduleSummary,
            startsOn: doc.startsOn,
            endsOn: doc.endsOn,
            isActive: doc.isActive,
          },
          doc.createdAt,
          doc.updatedAt
        )
    );
  }

  async findByFilters(filters: {
    organizationId?: string;
    schoolId?: string;
    programId?: string;
    limit?: number;
    offset?: number;
  }): Promise<CoachingBatch[]> {
    await this.ensureConnection();
    const query: {
      organizationId?: string;
      schoolId?: string;
      programId?: string;
    } = {};

    if (filters.organizationId) query.organizationId = filters.organizationId;
    if (filters.schoolId) query.schoolId = filters.schoolId;
    if (filters.programId) query.programId = filters.programId;

    let dbQuery = CoachingBatchModel.find(query).sort({ createdAt: -1 });
    if (typeof filters.offset === 'number' && filters.offset > 0) {
      dbQuery = dbQuery.skip(filters.offset);
    }
    if (typeof filters.limit === 'number' && filters.limit > 0) {
      dbQuery = dbQuery.limit(filters.limit);
    }

    const docs = (await dbQuery) as ICoachingBatchDocument[];
    return docs.map(
      (doc) =>
        new CoachingBatch(
          doc._id,
          {
            organizationId: doc.organizationId,
            schoolId: doc.schoolId,
            programId: doc.programId,
            name: doc.name,
            facultyId: doc.facultyId,
            capacity: doc.capacity,
            scheduleSummary: doc.scheduleSummary,
            startsOn: doc.startsOn,
            endsOn: doc.endsOn,
            isActive: doc.isActive,
          },
          doc.createdAt,
          doc.updatedAt
        )
    );
  }

  async countByFilters(filters: {
    organizationId?: string;
    schoolId?: string;
    programId?: string;
  }): Promise<number> {
    await this.ensureConnection();
    const query: {
      organizationId?: string;
      schoolId?: string;
      programId?: string;
    } = {};

    if (filters.organizationId) query.organizationId = filters.organizationId;
    if (filters.schoolId) query.schoolId = filters.schoolId;
    if (filters.programId) query.programId = filters.programId;

    return CoachingBatchModel.countDocuments(query);
  }

  async delete(id: string): Promise<void> {
    await this.ensureConnection();
    await CoachingBatchModel.findByIdAndDelete(id);
  }

  async exists(id: string): Promise<boolean> {
    await this.ensureConnection();
    const count = await CoachingBatchModel.countDocuments({ _id: id });
    return count > 0;
  }
}

export class MongoCoachingEnrollmentRepository implements CoachingEnrollmentRepository {
  private async ensureConnection() {
    await connectDB();
  }

  async save(entity: CoachingEnrollment): Promise<void> {
    await this.ensureConnection();
    await CoachingEnrollmentModel.findByIdAndUpdate(
      entity.getId(),
      {
        _id: entity.getId(),
        organizationId: entity.getOrganizationId(),
        schoolId: entity.getSchoolId(),
        programId: entity.getProgramId(),
        batchId: entity.getBatchId(),
        studentId: entity.getStudentId(),
        enrolledOn: entity.getEnrolledOn(),
        status: entity.getStatus(),
      },
      { upsert: true }
    );
  }

  async findById(id: string): Promise<CoachingEnrollment | null> {
    await this.ensureConnection();
    const doc = (await CoachingEnrollmentModel.findById(id)) as ICoachingEnrollmentDocument | null;
    if (!doc) return null;

    return new CoachingEnrollment(
      doc._id,
      {
        organizationId: doc.organizationId,
        schoolId: doc.schoolId,
        programId: doc.programId,
        batchId: doc.batchId,
        studentId: doc.studentId,
        enrolledOn: doc.enrolledOn,
        status: doc.status,
      },
      doc.createdAt,
      doc.updatedAt
    );
  }

  async findAll(): Promise<CoachingEnrollment[]> {
    await this.ensureConnection();
    const docs = (await CoachingEnrollmentModel.find({})) as ICoachingEnrollmentDocument[];
    return docs.map(
      (doc) =>
        new CoachingEnrollment(
          doc._id,
          {
            organizationId: doc.organizationId,
            schoolId: doc.schoolId,
            programId: doc.programId,
            batchId: doc.batchId,
            studentId: doc.studentId,
            enrolledOn: doc.enrolledOn,
            status: doc.status,
          },
          doc.createdAt,
          doc.updatedAt
        )
    );
  }

  async findByFilters(filters: {
    organizationId?: string;
    schoolId?: string;
    programId?: string;
    batchId?: string;
    studentId?: string;
    limit?: number;
    offset?: number;
  }): Promise<CoachingEnrollment[]> {
    await this.ensureConnection();
    const query: {
      organizationId?: string;
      schoolId?: string;
      programId?: string;
      batchId?: string;
      studentId?: string;
    } = {};

    if (filters.organizationId) query.organizationId = filters.organizationId;
    if (filters.schoolId) query.schoolId = filters.schoolId;
    if (filters.programId) query.programId = filters.programId;
    if (filters.batchId) query.batchId = filters.batchId;
    if (filters.studentId) query.studentId = filters.studentId;

    let dbQuery = CoachingEnrollmentModel.find(query).sort({ createdAt: -1 });
    if (typeof filters.offset === 'number' && filters.offset > 0) {
      dbQuery = dbQuery.skip(filters.offset);
    }
    if (typeof filters.limit === 'number' && filters.limit > 0) {
      dbQuery = dbQuery.limit(filters.limit);
    }

    const docs = (await dbQuery) as ICoachingEnrollmentDocument[];
    return docs.map(
      (doc) =>
        new CoachingEnrollment(
          doc._id,
          {
            organizationId: doc.organizationId,
            schoolId: doc.schoolId,
            programId: doc.programId,
            batchId: doc.batchId,
            studentId: doc.studentId,
            enrolledOn: doc.enrolledOn,
            status: doc.status,
          },
          doc.createdAt,
          doc.updatedAt
        )
    );
  }

  async countByFilters(filters: {
    organizationId?: string;
    schoolId?: string;
    programId?: string;
    batchId?: string;
    studentId?: string;
  }): Promise<number> {
    await this.ensureConnection();
    const query: {
      organizationId?: string;
      schoolId?: string;
      programId?: string;
      batchId?: string;
      studentId?: string;
    } = {};

    if (filters.organizationId) query.organizationId = filters.organizationId;
    if (filters.schoolId) query.schoolId = filters.schoolId;
    if (filters.programId) query.programId = filters.programId;
    if (filters.batchId) query.batchId = filters.batchId;
    if (filters.studentId) query.studentId = filters.studentId;

    return CoachingEnrollmentModel.countDocuments(query);
  }

  async existsByStudentInBatch(
    organizationId: string,
    schoolId: string,
    batchId: string,
    studentId: string
  ): Promise<boolean> {
    await this.ensureConnection();
    const count = await CoachingEnrollmentModel.countDocuments({
      organizationId,
      schoolId,
      batchId,
      studentId,
    });
    return count > 0;
  }

  async delete(id: string): Promise<void> {
    await this.ensureConnection();
    await CoachingEnrollmentModel.findByIdAndDelete(id);
  }

  async exists(id: string): Promise<boolean> {
    await this.ensureConnection();
    const count = await CoachingEnrollmentModel.countDocuments({ _id: id });
    return count > 0;
  }
}

export class MongoCoachingSessionRepository implements CoachingSessionRepository {
  private async ensureConnection() {
    await connectDB();
  }

  async save(entity: CoachingSession): Promise<void> {
    await this.ensureConnection();
    await CoachingSessionModel.findByIdAndUpdate(
      entity.getId(),
      {
        _id: entity.getId(),
        organizationId: entity.getOrganizationId(),
        schoolId: entity.getSchoolId(),
        programId: entity.getProgramId(),
        batchId: entity.getBatchId(),
        topic: entity.getTopic(),
        sessionDate: entity.getSessionDate(),
        startsAt: entity.getStartsAt(),
        endsAt: entity.getEndsAt(),
        facultyId: entity.getFacultyId(),
        status: entity.getStatus(),
      },
      { upsert: true }
    );
  }

  async findById(id: string): Promise<CoachingSession | null> {
    await this.ensureConnection();
    const doc = (await CoachingSessionModel.findById(id)) as ICoachingSessionDocument | null;
    if (!doc) return null;
    return new CoachingSession(
      doc._id,
      {
        organizationId: doc.organizationId,
        schoolId: doc.schoolId,
        programId: doc.programId,
        batchId: doc.batchId,
        topic: doc.topic,
        sessionDate: doc.sessionDate,
        startsAt: doc.startsAt,
        endsAt: doc.endsAt,
        facultyId: doc.facultyId,
        status: doc.status,
      },
      doc.createdAt,
      doc.updatedAt
    );
  }

  async findAll(): Promise<CoachingSession[]> {
    await this.ensureConnection();
    const docs = (await CoachingSessionModel.find({})) as ICoachingSessionDocument[];
    return docs.map(
      (doc) =>
        new CoachingSession(
          doc._id,
          {
            organizationId: doc.organizationId,
            schoolId: doc.schoolId,
            programId: doc.programId,
            batchId: doc.batchId,
            topic: doc.topic,
            sessionDate: doc.sessionDate,
            startsAt: doc.startsAt,
            endsAt: doc.endsAt,
            facultyId: doc.facultyId,
            status: doc.status,
          },
          doc.createdAt,
          doc.updatedAt
        )
    );
  }

  async findByFilters(filters: {
    organizationId?: string;
    schoolId?: string;
    programId?: string;
    batchId?: string;
    facultyId?: string;
    sessionDateFrom?: Date;
    sessionDateTo?: Date;
    limit?: number;
    offset?: number;
  }): Promise<CoachingSession[]> {
    await this.ensureConnection();
    const query: {
      organizationId?: string;
      schoolId?: string;
      programId?: string;
      batchId?: string;
      facultyId?: string;
      sessionDate?: { $gte?: Date; $lte?: Date };
    } = {};

    if (filters.organizationId) query.organizationId = filters.organizationId;
    if (filters.schoolId) query.schoolId = filters.schoolId;
    if (filters.programId) query.programId = filters.programId;
    if (filters.batchId) query.batchId = filters.batchId;
    if (filters.facultyId) query.facultyId = filters.facultyId;
    if (filters.sessionDateFrom || filters.sessionDateTo) {
      query.sessionDate = {};
      if (filters.sessionDateFrom) query.sessionDate.$gte = filters.sessionDateFrom;
      if (filters.sessionDateTo) query.sessionDate.$lte = filters.sessionDateTo;
    }

    let dbQuery = CoachingSessionModel.find(query).sort({ sessionDate: 1, createdAt: 1 });
    if (typeof filters.offset === 'number' && filters.offset > 0) {
      dbQuery = dbQuery.skip(filters.offset);
    }
    if (typeof filters.limit === 'number' && filters.limit > 0) {
      dbQuery = dbQuery.limit(filters.limit);
    }

    const docs = (await dbQuery) as ICoachingSessionDocument[];
    return docs.map(
      (doc) =>
        new CoachingSession(
          doc._id,
          {
            organizationId: doc.organizationId,
            schoolId: doc.schoolId,
            programId: doc.programId,
            batchId: doc.batchId,
            topic: doc.topic,
            sessionDate: doc.sessionDate,
            startsAt: doc.startsAt,
            endsAt: doc.endsAt,
            facultyId: doc.facultyId,
            status: doc.status,
          },
          doc.createdAt,
          doc.updatedAt
        )
    );
  }

  async countByFilters(filters: {
    organizationId?: string;
    schoolId?: string;
    programId?: string;
    batchId?: string;
    facultyId?: string;
    sessionDateFrom?: Date;
    sessionDateTo?: Date;
  }): Promise<number> {
    await this.ensureConnection();
    const query: {
      organizationId?: string;
      schoolId?: string;
      programId?: string;
      batchId?: string;
      facultyId?: string;
      sessionDate?: { $gte?: Date; $lte?: Date };
    } = {};

    if (filters.organizationId) query.organizationId = filters.organizationId;
    if (filters.schoolId) query.schoolId = filters.schoolId;
    if (filters.programId) query.programId = filters.programId;
    if (filters.batchId) query.batchId = filters.batchId;
    if (filters.facultyId) query.facultyId = filters.facultyId;
    if (filters.sessionDateFrom || filters.sessionDateTo) {
      query.sessionDate = {};
      if (filters.sessionDateFrom) query.sessionDate.$gte = filters.sessionDateFrom;
      if (filters.sessionDateTo) query.sessionDate.$lte = filters.sessionDateTo;
    }
    return CoachingSessionModel.countDocuments(query);
  }

  async delete(id: string): Promise<void> {
    await this.ensureConnection();
    await CoachingSessionModel.findByIdAndDelete(id);
  }

  async exists(id: string): Promise<boolean> {
    await this.ensureConnection();
    const count = await CoachingSessionModel.countDocuments({ _id: id });
    return count > 0;
  }
}

export class MongoCoachingAttendanceRepository implements CoachingAttendanceRepository {
  private async ensureConnection() {
    await connectDB();
  }

  async save(entity: CoachingAttendance): Promise<void> {
    await this.ensureConnection();
    await CoachingAttendanceModel.findByIdAndUpdate(
      entity.getId(),
      {
        _id: entity.getId(),
        organizationId: entity.getOrganizationId(),
        schoolId: entity.getSchoolId(),
        programId: entity.getProgramId(),
        batchId: entity.getBatchId(),
        sessionId: entity.getSessionId(),
        studentId: entity.getStudentId(),
        status: entity.getStatus(),
        remarks: entity.getRemarks(),
        markedAt: entity.getMarkedAt(),
      },
      { upsert: true }
    );
  }

  async findById(id: string): Promise<CoachingAttendance | null> {
    await this.ensureConnection();
    const doc = (await CoachingAttendanceModel.findById(id)) as ICoachingAttendanceDocument | null;
    if (!doc) return null;
    return new CoachingAttendance(
      doc._id,
      {
        organizationId: doc.organizationId,
        schoolId: doc.schoolId,
        programId: doc.programId,
        batchId: doc.batchId,
        sessionId: doc.sessionId,
        studentId: doc.studentId,
        status: doc.status,
        remarks: doc.remarks,
        markedAt: doc.markedAt,
      },
      doc.createdAt,
      doc.updatedAt
    );
  }

  async findAll(): Promise<CoachingAttendance[]> {
    await this.ensureConnection();
    const docs = (await CoachingAttendanceModel.find({})) as ICoachingAttendanceDocument[];
    return docs.map(
      (doc) =>
        new CoachingAttendance(
          doc._id,
          {
            organizationId: doc.organizationId,
            schoolId: doc.schoolId,
            programId: doc.programId,
            batchId: doc.batchId,
            sessionId: doc.sessionId,
            studentId: doc.studentId,
            status: doc.status,
            remarks: doc.remarks,
            markedAt: doc.markedAt,
          },
          doc.createdAt,
          doc.updatedAt
        )
    );
  }

  async findByFilters(filters: {
    organizationId?: string;
    schoolId?: string;
    sessionId?: string;
    studentId?: string;
    limit?: number;
    offset?: number;
  }): Promise<CoachingAttendance[]> {
    await this.ensureConnection();
    const query: {
      organizationId?: string;
      schoolId?: string;
      sessionId?: string;
      studentId?: string;
    } = {};

    if (filters.organizationId) query.organizationId = filters.organizationId;
    if (filters.schoolId) query.schoolId = filters.schoolId;
    if (filters.sessionId) query.sessionId = filters.sessionId;
    if (filters.studentId) query.studentId = filters.studentId;

    let dbQuery = CoachingAttendanceModel.find(query).sort({ createdAt: -1 });
    if (typeof filters.offset === 'number' && filters.offset > 0) {
      dbQuery = dbQuery.skip(filters.offset);
    }
    if (typeof filters.limit === 'number' && filters.limit > 0) {
      dbQuery = dbQuery.limit(filters.limit);
    }

    const docs = (await dbQuery) as ICoachingAttendanceDocument[];
    return docs.map(
      (doc) =>
        new CoachingAttendance(
          doc._id,
          {
            organizationId: doc.organizationId,
            schoolId: doc.schoolId,
            programId: doc.programId,
            batchId: doc.batchId,
            sessionId: doc.sessionId,
            studentId: doc.studentId,
            status: doc.status,
            remarks: doc.remarks,
            markedAt: doc.markedAt,
          },
          doc.createdAt,
          doc.updatedAt
        )
    );
  }

  async countByFilters(filters: {
    organizationId?: string;
    schoolId?: string;
    sessionId?: string;
    studentId?: string;
  }): Promise<number> {
    await this.ensureConnection();
    const query: {
      organizationId?: string;
      schoolId?: string;
      sessionId?: string;
      studentId?: string;
    } = {};

    if (filters.organizationId) query.organizationId = filters.organizationId;
    if (filters.schoolId) query.schoolId = filters.schoolId;
    if (filters.sessionId) query.sessionId = filters.sessionId;
    if (filters.studentId) query.studentId = filters.studentId;

    return CoachingAttendanceModel.countDocuments(query);
  }

  async existsBySessionAndStudent(
    organizationId: string,
    schoolId: string,
    sessionId: string,
    studentId: string
  ): Promise<boolean> {
    await this.ensureConnection();
    const count = await CoachingAttendanceModel.countDocuments({
      organizationId,
      schoolId,
      sessionId,
      studentId,
    });
    return count > 0;
  }

  async delete(id: string): Promise<void> {
    await this.ensureConnection();
    await CoachingAttendanceModel.findByIdAndDelete(id);
  }

  async exists(id: string): Promise<boolean> {
    await this.ensureConnection();
    const count = await CoachingAttendanceModel.countDocuments({ _id: id });
    return count > 0;
  }
}
