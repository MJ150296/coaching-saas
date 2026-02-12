import { Schema, model, models, Model } from 'mongoose';

export interface IFeeTypeDocument {
  _id: string;
  organizationId: string;
  schoolId: string;
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
  schoolId: string;
  academicYearId: string;
  name: string;
  items: Array<{ feeTypeId: string; name: string; amount: number; frequency: string }>;
  createdAt: Date;
  updatedAt: Date;
}

export interface IFeePlanAssignmentDocument {
  _id: string;
  organizationId: string;
  schoolId: string;
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
  schoolId: string;
  academicYearId: string;
  studentId: string;
  feePlanId?: string;
  feeTypeId?: string;
  amount: number;
  dueDate: Date;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IPaymentDocument {
  _id: string;
  organizationId: string;
  schoolId: string;
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
  schoolId: string;
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
    schoolId: { type: String, required: true, index: true },
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
    schoolId: { type: String, required: true, index: true },
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
    schoolId: { type: String, required: true, index: true },
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
    schoolId: { type: String, required: true, index: true },
    academicYearId: { type: String, required: true, index: true },
    studentId: { type: String, required: true, index: true },
    feePlanId: { type: String },
    feeTypeId: { type: String },
    amount: { type: Number, required: true },
    dueDate: { type: Date, required: true },
    status: { type: String, required: true },
  },
  { timestamps: true }
);

const paymentSchema = new Schema(
  {
    _id: { type: String, required: true },
    organizationId: { type: String, required: true, index: true },
    schoolId: { type: String, required: true, index: true },
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
    schoolId: { type: String, required: true, index: true },
    academicYearId: { type: String, required: true, index: true },
    studentId: { type: String, required: true, index: true },
    amount: { type: Number, required: true },
    reason: { type: String, required: true },
    createdOn: { type: Date, required: true },
  },
  { timestamps: true }
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
