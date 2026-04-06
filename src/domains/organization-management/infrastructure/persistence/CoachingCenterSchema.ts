/**
 * MongoDB Schemas for Organization & Coaching Center
 */

import { Schema, model, models } from 'mongoose';

// Organization Schema
export interface IOrganizationDocument {
  _id: string;
  organizationName: string;
  type: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country?: string;
  };
  contactInfo: {
    email: string;
    phone: string;
  };
  status: 'active' | 'inactive';
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const organizationSchema = new Schema(
  {
    _id: { type: String, required: true },
    organizationName: { type: String, required: true, index: true },
    type: { type: String, required: true, index: true },
    address: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: { type: String, default: 'INDIA' },
    },
    contactInfo: {
      email: { type: String, required: true },
      phone: { type: String, required: true },
    },
    status: { type: String, enum: ['active', 'inactive'], default: 'active', index: true },
    metadata: Schema.Types.Mixed,
  },
  {
    timestamps: true,
  }
);

organizationSchema.index({ status: 1, createdAt: -1 });

export const getOrCreateOrganizationModel = () => {
  if (models.Organization) return models.Organization;
  return model<IOrganizationDocument>('Organization', organizationSchema);
};

export const OrganizationModel = getOrCreateOrganizationModel();

// Coaching Center Schema
export interface ICoachingCenterDocument {
  _id: string;
  organizationId: string;
  coachingCenterName: string;
  coachingCenterCode: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country?: string;
  };
  contactInfo: {
    email: string;
    phone: string;
  };
  ownerId?: string;
  status: 'active' | 'inactive';
  studentCount: number;
  teacherCount: number;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const coachingCenterSchema = new Schema(
  {
    _id: { type: String, required: true },
    organizationId: { type: String, required: true, index: true },
    coachingCenterName: { type: String, required: true, index: true },
    coachingCenterCode: { type: String, required: true, unique: true, index: true },
    address: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: { type: String, default: 'INDIA' },
    },
    contactInfo: {
      email: { type: String, required: true },
      phone: { type: String, required: true },
    },
    ownerId: { type: String, index: true },
    status: { type: String, enum: ['active', 'inactive'], default: 'active', index: true },
    studentCount: { type: Number, default: 0 },
    teacherCount: { type: Number, default: 0 },
    metadata: Schema.Types.Mixed,
  },
  {
    timestamps: true,
  }
);

coachingCenterSchema.index({ organizationId: 1, status: 1 });
coachingCenterSchema.index({ organizationId: 1, createdAt: -1 });

export const getOrCreateCoachingCenterModel = () => {
  if (models.CoachingCenter) return models.CoachingCenter;
  return model<ICoachingCenterDocument>('CoachingCenter', coachingCenterSchema);
};

export const CoachingCenterModel = getOrCreateCoachingCenterModel();