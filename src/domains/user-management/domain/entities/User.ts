/**
 * User Management Domain - User Entity (Aggregate Root)
 */

import { AggregateRoot } from '@/shared/domain';
import { Email, Password, UserName, UserPhone } from '../value-objects';
import {
  UserActivatedEvent,
  UserCreatedEvent,
  UserDeactivatedEvent,
  UserRoleChangedEvent,
} from '../domain-events';

export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ORGANIZATION_ADMIN = 'ORGANIZATION_ADMIN',
  COACHING_ADMIN = 'COACHING_ADMIN',
  ADMIN = 'ADMIN',
  TEACHER = 'TEACHER',
  STUDENT = 'STUDENT',
  PARENT = 'PARENT',
  STAFF = 'STAFF',
}

export function normalizeUserRole(role: string | null | undefined): UserRole | null {
  if (!role) return null;
  return (Object.values(UserRole) as string[]).includes(role) ? (role as UserRole) : null;
}

export interface UserProps {
  email: Email;
  password: Password;
  name: UserName;
  phone?: UserPhone;
  role: UserRole;
  organizationId?: string;
  coachingCenterId?: string;
  schoolGrade?: string;
  schoolName?: string;
  isActive: boolean;
  emailVerified?: boolean;
}

export class User extends AggregateRoot<string> {
  private email: Email;
  private password: Password;
  private name: UserName;
  private phone?: UserPhone;
  private role: UserRole;
  private organizationId?: string;
  private coachingCenterId?: string;
  private schoolGrade?: string;
  private schoolName?: string;
  private isActive: boolean;
  private emailVerified: boolean;

  constructor(id: string, props: UserProps, createdAt?: Date, updatedAt?: Date) {
    super(id, createdAt, updatedAt);
    this.email = props.email;
    this.password = props.password;
    this.name = props.name;
    this.phone = props.phone;
    this.role = props.role;
    this.organizationId = props.organizationId;
    this.coachingCenterId = props.coachingCenterId;
    this.schoolGrade = props.schoolGrade;
    this.schoolName = props.schoolName;
    this.isActive = props.isActive;
    this.emailVerified = props.emailVerified || false;
  }

  static create(
    id: string,
    email: Email,
    password: Password,
    name: UserName,
    role: UserRole,
    organizationId?: string,
    coachingCenterId?: string,
    phone?: UserPhone,
    schoolGrade?: string,
    schoolName?: string
  ): User {
    const user = new User(id, {
      email,
      password,
      name,
      phone,
      role,
      organizationId,
      coachingCenterId,
      schoolGrade,
      schoolName,
      isActive: true,
      emailVerified: false,
    });

    user.addDomainEvent(
      new UserCreatedEvent(
        id,
        email.getValue(),
        name.getFirstName(),
        name.getLastName(),
        role
      )
    );

    return user;
  }

  getEmail(): Email {
    return this.email;
  }

  getPassword(): Password {
    return this.password;
  }

  getName(): UserName {
    return this.name;
  }

  getPhone(): UserPhone | undefined {
    return this.phone;
  }

  getRole(): UserRole {
    return this.role;
  }

  getOrganizationId(): string | undefined {
    return this.organizationId;
  }

  getCoachingCenterId(): string | undefined {
    return this.coachingCenterId;
  }

  getSchoolGrade(): string | undefined {
    return this.schoolGrade;
  }

  getSchoolName(): string | undefined {
    return this.schoolName;
  }

  changeRole(newRole: UserRole): void {
    if (this.role === newRole) {
      return;
    }

    const oldRole = this.role;
    this.role = newRole;
    this.setUpdatedAt(new Date());
    this.addDomainEvent(new UserRoleChangedEvent(this.id, oldRole, newRole));
  }

  isUserActive(): boolean {
    return this.isActive;
  }

  activate(): void {
    if (this.isActive) {
      return;
    }

    this.isActive = true;
    this.setUpdatedAt(new Date());
    this.addDomainEvent(new UserActivatedEvent(this.id));
  }

  deactivate(): void {
    if (!this.isActive) {
      return;
    }

    this.isActive = false;
    this.setUpdatedAt(new Date());
    this.addDomainEvent(new UserDeactivatedEvent(this.id));
  }

  verifyEmail(): void {
    this.emailVerified = true;
    this.setUpdatedAt(new Date());
  }

  isEmailVerified(): boolean {
    return this.emailVerified;
  }
}
