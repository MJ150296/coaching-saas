/**
 * User Management Domain - Mapper
 */

import { User } from '../../domain/entities/User';
import { UserResponseDTO } from '../dtos';
import { Email, Password, UserName, UserPhone } from '../../domain/value-objects';

interface UserPersistence {
  id: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  role: ReturnType<User['getRole']>;
  organizationId?: string;
  coachingCenterId?: string;
  coachingCenterId?: string;
  isActive: boolean;
  emailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class UserMapper {
  static toPersistence(user: User): UserPersistence {
    return {
      id: user.getId(),
      email: user.getEmail().getValue(),
      password: user.getPassword().getValue(),
      firstName: user.getName().getFirstName(),
      lastName: user.getName().getLastName(),
      phone: user.getPhone()?.getValue() || null,
      role: user.getRole(),
      organizationId: user.getOrganizationId(),
      coachingCenterId: user.getCoachingCenterId(),
      isActive: user.isUserActive(),
      emailVerified: user.isEmailVerified(),
      createdAt: user.getCreatedAt(),
      updatedAt: user.getUpdatedAt(),
    };
  }

  static toDomain(raw: UserPersistence): User {
    const email = Email.create(raw.email);
    const password = Password.create(raw.password, true); // Assume it's already hashed
    const name = UserName.create(raw.firstName, raw.lastName);
    const phone = raw.phone ? UserPhone.create(raw.phone) : undefined;

    const user = new User(
      raw.id,
      {
        email,
        password,
        name,
        phone,
        role: raw.role,
        organizationId: raw.organizationId,
        coachingCenterId: raw.coachingCenterId ?? raw.coachingCenterId,
        coachingCenterId: raw.coachingCenterId ?? raw.coachingCenterId,
        isActive: raw.isActive,
        emailVerified: raw.emailVerified,
      },
      raw.createdAt,
      raw.updatedAt
    );

    return user;
  }

  static toDTO(user: User): UserResponseDTO {
    return {
      id: user.getId(),
      email: user.getEmail().getValue(),
      firstName: user.getName().getFirstName(),
      lastName: user.getName().getLastName(),
      role: user.getRole(),
      phone: user.getPhone()?.getValue(),
      organizationId: user.getOrganizationId(),
      coachingCenterId: user.getCoachingCenterId(),
      isActive: user.isUserActive(),
      emailVerified: user.isEmailVerified(),
      createdAt: user.getCreatedAt(),
      updatedAt: user.getUpdatedAt(),
    };
  }
}
