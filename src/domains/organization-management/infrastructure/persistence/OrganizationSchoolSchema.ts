/**
 * MongoDB Schemas for Organization & School
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
      country: { type: String, default: 'USA' },
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

export const getOrCreateOrganizationModel = () => {
  if (models.Organization) return models.Organization;
  return model<IOrganizationDocument>('Organization', organizationSchema);
};

export const OrganizationModel = getOrCreateOrganizationModel();

// School Schema
export interface ISchoolDocument {
  _id: string;
  organizationId: string;
  schoolName: string;
  schoolCode: string;
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
  principalId?: string;
  status: 'active' | 'inactive';
  studentCount: number;
  teacherCount: number;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const schoolSchema = new Schema(
  {
    _id: { type: String, required: true },
    organizationId: { type: String, required: true, index: true },
    schoolName: { type: String, required: true, index: true },
    schoolCode: { type: String, required: true, unique: true, index: true },
    address: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: { type: String, default: 'USA' },
    },
    contactInfo: {
      email: { type: String, required: true },
      phone: { type: String, required: true },
    },
    principalId: { type: String, index: true },
    status: { type: String, enum: ['active', 'inactive'], default: 'active', index: true },
    studentCount: { type: Number, default: 0 },
    teacherCount: { type: Number, default: 0 },
    metadata: Schema.Types.Mixed,
  },
  {
    timestamps: true,
  }
);

export const getOrCreateSchoolModel = () => {
  if (models.School) return models.School;
  return model<ISchoolDocument>('School', schoolSchema);
};

export const SchoolModel = getOrCreateSchoolModel();
