import { Schema, model, models, Model } from 'mongoose';

export interface IAcademicYearDocument {
  _id: string;
  organizationId: string;
  schoolId: string;
  name: string;
  startDate: Date;
  endDate: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IClassMasterDocument {
  _id: string;
  organizationId: string;
  schoolId: string;
  name: string;
  level?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ISectionDocument {
  _id: string;
  organizationId: string;
  schoolId: string;
  classMasterId: string;
  name: string;
  capacity?: number;
  roomNumber?: string;
  shift?: string;
  classTeacherId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ISubjectAllocationDocument {
  _id: string;
  organizationId: string;
  schoolId: string;
  academicYearId: string;
  classMasterId: string;
  sectionId?: string;
  subjectName: string;
  teacherId?: string;
  weeklyPeriods?: number;
  createdAt: Date;
  updatedAt: Date;
}

const academicYearSchema = new Schema(
  {
    _id: { type: String, required: true },
    organizationId: { type: String, required: true, index: true },
    schoolId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const classMasterSchema = new Schema(
  {
    _id: { type: String, required: true },
    organizationId: { type: String, required: true, index: true },
    schoolId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    level: { type: String },
  },
  { timestamps: true }
);

const sectionSchema = new Schema(
  {
    _id: { type: String, required: true },
    organizationId: { type: String, required: true, index: true },
    schoolId: { type: String, required: true, index: true },
    classMasterId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    capacity: { type: Number },
    roomNumber: { type: String },
    shift: { type: String },
    classTeacherId: { type: String },
  },
  { timestamps: true }
);

const subjectAllocationSchema = new Schema(
  {
    _id: { type: String, required: true },
    organizationId: { type: String, required: true, index: true },
    schoolId: { type: String, required: true, index: true },
    academicYearId: { type: String, required: true, index: true },
    classMasterId: { type: String, required: true, index: true },
    sectionId: { type: String },
    subjectName: { type: String, required: true },
    teacherId: { type: String },
    weeklyPeriods: { type: Number },
  },
  { timestamps: true }
);

const getOrCreateModel = <T>(name: string, schema: Schema): Model<T> => {
  if (models[name]) return models[name] as Model<T>;
  return model<T>(name, schema);
};

export const AcademicYearModel = getOrCreateModel<IAcademicYearDocument>('AcademicYear', academicYearSchema);
export const ClassMasterModel = getOrCreateModel<IClassMasterDocument>('ClassMaster', classMasterSchema);
export const SectionModel = getOrCreateModel<ISectionDocument>('Section', sectionSchema);
export const SubjectAllocationModel = getOrCreateModel<ISubjectAllocationDocument>('SubjectAllocation', subjectAllocationSchema);
