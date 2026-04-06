import { UserRole } from '../../domain/entities/User';

export interface CreateUserDTO {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role?: UserRole;
  phone?: string;
  organizationId?: string;
  coachingCenterId?: string;
}

export interface UserResponseDTO {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  phone?: string;
  organizationId?: string;
  coachingCenterId?: string;
  isActive: boolean;
  emailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface UpdateUserDTO {
  firstName?: string;
  lastName?: string;
  phone?: string;
  isActive?: boolean;
}

export interface ChangeUserRoleDTO {
  userId: string;
  role: UserRole;
}
