import { connectDB } from '@/shared/infrastructure/database';
import { FeeTypeRepository, FeePlanRepository, FeePlanAssignmentRepository, StudentFeeLedgerRepository, PaymentRepository, CreditNoteRepository } from '../../domain/repositories';
import { FeeType } from '../../domain/entities/FeeType';
import { FeePlan } from '../../domain/entities/FeePlan';
import { FeePlanAssignment } from '../../domain/entities/FeePlanAssignment';
import { StudentFeeLedgerEntry } from '../../domain/entities/StudentFeeLedgerEntry';
import { Payment } from '../../domain/entities/Payment';
import { CreditNote } from '../../domain/entities/CreditNote';
import type { FeeFrequency } from '../../domain/entities/FeeType';
import type { FeePlanItem } from '../../domain/entities/FeePlan';
import type { DiscountMode, DiscountType, LedgerStatus } from '../../domain/entities/StudentFeeLedgerEntry';
import type { PaymentMethod } from '../../domain/entities/Payment';
import {
  FeeTypeModel,
  FeePlanModel,
  FeePlanAssignmentModel,
  StudentFeeLedgerModel,
  PaymentModel,
  CreditNoteModel,
  IFeeTypeDocument,
  IFeePlanDocument,
  IFeePlanAssignmentDocument,
  IStudentFeeLedgerDocument,
  IPaymentDocument,
  ICreditNoteDocument,
} from './FeeSchema';

export class MongoFeeTypeRepository implements FeeTypeRepository {
  private async ensureConnection() {
    await connectDB();
  }

  async save(entity: FeeType): Promise<void> {
    await this.ensureConnection();
    await FeeTypeModel.findByIdAndUpdate(
      entity.getId(),
      {
        _id: entity.getId(),
        organizationId: entity.getOrganizationId(),
        coachingCenterId: entity.getCoachingCenterId(),
        name: entity.getName(),
        amount: entity.getAmount(),
        frequency: entity.getFrequency(),
        isMandatory: entity.isMandatoryFee(),
        isTaxable: entity.isTaxableFee(),
      },
      { upsert: true }
    );
  }

  async findById(id: string): Promise<FeeType | null> {
    await this.ensureConnection();
    const doc = (await FeeTypeModel.findById(id)) as IFeeTypeDocument | null;
    if (!doc) return null;
    return new FeeType(doc._id, {
      organizationId: doc.organizationId,
      coachingCenterId: doc.coachingCenterId,
      name: doc.name,
      amount: doc.amount,
      frequency: doc.frequency as FeeFrequency,
      isMandatory: doc.isMandatory,
      isTaxable: doc.isTaxable,
    }, doc.createdAt, doc.updatedAt);
  }

  async findAll(): Promise<FeeType[]> {
    await this.ensureConnection();
    const docs = (await FeeTypeModel.find({})) as IFeeTypeDocument[];
    return docs.map((doc) => new FeeType(doc._id, {
      organizationId: doc.organizationId,
      coachingCenterId: doc.coachingCenterId,
      name: doc.name,
      amount: doc.amount,
      frequency: doc.frequency as FeeFrequency,
      isMandatory: doc.isMandatory,
      isTaxable: doc.isTaxable,
    }, doc.createdAt, doc.updatedAt));
  }

  async findByTenant(
    organizationId?: string,
    coachingCenterId?: string,
    options?: { limit?: number; offset?: number }
  ): Promise<FeeType[]> {
    await this.ensureConnection();
    const query: { organizationId?: string; coachingCenterId?: string } = {};
    if (organizationId) query.organizationId = organizationId;
    if (coachingCenterId) query.coachingCenterId = coachingCenterId;
    let dbQuery = FeeTypeModel.find(query);
    if (typeof options?.offset === 'number' && options.offset > 0) {
      dbQuery = dbQuery.skip(options.offset);
    }
    if (typeof options?.limit === 'number' && options.limit > 0) {
      dbQuery = dbQuery.limit(options.limit);
    }
    const docs = (await dbQuery) as IFeeTypeDocument[];
    return docs.map((doc) => new FeeType(doc._id, {
      organizationId: doc.organizationId,
      coachingCenterId: doc.coachingCenterId,
      name: doc.name,
      amount: doc.amount,
      frequency: doc.frequency as FeeFrequency,
      isMandatory: doc.isMandatory,
      isTaxable: doc.isTaxable,
    }, doc.createdAt, doc.updatedAt));
  }

  async countByTenant(organizationId?: string, coachingCenterId?: string): Promise<number> {
    await this.ensureConnection();
    const query: { organizationId?: string; coachingCenterId?: string } = {};
    if (organizationId) query.organizationId = organizationId;
    if (coachingCenterId) query.coachingCenterId = coachingCenterId;
    return FeeTypeModel.countDocuments(query);
  }

  async delete(id: string): Promise<void> {
    await this.ensureConnection();
    await FeeTypeModel.findByIdAndDelete(id);
  }

  async exists(id: string): Promise<boolean> {
    await this.ensureConnection();
    const count = await FeeTypeModel.countDocuments({ _id: id });
    return count > 0;
  }
}

export class MongoFeePlanRepository implements FeePlanRepository {
  private async ensureConnection() {
    await connectDB();
  }

  async save(entity: FeePlan): Promise<void> {
    await this.ensureConnection();
    await FeePlanModel.findByIdAndUpdate(
      entity.getId(),
      {
        _id: entity.getId(),
        organizationId: entity.getOrganizationId(),
        coachingCenterId: entity.getCoachingCenterId(),
        academicYearId: entity.getAcademicYearId(),
        name: entity.getName(),
        items: entity.getItems(),
      },
      { upsert: true }
    );
  }

  async findById(id: string): Promise<FeePlan | null> {
    await this.ensureConnection();
    const doc = (await FeePlanModel.findById(id)) as IFeePlanDocument | null;
    if (!doc) return null;
    return new FeePlan(doc._id, {
      organizationId: doc.organizationId,
      coachingCenterId: doc.coachingCenterId,
      academicYearId: doc.academicYearId,
      name: doc.name,
      items: doc.items as FeePlanItem[],
    }, doc.createdAt, doc.updatedAt);
  }

  async findAll(): Promise<FeePlan[]> {
    await this.ensureConnection();
    const docs = (await FeePlanModel.find({})) as IFeePlanDocument[];
    return docs.map((doc) => new FeePlan(doc._id, {
      organizationId: doc.organizationId,
      coachingCenterId: doc.coachingCenterId,
      academicYearId: doc.academicYearId,
      name: doc.name,
      items: doc.items as FeePlanItem[],
    }, doc.createdAt, doc.updatedAt));
  }

  async findByTenant(
    organizationId?: string,
    coachingCenterId?: string,
    options?: { academicYearId?: string; limit?: number; offset?: number }
  ): Promise<FeePlan[]> {
    await this.ensureConnection();
    const query: { organizationId?: string; coachingCenterId?: string; academicYearId?: string } = {};
    if (organizationId) query.organizationId = organizationId;
    if (coachingCenterId) query.coachingCenterId = coachingCenterId;
    if (options?.academicYearId) query.academicYearId = options.academicYearId;

    let dbQuery = FeePlanModel.find(query);
    if (typeof options?.offset === 'number' && options.offset > 0) {
      dbQuery = dbQuery.skip(options.offset);
    }
    if (typeof options?.limit === 'number' && options.limit > 0) {
      dbQuery = dbQuery.limit(options.limit);
    }
    const docs = (await dbQuery) as IFeePlanDocument[];
    return docs.map((doc) => new FeePlan(doc._id, {
      organizationId: doc.organizationId,
      coachingCenterId: doc.coachingCenterId,
      academicYearId: doc.academicYearId,
      name: doc.name,
      items: doc.items as FeePlanItem[],
    }, doc.createdAt, doc.updatedAt));
  }

  async countByTenant(
    organizationId?: string,
    coachingCenterId?: string,
    options?: { academicYearId?: string }
  ): Promise<number> {
    await this.ensureConnection();
    const query: { organizationId?: string; coachingCenterId?: string; academicYearId?: string } = {};
    if (organizationId) query.organizationId = organizationId;
    if (coachingCenterId) query.coachingCenterId = coachingCenterId;
    if (options?.academicYearId) query.academicYearId = options.academicYearId;
    return FeePlanModel.countDocuments(query);
  }

  async delete(id: string): Promise<void> {
    await this.ensureConnection();
    await FeePlanModel.findByIdAndDelete(id);
  }

  async exists(id: string): Promise<boolean> {
    await this.ensureConnection();
    const count = await FeePlanModel.countDocuments({ _id: id });
    return count > 0;
  }
}

export class MongoFeePlanAssignmentRepository implements FeePlanAssignmentRepository {
  private async ensureConnection() {
    await connectDB();
  }

  async save(entity: FeePlanAssignment): Promise<void> {
    await this.ensureConnection();
    await FeePlanAssignmentModel.findByIdAndUpdate(
      entity.getId(),
      {
        _id: entity.getId(),
        organizationId: entity.getOrganizationId(),
        coachingCenterId: entity.getCoachingCenterId(),
        academicYearId: entity.getAcademicYearId(),
        feePlanId: entity.getFeePlanId(),
        classMasterId: entity.getClassMasterId(),
        sectionId: entity.getSectionId(),
      },
      { upsert: true }
    );
  }

  async findById(id: string): Promise<FeePlanAssignment | null> {
    await this.ensureConnection();
    const doc = (await FeePlanAssignmentModel.findById(id)) as IFeePlanAssignmentDocument | null;
    if (!doc) return null;
    return new FeePlanAssignment(doc._id, {
      organizationId: doc.organizationId,
      coachingCenterId: doc.coachingCenterId,
      academicYearId: doc.academicYearId,
      feePlanId: doc.feePlanId,
      classMasterId: doc.classMasterId,
      sectionId: doc.sectionId,
    }, doc.createdAt, doc.updatedAt);
  }

  async findAll(): Promise<FeePlanAssignment[]> {
    await this.ensureConnection();
    const docs = (await FeePlanAssignmentModel.find({})) as IFeePlanAssignmentDocument[];
    return docs.map((doc) => new FeePlanAssignment(doc._id, {
      organizationId: doc.organizationId,
      coachingCenterId: doc.coachingCenterId,
      academicYearId: doc.academicYearId,
      feePlanId: doc.feePlanId,
      classMasterId: doc.classMasterId,
      sectionId: doc.sectionId,
    }, doc.createdAt, doc.updatedAt));
  }

  async delete(id: string): Promise<void> {
    await this.ensureConnection();
    await FeePlanAssignmentModel.findByIdAndDelete(id);
  }

  async exists(id: string): Promise<boolean> {
    await this.ensureConnection();
    const count = await FeePlanAssignmentModel.countDocuments({ _id: id });
    return count > 0;
  }
}

export class MongoStudentFeeLedgerRepository implements StudentFeeLedgerRepository {
  private async ensureConnection() {
    await connectDB();
  }

  async save(entity: StudentFeeLedgerEntry): Promise<void> {
    await this.ensureConnection();
    await StudentFeeLedgerModel.findByIdAndUpdate(
      entity.getId(),
      {
        _id: entity.getId(),
        organizationId: entity.getOrganizationId(),
        coachingCenterId: entity.getCoachingCenterId(),
        academicYearId: entity.getAcademicYearId(),
        studentId: entity.getStudentId(),
        feePlanId: entity.getFeePlanId(),
        feeTypeId: entity.getFeeTypeId(),
        originalAmount: entity.getOriginalAmount(),
        amount: entity.getAmount(),
        discount: entity.getDiscount(),
        dueDate: entity.getDueDate(),
        status: entity.getStatus(),
      },
      { upsert: true }
    );
  }

  async findById(id: string): Promise<StudentFeeLedgerEntry | null> {
    await this.ensureConnection();
    const doc = (await StudentFeeLedgerModel.findById(id)) as IStudentFeeLedgerDocument | null;
    if (!doc) return null;
    return new StudentFeeLedgerEntry(doc._id, {
      organizationId: doc.organizationId,
      coachingCenterId: doc.coachingCenterId,
      academicYearId: doc.academicYearId,
      studentId: doc.studentId,
      feePlanId: doc.feePlanId,
      feeTypeId: doc.feeTypeId,
      originalAmount: doc.originalAmount ?? doc.amount,
      amount: doc.amount,
      discount: doc.discount
        ? {
            type: doc.discount.type as DiscountType,
            mode: doc.discount.mode as DiscountMode,
            value: Number(doc.discount.value),
            amount: Number(doc.discount.amount),
            reason: doc.discount.reason,
          }
        : undefined,
      dueDate: doc.dueDate,
      status: doc.status as LedgerStatus,
    }, doc.createdAt, doc.updatedAt);
  }

  async findAll(): Promise<StudentFeeLedgerEntry[]> {
    await this.ensureConnection();
    const docs = (await StudentFeeLedgerModel.find({})) as IStudentFeeLedgerDocument[];
    return docs.map((doc) => new StudentFeeLedgerEntry(doc._id, {
      organizationId: doc.organizationId,
      coachingCenterId: doc.coachingCenterId,
      academicYearId: doc.academicYearId,
      studentId: doc.studentId,
      feePlanId: doc.feePlanId,
      feeTypeId: doc.feeTypeId,
      originalAmount: doc.originalAmount ?? doc.amount,
      amount: doc.amount,
      discount: doc.discount
        ? {
            type: doc.discount.type as DiscountType,
            mode: doc.discount.mode as DiscountMode,
            value: Number(doc.discount.value),
            amount: Number(doc.discount.amount),
            reason: doc.discount.reason,
          }
        : undefined,
      dueDate: doc.dueDate,
      status: doc.status as LedgerStatus,
    }, doc.createdAt, doc.updatedAt));
  }

  async delete(id: string): Promise<void> {
    await this.ensureConnection();
    await StudentFeeLedgerModel.findByIdAndDelete(id);
  }

  async exists(id: string): Promise<boolean> {
    await this.ensureConnection();
    const count = await StudentFeeLedgerModel.countDocuments({ _id: id });
    return count > 0;
  }
}

export class MongoPaymentRepository implements PaymentRepository {
  private async ensureConnection() {
    await connectDB();
  }

  async save(entity: Payment): Promise<void> {
    await this.ensureConnection();
    await PaymentModel.findByIdAndUpdate(
      entity.getId(),
      {
        _id: entity.getId(),
        organizationId: entity.getOrganizationId(),
        coachingCenterId: entity.getCoachingCenterId(),
        academicYearId: entity.getAcademicYearId(),
        studentId: entity.getStudentId(),
        amount: entity.getAmount(),
        method: entity.getMethod(),
        reference: entity.getReference(),
        paidAt: entity.getPaidAt(),
      },
      { upsert: true }
    );
  }

  async findById(id: string): Promise<Payment | null> {
    await this.ensureConnection();
    const doc = (await PaymentModel.findById(id)) as IPaymentDocument | null;
    if (!doc) return null;
    return new Payment(doc._id, {
      organizationId: doc.organizationId,
      coachingCenterId: doc.coachingCenterId,
      academicYearId: doc.academicYearId,
      studentId: doc.studentId,
      amount: doc.amount,
      method: doc.method as PaymentMethod,
      reference: doc.reference,
      paidAt: doc.paidAt,
    }, doc.createdAt, doc.updatedAt);
  }

  async findAll(): Promise<Payment[]> {
    await this.ensureConnection();
    const docs = (await PaymentModel.find({})) as IPaymentDocument[];
    return docs.map((doc) => new Payment(doc._id, {
      organizationId: doc.organizationId,
      coachingCenterId: doc.coachingCenterId,
      academicYearId: doc.academicYearId,
      studentId: doc.studentId,
      amount: doc.amount,
      method: doc.method as PaymentMethod,
      reference: doc.reference,
      paidAt: doc.paidAt,
    }, doc.createdAt, doc.updatedAt));
  }

  async delete(id: string): Promise<void> {
    await this.ensureConnection();
    await PaymentModel.findByIdAndDelete(id);
  }

  async exists(id: string): Promise<boolean> {
    await this.ensureConnection();
    const count = await PaymentModel.countDocuments({ _id: id });
    return count > 0;
  }
}

export class MongoCreditNoteRepository implements CreditNoteRepository {
  private async ensureConnection() {
    await connectDB();
  }

  async save(entity: CreditNote): Promise<void> {
    await this.ensureConnection();
    await CreditNoteModel.findByIdAndUpdate(
      entity.getId(),
      {
        _id: entity.getId(),
        organizationId: entity.getOrganizationId(),
        coachingCenterId: entity.getCoachingCenterId(),
        academicYearId: entity.getAcademicYearId(),
        studentId: entity.getStudentId(),
        amount: entity.getAmount(),
        reason: entity.getReason(),
        createdOn: entity.getCreatedOn(),
      },
      { upsert: true }
    );
  }

  async findById(id: string): Promise<CreditNote | null> {
    await this.ensureConnection();
    const doc = (await CreditNoteModel.findById(id)) as ICreditNoteDocument | null;
    if (!doc) return null;
    return new CreditNote(doc._id, {
      organizationId: doc.organizationId,
      coachingCenterId: doc.coachingCenterId,
      academicYearId: doc.academicYearId,
      studentId: doc.studentId,
      amount: doc.amount,
      reason: doc.reason,
      createdOn: doc.createdOn,
    }, doc.createdAt, doc.updatedAt);
  }

  async findAll(): Promise<CreditNote[]> {
    await this.ensureConnection();
    const docs = (await CreditNoteModel.find({})) as ICreditNoteDocument[];
    return docs.map((doc) => new CreditNote(doc._id, {
      organizationId: doc.organizationId,
      coachingCenterId: doc.coachingCenterId,
      academicYearId: doc.academicYearId,
      studentId: doc.studentId,
      amount: doc.amount,
      reason: doc.reason,
      createdOn: doc.createdOn,
    }, doc.createdAt, doc.updatedAt));
  }

  async delete(id: string): Promise<void> {
    await this.ensureConnection();
    await CreditNoteModel.findByIdAndDelete(id);
  }

  async exists(id: string): Promise<boolean> {
    await this.ensureConnection();
    const count = await CreditNoteModel.countDocuments({ _id: id });
    return count > 0;
  }
}
