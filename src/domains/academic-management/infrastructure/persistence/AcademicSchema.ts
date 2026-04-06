import { Schema, model, models, Model } from 'mongoose';

export interface IAcademicYearDocument {
  _id: string;
  organizationId: string;
  coachingCenterId: string;
  name: string;
  startDate: Date;
  endDate: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ITimetableEntryDocument {
  _id: string;
  organizationId: string;
  coachingCenterId: string;
  academicYearId: string;
  programId: string;
  batchId?: string;
  dayOfWeek: string;
  periodNumber: number;
  subjectName: string;
  teacherId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IStudentEnrollmentDocument {
  _id: string;
  organizationId: string;
  coachingCenterId: string;
  academicYearId: string;
  studentId: string;
  programId: string;
  batchId?: string;
  rollNumber?: string;
  createdAt: Date;
  updatedAt: Date;
}


export interface ISectionDocument {
  _id: string;
  organizationId: string;
  coachingCenterId: string;
  name: string;
  roomNumber?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ISubjectAllocationDocument {
  _id: string;
  organizationId: string;
  coachingCenterId: string;
  sectionId?: string;
  teacherId: string;
  subjectName: string;
  weeklyPeriods?: number;
  createdAt: Date;
  updatedAt: Date;
}

const academicYearSchema = new Schema(
  {
    _id: { type: String, required: true },
    organizationId: { type: String, required: true, index: true },
    coachingCenterId: { type: String, index: true },
    name: { type: String, required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const timetableEntrySchema = new Schema(
  {
    _id: { type: String, required: true },
    organizationId: { type: String, required: true, index: true },
    coachingCenterId: { type: String, index: true },
    academicYearId: { type: String, required: true, index: true },
    programId: { type: String, required: true, index: true },
    batchId: { type: String, index: true },
    dayOfWeek: { type: String, required: true, index: true },
    periodNumber: { type: Number, required: true, index: true },
    subjectName: { type: String, required: true },
    teacherId: { type: String },
  },
  { timestamps: true }
);

const studentEnrollmentSchema = new Schema(
  {
    _id: { type: String, required: true },
    organizationId: { type: String, required: true, index: true },
    coachingCenterId: { type: String, index: true },
    academicYearId: { type: String, required: true, index: true },
    studentId: { type: String, required: true, index: true },
    programId: { type: String, required: true, index: true },
    batchId: { type: String, index: true },
    rollNumber: { type: String },
  },
  { timestamps: true }
);

timetableEntrySchema.index(
  {
    organizationId: 1,
    coachingCenterId: 1,
    academicYearId: 1,
    programId: 1,
    batchId: 1,
    dayOfWeek: 1,
    periodNumber: 1,
  },
  { unique: true }
);

studentEnrollmentSchema.index(
  {
    organizationId: 1,
    coachingCenterId: 1,
    academicYearId: 1,
    studentId: 1,
  },
  { unique: true }
);

const sectionSchema = new Schema(
  {
    _id: { type: String, required: true },
    organizationId: { type: String, required: true, index: true },
    coachingCenterId: { type: String, index: true },
    name: { type: String, required: true },
    roomNumber: { type: String },
  },
  { timestamps: true }
);

const subjectAllocationSchema = new Schema(
  {
    _id: { type: String, required: true },
    organizationId: { type: String, required: true, index: true },
    coachingCenterId: { type: String, index: true },
    sectionId: { type: String, index: true },
    teacherId: { type: String, required: true, index: true },
    subjectName: { type: String, required: true },
    weeklyPeriods: { type: Number },
  },
  { timestamps: true }
);

sectionSchema.index(
  { organizationId: 1, coachingCenterId: 1, name: 1 },
  { unique: true }
);

subjectAllocationSchema.index(
  { organizationId: 1, coachingCenterId: 1, sectionId: 1, teacherId: 1, subjectName: 1 },
  { unique: true }
);

const getOrCreateModel = <T>(name: string, schema: Schema): Model<T> => {
  if (models[name]) return models[name] as Model<T>;
  return model<T>(name, schema);
};

export const AcademicYearModel = getOrCreateModel<IAcademicYearDocument>('AcademicYear', academicYearSchema);
export const TimetableEntryModel = getOrCreateModel<ITimetableEntryDocument>('TimetableEntry', timetableEntrySchema);
export const StudentEnrollmentModel = getOrCreateModel<IStudentEnrollmentDocument>('StudentEnrollment', studentEnrollmentSchema);
export const SectionModel = getOrCreateModel<ISectionDocument>('Section', sectionSchema);
export const SubjectAllocationModel = getOrCreateModel<ISubjectAllocationDocument>('SubjectAllocation', subjectAllocationSchema);
