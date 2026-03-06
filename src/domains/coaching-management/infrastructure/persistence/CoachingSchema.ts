import { Schema, model, models, Model } from 'mongoose';
import { CoachingEnrollmentStatus } from '../../domain/entities/CoachingEnrollment';
import { CoachingProgramStatus } from '../../domain/entities/CoachingProgram';
import { CoachingSessionStatus } from '../../domain/entities/CoachingSession';
import { CoachingAttendanceStatus } from '../../domain/entities/CoachingAttendance';

export interface ICoachingProgramDocument {
  _id: string;
  organizationId: string;
  coachingCenterId: string;
  academicYearId: string;
  name: string;
  code?: string;
  classLevel?: string;
  board?: string;
  description?: string;
  status: CoachingProgramStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICoachingBatchDocument {
  _id: string;
  organizationId: string;
  coachingCenterId: string;
  programId: string;
  name: string;
  facultyId?: string;
  capacity: number;
  scheduleSummary?: string;
  startsOn?: Date;
  endsOn?: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICoachingEnrollmentDocument {
  _id: string;
  organizationId: string;
  coachingCenterId: string;
  programId: string;
  batchId: string;
  studentId: string;
  enrolledOn: Date;
  status: CoachingEnrollmentStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICoachingSessionDocument {
  _id: string;
  organizationId: string;
  coachingCenterId: string;
  programId: string;
  batchId: string;
  topic: string;
  sessionDate: Date;
  startsAt?: string;
  endsAt?: string;
  facultyId?: string;
  status: CoachingSessionStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICoachingAttendanceDocument {
  _id: string;
  organizationId: string;
  coachingCenterId: string;
  programId: string;
  batchId: string;
  sessionId: string;
  studentId: string;
  status: CoachingAttendanceStatus;
  remarks?: string;
  markedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const coachingProgramSchema = new Schema(
  {
    _id: { type: String, required: true },
    organizationId: { type: String, required: true, index: true },
    coachingCenterId: { type: String, index: true },
    academicYearId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    code: { type: String },
    classLevel: { type: String },
    board: { type: String },
    description: { type: String },
    status: {
      type: String,
      required: true,
      enum: Object.values(CoachingProgramStatus),
      default: CoachingProgramStatus.DRAFT,
    },
  },
  { timestamps: true }
);

const coachingBatchSchema = new Schema(
  {
    _id: { type: String, required: true },
    organizationId: { type: String, required: true, index: true },
    coachingCenterId: { type: String, index: true },
    programId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    facultyId: { type: String },
    capacity: { type: Number, required: true },
    scheduleSummary: { type: String },
    startsOn: { type: Date },
    endsOn: { type: Date },
    isActive: { type: Boolean, required: true, default: true },
  },
  { timestamps: true }
);

const coachingEnrollmentSchema = new Schema(
  {
    _id: { type: String, required: true },
    organizationId: { type: String, required: true, index: true },
    coachingCenterId: { type: String, index: true },
    programId: { type: String, required: true, index: true },
    batchId: { type: String, required: true, index: true },
    studentId: { type: String, required: true, index: true },
    enrolledOn: { type: Date, required: true },
    status: {
      type: String,
      required: true,
      enum: Object.values(CoachingEnrollmentStatus),
      default: CoachingEnrollmentStatus.ACTIVE,
    },
  },
  { timestamps: true }
);

const coachingSessionSchema = new Schema(
  {
    _id: { type: String, required: true },
    organizationId: { type: String, required: true, index: true },
    coachingCenterId: { type: String, index: true },
    programId: { type: String, required: true, index: true },
    batchId: { type: String, required: true, index: true },
    topic: { type: String, required: true },
    sessionDate: { type: Date, required: true, index: true },
    startsAt: { type: String },
    endsAt: { type: String },
    facultyId: { type: String },
    status: {
      type: String,
      required: true,
      enum: Object.values(CoachingSessionStatus),
      default: CoachingSessionStatus.SCHEDULED,
    },
  },
  { timestamps: true }
);

const coachingAttendanceSchema = new Schema(
  {
    _id: { type: String, required: true },
    organizationId: { type: String, required: true, index: true },
    coachingCenterId: { type: String, index: true },
    programId: { type: String, required: true, index: true },
    batchId: { type: String, required: true, index: true },
    sessionId: { type: String, required: true, index: true },
    studentId: { type: String, required: true, index: true },
    status: {
      type: String,
      required: true,
      enum: Object.values(CoachingAttendanceStatus),
    },
    remarks: { type: String },
    markedAt: { type: Date, required: true },
  },
  { timestamps: true }
);

coachingProgramSchema.index(
  { organizationId: 1, coachingCenterId: 1, academicYearId: 1, code: 1 },
  { unique: true, partialFilterExpression: { code: { $exists: true, $type: 'string' } } }
);

coachingEnrollmentSchema.index(
  { organizationId: 1, coachingCenterId: 1, batchId: 1, studentId: 1 },
  { unique: true }
);

coachingAttendanceSchema.index(
  { organizationId: 1, coachingCenterId: 1, sessionId: 1, studentId: 1 },
  { unique: true }
);

const getOrCreateModel = <T>(name: string, schema: Schema): Model<T> => {
  if (models[name]) return models[name] as Model<T>;
  return model<T>(name, schema);
};

export const CoachingProgramModel = getOrCreateModel<ICoachingProgramDocument>(
  'CoachingProgram',
  coachingProgramSchema
);
export const CoachingBatchModel = getOrCreateModel<ICoachingBatchDocument>(
  'CoachingBatch',
  coachingBatchSchema
);
export const CoachingEnrollmentModel = getOrCreateModel<ICoachingEnrollmentDocument>(
  'CoachingEnrollment',
  coachingEnrollmentSchema
);
export const CoachingSessionModel = getOrCreateModel<ICoachingSessionDocument>(
  'CoachingSession',
  coachingSessionSchema
);
export const CoachingAttendanceModel = getOrCreateModel<ICoachingAttendanceDocument>(
  'CoachingAttendance',
  coachingAttendanceSchema
);
