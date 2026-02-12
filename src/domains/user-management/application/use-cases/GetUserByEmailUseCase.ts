/**
 * Get User By Email Use Case
 */

import { Result } from '@/shared/domain';
import { UserRepository } from '../../domain/repositories/UserRepository';
import { UserResponseDTO } from '../dtos';
import { UserMapper } from '../mappers/UserMapper';

export interface GetUserByEmailUseCaseRequest {
  email: string;
}

export interface GetUserByEmailUseCaseResponse {
  user: UserResponseDTO | null;
}

export class GetUserByEmailUseCase {
  constructor(private userRepository: UserRepository) {}

  async execute(
    request: GetUserByEmailUseCaseRequest
  ): Promise<Result<GetUserByEmailUseCaseResponse, string>> {
    try {
      const user = await this.userRepository.findByEmail(request.email);

      if (!user) {
        return Result.ok<GetUserByEmailUseCaseResponse>({
          user: null,
        });
      }

      return Result.ok<GetUserByEmailUseCaseResponse>({
        user: UserMapper.toDTO(user),
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error occurred';
      return Result.fail<GetUserByEmailUseCaseResponse>(message);
    }
  }
}
