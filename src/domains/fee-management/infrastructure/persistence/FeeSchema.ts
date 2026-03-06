import { Schema, model, models, Model } from 'mongoose';

export interface IFeeTypeDocument {
  _id: string;
  organizationId: string;
  coachingCenterId: string;
  name: string;
  amount: number;
  frequency: string;
  isMandatory: boolean;
  isTaxable: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IFeePlanDocument {
  _id: string;
  organizationId: string;
  coachingCenterId: string;
  academicYearId: string;
  name: string;
  items: Array<{ feeTypeId: string; name: string; amount: number; frequency: string }>;
  createdAt: Date;
  updatedAt: Date;
}

export interface IFeePlanAssignmentDocument {
  _id: string;
  organizationId: string;
  coachingCenterId: string;
  academicYearId: string;
  feePlanId: string;
  classMasterId: string;
  sectionId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IStudentFeeLedgerDocument {
  _id: string;
  organizationId: string;
  coachingCenterId: string;
  academicYearId: string;
  studentId: string;
  feePlanId?: string;
  feeTypeId?: string;
  originalAmount: number;
  amount: number;
  discount?: {
    type: string;
    mode: string;
    value: number;
    amount: number;
    reason?: string;
  };
  dueDate: Date;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IPaymentDocument {
  _id: string;
  organizationId: string;
  coachingCenterId: string;
  academicYearId: string;
  studentId: string;
  amount: number;
  method: string;
  reference?: string;
  paidAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICreditNoteDocument {
  _id: string;
  organizationId: string;
  coachingCenterId: string;
  academicYearId: string;
  studentId: string;
  amount: number;
  reason: string;
  createdOn: Date;
  createdAt: Date;
  updatedAt: Date;
}

const feeTypeSchema = new Schema(
  {
    _id: { type: String, required: true },
    organizationId: { type: String, required: true, index: true },
    coachingCenterId: { type: String, index: true },
    name: { type: String, required: true },
    amount: { type: Number, required: true },
    frequency: { type: String, required: true },
    isMandatory: { type: Boolean, default: true },
    isTaxable: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const feePlanSchema = new Schema(
  {
    _id: { type: String, required: true },
    organizationId: { type: String, required: true, index: true },
    coachingCenterId: { type: String, index: true },
    academicYearId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    items: { type: Array, default: [] },
  },
  { timestamps: true }
);

const feePlanAssignmentSchema = new Schema(
  {
    _id: { type: String, required: true },
    organizationId: { type: String, required: true, index: true },
    coachingCenterId: { type: String, index: true },
    academicYearId: { type: String, required: true, index: true },
    feePlanId: { type: String, required: true },
    classMasterId: { type: String, required: true },
    sectionId: { type: String },
  },
  { timestamps: true }
);

const studentFeeLedgerSchema = new Schema(
  {
    _id: { type: String, required: true },
    organizationId: { type: String, required: true, index: true },
    coachingCenterId: { type: String, index: true },
    academicYearId: { type: String, required: true, index: true },
    studentId: { type: String, required: true, index: true },
    feePlanId: { type: String },
    feeTypeId: { type: String },
    originalAmount: { type: Number },
    amount: { type: Number, required: true },
    discount: {
      type: {
        type: String,
        enum: ['NONE', 'SCHOLARSHIP', 'SIBLING', 'STAFF', 'CUSTOM'],
      },
      mode: {
        type: String,
        enum: ['FLAT', 'PERCENT'],
      },
      value: { type: Number },
      amount: { type: Number },
      reason: { type: String },
    },
    dueDate: { type: Date, required: true },
    status: { type: String, required: true },
  },
  { timestamps: true }
);

const paymentSchema = new Schema(
  {
    _id: { type: String, required: true },
    organizationId: { type: String, required: true, index: true },
    coachingCenterId: { type: String, index: true },
    academicYearId: { type: String, required: true, index: true },
    studentId: { type: String, required: true, index: true },
    amount: { type: Number, required: true },
    method: { type: String, required: true },
    reference: { type: String },
    paidAt: { type: Date, required: true },
  },
  { timestamps: true }
);

const creditNoteSchema = new Schema(
  {
    _id: { type: String, required: true },
    organizationId: { type: String, required: true, index: true },
    coachingCenterId: { type: String, index: true },
    academicYearId: { type: String, required: true, index: true },
    studentId: { type: String, required: true, index: true },
    amount: { type: Number, required: true },
    reason: { type: String, required: true },
    createdOn: { type: Date, required: true },
  },
  { timestamps: true }
);

feeTypeSchema.index(
  { organizationId: 1, coachingCenterId: 1, name: 1 },
  { unique: true }
);

feePlanSchema.index(
  { organizationId: 1, coachingCenterId: 1, academicYearId: 1, name: 1 },
  { unique: true }
);

feePlanAssignmentSchema.index(
  { organizationId: 1, coachingCenterId: 1, academicYearId: 1, feePlanId: 1, classMasterId: 1, sectionId: 1 },
  { unique: true }
);

studentFeeLedgerSchema.index(
  { organizationId: 1, coachingCenterId: 1, academicYearId: 1, studentId: 1, status: 1, dueDate: 1 }
);

studentFeeLedgerSchema.index(
  { organizationId: 1, coachingCenterId: 1, academicYearId: 1, studentId: 1, feePlanId: 1, feeTypeId: 1, dueDate: 1 },
  { unique: true }
);

paymentSchema.index(
  { organizationId: 1, coachingCenterId: 1, academicYearId: 1, studentId: 1, paidAt: -1 }
);

const getOrCreateModel = <T>(name: string, schema: Schema): Model<T> => {
  if (models[name]) return models[name] as Model<T>;
  return model<T>(name, schema);
};

export const FeeTypeModel = getOrCreateModel<IFeeTypeDocument>('FeeType', feeTypeSchema);
export const FeePlanModel = getOrCreateModel<IFeePlanDocument>('FeePlan', feePlanSchema);
export const FeePlanAssignmentModel = getOrCreateModel<IFeePlanAssignmentDocument>('FeePlanAssignment', feePlanAssignmentSchema);
export const StudentFeeLedgerModel = getOrCreateModel<IStudentFeeLedgerDocument>('StudentFeeLedger', studentFeeLedgerSchema);
export const PaymentModel = getOrCreateModel<IPaymentDocument>('Payment', paymentSchema);
export const CreditNoteModel = getOrCreateModel<ICreditNoteDocument>('CreditNote', creditNoteSchema);
