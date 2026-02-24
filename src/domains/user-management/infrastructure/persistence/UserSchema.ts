/**
 * Mongoose User Schema
 */

import { Schema, model, models, Model } from 'mongoose';
import { UserRole } from '@/domains/user-management/domain/entities/User';

export interface IUserDocument {
  _id: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: UserRole;
  organizationId?: string;
  schoolId?: string;
  isActive: boolean;
  emailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUserDocument>(
  {
    _id: { type: String, required: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    firstName: {
      type: String,
      required: true,
      trim: true,
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      sparse: true,
    },
    role: {
      type: String,
      enum: Object.values(UserRole),
      default: UserRole.STUDENT,
    },
    organizationId: {
      type: String,
      index: true,
    },
    schoolId: {
      type: String,
      index: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    emailVerified: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Create indexes for better query performance
// Note: email index is created automatically by unique: true
userSchema.index({ role: 1 });
userSchema.index({ isActive: 1 });
userSchema.index({ organizationId: 1, schoolId: 1, role: 1 });
userSchema.index({ organizationId: 1, schoolId: 1, createdAt: -1 });
userSchema.index({ organizationId: 1, role: 1 });

// Get or create the User model (handles Next.js hot reload)
const getOrCreateUserModel = (): Model<IUserDocument> => {
  // If model already exists in mongoose.models, return it
  if (models.User) {
    return models.User as Model<IUserDocument>;
  }

  // Otherwise, create and return new model
  return model<IUserDocument>('User', userSchema);
};

export const UserModel: Model<IUserDocument> = getOrCreateUserModel();
