/**
 * Create User Use Case
 */

import { Result } from '@/shared/domain';
import { UserRepository } from '../../domain/repositories/UserRepository';
import { User, UserRole } from '../../domain/entities/User';
import { Email, Password, UserName, UserPhone } from '../../domain/value-objects';
import { CreateUserDTO, UserResponseDTO } from '../dtos';
import { UserMapper } from '../mappers/UserMapper';
import { ConflictError } from '@/shared/infrastructure/errors';
import { generateId } from '@/shared/lib/utils';
import { PasswordEncryption } from '../../infrastructure/external-services/PasswordEncryption';

export interface CreateUserUseCaseRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  phone?: string;
  organizationId?: string;
  schoolId?: string;
}

export interface CreateUserUseCaseResponse {
  user: UserResponseDTO;
}

export class CreateUserUseCase {
  constructor(private userRepository: UserRepository) {}

  async execute(
    request: CreateUserUseCaseRequest
  ): Promise<Result<CreateUserUseCaseResponse, string>> {
    try {
      // Check if user already exists
      const emailExists = await this.userRepository.emailExists(request.email);
      if (emailExists) {
        return Result.fail<CreateUserUseCaseResponse>(
          `User with email ${request.email} already exists`
        );
      }

      // Create value objects
      const email = Email.create(request.email);
      // Hash password before creating Password value object
      const hashedPassword = await PasswordEncryption.hash(request.password);
      const password = Password.create(hashedPassword, true);
      const name = UserName.create(request.firstName, request.lastName);
      const phone = request.phone ? UserPhone.create(request.phone) : undefined;

      if (request.role !== UserRole.SUPER_ADMIN) {
        if (!request.organizationId || !request.schoolId) {
          return Result.fail<CreateUserUseCaseResponse>(
            'organizationId and schoolId are required for non-superadmin users'
          );
        }
      }

      // Create domain entity
      const userId = generateId();
      const user = User.create(
        userId,
        email,
        password,
        name,
        request.role,
        request.organizationId,
        request.schoolId,
        phone
      );

      // Persist
      await this.userRepository.save(user);

      return Result.ok<CreateUserUseCaseResponse>({
        user: UserMapper.toDTO(user),
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error occurred';
      return Result.fail<CreateUserUseCaseResponse>(message);
    }
  }
}
