import { connectDB } from '@/shared/infrastructure/database';
import { AcademicYearRepository, ClassMasterRepository, SectionRepository, SubjectAllocationRepository } from '../../domain/repositories';
import { AcademicYear } from '../../domain/entities/AcademicYear';
import { ClassMaster } from '../../domain/entities/ClassMaster';
import { Section } from '../../domain/entities/Section';
import { SubjectAllocation } from '../../domain/entities/SubjectAllocation';
import {
  AcademicYearModel,
  ClassMasterModel,
  SectionModel,
  SubjectAllocationModel,
  IAcademicYearDocument,
  IClassMasterDocument,
  ISectionDocument,
  ISubjectAllocationDocument,
} from './AcademicSchema';

export class MongoAcademicYearRepository implements AcademicYearRepository {
  private async ensureConnection() {
    await connectDB();
  }

  async save(entity: AcademicYear): Promise<void> {
    await this.ensureConnection();
    await AcademicYearModel.findByIdAndUpdate(
      entity.getId(),
      {
        _id: entity.getId(),
        organizationId: entity.getOrganizationId(),
        schoolId: entity.getSchoolId(),
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
      schoolId: doc.schoolId,
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
      schoolId: doc.schoolId,
      name: doc.name,
      startDate: doc.startDate,
      endDate: doc.endDate,
      isActive: doc.isActive,
    }, doc.createdAt, doc.updatedAt));
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

export class MongoClassMasterRepository implements ClassMasterRepository {
  private async ensureConnection() {
    await connectDB();
  }

  async save(entity: ClassMaster): Promise<void> {
    await this.ensureConnection();
    await ClassMasterModel.findByIdAndUpdate(
      entity.getId(),
      {
        _id: entity.getId(),
        organizationId: entity.getOrganizationId(),
        schoolId: entity.getSchoolId(),
        name: entity.getName(),
        level: entity.getLevel(),
      },
      { upsert: true }
    );
  }

  async findById(id: string): Promise<ClassMaster | null> {
    await this.ensureConnection();
    const doc = (await ClassMasterModel.findById(id)) as IClassMasterDocument | null;
    if (!doc) return null;
    return new ClassMaster(doc._id, {
      organizationId: doc.organizationId,
      schoolId: doc.schoolId,
      name: doc.name,
      level: doc.level,
    }, doc.createdAt, doc.updatedAt);
  }

  async findAll(): Promise<ClassMaster[]> {
    await this.ensureConnection();
    const docs = (await ClassMasterModel.find({})) as IClassMasterDocument[];
    return docs.map((doc) => new ClassMaster(doc._id, {
      organizationId: doc.organizationId,
      schoolId: doc.schoolId,
      name: doc.name,
      level: doc.level,
    }, doc.createdAt, doc.updatedAt));
  }

  async delete(id: string): Promise<void> {
    await this.ensureConnection();
    await ClassMasterModel.findByIdAndDelete(id);
  }

  async exists(id: string): Promise<boolean> {
    await this.ensureConnection();
    const count = await ClassMasterModel.countDocuments({ _id: id });
    return count > 0;
  }
}

export class MongoSectionRepository implements SectionRepository {
  private async ensureConnection() {
    await connectDB();
  }

  async save(entity: Section): Promise<void> {
    await this.ensureConnection();
    await SectionModel.findByIdAndUpdate(
      entity.getId(),
      {
        _id: entity.getId(),
        organizationId: entity.getOrganizationId(),
        schoolId: entity.getSchoolId(),
        classMasterId: entity.getClassMasterId(),
        name: entity.getName(),
        capacity: entity.getCapacity(),
        roomNumber: entity.getRoomNumber(),
        shift: entity.getShift(),
        classTeacherId: entity.getClassTeacherId(),
      },
      { upsert: true }
    );
  }

  async findById(id: string): Promise<Section | null> {
    await this.ensureConnection();
    const doc = (await SectionModel.findById(id)) as ISectionDocument | null;
    if (!doc) return null;
    return new Section(doc._id, {
      organizationId: doc.organizationId,
      schoolId: doc.schoolId,
      classMasterId: doc.classMasterId,
      name: doc.name,
      capacity: doc.capacity,
      roomNumber: doc.roomNumber,
      shift: doc.shift,
      classTeacherId: doc.classTeacherId,
    }, doc.createdAt, doc.updatedAt);
  }

  async findAll(): Promise<Section[]> {
    await this.ensureConnection();
    const docs = (await SectionModel.find({})) as ISectionDocument[];
    return docs.map((doc) => new Section(doc._id, {
      organizationId: doc.organizationId,
      schoolId: doc.schoolId,
      classMasterId: doc.classMasterId,
      name: doc.name,
      capacity: doc.capacity,
      roomNumber: doc.roomNumber,
      shift: doc.shift,
      classTeacherId: doc.classTeacherId,
    }, doc.createdAt, doc.updatedAt));
  }

  async delete(id: string): Promise<void> {
    await this.ensureConnection();
    await SectionModel.findByIdAndDelete(id);
  }

  async exists(id: string): Promise<boolean> {
    await this.ensureConnection();
    const count = await SectionModel.countDocuments({ _id: id });
    return count > 0;
  }
}

export class MongoSubjectAllocationRepository implements SubjectAllocationRepository {
  private async ensureConnection() {
    await connectDB();
  }

  async save(entity: SubjectAllocation): Promise<void> {
    await this.ensureConnection();
    await SubjectAllocationModel.findByIdAndUpdate(
      entity.getId(),
      {
        _id: entity.getId(),
        organizationId: entity.getOrganizationId(),
        schoolId: entity.getSchoolId(),
        academicYearId: entity.getAcademicYearId(),
        classMasterId: entity.getClassMasterId(),
        sectionId: entity.getSectionId(),
        subjectName: entity.getSubjectName(),
        teacherId: entity.getTeacherId(),
        weeklyPeriods: entity.getWeeklyPeriods(),
      },
      { upsert: true }
    );
  }

  async findById(id: string): Promise<SubjectAllocation | null> {
    await this.ensureConnection();
    const doc = (await SubjectAllocationModel.findById(id)) as ISubjectAllocationDocument | null;
    if (!doc) return null;
    return new SubjectAllocation(doc._id, {
      organizationId: doc.organizationId,
      schoolId: doc.schoolId,
      academicYearId: doc.academicYearId,
      classMasterId: doc.classMasterId,
      sectionId: doc.sectionId,
      subjectName: doc.subjectName,
      teacherId: doc.teacherId,
      weeklyPeriods: doc.weeklyPeriods,
    }, doc.createdAt, doc.updatedAt);
  }

  async findAll(): Promise<SubjectAllocation[]> {
    await this.ensureConnection();
    const docs = (await SubjectAllocationModel.find({})) as ISubjectAllocationDocument[];
    return docs.map((doc) => new SubjectAllocation(doc._id, {
      organizationId: doc.organizationId,
      schoolId: doc.schoolId,
      academicYearId: doc.academicYearId,
      classMasterId: doc.classMasterId,
      sectionId: doc.sectionId,
      subjectName: doc.subjectName,
      teacherId: doc.teacherId,
      weeklyPeriods: doc.weeklyPeriods,
    }, doc.createdAt, doc.updatedAt));
  }

  async delete(id: string): Promise<void> {
    await this.ensureConnection();
    await SubjectAllocationModel.findByIdAndDelete(id);
  }

  async exists(id: string): Promise<boolean> {
    await this.ensureConnection();
    const count = await SubjectAllocationModel.countDocuments({ _id: id });
    return count > 0;
  }
}
