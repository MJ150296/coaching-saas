/**
 * Verify User Email Use Case
 */

import { Result } from '@/shared/domain';
import { UserRepository } from '../../domain/repositories/UserRepository';

export interface VerifyUserEmailUseCaseRequest {
  userId: string;
}

export interface VerifyUserEmailUseCaseResponse {
  success: boolean;
}

export class VerifyUserEmailUseCase {
  constructor(private userRepository: UserRepository) {}

  async execute(
    request: VerifyUserEmailUseCaseRequest
  ): Promise<Result<VerifyUserEmailUseCaseResponse, string>> {
    try {
      const user = await this.userRepository.findById(request.userId);

      if (!user) {
        return Result.fail<VerifyUserEmailUseCaseResponse>(
          `User with id ${request.userId} not found`
        );
      }

      user.verifyEmail();
      await this.userRepository.save(user);

      return Result.ok<VerifyUserEmailUseCaseResponse>({
        success: true,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error occurred';
      return Result.fail<VerifyUserEmailUseCaseResponse>(message);
    }
  }
}
