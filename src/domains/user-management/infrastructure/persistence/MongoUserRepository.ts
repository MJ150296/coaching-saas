/**
 * MongoDB User Repository Implementation
 */

import { UserRepository } from "../../domain/repositories/UserRepository";
import { User } from "../../domain/entities/User";
import {
  Email,
  Password,
  UserName,
  UserPhone,
} from "../../domain/value-objects";
import { UserModel, IUserDocument } from "./UserSchema";
import { connectDB } from "@/shared/infrastructure/database";

export class MongoUserRepository implements UserRepository {
  private async ensureConnection() {
    await connectDB();
  }

  async save(user: User): Promise<void> {
    await this.ensureConnection();

    const userData = {
      _id: user.getId(),
      email: user.getEmail().getValue(),
      password: user.getPassword().getValue(),
      firstName: user.getName().getFirstName(),
      lastName: user.getName().getLastName(),
      phone: user.getPhone()?.getValue() || null,
      role: user.getRole(),
      organizationId: user.getOrganizationId(),
      schoolId: user.getSchoolId(),
      isActive: user.isUserActive(),
      emailVerified: user.isEmailVerified(),
      createdAt: user.getCreatedAt(),
      updatedAt: user.getUpdatedAt(),
    };

    await UserModel.findByIdAndUpdate(user.getId(), userData, { upsert: true });
  }

  async findById(id: string): Promise<User | null> {
    await this.ensureConnection();

    const document = await UserModel.findById(id);

    if (!document) {
      return null;
    }

    return this.toDomainEntity(document);
  }

  async findAll(): Promise<User[]> {
    await this.ensureConnection();

    const documents = await UserModel.find();
    return documents.map((doc) => this.toDomainEntity(doc));
  }

  async delete(id: string): Promise<void> {
    await this.ensureConnection();

    await UserModel.findByIdAndDelete(id);
  }

  async exists(id: string): Promise<boolean> {
    await this.ensureConnection();

    const count = await UserModel.countDocuments({ _id: id });
    return count > 0;
  }

  async findByEmail(email: string): Promise<User | null> {
    await this.ensureConnection();

    const document = await UserModel.findOne({ email: email.toLowerCase() });

    if (!document) {
      return null;
    }

    return this.toDomainEntity(document);
  }

  async emailExists(email: string): Promise<boolean> {
    await this.ensureConnection();

    const count = await UserModel.countDocuments({
      email: email.toLowerCase(),
    });
    return count > 0;
  }

  async findByRole(role: string): Promise<User[]> {
    await this.ensureConnection();

    const documents = await UserModel.find({ role });
    return documents.map((doc) => this.toDomainEntity(doc));
  }

  async findAllActive(): Promise<User[]> {
    await this.ensureConnection();

    const documents = await UserModel.find({ isActive: true });
    return documents.map((doc) => this.toDomainEntity(doc));
  }

  private toDomainEntity(document: IUserDocument): User {
    const email = Email.create(document.email);
    const password = Password.create(document.password, true); // It's already hashed
    const name = UserName.create(document.firstName, document.lastName);
    const phone = document.phone ? UserPhone.create(document.phone) : undefined;

    const user = new User(
      document._id,
      {
        email,
        password,
        name,
        phone,
        role: document.role,
        organizationId: document.organizationId,
        schoolId: document.schoolId,
        isActive: document.isActive,
        emailVerified: document.emailVerified,
      },
      document.createdAt,
      document.updatedAt,
    );

    return user;
  }
}
