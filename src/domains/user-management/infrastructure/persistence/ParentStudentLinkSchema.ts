import { Schema, model, models, Model } from 'mongoose';

export interface IParentStudentLinkDocument {
  _id: string;
  parentId: string;
  studentId: string;
  organizationId?: string;
  coachingCenterId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const parentStudentLinkSchema = new Schema<IParentStudentLinkDocument>(
  {
    _id: { type: String, required: true },
    parentId: { type: String, required: true, index: true },
    studentId: { type: String, required: true, index: true },
    organizationId: { type: String, index: true },
    coachingCenterId: { type: String, index: true },
  },
  { timestamps: true }
);

const getOrCreateParentStudentLinkModel = (): Model<IParentStudentLinkDocument> => {
  if (models.ParentStudentLink) {
    return models.ParentStudentLink as Model<IParentStudentLinkDocument>;
  }
  return model<IParentStudentLinkDocument>('ParentStudentLink', parentStudentLinkSchema);
};

export const ParentStudentLinkModel: Model<IParentStudentLinkDocument> = getOrCreateParentStudentLinkModel();
