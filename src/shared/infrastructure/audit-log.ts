import { Schema, model, models, Model } from 'mongoose';
import { connectDB } from '@/shared/infrastructure/database';
import { UserRole } from '@/domains/user-management/domain/entities/User';

export interface AuditLogEvent {
  actorId: string;
  actorRole: UserRole;
  action: string;
  targetId?: string;
  targetRole?: UserRole;
  organizationId?: string;
  coachingCenterId?: string;
  coachingCenterId?: string;
  ip?: string;
  metadata?: Record<string, unknown>;
}

export interface IAuditLogDocument extends AuditLogEvent {
  _id: string;
  createdAt: Date;
  updatedAt: Date;
}

const auditLogSchema = new Schema<IAuditLogDocument>(
  {
    _id: { type: String, required: true },
    actorId: { type: String, required: true },
    actorRole: { type: String, required: true },
    action: { type: String, required: true },
    targetId: { type: String },
    targetRole: { type: String },
    organizationId: { type: String },
    coachingCenterId: { type: String },
    coachingCenterId: { type: String },
    ip: { type: String },
    metadata: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

auditLogSchema.index({ actorId: 1, action: 1, createdAt: -1 });

auditLogSchema.index({ organizationId: 1, coachingCenterId: 1, createdAt: -1 });
auditLogSchema.index({ organizationId: 1, coachingCenterId: 1, createdAt: -1 });

const getOrCreateAuditLogModel = (): Model<IAuditLogDocument> => {
  if (models.AuditLog) return models.AuditLog as Model<IAuditLogDocument>;
  return model<IAuditLogDocument>('AuditLog', auditLogSchema);
};

export const AuditLogModel: Model<IAuditLogDocument> = getOrCreateAuditLogModel();

export async function logAuditEvent(event: AuditLogEvent): Promise<void> {
  await connectDB();
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  await AuditLogModel.create({ _id: id, ...event });
}
