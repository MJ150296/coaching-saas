/**
 * MongoDB Repository Implementations for Organization & Coaching Center
 */

import { OrganizationRepository, CoachingCenterRepository } from '../../domain/repositories';
import { Organization } from '../../domain/entities/Organization';
import { CoachingCenter } from '../../domain/entities/CoachingCenter';
import {
  OrganizationName,
  Address,
  ContactInfo,
  CoachingCenterName,
  CoachingCenterCode,
} from '../../domain/value-objects';
import {
  OrganizationModel,
  IOrganizationDocument,
  CoachingCenterModel,
  ICoachingCenterDocument,
} from './OrganizationSchoolSchema';
import { connectDB } from '@/shared/infrastructure/database';

export class MongoOrganizationRepository implements OrganizationRepository {
  private async ensureConnection() {
    await connectDB();
  }

  async save(organization: Organization): Promise<void> {
    await this.ensureConnection();

    const data = {
      _id: organization.getId(),
      organizationName: organization.getOrganizationName().getValue(),
      type: organization.getType(),
      address: {
        street: organization.getAddress().getStreet(),
        city: organization.getAddress().getCity(),
        state: organization.getAddress().getState(),
        zipCode: organization.getAddress().getZipCode(),
        country: organization.getAddress().getCountry(),
      },
      contactInfo: {
        email: organization.getContactInfo().getEmail(),
        phone: organization.getContactInfo().getPhone(),
      },
      status: organization.getStatus(),
      metadata: organization.getMetadata(),
      createdAt: organization.getCreatedAt(),
      updatedAt: organization.getUpdatedAt(),
    };

    await OrganizationModel.findByIdAndUpdate(organization.getId(), data, {
      upsert: true,
    });
  }

  async findById(id: string): Promise<Organization | null> {
    await this.ensureConnection();
    const doc = (await OrganizationModel.findById(id)) as IOrganizationDocument | null;
    if (!doc) return null;
    return this.toDomainEntity(doc);
  }

  async findByName(name: string): Promise<Organization | null> {
    await this.ensureConnection();
    const doc = (await OrganizationModel.findOne({ organizationName: name })) as IOrganizationDocument | null;
    if (!doc) return null;
    return this.toDomainEntity(doc);
  }

  async findByType(type: string): Promise<Organization[]> {
    await this.ensureConnection();
    const docs = (await OrganizationModel.find({ type })) as IOrganizationDocument[];
    return docs.map((doc) => this.toDomainEntity(doc));
  }

  async findActive(): Promise<Organization[]> {
    await this.ensureConnection();
    const docs = (await OrganizationModel.find({ status: 'active' })) as IOrganizationDocument[];
    return docs.map((doc) => this.toDomainEntity(doc));
  }

  async findAll(): Promise<Organization[]> {
    await this.ensureConnection();
    const docs = (await OrganizationModel.find({})) as IOrganizationDocument[];
    return docs.map((doc) => this.toDomainEntity(doc));
  }

  async delete(id: string): Promise<void> {
    await this.ensureConnection();
    await OrganizationModel.findByIdAndDelete(id);
  }

  async exists(id: string): Promise<boolean> {
    await this.ensureConnection();
    const count = await OrganizationModel.countDocuments({ _id: id });
    return count > 0;
  }

  private toDomainEntity(doc: IOrganizationDocument): Organization {
    const organizationName = OrganizationName.create(doc.organizationName);
    const address = Address.create({
      street: doc.address.street,
      city: doc.address.city,
      state: doc.address.state,
      zipCode: doc.address.zipCode,
      country: doc.address.country,
    });
    const contactInfo = ContactInfo.create({
      email: doc.contactInfo.email,
      phone: doc.contactInfo.phone,
    });

    return new Organization(
      doc._id,
      {
        organizationName,
        type: doc.type,
        address,
        contactInfo,
        status: doc.status,
        metadata: doc.metadata,
      },
      doc.createdAt,
      doc.updatedAt
    );
  }
}

export class MongoCoachingCenterRepository implements CoachingCenterRepository {
  private async ensureConnection() {
    await connectDB();
  }

  async save(center: CoachingCenter): Promise<void> {
    await this.ensureConnection();

    const data = {
      _id: center.getId(),
      organizationId: center.getOrganizationId(),
      coachingCenterName: center.getCoachingCenterName().getValue(),
      coachingCenterCode: center.getCoachingCenterCode().getValue(),
      address: {
        street: center.getAddress().getStreet(),
        city: center.getAddress().getCity(),
        state: center.getAddress().getState(),
        zipCode: center.getAddress().getZipCode(),
        country: center.getAddress().getCountry(),
      },
      contactInfo: {
        email: center.getContactInfo().getEmail(),
        phone: center.getContactInfo().getPhone(),
      },
      principalId: center.getPrincipalId(),
      status: center.getStatus(),
      studentCount: center.getStudentCount(),
      teacherCount: center.getTeacherCount(),
      metadata: center.getMetadata(),
      createdAt: center.getCreatedAt(),
      updatedAt: center.getUpdatedAt(),
    };

    await CoachingCenterModel.findByIdAndUpdate(center.getId(), data, { upsert: true });
  }

  async findById(id: string): Promise<CoachingCenter | null> {
    await this.ensureConnection();
    const doc = (await CoachingCenterModel.findById(id)) as ICoachingCenterDocument | null;
    if (!doc) return null;
    return this.toDomainEntity(doc);
  }

  async findByOrganizationId(organizationId: string): Promise<CoachingCenter[]> {
    await this.ensureConnection();
    const docs = (await CoachingCenterModel.find({ organizationId })) as ICoachingCenterDocument[];
    return docs.map((doc) => this.toDomainEntity(doc));
  }

  async findByCode(code: string): Promise<CoachingCenter | null> {
    await this.ensureConnection();
    const doc = (await CoachingCenterModel.findOne({
      coachingCenterCode: code.toUpperCase(),
    })) as ICoachingCenterDocument | null;
    if (!doc) return null;
    return this.toDomainEntity(doc);
  }

  async findActive(): Promise<CoachingCenter[]> {
    await this.ensureConnection();
    const docs = (await CoachingCenterModel.find({ status: 'active' })) as ICoachingCenterDocument[];
    return docs.map((doc) => this.toDomainEntity(doc));
  }

  async findByOrganizationIdAndActive(organizationId: string): Promise<CoachingCenter[]> {
    await this.ensureConnection();
    const docs = (await CoachingCenterModel.find({
      organizationId,
      status: 'active',
    })) as ICoachingCenterDocument[];
    return docs.map((doc) => this.toDomainEntity(doc));
  }

  async findAll(): Promise<CoachingCenter[]> {
    await this.ensureConnection();
    const docs = (await CoachingCenterModel.find({})) as ICoachingCenterDocument[];
    return docs.map((doc) => this.toDomainEntity(doc));
  }

  async delete(id: string): Promise<void> {
    await this.ensureConnection();
    await CoachingCenterModel.findByIdAndDelete(id);
  }

  async exists(id: string): Promise<boolean> {
    await this.ensureConnection();
    const count = await CoachingCenterModel.countDocuments({ _id: id });
    return count > 0;
  }

  private toDomainEntity(doc: ICoachingCenterDocument): CoachingCenter {
    const centerName = CoachingCenterName.create(doc.coachingCenterName);
    const centerCode = CoachingCenterCode.create(doc.coachingCenterCode);
    const address = Address.create({
      street: doc.address.street,
      city: doc.address.city,
      state: doc.address.state,
      zipCode: doc.address.zipCode,
      country: doc.address.country,
    });
    const contactInfo = ContactInfo.create({
      email: doc.contactInfo.email,
      phone: doc.contactInfo.phone,
    });

    return new CoachingCenter(
      doc._id,
      {
        organizationId: doc.organizationId,
        coachingCenterName: centerName,
        coachingCenterCode: centerCode,
        address,
        contactInfo,
        principalId: doc.principalId,
        status: doc.status,
        studentCount: doc.studentCount,
        teacherCount: doc.teacherCount,
        metadata: doc.metadata,
      },
      doc.createdAt,
      doc.updatedAt
    );
  }
}
