/**
 * MongoDB Repository Implementations for Organization & School
 */

import { OrganizationRepository, SchoolRepository } from '../../domain/repositories';
import { Organization } from '../../domain/entities/Organization';
import { School } from '../../domain/entities/School';
import {
  OrganizationName,
  Address,
  ContactInfo,
  SchoolName,
  SchoolCode,
} from '../../domain/value-objects';
import {
  OrganizationModel,
  IOrganizationDocument,
  SchoolModel,
  ISchoolDocument,
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

export class MongoSchoolRepository implements SchoolRepository {
  private async ensureConnection() {
    await connectDB();
  }

  async save(school: School): Promise<void> {
    await this.ensureConnection();

    const data = {
      _id: school.getId(),
      organizationId: school.getOrganizationId(),
      schoolName: school.getSchoolName().getValue(),
      schoolCode: school.getSchoolCode().getValue(),
      address: {
        street: school.getAddress().getStreet(),
        city: school.getAddress().getCity(),
        state: school.getAddress().getState(),
        zipCode: school.getAddress().getZipCode(),
        country: school.getAddress().getCountry(),
      },
      contactInfo: {
        email: school.getContactInfo().getEmail(),
        phone: school.getContactInfo().getPhone(),
      },
      principalId: school.getPrincipalId(),
      status: school.getStatus(),
      studentCount: school.getStudentCount(),
      teacherCount: school.getTeacherCount(),
      metadata: school.getMetadata(),
      createdAt: school.getCreatedAt(),
      updatedAt: school.getUpdatedAt(),
    };

    await SchoolModel.findByIdAndUpdate(school.getId(), data, { upsert: true });
  }

  async findById(id: string): Promise<School | null> {
    await this.ensureConnection();
    const doc = (await SchoolModel.findById(id)) as ISchoolDocument | null;
    if (!doc) return null;
    return this.toDomainEntity(doc);
  }

  async findByOrganizationId(organizationId: string): Promise<School[]> {
    await this.ensureConnection();
    const docs = (await SchoolModel.find({ organizationId })) as ISchoolDocument[];
    return docs.map((doc) => this.toDomainEntity(doc));
  }

  async findByCode(code: string): Promise<School | null> {
    await this.ensureConnection();
    const doc = (await SchoolModel.findOne({ schoolCode: code.toUpperCase() })) as ISchoolDocument | null;
    if (!doc) return null;
    return this.toDomainEntity(doc);
  }

  async findActive(): Promise<School[]> {
    await this.ensureConnection();
    const docs = (await SchoolModel.find({ status: 'active' })) as ISchoolDocument[];
    return docs.map((doc) => this.toDomainEntity(doc));
  }

  async findByOrganizationIdAndActive(organizationId: string): Promise<School[]> {
    await this.ensureConnection();
    const docs = (await SchoolModel.find({
      organizationId,
      status: 'active',
    })) as ISchoolDocument[];
    return docs.map((doc) => this.toDomainEntity(doc));
  }

  async findAll(): Promise<School[]> {
    await this.ensureConnection();
    const docs = (await SchoolModel.find({})) as ISchoolDocument[];
    return docs.map((doc) => this.toDomainEntity(doc));
  }

  async delete(id: string): Promise<void> {
    await this.ensureConnection();
    await SchoolModel.findByIdAndDelete(id);
  }

  async exists(id: string): Promise<boolean> {
    await this.ensureConnection();
    const count = await SchoolModel.countDocuments({ _id: id });
    return count > 0;
  }

  private toDomainEntity(doc: ISchoolDocument): School {
    const schoolName = SchoolName.create(doc.schoolName);
    const schoolCode = SchoolCode.create(doc.schoolCode);
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

    return new School(
      doc._id,
      {
        organizationId: doc.organizationId,
        schoolName,
        schoolCode,
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
