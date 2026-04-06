import { connectDB } from '@/shared/infrastructure/database';
import { AcademicYearRepository } from '../../domain/repositories';
import { AcademicYear } from '../../domain/entities/AcademicYear';
import {
  AcademicYearModel,
  IAcademicYearDocument,
} from './AcademicSchema';

export class MongoAcademicYearRepository implements AcademicYearRepository {
  private async ensureConnection() {
    await connectDB();
  }

  async existsByScopeAndPeriod(input: {
    organizationId: string;
    coachingCenterId: string;
    name: string;
    startDate: Date;
    endDate: Date;
    excludeId?: string;
  }): Promise<boolean> {
    await this.ensureConnection();

    const duplicate = await AcademicYearModel.findOne({
      organizationId: input.organizationId,
      coachingCenterId: input.coachingCenterId,
      name: input.name.trim(),
      startDate: input.startDate,
      endDate: input.endDate,
      ...(input.excludeId ? { _id: { $ne: input.excludeId } } : {}),
    });

    return Boolean(duplicate);
  }

  async save(entity: AcademicYear): Promise<void> {
    await this.ensureConnection();
    await AcademicYearModel.findByIdAndUpdate(
      entity.getId(),
      {
        _id: entity.getId(),
        organizationId: entity.getOrganizationId(),
        coachingCenterId: entity.getCoachingCenterId(),
        name: entity.getName(),
        startDate: entity.getStartDate(),
        endDate: entity.getEndDate(),
        isActive: entity.isActiveYear(),
      },
      { upsert: true }
    );
  }

  async findById(id: string): Promise<AcademicYear | null> {
    await this.ensureConnection();
    const doc = (await AcademicYearModel.findById(id)) as IAcademicYearDocument | null;
    if (!doc) return null;
    return new AcademicYear(doc._id, {
      organizationId: doc.organizationId,
      coachingCenterId: doc.coachingCenterId,
      name: doc.name,
      startDate: doc.startDate,
      endDate: doc.endDate,
      isActive: doc.isActive,
    }, doc.createdAt, doc.updatedAt);
  }

  async findAll(): Promise<AcademicYear[]> {
    await this.ensureConnection();
    const docs = (await AcademicYearModel.find({})) as IAcademicYearDocument[];
    return docs.map((doc) => new AcademicYear(doc._id, {
      organizationId: doc.organizationId,
      coachingCenterId: doc.coachingCenterId,
      name: doc.name,
      startDate: doc.startDate,
      endDate: doc.endDate,
      isActive: doc.isActive,
    }, doc.createdAt, doc.updatedAt));
  }

  async findByFilters(filters: {
    organizationId?: string;
    coachingCenterId?: string;
    limit?: number;
    offset?: number;
  }): Promise<AcademicYear[]> {
    await this.ensureConnection();
    const query: {
      organizationId?: string;
      coachingCenterId?: string;
    } = {};

    if (filters.organizationId) query.organizationId = filters.organizationId;
    if (filters.coachingCenterId) query.coachingCenterId = filters.coachingCenterId;

    let dbQuery = AcademicYearModel.find(query);
    if (typeof filters.offset === 'number' && filters.offset > 0) {
      dbQuery = dbQuery.skip(filters.offset);
    }
    if (typeof filters.limit === 'number' && filters.limit > 0) {
      dbQuery = dbQuery.limit(filters.limit);
    }

    const docs = (await dbQuery) as IAcademicYearDocument[];
    return docs.map((doc) => new AcademicYear(doc._id, {
      organizationId: doc.organizationId,
      coachingCenterId: doc.coachingCenterId,
      name: doc.name,
      startDate: doc.startDate,
      endDate: doc.endDate,
      isActive: doc.isActive,
    }, doc.createdAt, doc.updatedAt));
  }

  async countByFilters(filters: {
    organizationId?: string;
    coachingCenterId?: string;
  }): Promise<number> {
    await this.ensureConnection();
    const query: {
      organizationId?: string;
      coachingCenterId?: string;
    } = {};
    if (filters.organizationId) query.organizationId = filters.organizationId;
    if (filters.coachingCenterId) query.coachingCenterId = filters.coachingCenterId;
    return AcademicYearModel.countDocuments(query);
  }

  async delete(id: string): Promise<void> {
    await this.ensureConnection();
    await AcademicYearModel.findByIdAndDelete(id);
  }

  async exists(id: string): Promise<boolean> {
    await this.ensureConnection();
    const count = await AcademicYearModel.countDocuments({ _id: id });
    return count > 0;
  }
}
